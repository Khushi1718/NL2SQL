import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Header
from typing import Optional, List, Dict, Any
from database_manager import DatabaseManager, DEFAULT_BENCHMARK_DB_ID
from mongo import check_mongo_connection

router = APIRouter(prefix="/api/databases", tags=["Databases"])

MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")) * 1024 * 1024

@router.get("")
@router.get("/list")
def list_all_databases(
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    user_email: Optional[str] = Query(None)
):
    """
    Returns list of databases belonging exclusively to the authenticated user.
    Never returns other users' datasets or global sample databases.
    """
    email = (user_email or x_user_email or "").strip().lower()
    mongo_ok, mongo_msg = check_mongo_connection()
    databases = DatabaseManager.list_databases(user_email=email)

    return {
        "databases": databases,
        "total_databases": len(databases),
        "mongodb_status": {
            "connected": mongo_ok,
            "message": mongo_msg
        }
    }

@router.get("/{database_id}")
def get_database_info(database_id: str):
    """
    Returns metadata for a specific database.
    """
    db_meta = DatabaseManager.get_database(database_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail=f"Database '{database_id}' not found.")
    return db_meta

@router.get("/{database_id}/schema")
def get_database_schema(database_id: str):
    """
    Retrieves full relational schema, columns, data types, and primary/foreign keys
    for the specified database.
    """
    try:
        sqlite_path = DatabaseManager.materialize_database(database_id)
        schema = DatabaseManager.inspect_sqlite_schema(sqlite_path)
        return schema
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Database '{database_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to inspect schema: {str(e)}")

@router.get("/{database_id}/tables")
def get_database_tables(database_id: str):
    """
    Returns all tables with column definitions and row counts for a database.
    """
    try:
        sqlite_path = DatabaseManager.materialize_database(database_id)
        schema = DatabaseManager.inspect_sqlite_schema(sqlite_path)
        return {
            "database_id": database_id,
            "tables": list(schema["tables"].values()),
            "table_count": schema["table_count"],
            "total_records": schema["total_records"]
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Database '{database_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tables: {str(e)}")

@router.get("/{database_id}/tables/{table_name}/preview")
def get_table_preview(database_id: str, table_name: str, limit: int = Query(50, ge=1, le=200)):
    """
    Returns preview rows for a specific table in a database.
    """
    try:
        preview = DatabaseManager.get_table_preview(database_id, table_name, limit=limit)
        return preview
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Database '{database_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch preview for table '{table_name}': {str(e)}")

@router.post("/upload")
async def upload_database(
    file: UploadFile = File(...),
    database_name: str = Form(...),
    table_name: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Uploads a CSV or SQLite database file, stores it persistently in MongoDB GridFS,
    creates/materializes the SQLite execution database, and registers metadata in MongoDB
    associated exclusively with the current user.
    """
    filename = file.filename or "uploaded_data"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".csv", ".sqlite", ".db", ".sqlite3"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a .csv or SQLite (.sqlite, .db, .sqlite3) file."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum upload size of {os.getenv('MAX_UPLOAD_SIZE_MB', '25')}MB."
        )

    email = (user_email or x_user_email or "").strip().lower()
    uid = user_id or x_user_id or ""

    try:
        if ext == ".csv":
            meta = DatabaseManager.upload_csv(
                file_bytes=file_bytes,
                filename=filename,
                database_name=database_name,
                table_name=table_name,
                user_email=email,
                user_id=uid
            )
        else:
            meta = DatabaseManager.upload_sqlite(
                file_bytes=file_bytes,
                filename=filename,
                database_name=database_name,
                user_email=email,
                user_id=uid
            )

        return {
            "message": f"Database '{meta['database_name']}' uploaded and persisted in MongoDB GridFS successfully.",
            "database": meta
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/{database_id}")
def delete_database(
    database_id: str,
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    user_email: Optional[str] = Query(None)
):
    """
    Permanently deletes database metadata from MongoDB, removes its file from GridFS,
    and removes its local SQLite cache. Enforces user isolation.
    """
    email = (user_email or x_user_email or "").strip().lower()
    try:
        success = DatabaseManager.delete_database(database_id, user_email=email)
        if not success:
            raise HTTPException(status_code=404, detail="Database not found or could not be deleted.")
        return {"message": f"Database '{database_id}' successfully deleted from MongoDB GridFS and local storage."}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete database: {str(e)}")
