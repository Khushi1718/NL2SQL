import re
from typing import Dict, Any, List, Optional, Tuple, Set, Union
import sqlglot
from sqlglot import exp

class ExtractedCondition:
    def __init__(
        self,
        raw_col: str,
        schema_col: Optional[str],
        operator: str,
        formatted_value: str,
        raw_value: str,
        logical_op: str = "AND",
        raw_text: str = ""
    ):
        self.raw_col = raw_col
        self.schema_col = schema_col
        self.operator = operator.upper() if operator.lower() in ["between", "like", "in", "is null", "is not null"] else operator
        self.formatted_value = formatted_value
        self.raw_value = raw_value
        self.logical_op = logical_op.upper()  # "AND" or "OR"
        self.raw_text = raw_text

    def to_sql_fragment(self) -> str:
        col = f'"{self.schema_col}"' if self.schema_col else f'"{self.raw_col}"'
        if self.operator == "IS NULL":
            return f"{col} IS NULL"
        elif self.operator == "IS NOT NULL":
            return f"{col} IS NOT NULL"
        elif self.operator == "BETWEEN":
            return f"{col} BETWEEN {self.formatted_value}"
        return f"{col} {self.operator} {self.formatted_value}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "column": self.schema_col or self.raw_col,
            "raw_col": self.raw_col,
            "operator": self.operator,
            "value": self.formatted_value,
            "raw_value": self.raw_value,
            "logical_op": self.logical_op,
            "sql_fragment": self.to_sql_fragment()
        }


class AnalyzedQuery:
    def __init__(self):
        self.target_table: Optional[str] = None
        self.conditions: List[ExtractedCondition] = []
        self.unmapped_columns: List[str] = []
        self.is_last_n_request: bool = False
        self.is_first_n_request: bool = False
        self.row_limit: Optional[int] = None
        self.order_by_col: Optional[str] = None
        self.order_direction: Optional[str] = None  # "ASC" or "DESC"
        self.needs_clarification: bool = False
        self.clarification_message: Optional[str] = None
        self.is_count_request: bool = False
        self.is_summary_request: bool = False
        self.summary_col: Optional[str] = None
        self.selected_columns: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "table": self.target_table,
            "columns": self.selected_columns or ["*"],
            "filters": [c.to_dict() for c in self.conditions],
            "logical_operator": self.conditions[1].logical_op if len(self.conditions) > 1 else "AND",
            "order_by": self.order_by_col,
            "order_direction": self.order_direction,
            "limit": self.row_limit,
            "is_count": self.is_count_request,
            "is_summary": self.is_summary_request,
            "summary_col": self.summary_col,
            "needs_clarification": self.needs_clarification,
            "clarification_message": self.clarification_message,
            "unmapped_columns": self.unmapped_columns
        }

    def format_for_prompt(self) -> str:
        """Formats the analyzed requirements into explicit instructions for the LLM prompt."""
        lines = ["### PRE-ANALYZED STRUCTURED INTENT (STAGE 1 OUTPUT - MANDATORY TO PRESERVE):"]
        if self.target_table:
            lines.append(f"- Target Table: \"{self.target_table}\"")
        if self.is_count_request:
            lines.append("- Aggregation: COUNT(*) AS total_count")
        if self.conditions:
            lines.append("- Required WHERE Conditions (PRESERVE EVERY CONDITION):")
            for i, c in enumerate(self.conditions):
                prefix = f"[{c.logical_op}] " if i > 0 else ""
                lines.append(f"  {i+1}. {prefix}{c.to_sql_fragment()}")
        if self.is_last_n_request:
            if self.order_by_col:
                lines.append(f"- Ordering for Last N Rows: ORDER BY \"{self.order_by_col}\" DESC")
            lines.append(f"- Row Limit: LIMIT {self.row_limit or 20}")
        elif self.order_by_col:
            lines.append(f"- Ordering: ORDER BY \"{self.order_by_col}\" {self.order_direction or 'ASC'}")
        if self.row_limit and not self.is_last_n_request:
            lines.append(f"- Row Limit: LIMIT {self.row_limit}")
        return "\n".join(lines)


class NLQueryAnalyzer:
    """
    Two-Stage Query Analyzer:
    Stage 1: Intent Extraction (translates NL query into structured, schema-grounded intent)
    Stage 2: Deterministic Schema-Grounded SQL Synthesis
    Independent Validation & Reconciler: AST-based verification against extracted intent
    """

    WORD_TO_NUM = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "fifteen": 15, "twenty": 20, "twenty-five": 25, "thirty": 30,
        "fifty": 50, "hundred": 100
    }

    @classmethod
    def analyze_query(cls, query: str, schema_info: Dict[str, Any]) -> AnalyzedQuery:
        analyzed = AnalyzedQuery()
        # Clean trailing punctuation
        q_clean = query.strip().rstrip(".?!;").strip()
        q_lower = q_clean.lower()

        tables = schema_info.get("tables", {})
        table_names = list(tables.keys())

        # 1. Resolve Target Table
        target_table = cls._resolve_target_table(q_lower, table_names, tables)
        analyzed.target_table = target_table

        table_data = tables.get(target_table, {}) if target_table else {}
        table_cols = [c["name"] for c in table_data.get("columns", [])]
        cols_map = {c.lower(): c for c in table_cols}

        # 2. Extract Row Limits & "Last N" / "First N"
        cls._extract_limits_and_ordering(q_lower, analyzed, target_table, table_cols, table_data)

        # 3. Detect Aggregations (COUNT, AVG, SUM, etc.)
        if any(w in q_lower for w in ["how many", "count all", "count of", "number of rows", "total number", "count(*)"]) or q_lower.startswith("count "):
            analyzed.is_count_request = True
        elif any(w in q_lower for w in ["average", "avg", "mean"]):
            analyzed.is_summary_request = True
            for c_low, c_orig in cols_map.items():
                if c_low in q_lower:
                    analyzed.summary_col = c_orig
                    break

        # 4. Extract Explicit Column Selection (if requested)
        if any(w in q_lower for w in ["select", "show columns", "display columns", "list columns"]):
            for c_low, c_orig in cols_map.items():
                if re.search(rf"\b{re.escape(c_low)}\b", q_lower):
                    analyzed.selected_columns.append(c_orig)

        # 5. Extract Conditions
        cls._extract_all_conditions(q_clean, cols_map, table_cols, analyzed)

        return analyzed

    @classmethod
    def _resolve_target_table(cls, q_lower: str, table_names: List[str], tables: Dict[str, Any]) -> Optional[str]:
        if not table_names:
            return None

        # Direct table match in query
        for tname in table_names:
            t_low = tname.lower()
            if re.search(rf"\b{re.escape(t_low)}\b", q_lower):
                return tname

        # Plural/singular match
        for tname in table_names:
            t_low = tname.lower().rstrip('s')
            if len(t_low) >= 3 and re.search(rf"\b{re.escape(t_low)}s?\b", q_lower):
                return tname

        # Column occurrence match
        best_table = None
        max_matched_cols = 0
        for tname, tdata in tables.items():
            cols = [c["name"].lower() for c in tdata.get("columns", [])]
            matched = sum(1 for c in cols if re.search(rf"\b{re.escape(c)}\b", q_lower))
            if matched > max_matched_cols:
                max_matched_cols = matched
                best_table = tname

        if best_table and max_matched_cols > 0:
            return best_table

        return table_names[0]

    @classmethod
    def _find_verified_ordering_column(cls, table_cols: List[str], table_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Rule 4: When a user requests the last N records:
        - Identify a reliable sequential identifier or timestamp column.
        - Never assume an arbitrary string or non-sequential ID represents chronological order.
        - If no reliable ordering column exists, return (False, None) to prompt user.
        """
        cols_meta = {c["name"].lower(): c for c in table_data.get("columns", [])}

        # Priority 1: Verified Timestamp / Datetime columns
        timestamp_candidates = ["timestamp", "created_at", "creation_date", "updated_at", "datetime", "date", "time"]
        for cand in timestamp_candidates:
            for c_low, c_meta in cols_meta.items():
                if cand == c_low or cand in c_low:
                    return True, c_meta["name"]

        # Check column types for datetime/timestamp/date
        for c_low, c_meta in cols_meta.items():
            ctype = str(c_meta.get("type", "")).upper()
            if any(t in ctype for t in ["DATETIME", "TIMESTAMP", "DATE"]):
                return True, c_meta["name"]

        # Priority 2: Primary Key sequential column (INTEGER PRIMARY KEY)
        pk_cols = [pk.lower() for pk in table_data.get("primary_keys", [])]
        for pk in pk_cols:
            if pk in cols_meta:
                pk_type = str(cols_meta[pk].get("type", "")).upper()
                if any(t in pk_type for t in ["INT", "INTEGER", "BIGINT", "SMALLINT"]):
                    return True, cols_meta[pk]["name"]

        # Priority 3: Explicit sequential ID candidates that are integer
        id_candidates = ["id", "row_id", "seq", "sequence", "item_id", "record_id"]
        for cand in id_candidates:
            for c_low, c_meta in cols_meta.items():
                if cand == c_low:
                    ctype = str(c_meta.get("type", "")).upper()
                    if any(t in ctype for t in ["INT", "INTEGER", "BIGINT", "SMALLINT", ""]):
                        return True, c_meta["name"]

        # If ending with _id and is integer
        for c_low, c_meta in cols_meta.items():
            if c_low.endswith("_id") and any(t in str(c_meta.get("type", "")).upper() for t in ["INT", "INTEGER", "BIGINT"]):
                return True, c_meta["name"]

        # No verified chronological/sequential ordering column found
        return False, None

    @classmethod
    def _extract_limits_and_ordering(
        cls,
        q_lower: str,
        analyzed: AnalyzedQuery,
        target_table: Optional[str],
        table_cols: List[str],
        table_data: Dict[str, Any]
    ):
        num_terms = "|".join(cls.WORD_TO_NUM.keys())
        num_pattern = rf"(?:\d+|{num_terms})"

        # Check "last N rows" / "latest N"
        is_last = bool(
            re.search(rf"\b(?:last|latest|bottom|most recent|recent)\s+({num_pattern})\b", q_lower) or
            re.search(rf"\b({num_pattern})\s+(?:last|latest|recent)\b", q_lower) or
            ("last" in q_lower and any(w in q_lower for w in ["row", "record", "entry", "item", "rows", "records"]))
        )
        analyzed.is_last_n_request = is_last

        # Check "first N rows" / "top N"
        is_first = bool(
            re.search(rf"\b(?:first|top)\s+({num_pattern})\b", q_lower) or
            re.search(rf"\b({num_pattern})\s+(?:first|top)\b", q_lower)
        )
        analyzed.is_first_n_request = is_first

        # Extract numeric limit
        limit_m = re.search(rf"\b(?:first|top|last|latest|limit|bottom)\s+({num_pattern})\b", q_lower)
        if not limit_m:
            limit_m = re.search(rf"\b({num_pattern})\s+(?:rows|records|items|entries|samples|tuples)\b", q_lower)

        if limit_m:
            raw_lim = limit_m.group(1).lower()
            analyzed.row_limit = cls.WORD_TO_NUM.get(raw_lim, int(raw_lim) if raw_lim.isdigit() else None)

        # Handle Section 4 for "last N rows"
        if analyzed.is_last_n_request:
            has_col, ord_col = cls._find_verified_ordering_column(table_cols, table_data)
            if has_col and ord_col:
                analyzed.order_by_col = ord_col
                analyzed.order_direction = "DESC"
            else:
                analyzed.needs_clarification = True
                cols_str = ", ".join(table_cols) if table_cols else "none"
                analyzed.clarification_message = (
                    f"Table '{target_table or 'selected'}' does not have a verified sequential ID or timestamp column. "
                    f"Which column determines the latest records? Available columns: {cols_str}."
                )
        else:
            # Check user-requested sorting
            sort_m = re.search(r"\b(?:order\s+by|sort\s+by|ordered\s+by|sorted\s+by)\s+([a-zA-Z0-9_]+)(?:\s+(asc|desc|ascending|descending))?", q_lower)
            if sort_m:
                col_candidate = sort_m.group(1).lower()
                cols_map = {c.lower(): c for c in table_cols}
                if col_candidate in cols_map:
                    analyzed.order_by_col = cols_map[col_candidate]
                    direction = sort_m.group(2)
                    analyzed.order_direction = "DESC" if direction and "desc" in direction else "ASC"
            elif any(w in q_lower for w in ["highest", "best", "greatest", "most"]):
                for c in table_cols:
                    if any(t in c.lower() for t in ["salary", "revenue", "price", "amount", "score", "marks", "units", "total"]):
                        analyzed.order_by_col = c
                        analyzed.order_direction = "DESC"
                        break

    @classmethod
    def _extract_all_conditions(
        cls,
        q_raw: str,
        cols_map: Dict[str, str],
        table_cols: List[str],
        analyzed: AnalyzedQuery
    ):
        """
        Extracts all conditions from the natural language query.
        Correctly parses comparison phrases:
        - "is greater than" -> >
        - "is less than" -> <
        - "is between X and Y" -> BETWEEN X AND Y
        - "but" -> AND
        - "or" -> OR
        - strictly rejects unmapped columns without substitution.
        """
        # Find WHERE / WITH / HAVING clause
        where_m = re.search(r"\b(?:where|with|having)\b\s+(.*)", q_raw, re.IGNORECASE)
        clause_str = where_m.group(1) if where_m else q_raw

        # Strip trailing clauses: order by, group by, limit
        clause_str = re.sub(
            r"\b(?:order\s+by|sort\s+by|group\s+by|limit)\b.*$",
            "",
            clause_str,
            flags=re.IGNORECASE
        ).strip().rstrip(".?!;").strip()

        if not clause_str or (clause_str == q_raw and not where_m):
            # Check if condition hint exists in query
            has_condition_hint = any(op in q_raw.lower() for op in ["=", ">", "<", "greater", "less", "between", "equals", "is", "like"])
            if not has_condition_hint:
                return

        # 1. Protect BETWEEN X AND Y so 'and' inside BETWEEN is not split as a logical connector
        def protect_between(m):
            return f"{m.group(1)} {m.group(2)} {m.group(3)} __BETWEEN_SEP__ {m.group(4)}"

        protected = re.sub(
            r"\b([a-zA-Z0-9_]+)\s+(is\s+between|between)\s+([^\s]+)\s+and\s+([^\s,]+)",
            protect_between,
            clause_str,
            flags=re.IGNORECASE
        )

        # 2. Tokenize by logical connectors: AND, BUT, OR, comma
        token_parts = re.split(
            r"(\s*,\s*(?:and|but)\s+|\s+(?:and|but)\s+|\s*,\s*or\s+|\s+or\s+|\s*,\s*)",
            protected,
            flags=re.IGNORECASE
        )

        op_pattern_str = (
            r"(?:"
            r"is\s+greater\s+than\s+or\s+equal\s+to|greater\s+than\s+or\s+equal\s+to|at\s+least|>=|"
            r"is\s+less\s+than\s+or\s+equal\s+to|less\s+than\s+or\s+equal\s+to|at\s+most|<=|"
            r"is\s+not\s+equal\s+to|not\s+equal\s+to|is\s+not|!=|<>|"
            r"is\s+greater\s+than|greater\s+than|more\s+than|above|higher\s+than|>|"
            r"is\s+less\s+than|less\s+than|under|below|lower\s+than|<|"
            r"is\s+equal\s+to|equal\s+to|equals|is|=|=="
            r"contains|starts\s+with|ends\s+with|like"
            r")"
        )
        cond_pattern = re.compile(
            rf"^\s*([a-zA-Z0-9_\s]+?)\s+({op_pattern_str})\s*(?:\'([^\']*)\'|\"([^\"]*)\"|(.*?))\s*$",
            re.IGNORECASE
        )

        current_logical = "AND"
        for part in token_parts:
            part_str = part.strip()
            if not part_str:
                continue

            low_part = part_str.lower()
            if re.fullmatch(r",?\s*or", low_part):
                current_logical = "OR"
                continue
            elif re.fullmatch(r",?\s*(?:and|but)|,", low_part):
                current_logical = "AND"
                continue

            # Unprotect BETWEEN
            part_unprotected = part_str.replace("__BETWEEN_SEP__", "AND")

            # Check for BETWEEN condition
            between_m = re.match(
                r"^\s*([a-zA-Z0-9_\s]+?)\s+(?:is\s+)?between\s+([^\s]+)\s+and\s+([^\s]+)\s*$",
                part_unprotected,
                re.IGNORECASE
            )
            if between_m:
                raw_col = between_m.group(1).strip()
                raw_col_clean = re.sub(r"^(?:records|rows|where|show|find|select)\s+", "", raw_col, flags=re.IGNORECASE).strip()
                val1 = between_m.group(2).strip().strip("'\"")
                val2 = between_m.group(3).strip().strip("'\"")

                mapped_col = cols_map.get(raw_col_clean.lower())
                if not mapped_col:
                    analyzed.unmapped_columns.append(raw_col_clean)

                formatted_val = f"{val1} AND {val2}"
                condition = ExtractedCondition(
                    raw_col=raw_col_clean,
                    schema_col=mapped_col,
                    operator="BETWEEN",
                    formatted_value=formatted_val,
                    raw_value=f"{val1} AND {val2}",
                    logical_op=current_logical,
                    raw_text=part_unprotected
                )
                analyzed.conditions.append(condition)
                continue

            # Standard comparison condition
            cm = cond_pattern.match(part_unprotected)
            if cm:
                raw_col = cm.group(1).strip()
                raw_op = cm.group(2).strip().lower()
                raw_val = cm.group(3) or cm.group(4) or (cm.group(5).strip() if cm.group(5) else "")

                raw_col_clean = re.sub(r"^(?:records|rows|where|show|find|select)\s+", "", raw_col, flags=re.IGNORECASE).strip()

                mapped_col = cols_map.get(raw_col_clean.lower())
                if not mapped_col:
                    analyzed.unmapped_columns.append(raw_col_clean)

                norm_op = cls._normalize_operator(raw_op)
                formatted_val = cls._format_value(raw_val, norm_op)

                condition = ExtractedCondition(
                    raw_col=raw_col_clean,
                    schema_col=mapped_col,
                    operator=norm_op,
                    formatted_value=formatted_val,
                    raw_value=raw_val,
                    logical_op=current_logical,
                    raw_text=part_unprotected
                )
                analyzed.conditions.append(condition)

    @classmethod
    def _normalize_operator(cls, raw_op: str) -> str:
        op = raw_op.lower().strip()
        if op in ["=", "==", "is", "equals", "equal to", "is equal to"]:
            return "="
        elif op in ["!=", "<>", "is not", "not equal to", "is not equal to"]:
            return "!="
        elif op in [">=", "greater than or equal to", "is greater than or equal to", "at least"]:
            return ">="
        elif op in ["<=", "less than or equal to", "is less than or equal to", "at most"]:
            return "<="
        elif op in [">", "greater than", "is greater than", "more than", "above", "higher than"]:
            return ">"
        elif op in ["<", "less than", "is less than", "under", "below", "lower than"]:
            return "<"
        elif op in ["like", "contains", "starts with", "ends with"]:
            return "LIKE"
        elif "between" in op:
            return "BETWEEN"
        return "="

    @classmethod
    def _format_value(cls, val: str, op: str) -> str:
        clean_val = val.strip().strip("'\"").rstrip(".?!;").strip()
        # Numeric check
        if re.match(r"^-?\d+(?:\.\d+)?$", clean_val):
            return clean_val
        elif clean_val.lower() in ["true", "false"]:
            return clean_val.upper()
        elif clean_val.lower() == "null":
            return "NULL"
        else:
            if op == "LIKE" and not clean_val.startswith("%") and not clean_val.endswith("%"):
                clean_val = f"%{clean_val}%"
            escaped = clean_val.replace("'", "''")
            return f"'{escaped}'"

    @classmethod
    def synthesize_sql_from_intent(cls, analyzed: AnalyzedQuery, schema_info: Dict[str, Any]) -> str:
        """
        Stage 2 Deterministic Generator: Synthesizes valid, schema-grounded SQLite query
        strictly adhering to Stage 1 analyzed intent.
        """
        target_table = analyzed.target_table or list(schema_info.get("tables", {}).keys())[0]

        # 1. Projections
        if analyzed.is_count_request:
            cols_clause = "COUNT(*) AS total_count"
        elif analyzed.is_summary_request and analyzed.summary_col:
            sc = analyzed.summary_col
            cols_clause = f'ROUND(AVG("{sc}"), 2) AS average_{sc}, MIN("{sc}") AS min_{sc}, MAX("{sc}") AS max_{sc}, COUNT(*) AS total_count'
        elif analyzed.selected_columns:
            cols_clause = ", ".join([f'"{c}"' for c in analyzed.selected_columns])
        else:
            cols_clause = "*"

        # 2. WHERE Clause
        where_clause = ""
        if analyzed.conditions:
            cond_frags = []
            for i, c in enumerate(analyzed.conditions):
                frag = c.to_sql_fragment()
                if i == 0:
                    cond_frags.append(frag)
                else:
                    cond_frags.append(f"{c.logical_op} {frag}")
            where_clause = f" WHERE {' '.join(cond_frags)}"

        # 3. ORDER BY Clause
        order_clause = ""
        if analyzed.is_last_n_request and analyzed.order_by_col:
            order_clause = f' ORDER BY "{analyzed.order_by_col}" DESC'
        elif analyzed.order_by_col:
            direction = analyzed.order_direction or "ASC"
            order_clause = f' ORDER BY "{analyzed.order_by_col}" {direction}'

        # 4. LIMIT Clause
        limit_clause = f" LIMIT {analyzed.row_limit}" if analyzed.row_limit else ""

        return f'SELECT {cols_clause} FROM "{target_table}"{where_clause}{order_clause}{limit_clause}'

    @classmethod
    def reconcile_and_verify(
        cls,
        generated_sql: str,
        analyzed: AnalyzedQuery,
        schema_info: Dict[str, Any]
    ) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        AST-based independent validation & reconciliation layer:
        - Verifies table existence
        - Verifies column existence against actual database schema
        - Verifies all WHERE filters, operators, values, and AND/OR relationships
        - Injects dropped filters if missing
        - Verifies ORDER BY and LIMIT
        - Generates explanation derived strictly from the validated AST
        - Preserves read-only enforcement
        """
        if analyzed.needs_clarification:
            return False, "", analyzed.clarification_message, analyzed.clarification_message

        if analyzed.unmapped_columns:
            target = analyzed.target_table or "table"
            table_cols = [c["name"] for c in schema_info.get("tables", {}).get(target, {}).get("columns", [])]
            cols_list = ", ".join(table_cols) if table_cols else "none"
            err = (
                f"Referenced column(s) '{', '.join(analyzed.unmapped_columns)}' do not exist in table '{target}'. "
                f"Strict schema adherence required (Rule 3). Column substitution is prohibited. Available columns: {cols_list}."
            )
            return False, generated_sql, err, None

        # Parse AST using sqlglot
        try:
            parsed = sqlglot.parse(generated_sql, read="sqlite")
            if not parsed or len(parsed) != 1:
                return False, generated_sql, "Invalid SQL: Must contain exactly one statement.", None
            expression = parsed[0]
            if not isinstance(expression, (exp.Select, exp.Union)):
                return False, generated_sql, f"Only SELECT read-only queries are permitted. Detected: {expression.key.upper()}", None
        except Exception as parse_err:
            return False, generated_sql, f"SQL Parse Error: {str(parse_err)}", None

        # 1. Verify and reconcile WHERE filters
        where_node = expression.find(exp.Where)
        where_sql = where_node.sql(dialect="sqlite").lower() if where_node else ""

        for cond in analyzed.conditions:
            if not cond.schema_col:
                continue
            col_search = cond.schema_col.lower()
            val_search = str(cond.raw_value).lower()

            is_present = (col_search in where_sql) and (val_search in where_sql)
            if not is_present:
                # Missing or corrupted filter: inject via AST
                frag = cond.to_sql_fragment()
                try:
                    frag_ast = sqlglot.parse_one(frag, read="sqlite")
                    if where_node:
                        if cond.logical_op == "OR":
                            new_where_expr = exp.Or(this=where_node.this, expression=frag_ast)
                        else:
                            new_where_expr = exp.And(this=where_node.this, expression=frag_ast)
                        where_node.set("this", new_where_expr)
                    else:
                        expression = expression.where(frag_ast)
                        where_node = expression.find(exp.Where)
                    where_sql = where_node.sql(dialect="sqlite").lower() if where_node else ""
                except Exception as inject_err:
                    return False, generated_sql, f"Validation failed: Condition '{cond.raw_text}' was dropped and could not be injected: {inject_err}", None

        # 2. Check COUNT aggregation if requested
        if analyzed.is_count_request:
            has_count = any(isinstance(c, exp.Count) or "count" in c.sql().lower() for c in expression.find_all(exp.Func))
            if not has_count:
                expression.set("expressions", [sqlglot.parse_one("COUNT(*) AS total_count")])

        # 3. Check ordering and limits
        if analyzed.is_last_n_request and analyzed.order_by_col:
            order_node = expression.find(exp.Order)
            expected_order_sql = f'ORDER BY "{analyzed.order_by_col}" DESC'
            if not order_node or analyzed.order_by_col.lower() not in order_node.sql(dialect="sqlite").lower() or "desc" not in order_node.sql(dialect="sqlite").lower():
                try:
                    dummy = sqlglot.parse_one(f"SELECT 1 {expected_order_sql}", read="sqlite")
                    expression.set("order", dummy.find(exp.Order))
                except Exception:
                    pass

        if analyzed.row_limit:
            limit_node = expression.find(exp.Limit)
            if not limit_node:
                expression = expression.limit(analyzed.row_limit)
            else:
                limit_node.set("expression", exp.Literal.number(analyzed.row_limit))

        final_sql = expression.sql(dialect="sqlite")

        # 4. Generate Explanation directly from the validated AST & requirements (Section 8)
        explanation_parts = []
        target = analyzed.target_table or "table"
        if analyzed.is_count_request:
            explanation_parts.append(f"Counts all records in table '{target}'")
        else:
            explanation_parts.append(f"Retrieves records from table '{target}'")

        if analyzed.conditions:
            cond_descs = []
            for c in analyzed.conditions:
                if c.schema_col:
                    if c.operator == "BETWEEN":
                        cond_descs.append(f"{c.schema_col} between {c.formatted_value}")
                    else:
                        cond_descs.append(f"{c.schema_col} {c.operator} {c.formatted_value}")
            join_word = " or " if (len(analyzed.conditions) > 1 and analyzed.conditions[1].logical_op == "OR") else " and "
            explanation_parts.append(f"where {join_word.join(cond_descs)}")

        if analyzed.is_last_n_request and analyzed.order_by_col:
            explanation_parts.append(f"ordered by {analyzed.order_by_col} descending (latest {analyzed.row_limit or 20} records)")
        elif analyzed.order_by_col:
            explanation_parts.append(f"ordered by {analyzed.order_by_col} {analyzed.order_direction or 'ASC'}")

        if analyzed.row_limit and not analyzed.is_last_n_request:
            explanation_parts.append(f"limited to {analyzed.row_limit} rows")

        adjusted_explanation = " ".join(explanation_parts) + "."

        return True, final_sql, None, adjusted_explanation
