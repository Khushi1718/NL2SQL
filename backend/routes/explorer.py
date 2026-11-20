import re
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from sqlalchemy import text
from database import engine
from schema_inspector import get_database_schema

router = APIRouter(prefix="/api/explorer", tags=["Database Explorer"])

@router.get("/tables")
def list_tables():
    """
    Returns list of all available tables, structures, row counts, and relationships.
    """
    schema = get_database_schema(exclude_tables=["sqlite_sequence"])
    return {
        "tables": list(schema["tables"].values()),
        "relationships": schema["relationships"],
        "table_count": schema["table_count"],
        "total_columns": schema["total_columns"]
    }

@router.get("/tables/{table_name}")
def get_table_details(table_name: str, limit: int = 50):
    """
    Returns schema structure and up to `limit` sample records for a specific table.
    """
    schema = get_database_schema(exclude_tables=["sqlite_sequence"])
    if table_name not in schema["tables"]:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' does not exist.")

    table_meta = schema["tables"][table_name]

    # Fetch rows
    rows = []
    columns = []
    try:
        with engine.connect() as conn:
            res = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT :limit'), {"limit": limit})
            columns = list(res.keys())
            for r in res.fetchall():
                row_dict = {}
                for i, col in enumerate(columns):
                    val = r[i]
                    if hasattr(val, "isoformat"):
                        val = val.isoformat()
                    row_dict[col] = val
                rows.append(row_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading table rows: {str(e)}")

    return {
        "table": table_meta,
        "columns": columns,
        "rows": rows,
        "total_records": table_meta["row_count"],
        "returned_records": len(rows)
    }

@router.post("/upload-csv")
async def upload_csv_table(
    file: UploadFile = File(...),
    table_name: str = Form(...)
):
    """
    Uploads a CSV file and imports it as a new database table.
    """
    # Sanitize table name
    clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", table_name.strip().lower())
    if not clean_name or clean_name[0].isdigit():
        clean_name = f"tbl_{clean_name}"

    if clean_name in ["query_history", "sqlite_sequence"]:
        raise HTTPException(status_code=400, detail="Table name is reserved by system.")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        # Sanitize column names
        df.columns = [re.sub(r"[^a-zA-Z0-9_]", "_", str(c).strip().lower()) for c in df.columns]

        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

        # Save to SQLite database
        df.to_sql(name=clean_name, con=engine, if_exists="replace", index=False)

        # Inspect updated table
        schema = get_database_schema()
        updated_table = schema["tables"].get(clean_name, {})

        return {
            "message": f"Successfully imported CSV as table '{clean_name}'.",
            "table_name": clean_name,
            "rows_imported": len(df),
            "columns": list(df.columns),
            "table_metadata": updated_table
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")
