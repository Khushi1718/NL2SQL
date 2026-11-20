import re
from typing import Dict, Any, List, Optional, Tuple, Set
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
        self.operator = operator
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
        return f"{col} {self.operator} {self.formatted_value}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_col": self.raw_col,
            "schema_col": self.schema_col,
            "operator": self.operator,
            "formatted_value": self.formatted_value,
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

    def format_for_prompt(self) -> str:
        """Formats the analyzed requirements into explicit instructions for the LLM prompt."""
        lines = ["### PRE-ANALYZED QUERY REQUIREMENTS (MANDATORY TO PRESERVE):"]
        if self.target_table:
            lines.append(f"- Target Table: {self.target_table}")
        if self.conditions:
            lines.append("- Required WHERE Conditions (DO NOT OMIT ANY):")
            for i, c in enumerate(self.conditions):
                lines.append(f"  {i+1}. [{c.logical_op}] {c.to_sql_fragment()}")
        if self.is_last_n_request:
            if self.order_by_col:
                lines.append(f"- Ordering for Last N Rows: ORDER BY \"{self.order_by_col}\" DESC")
            lines.append(f"- Row Limit: LIMIT {self.row_limit or 10}")
        elif self.order_by_col:
            lines.append(f"- Ordering: ORDER BY \"{self.order_by_col}\" {self.order_direction or 'ASC'}")
        if self.row_limit and not self.is_last_n_request:
            lines.append(f"- Row Limit: LIMIT {self.row_limit}")
        return "\n".join(lines)


class NLQueryAnalyzer:
    """
    Analyzes natural language queries against database schemas to extract
    every condition, map columns strictly, identify ordering requirements,
    and cross-check generated SQL.
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
        q_raw = query.strip()
        q_lower = q_raw.lower()

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
        if any(w in q_lower for w in ["how many", "count", "number of rows", "total number", "count(*)"]):
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
                # Check if column is mentioned outside the where clause
                m_col = re.search(rf"\b{re.escape(c_low)}\b", q_lower)
                if m_col:
                    analyzed.selected_columns.append(c_orig)

        # 5. Extract Conditions
        cls._extract_all_conditions(q_raw, cols_map, table_cols, analyzed)

        return analyzed

    @classmethod
    def _resolve_target_table(cls, q_lower: str, table_names: List[str], tables: Dict[str, Any]) -> Optional[str]:
        if not table_names:
            return None

        # Direct table match in query
        for tname in table_names:
            t_low = tname.lower()
            pattern = rf"\b{re.escape(t_low)}\b"
            if re.search(pattern, q_lower):
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

        # Default to first table if only one or as fallback
        return table_names[0]

    @classmethod
    def _find_verified_ordering_column(cls, table_cols: List[str], table_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Rule 6: For 'last N rows', use a verified sequential ID or timestamp column.
        If no reliable ordering column exists, return (False, None).
        """
        cols_meta = {c["name"].lower(): c for c in table_data.get("columns", [])}

        # Priority 1: Timestamp / Datetime columns
        timestamp_candidates = ["timestamp", "created_at", "creation_date", "updated_at", "datetime", "date", "time"]
        for cand in timestamp_candidates:
            for c_low, c_meta in cols_meta.items():
                if cand == c_low or cand in c_low:
                    return True, c_meta["name"]

        # Check types for date/time
        for c_low, c_meta in cols_meta.items():
            ctype = str(c_meta.get("type", "")).upper()
            if any(t in ctype for t in ["DATETIME", "TIMESTAMP", "DATE"]):
                return True, c_meta["name"]

        # Priority 2: Primary Key sequential column
        pk_cols = [pk.lower() for pk in table_data.get("primary_keys", [])]
        for pk in pk_cols:
            if pk in cols_meta:
                pk_type = str(cols_meta[pk].get("type", "")).upper()
                if "INT" in pk_type:
                    return True, cols_meta[pk]["name"]

        # Priority 3: Sequential ID candidates
        id_candidates = ["id", "row_id", "seq", "sequence", "item_id", "record_id"]
        for cand in id_candidates:
            for c_low, c_meta in cols_meta.items():
                if cand == c_low:
                    return True, c_meta["name"]

        # If ending with _id and is integer
        for c_low, c_meta in cols_meta.items():
            if c_low.endswith("_id") and "INT" in str(c_meta.get("type", "")).upper():
                return True, c_meta["name"]

        # No reliable ordering column found
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

        # Handle Rule 6 for "last N rows"
        if analyzed.is_last_n_request:
            has_col, ord_col = cls._find_verified_ordering_column(table_cols, table_data)
            if has_col and ord_col:
                analyzed.order_by_col = ord_col
                analyzed.order_direction = "DESC"
            else:
                # Rule 6: If no reliable ordering column exists, ask for clarification. Never guess.
                analyzed.needs_clarification = True
                cols_str = ", ".join(table_cols) if table_cols else "none"
                analyzed.clarification_message = (
                    f"Table '{target_table or 'selected'}' does not have a verified sequential ID or timestamp column. "
                    f"To display the last records accurately, which column should determine the ordering? "
                    f"Available columns: {cols_str}."
                )
        else:
            # Check user-requested sorting (e.g. "ordered by salary desc", "highest revenue")
            sort_m = re.search(r"\b(?:order\s+by|sort\s+by|ordered\s+by|sorted\s+by)\s+([a-zA-Z0-9_]+)(?:\s+(asc|desc|ascending|descending))?", q_lower)
            if sort_m:
                col_candidate = sort_m.group(1).lower()
                cols_map = {c.lower(): c for c in table_cols}
                if col_candidate in cols_map:
                    analyzed.order_by_col = cols_map[col_candidate]
                    direction = sort_m.group(2)
                    analyzed.order_direction = "DESC" if direction and "desc" in direction else "ASC"
            elif any(w in q_lower for w in ["highest", "best", "greatest", "most", "top"]):
                # Look for numeric column
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
        Extracts all conditions from the query, mapping strictly against actual schema columns.
        Preserves comparison operators, values, and AND/OR relationships.
        Never substitutes similar column names (Rule 3).
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
        ).strip()

        if not clause_str or clause_str == q_raw and not where_m:
            # If no explicit WHERE and whole query was kept, check if any "col op val" patterns exist
            has_condition_hint = any(op in q_raw.lower() for op in ["=", ">", "<", "is", "equals", "contains"])
            if not has_condition_hint:
                return

        # Tokenize by logical connectors: AND / OR / comma
        # Preserving the delimiter so we know whether it's AND or OR
        token_parts = re.split(r"(\s*,\s*and\s+|\s+and\s+|\s*,\s*or\s+|\s+or\s+|\s*,\s*)", clause_str, flags=re.IGNORECASE)

        cond_pattern = re.compile(
            r"^\s*([a-zA-Z0-9_\s]+?)\s*(=|!=|<>|<=|>=|<|>|\bis\s+not\b|\bis\b|\blike\b|\bequals?\b|\bequal\s+to\b|\bnot\s+equal\s+to\b|\bmore\s+than\b|\bgreater\s+than\b|\bless\s+than\b)\s*(?:\'([^\']*)\'|\"([^\"]*)\"|([^\'\"]+?))\s*$",
            re.IGNORECASE
        )

        current_logical = "AND"
        for part in token_parts:
            part_str = part.strip()
            if not part_str:
                continue

            low_part = part_str.lower()
            if "or" in low_part:
                current_logical = "OR"
                continue
            elif "and" in low_part or part_str == ",":
                current_logical = "AND"
                continue

            cm = cond_pattern.match(part_str)
            if cm:
                raw_col = cm.group(1).strip()
                raw_op = cm.group(2).strip().lower()
                raw_val = cm.group(3) or cm.group(4) or cm.group(5).strip()

                # Clean potential words like "records", "rows", "where" from raw_col
                raw_col_clean = re.sub(r"^(?:records|rows|where|show|find|select)\s+", "", raw_col, flags=re.IGNORECASE).strip()

                # Strict Schema Column Mapping (Rule 3)
                mapped_col = cols_map.get(raw_col_clean.lower())
                if not mapped_col:
                    # Also try exact match without case change
                    for c in table_cols:
                        if c.lower() == raw_col_clean.lower():
                            mapped_col = c
                            break

                if not mapped_col:
                    # Rule 3: Map columns ONLY using the actual database schema. Never substitute similar column names.
                    analyzed.unmapped_columns.append(raw_col_clean)

                # Normalize operator
                norm_op = cls._normalize_operator(raw_op)

                # Format value
                formatted_val = cls._format_value(raw_val, norm_op)

                condition = ExtractedCondition(
                    raw_col=raw_col_clean,
                    schema_col=mapped_col,
                    operator=norm_op,
                    formatted_value=formatted_val,
                    raw_value=raw_val,
                    logical_op=current_logical,
                    raw_text=part_str
                )
                analyzed.conditions.append(condition)

    @classmethod
    def _normalize_operator(cls, raw_op: str) -> str:
        if raw_op in ["=", "is", "equals", "equal to"]:
            return "="
        elif raw_op in ["!=", "<>", "is not", "not equal to"]:
            return "!="
        elif raw_op in [">=", "greater than or equal to", "at least"]:
            return ">="
        elif raw_op in ["<=", "less than or equal to", "at most"]:
            return "<="
        elif raw_op in [">", "more than", "greater than", "above", "higher than"]:
            return ">"
        elif raw_op in ["<", "less than", "under", "below"]:
            return "<"
        elif raw_op in ["like", "contains", "starts with", "ends with"]:
            return "LIKE"
        return "="

    @classmethod
    def _format_value(cls, val: str, op: str) -> str:
        clean_val = val.strip().strip("'\"")
        # Check if numeric
        if re.match(r"^-?\d+(?:\.\d+)?$", clean_val):
            return clean_val
        elif clean_val.lower() in ["true", "false"]:
            return clean_val.upper()
        elif clean_val.lower() == "null":
            return "NULL"
        else:
            if op == "LIKE" and not clean_val.startswith("%") and not clean_val.endswith("%"):
                clean_val = f"%{clean_val}%"
            # Escape single quotes for SQLite
            escaped = clean_val.replace("'", "''")
            return f"'{escaped}'"

    @classmethod
    def reconcile_and_verify(
        cls,
        generated_sql: str,
        analyzed: AnalyzedQuery,
        schema_info: Dict[str, Any]
    ) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """
        Cross-checks generated SQL against analyzed user requirements (Rule 7).
        Enforces:
        - If clarification is needed, blocks execution and requests clarification (Rule 6).
        - If unmapped columns exist, returns validation error (Rule 3).
        - Preserves every condition in the WHERE clause (Rule 4, 5, 8).
        - Verifies 'last N rows' uses verified DESC ordering (Rule 6).
        - Generates consistent explanation describing every condition (Rule 9).
        - Preserves strict read-only SQL enforcement (Rule 10).
        """
        if analyzed.needs_clarification:
            return False, "", analyzed.clarification_message, analyzed.clarification_message

        if analyzed.unmapped_columns:
            target = analyzed.target_table or "table"
            table_cols = [c["name"] for c in schema_info.get("tables", {}).get(target, {}).get("columns", [])]
            cols_list = ", ".join(table_cols) if table_cols else "none"
            err = (
                f"Column '{', '.join(analyzed.unmapped_columns)}' does not exist in table '{target}'. "
                f"Strict schema adherence required (Rule 3). Available columns: {cols_list}."
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

        # Check conditions in WHERE clause
        where_node = expression.find(exp.Where)
        where_sql = where_node.sql(dialect="sqlite").lower() if where_node else ""

        missing_conditions: List[ExtractedCondition] = []
        for cond in analyzed.conditions:
            if not cond.schema_col:
                continue
            col_search = cond.schema_col.lower()
            val_search = cond.raw_value.lower()

            # Check if column and value are represented in the WHERE clause
            is_present = (col_search in where_sql) and (val_search in where_sql)
            if not is_present:
                missing_conditions.append(cond)

        # Rule 8: If any condition is missing, regenerate/reconcile AST
        if missing_conditions:
            for missing in missing_conditions:
                frag = missing.to_sql_fragment()
                try:
                    frag_ast = sqlglot.parse_one(frag, read="sqlite")
                    if where_node:
                        # Combine with proper logical operator (AND or OR)
                        if missing.logical_op == "OR":
                            new_where_expr = exp.Or(this=where_node.this, expression=frag_ast)
                        else:
                            new_where_expr = exp.And(this=where_node.this, expression=frag_ast)
                        where_node.set("this", new_where_expr)
                    else:
                        expression = expression.where(frag_ast)
                        where_node = expression.find(exp.Where)
                except Exception as inject_err:
                    return False, generated_sql, f"Validation failed: Condition '{missing.raw_text}' was dropped and could not be injected: {inject_err}", None

        # Rule 6 & 2: Check ordering and limits for "last N rows"
        if analyzed.is_last_n_request:
            if analyzed.order_by_col:
                # Ensure ORDER BY "{col}" DESC is in AST
                order_node = expression.find(exp.Order)
                expected_order_sql = f'ORDER BY "{analyzed.order_by_col}" DESC'
                if not order_node or analyzed.order_by_col.lower() not in order_node.sql(dialect="sqlite").lower() or "desc" not in order_node.sql(dialect="sqlite").lower():
                    try:
                        dummy = sqlglot.parse_one(f'SELECT 1 {expected_order_sql}', read='sqlite')
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

        # Rule 9: Ensure explanation accurately reflects every condition in the generated SQL
        explanation_parts = []
        if analyzed.target_table:
            explanation_parts.append(f"Retrieves records from '{analyzed.target_table}'")
        else:
            explanation_parts.append("Retrieves records")

        if analyzed.conditions:
            cond_descs = [f"{c.schema_col} {c.operator} {c.formatted_value}" for c in analyzed.conditions if c.schema_col]
            explanation_parts.append(f"where {' and '.join(cond_descs)}")

        if analyzed.is_last_n_request and analyzed.order_by_col:
            explanation_parts.append(f"ordered by {analyzed.order_by_col} descending (latest {analyzed.row_limit or 10} records)")
        elif analyzed.order_by_col:
            explanation_parts.append(f"ordered by {analyzed.order_by_col} {analyzed.order_direction or 'ASC'}")

        if analyzed.row_limit and not analyzed.is_last_n_request:
            explanation_parts.append(f"limited to {analyzed.row_limit} rows")

        adjusted_explanation = " ".join(explanation_parts) + "."

        return True, final_sql, None, adjusted_explanation
