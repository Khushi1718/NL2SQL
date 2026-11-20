import re
from typing import Tuple, Optional, Set
import sqlglot
from sqlglot import exp

FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
    "REPLACE", "ATTACH", "DETACH", "GRANT", "REVOKE", "VACUUM", "REINDEX",
    "EXEC", "EXECUTE", "UPSERT", "MERGE"
}

def clean_sql(raw_sql: str) -> str:
    """Strip markdown code fences and whitespace from model response."""
    sql = raw_sql.strip()
    if sql.startswith("```"):
        lines = sql.splitlines()
        if len(lines) >= 2:
            # remove first line (e.g. ```sql or ```)
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            sql = "\n".join(lines).strip()
    # Remove trailing semicolon for standardization
    if sql.endswith(";"):
        sql = sql[:-1].strip()
    return sql


def validate_sql(
    sql_query: str,
    allowed_tables: Optional[Set[str]] = None,
    max_limit: int = 500
) -> Tuple[bool, str, Optional[str]]:
    """
    Validates a SQL query for safety.
    Returns: (is_valid: bool, sanitized_or_error_sql: str, error_message: Optional[str])
    """
    sql = clean_sql(sql_query)

    if not sql:
        return False, "", "Empty query provided."

    # 1. Check for multiple statements (semicolons in unquoted positions)
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    if len(statements) > 1:
        return False, sql, "Multiple SQL statements are strictly prohibited for security reasons."

    # 2. Check forbidden keywords with regex word boundaries
    upper_sql = sql.upper()
    for kw in FORBIDDEN_KEYWORDS:
        pattern = rf"\b{kw}\b"
        if re.search(pattern, upper_sql):
            return False, sql, f"Security Violation: Query contains prohibited keyword '{kw}'. Only SELECT queries are permitted."

    # 3. PRAGMA checks: forbid any PRAGMA execution
    if re.search(r"\bPRAGMA\b", upper_sql):
        return False, sql, "Security Violation: PRAGMA commands are not allowed."

    # 4. Parse using sqlglot AST
    try:
        parsed_expressions = sqlglot.parse(sql, read="sqlite")
        if not parsed_expressions or len(parsed_expressions) != 1:
            return False, sql, "Invalid SQL: Must contain exactly one query statement."

        expression = parsed_expressions[0]
        if not expression:
            return False, sql, "Failed to parse SQL statement."

        # Must be a Select or Union of Selects
        if not isinstance(expression, (exp.Select, exp.Union)):
            return False, sql, f"Only SELECT read-only queries are permitted. Detected: {expression.key.upper()}"

        # Ensure no write expressions nested inside
        for node in expression.walk():
            if isinstance(node, (exp.Insert, exp.Update, exp.Delete, exp.Create, exp.Drop, exp.Alter)):
                return False, sql, f"Dangerous nested statement detected: {node.key.upper()}"

        # Check tables if allowed_tables list is provided
        if allowed_tables:
            tables_in_query = set()
            for table_node in expression.find_all(exp.Table):
                t_name = table_node.name.lower()
                if t_name:
                    tables_in_query.add(t_name)
            
            normalized_allowed = {t.lower() for t in allowed_tables}
            for t in tables_in_query:
                if t not in normalized_allowed and not t.startswith("sqlite_"):
                    return False, sql, f"Referenced table '{t}' does not exist in the database schema."

        # Ensure LIMIT is present or add safe LIMIT
        limit_node = expression.find(exp.Limit)
        if limit_node:
            try:
                # If existing limit exceeds max_limit, clamp it or leave
                limit_val = int(limit_node.expression.this)
                if limit_val > max_limit:
                    limit_node.expression.this = str(max_limit)
            except Exception:
                pass
        else:
            # Append LIMIT if it's a top-level Select
            if isinstance(expression, exp.Select):
                expression = expression.limit(max_limit)

        validated_sql = expression.sql(dialect="sqlite")
        return True, validated_sql, None

    except Exception as e:
        # If sqlglot parsing fails, perform fallback lexical inspection
        if not upper_sql.strip().startswith("SELECT"):
            return False, sql, f"Query must begin with SELECT. Parse error: {str(e)}"
        
        # Check forbidden keywords again
        for kw in FORBIDDEN_KEYWORDS:
            if re.search(rf"\b{kw}\b", upper_sql):
                return False, sql, f"Security Violation: Query contains prohibited keyword '{kw}'."

        # Basic append of LIMIT if not present
        if "LIMIT" not in upper_sql:
            sql = f"{sql} LIMIT {max_limit}"

        return True, sql, None
