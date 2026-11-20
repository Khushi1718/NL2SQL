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
from mongo import save_query_history_mongo

class QueryService:
    @staticmethod
    def generate_sql_from_nl(natural_language_query: str, database_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Translates a natural language question into validated SQL tailored
        specifically to the chosen database's actual schema.
        """
        db_id = database_id or DEFAULT_BENCHMARK_DB_ID
        
        # 1. Materialize and inspect the specific database
        sqlite_path = DatabaseManager.materialize_database(db_id)
        schema_info = DatabaseManager.inspect_sqlite_schema(sqlite_path)

        # 2. Build schema-aware prompt
        builder = PromptBuilder(schema_info=schema_info)
        full_prompt = builder.build_full_prompt(natural_language_query)
        prompt_breakdown = builder.get_inspectable_breakdown(natural_language_query)

        # 3. Generate SQL via LLM service
        llm_response = llm_service.generate_sql(
            full_prompt=full_prompt,
            user_question=natural_language_query,
            schema_info=schema_info
        )
        raw_sql = llm_response.get("sql_query", "").strip()

        # 4. Validate SQL against the target database's allowed tables
        allowed_tables = set(schema_info["tables"].keys())
        is_valid, validated_sql, validation_err = validate_sql(raw_sql, allowed_tables=allowed_tables)

        return {
            "database_id": db_id,
            "natural_language_query": natural_language_query,
            "generated_sql": validated_sql if is_valid else raw_sql,
            "raw_sql": raw_sql,
            "is_valid": is_valid,
            "validation_error": validation_err,
            "thought_process": llm_response.get("thought_process", ""),
            "explanation": llm_response.get("explanation", ""),
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

        # Validate strictly before executing
        is_valid, sanitized_sql, error_msg = validate_sql(sql_query, allowed_tables=allowed_tables)
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
