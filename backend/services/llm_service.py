import os
import json
import re
from typing import Dict, Any, Optional, List, Tuple
from services.nl_query_analyzer import NLQueryAnalyzer, AnalyzedQuery, ExtractedCondition
from schema_inspector import format_schema_for_prompt

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        demo_env = os.getenv("DEMO_MODE", "false").lower()
        self.demo_mode = demo_env in ("true", "1", "yes") or not bool(self.api_key)

    def update_config(self, api_key: Optional[str] = None, model_name: Optional[str] = None, demo_mode: Optional[bool] = None):
        if api_key is not None:
            self.api_key = api_key.strip()
            os.environ["GEMINI_API_KEY"] = self.api_key
        if model_name is not None:
            self.model_name = model_name.strip()
            os.environ["GEMINI_MODEL"] = self.model_name
        if demo_mode is not None:
            self.demo_mode = demo_mode
            os.environ["DEMO_MODE"] = str(demo_mode).lower()
        elif not self.api_key:
            self.demo_mode = True

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def stage1_extract_intent(self, user_question: str, schema_info: Dict[str, Any]) -> AnalyzedQuery:
        """
        Stage 1: Intent Extraction
        Converts the user's natural language request into a validated, structured intent representation
        containing table, filters, operators, values, logical relationships, sorting, grouping, and limits.
        Uses Gemini when available, verified and supplemented by deterministic schema grounding.
        """
        # Always run deterministic extraction as ground-truth baseline
        deterministic_intent = NLQueryAnalyzer.analyze_query(user_question, schema_info)

        if not self.api_key or self.demo_mode:
            return deterministic_intent

        try:
            schema_str = format_schema_for_prompt(schema_info)
            prompt = f"""You are a precise Database Intent Extractor.
Extract the user's inquiry into structured JSON strictly matching the database schema.

{schema_str}

User Question: "{user_question.strip()}"

### EXTRACTION RULES:
1. Target table MUST be an exact table from the schema.
2. Filter column names MUST be exact column names from the schema. Never invent or rename columns.
3. Operators MUST be standard comparison operators: ">", "<", ">=", "<=", "=", "!=", "BETWEEN", "LIKE", "IS NULL".
4. Values MUST be raw literals (e.g. 2, 5.0, "Iris-setosa"). NEVER put natural language instructions inside values.
5. If the user asks for "last N rows", verify if a sequential ID or timestamp exists. If none exists, set needs_clarification=true.

Return ONLY a JSON object:
{{
  "table": "table_name",
  "columns": ["*"],
  "filters": [
    {{
      "column": "col_name",
      "operator": ">",
      "value": "2",
      "logical_op": "AND"
    }}
  ],
  "logical_operator": "AND",
  "order_by": null,
  "order_direction": null,
  "limit": null,
  "is_count": false,
  "needs_clarification": false,
  "clarification_message": null
}}"""
            response_json = self._call_gemini_api_json(prompt)
            if response_json and isinstance(response_json, dict) and "filters" in response_json:
                # Merge and validate Gemini output with deterministic rules
                tables = schema_info.get("tables", {})
                tbl = response_json.get("table")
                if tbl in tables:
                    deterministic_intent.target_table = tbl

                # If Gemini successfully identified filters, verify against schema
                gemini_filters = response_json.get("filters", [])
                if gemini_filters and isinstance(gemini_filters, list):
                    tbl_cols = {c["name"].lower(): c["name"] for c in tables.get(deterministic_intent.target_table, {}).get("columns", [])}
                    valid_conditions = []
                    for gf in gemini_filters:
                        col_raw = gf.get("column", "")
                        col_clean = tbl_cols.get(col_raw.lower())
                        if col_clean:
                            valid_conditions.append(ExtractedCondition(
                                raw_col=col_raw,
                                schema_col=col_clean,
                                operator=gf.get("operator", "="),
                                formatted_value=str(gf.get("value", "")),
                                raw_value=str(gf.get("value", "")),
                                logical_op=gf.get("logical_op", "AND")
                            ))
                    if valid_conditions and len(valid_conditions) >= len(deterministic_intent.conditions):
                        deterministic_intent.conditions = valid_conditions

                if response_json.get("limit"):
                    try:
                        deterministic_intent.row_limit = int(response_json["limit"])
                    except Exception:
                        pass

                if response_json.get("order_by"):
                    ord_c = response_json.get("order_by")
                    tbl_cols = {c["name"].lower(): c["name"] for c in tables.get(deterministic_intent.target_table, {}).get("columns", [])}
                    if ord_c.lower() in tbl_cols:
                        deterministic_intent.order_by_col = tbl_cols[ord_c.lower()]
                        deterministic_intent.order_direction = response_json.get("order_direction", "ASC")

                if response_json.get("is_count"):
                    deterministic_intent.is_count_request = True

        except Exception as e:
            print(f"[Stage 1 Gemini Intent Warning] {e}. Using deterministic intent.")

        return deterministic_intent

    def stage2_generate_sql(
        self,
        user_question: str,
        schema_info: Dict[str, Any],
        analyzed_intent: AnalyzedQuery
    ) -> Dict[str, Any]:
        """
        Stage 2: SQL Generation
        Generates SQLite syntax from:
        - Original user query
        - Actual database schema
        - Validated structured intent from Stage 1
        - Selected database dialect (SQLite)
        Strictly forbids altering, dropping, or substituting Stage 1 requirements.
        """
        # Baseline deterministic SQL
        baseline_sql = NLQueryAnalyzer.synthesize_sql_from_intent(analyzed_intent, schema_info)

        if not self.api_key or self.demo_mode:
            reasons = [f"1. Identified target table '{analyzed_intent.target_table}'."]
            if analyzed_intent.conditions:
                reasons.append(f"2. Preserved all {len(analyzed_intent.conditions)} filter conditions.")
            if analyzed_intent.order_by_col:
                reasons.append(f"3. Applied ordering: ORDER BY \"{analyzed_intent.order_by_col}\" {analyzed_intent.order_direction or 'ASC'}.")
            if analyzed_intent.row_limit:
                reasons.append(f"4. Applied row limit: LIMIT {analyzed_intent.row_limit}.")

            return {
                "thought_process": "\n".join(reasons),
                "sql_query": baseline_sql,
                "explanation": f"Generated schema-grounded query for table '{analyzed_intent.target_table}'."
            }

        try:
            schema_str = format_schema_for_prompt(schema_info)
            intent_str = json.dumps(analyzed_intent.to_dict(), indent=2)

            prompt = f"""You are an expert SQL Generator.
Generate SQLite SQL matching this exact validated intent:

{schema_str}

Validated Intent from Stage 1:
{intent_str}

Original Inquiry: "{user_question.strip()}"

### STRICT RULES:
1. Generate standard SQLite SELECT query.
2. DO NOT omit, drop, rename, or substitute any filter condition from Stage 1.
3. Use exact quoted identifiers: "{analyzed_intent.target_table}".
4. Return ONLY valid JSON:
{{
  "thought_process": "Step-by-step reasoning explaining how every filter is preserved.",
  "sql_query": "The clean SQLite query.",
  "explanation": "Concise human-readable explanation matching the query."
}}"""
            response = self._call_gemini_api(prompt)
            if response.get("sql_query"):
                return response
        except Exception as e:
            print(f"[Stage 2 Gemini Generation Warning] {e}. Using deterministic SQL.")

        return {
            "thought_process": "Deterministic synthesis based on Stage 1 validated intent.",
            "sql_query": baseline_sql,
            "explanation": f"Query derived from natural language inquiry on table '{analyzed_intent.target_table}'."
        }

    def generate_sql(
        self,
        full_prompt: str,
        user_question: str,
        schema_info: Optional[Dict[str, Any]] = None,
        analyzed_query: Optional[AnalyzedQuery] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates Two-Stage Pipeline:
        Stage 1: Intent Extraction
        Stage 2: Schema-Grounded SQL Generation
        """
        schema = schema_info or {"tables": {}}
        if not schema.get("tables"):
            return {
                "thought_process": "No tables detected in database schema.",
                "sql_query": "SELECT 'No tables available' AS status",
                "explanation": "Cannot query an empty database."
            }

        # Stage 1: Intent Extraction
        intent = analyzed_query or self.stage1_extract_intent(user_question, schema)

        # Clarification check
        if intent.needs_clarification:
            return {
                "thought_process": "Checked database schema for sequential ID or timestamp column. None found.",
                "sql_query": "",
                "explanation": intent.clarification_message,
                "needs_clarification": True
            }

        # Unmapped column check
        if intent.unmapped_columns:
            target = intent.target_table or list(schema["tables"].keys())[0]
            cols = [c["name"] for c in schema["tables"].get(target, {}).get("columns", [])]
            err = f"Referenced column(s) '{', '.join(intent.unmapped_columns)}' do not exist in table '{target}'. Strict schema adherence required (Rule 3). Column substitution is prohibited. Available columns: {', '.join(cols)}."
            return {
                "thought_process": f"Strict schema validation failed: unmapped column(s) {intent.unmapped_columns}.",
                "sql_query": "",
                "explanation": err,
                "validation_error": err
            }

        # Stage 2: SQL Generation
        return self.stage2_generate_sql(user_question, schema, intent)

    def _call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """Calls the real Google Gemini API via the google-genai client."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        return self._parse_json_response(response.text.strip())

    def _call_gemini_api_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Calls Gemini API and parses response directly as JSON dict."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        try:
            return json.loads(text)
        except Exception:
            return None

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Extracts and parses JSON object from LLM response."""
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(cleaned)
            if "sql_query" in parsed:
                return {
                    "thought_process": parsed.get("thought_process", "Generated by Gemini LLM."),
                    "sql_query": parsed.get("sql_query", "").strip(),
                    "explanation": parsed.get("explanation", "SQL query derived from natural language inquiry.")
                }
        except json.JSONDecodeError:
            pass

        sql_match = re.search(r"SELECT[\s\S]+?(?:;|$)", cleaned, re.IGNORECASE)
        sql = sql_match.group(0).rstrip(";") if sql_match else cleaned
        return {
            "thought_process": "Extracted SQL expression from raw LLM output stream.",
            "sql_query": sql,
            "explanation": "Extracted query based on user's natural language input."
        }

llm_service = LLMService()
