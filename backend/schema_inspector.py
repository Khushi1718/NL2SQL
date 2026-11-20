from typing import Dict, List, Any
from sqlalchemy import inspect, text
from database import engine

def get_database_schema(exclude_tables: List[str] = None) -> Dict[str, Any]:
    """
    Inspects the connected SQLite database and returns detailed schema metadata.
    """
    if exclude_tables is None:
        exclude_tables = ["query_history", "sqlite_sequence"]

    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    schema_info = {
        "tables": {},
        "relationships": [],
        "table_count": 0,
        "total_columns": 0
    }

    total_cols = 0

    with engine.connect() as conn:
        for table_name in table_names:
            if table_name in exclude_tables:
                continue

            # Columns
            cols = inspector.get_columns(table_name)
            pk = inspector.get_pk_constraint(table_name)
            pk_cols = pk.get("constrained_columns", [])
            fks = inspector.get_foreign_keys(table_name)

            columns_info = []
            for col in cols:
                total_cols += 1
                is_pk = col["name"] in pk_cols
                fk_target = None
                for fk in fks:
                    if col["name"] in fk.get("constrained_columns", []):
                        idx = fk["constrained_columns"].index(col["name"])
                        target_col = fk["referred_columns"][idx] if idx < len(fk["referred_columns"]) else "id"
                        fk_target = f"{fk['referred_table']}.{target_col}"
                        break

                columns_info.append({
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col.get("nullable", True),
                    "primary_key": is_pk,
                    "foreign_key": fk_target
                })

            # Record count
            try:
                row_count_res = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
            except Exception:
                row_count_res = 0

            # Sample records (top 3)
            sample_rows = []
            try:
                sample_res = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT 3'))
                keys = list(sample_res.keys())
                for r in sample_res.fetchall():
                    row_dict = {}
                    for i, val in enumerate(r):
                        row_dict[keys[i]] = str(val) if val is not None else None
                    sample_rows.append(row_dict)
            except Exception:
                sample_rows = []

            schema_info["tables"][table_name] = {
                "name": table_name,
                "columns": columns_info,
                "primary_keys": pk_cols,
                "foreign_keys": [
                    {
                        "constrained_columns": fk["constrained_columns"],
                        "referred_table": fk["referred_table"],
                        "referred_columns": fk["referred_columns"]
                    }
                    for fk in fks
                ],
                "row_count": row_count_res,
                "sample_rows": sample_rows
            }

            for fk in fks:
                schema_info["relationships"].append({
                    "from_table": table_name,
                    "from_columns": fk["constrained_columns"],
                    "to_table": fk["referred_table"],
                    "to_columns": fk["referred_columns"]
                })

    schema_info["table_count"] = len(schema_info["tables"])
    schema_info["total_columns"] = total_cols
    return schema_info


def format_schema_for_prompt(schema_info: Dict[str, Any]) -> str:
    """
    Formats the schema metadata into a clean, concise, unambiguous representation
    for Context Injection in the LLM prompt.
    """
    lines = ["### DATABASE SCHEMA (SQLite):\n"]
    for table_name, table_data in schema_info["tables"].items():
        lines.append(f"Table: {table_name}")
        cols_desc = []
        for col in table_data["columns"]:
            pk_str = " [PRIMARY KEY]" if col["primary_key"] else ""
            fk_str = f" [REFERENCES {col['foreign_key']}]" if col["foreign_key"] else ""
            cols_desc.append(f"  - {col['name']} ({col['type']}){pk_str}{fk_str}")
        lines.extend(cols_desc)

        # Include 1 sample row for data format clarity
        if table_data["sample_rows"]:
            sample = table_data["sample_rows"][0]
            lines.append(f"  Sample Row: {sample}")
        lines.append("")

    if schema_info["relationships"]:
        lines.append("### FOREIGN KEY RELATIONSHIPS:")
        for rel in schema_info["relationships"]:
            from_col = ", ".join(rel["from_columns"])
            to_col = ", ".join(rel["to_columns"])
            lines.append(f"- {rel['from_table']}.{from_col} -> {rel['to_table']}.{to_col}")
        lines.append("")

    return "\n".join(lines)
