import time
import csv
import io
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, text
from database_manager import DatabaseManager, DEFAULT_BENCHMARK_DB_ID
from prompt_engineering.builder import PromptBuilder
from sql_validator import validate_sql
from services.llm_service import llm_service
from services.nl_query_analyzer import NLQueryAnalyzer
from mongo import save_query_history_mongo

class QueryService:
    @staticmethod
    def generate_sql_from_nl(natural_language_query: str, database_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Translates a natural language question into validated, schema-grounded SQL
        tailored strictly to the chosen database's actual schema.
        Enforces all 10 mandatory rules:
        1. Extract EVERY condition before generating SQL
        2. Preserve columns, comparison operators, values, AND/OR logic, sorting, and limits
        3. Map columns ONLY using actual schema (no substitutions)
        4. Never silently omit a condition
        5. Include every condition in the WHERE clause
        6. For 'last N rows', use verified sequential ID/timestamp with DESC or ask for clarification
        7. Cross-check generated query against extracted requirements
        8. Reconcile or return validation error if condition is missing
        9. Ensure explanation accurately reflects every condition
        10. Preserve strict read-only SQL enforcement
        """
        db_id = database_id or DEFAULT_BENCHMARK_DB_ID
        
        # 1. Materialize and inspect the specific database
        sqlite_path = DatabaseManager.materialize_database(db_id)
        schema_info = DatabaseManager.inspect_sqlite_schema(sqlite_path)

        # 2. Extract and pre-analyze requirements from NL query (Rule 1, 2, 3)
        analyzed = NLQueryAnalyzer.analyze_query(natural_language_query, schema_info)

        # 3. Rule 6: Clarification check for "last N rows"
        if analyzed.needs_clarification:
            return {
                "database_id": db_id,
                "natural_language_query": natural_language_query,
                "generated_sql": "",
                "raw_sql": "",
                "is_valid": False,
                "validation_error": analyzed.clarification_message,
                "thought_process": "Checked database schema for sequential ID or timestamp column. None found. Requesting clarification per Rule 6.",
                "explanation": analyzed.clarification_message,
                "prompt_breakdown": {
                    "role_prompt": "",
                    "schema_context": "",
                    "schema_metadata": {},
                    "few_shot_examples": [],
                    "important_rules": [],
                    "query_constraints": [],
                    "pre_analyzed_requirements": analyzed.clarification_message,
                    "structured_output_schema": "",
                    "user_question": natural_language_query,
                    "final_constructed_prompt": ""
                }
            }

        # 4. Rule 3: Unmapped column check (strictly reject substitutions)
        if analyzed.unmapped_columns:
            target = analyzed.target_table or "table"
            cols = [c["name"] for c in schema_info.get("tables", {}).get(target, {}).get("columns", [])]
            cols_list = ", ".join(cols) if cols else "none"
            err_msg = (
                f"Referenced column(s) '{', '.join(analyzed.unmapped_columns)}' do not exist in table '{target}'. "
                f"Strict schema adherence required (Rule 3). Column substitution is prohibited. Available columns: {cols_list}."
            )
            return {
                "database_id": db_id,
                "natural_language_query": natural_language_query,
                "generated_sql": "",
                "raw_sql": "",
                "is_valid": False,
                "validation_error": err_msg,
                "thought_process": "Strict schema validation failed: referenced column does not exist in schema.",
                "explanation": err_msg,
                "prompt_breakdown": {
                    "role_prompt": "",
                    "schema_context": "",
                    "schema_metadata": {},
                    "few_shot_examples": [],
                    "important_rules": [],
                    "query_constraints": [],
                    "pre_analyzed_requirements": err_msg,
                    "structured_output_schema": "",
                    "user_question": natural_language_query,
                    "final_constructed_prompt": ""
                }
            }

        # 5. Build schema-aware prompt with injected condition checklist
        builder = PromptBuilder(schema_info=schema_info)
        full_prompt = builder.build_full_prompt(natural_language_query, analyzed_query=analyzed)
        prompt_breakdown = builder.get_inspectable_breakdown(natural_language_query, analyzed_query=analyzed)

        # 6. Generate SQL via LLM service (Gemini API or intelligent schema engine)
        llm_response = llm_service.generate_sql(
            full_prompt=full_prompt,
            user_question=natural_language_query,
            schema_info=schema_info,
            analyzed_query=analyzed
        )
        raw_sql = llm_response.get("sql_query", "").strip()

        if not raw_sql and llm_response.get("explanation"):
            return {
                "database_id": db_id,
                "natural_language_query": natural_language_query,
                "generated_sql": "",
                "raw_sql": "",
                "is_valid": False,
                "validation_error": llm_response.get("explanation"),
                "thought_process": llm_response.get("thought_process", ""),
                "explanation": llm_response.get("explanation"),
                "prompt_breakdown": prompt_breakdown
            }

        # 7. Cross-check generated query against extracted requirements (Rule 7, 8, 9)
        reconcile_ok, reconciled_sql, reconcile_err, reconciled_exp = NLQueryAnalyzer.reconcile_and_verify(
            raw_sql, analyzed, schema_info
        )

        if not reconcile_ok:
            return {
                "database_id": db_id,
                "natural_language_query": natural_language_query,
                "generated_sql": raw_sql,
                "raw_sql": raw_sql,
                "is_valid": False,
                "validation_error": reconcile_err,
                "thought_process": llm_response.get("thought_process", ""),
                "explanation": reconcile_err or "Generated query failed requirement cross-check.",
                "prompt_breakdown": prompt_breakdown
            }

        # 8. Validate SQL against target database's allowed tables AND columns (Rule 3 & 10)
        allowed_tables = set(schema_info["tables"].keys())
        allowed_columns = {t: {c["name"] for c in data["columns"]} for t, data in schema_info["tables"].items()}
        is_valid, validated_sql, validation_err = validate_sql(
            reconciled_sql,
            allowed_tables=allowed_tables,
            allowed_columns=allowed_columns
        )

        final_sql = validated_sql if is_valid else reconciled_sql
        final_explanation = reconciled_exp or llm_response.get("explanation", "")

        return {
            "database_id": db_id,
            "natural_language_query": natural_language_query,
            "generated_sql": final_sql,
            "raw_sql": raw_sql,
            "is_valid": is_valid,
            "validation_error": validation_err,
            "thought_process": llm_response.get("thought_process", ""),
            "explanation": final_explanation,
            "prompt_breakdown": prompt_breakdown
        }

    @staticmethod
    def execute_sql_query(
        sql_query: str,
        database_id: Optional[str] = None,
        natural_language_query: Optional[str] = None,
        prompt_used: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates and executes SQL against the exact selected SQLite database,
        records the execution in MongoDB, and returns tabular results.
        """
        db_id = database_id or DEFAULT_BENCHMARK_DB_ID
        sqlite_path = DatabaseManager.materialize_database(db_id)
        schema_info = DatabaseManager.inspect_sqlite_schema(sqlite_path)
        allowed_tables = set(schema_info["tables"].keys())
        allowed_columns = {t: {c["name"] for c in data["columns"]} for t, data in schema_info["tables"].items()}

        # Validate strictly before executing
        is_valid, sanitized_sql, error_msg = validate_sql(
            sql_query,
            allowed_tables=allowed_tables,
            allowed_columns=allowed_columns
        )
        if not is_valid:
            # Record failed validation in MongoDB
            query_id = f"q_{uuid.uuid4().hex[:10]}"
            save_query_history_mongo({
                "query_id": query_id,
                "database_id": db_id,
                "natural_language_question": natural_language_query or "Direct SQL Execution",
                "generated_sql": sql_query,
                "executed_sql": sql_query,
                "execution_status": "FAILED",
                "execution_time_ms": 0.0,
                "row_count": 0,
                "error_message": error_msg,
                "created_at": datetime.utcnow().isoformat()
            })

            return {
                "status": "FAILED",
                "database_id": db_id,
                "sql": sql_query,
                "sanitized_sql": sql_query,
                "error": error_msg,
                "columns": [],
                "rows": [],
                "row_count": 0,
                "execution_time_ms": 0.0,
                "query_id": query_id
            }

        start_time = time.perf_counter()
        columns = []
        rows = []
        status = "SUCCESS"
        execution_err = None

        engine = create_engine(f"sqlite:///{sqlite_path}")

        try:
            with engine.connect() as conn:
                result = conn.execute(text(sanitized_sql))
                columns = list(result.keys())
                raw_rows = result.fetchall()
                for r in raw_rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        val = r[i]
                        if hasattr(val, "isoformat"):
                            val = val.isoformat()
                        row_dict[col] = val
                    rows.append(row_dict)

        except Exception as e:
            status = "FAILED"
            execution_err = str(e)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        row_count = len(rows)
        query_id = f"q_{uuid.uuid4().hex[:10]}"

        # Save record in MongoDB query_history collection
        try:
            save_query_history_mongo({
                "query_id": query_id,
                "database_id": db_id,
                "natural_language_question": natural_language_query or "Direct SQL Execution",
                "generated_sql": sql_query,
                "executed_sql": sanitized_sql,
                "execution_status": status,
                "execution_time_ms": execution_time_ms,
                "row_count": row_count,
                "error_message": execution_err,
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception as mongo_err:
            print(f"[MongoDB Query History Save Warning] {mongo_err}")

        return {
            "status": status,
            "database_id": db_id,
            "sql": sanitized_sql,
            "columns": columns,
            "rows": rows,
            "row_count": row_count,
            "execution_time_ms": execution_time_ms,
            "error": execution_err,
            "query_id": query_id
        }

    @staticmethod
    def generate_csv_export(columns: List[str], rows: List[Dict[str, Any]]) -> str:
        """Exports tabular query results to CSV text format."""
        output = io.StringIO()
        if not columns and rows:
            columns = list(rows[0].keys())

        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: (r.get(k) if r.get(k) is not None else "") for k in columns})

        return output.getvalue()
