import os
import re
import uuid
import io
import shutil
import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
from sqlalchemy import create_engine, inspect, text
from mongo import (
    save_file_to_gridfs,
    read_file_from_gridfs,
    delete_file_from_gridfs,
    save_database_meta,
    get_database_meta,
    list_databases_meta,
    delete_database_meta,
    check_mongo_connection
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage", "databases")
os.makedirs(STORAGE_DIR, exist_ok=True)

DEFAULT_BENCHMARK_DB_ID = "db_benchmark_default"

def sanitize_identifier(name: str) -> str:
    """Sanitizes table and column names to prevent SQL injection and format issues."""
    clean = re.sub(r"[^a-zA-Z0-9_]", "_", name.strip().lower())
    if not clean or clean[0].isdigit():
        clean = f"t_{clean}"
    return clean

class DatabaseManager:
    @staticmethod
    def get_local_db_path(database_id: str) -> str:
        """Returns the local filesystem path for a database's SQLite file."""
        return os.path.join(STORAGE_DIR, f"{database_id}.sqlite")

    @classmethod
    def ensure_default_benchmark_database(cls):
        """
        Ensures the default benchmark database is initialized and registered in MongoDB
        with realistic data for Students, Courses, Enrollments, Employees, Departments,
        Customers, and Orders.
        """
        target_path = cls.get_local_db_path(DEFAULT_BENCHMARK_DB_ID)
        source_db_path = os.path.join(BASE_DIR, "querymate.db")

        # If source db exists, copy it, or seed it
        if os.path.exists(source_db_path):
            if not os.path.exists(target_path):
                shutil.copyfile(source_db_path, target_path)
        else:
            from database import Base, engine as root_engine, SessionLocal
            from models import seed_database
            Base.metadata.create_all(bind=root_engine)
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
            shutil.copyfile(source_db_path, target_path)

        # Register in MongoDB if not already registered
        try:
            mongo_connected, _ = check_mongo_connection()
            if mongo_connected:
                existing = get_database_meta(DEFAULT_BENCHMARK_DB_ID)
                if not existing:
                    with open(target_path, "rb") as f:
                        file_bytes = f.read()
                    gridfs_id = save_file_to_gridfs(
                        file_bytes,
                        filename="benchmark_dataset.sqlite",
                        metadata={"database_id": DEFAULT_BENCHMARK_DB_ID}
                    )
                    schema_meta = cls.inspect_sqlite_schema(target_path)
                    meta = {
                        "database_id": DEFAULT_BENCHMARK_DB_ID,
                        "database_name": "Sample Benchmark Database (College & Enterprise)",
                        "original_filename": "benchmark_dataset.sqlite",
                        "file_type": "sqlite",
                        "storage_reference": gridfs_id,
                        "upload_date": datetime.utcnow().isoformat(),
                        "table_count": schema_meta["table_count"],
                        "record_count": schema_meta["total_records"],
                        "schema_metadata": schema_meta,
                        "is_default": True
                    }
                    save_database_meta(meta)
        except Exception as e:
            print(f"[Benchmark Registration Warning] {e}")

    @classmethod
    def materialize_database(cls, database_id: str) -> str:
        """
        Ensures the SQLite database file for database_id exists locally on disk.
        If missing locally, restores it securely from MongoDB GridFS.
        """
        target_path = cls.get_local_db_path(database_id)
        if os.path.exists(target_path):
            return target_path

        # If missing locally, attempt to restore from MongoDB GridFS
        meta = get_database_meta(database_id)
        if meta and meta.get("storage_reference"):
            gridfs_id = meta["storage_reference"]
            file_bytes = read_file_from_gridfs(gridfs_id)
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            return target_path

        # If it's the default benchmark database, recreate it
        if database_id == DEFAULT_BENCHMARK_DB_ID:
            cls.ensure_default_benchmark_database()
            if os.path.exists(target_path):
                return target_path

        raise FileNotFoundError(f"Database with ID '{database_id}' could not be located or materialized.")

    @classmethod
    def inspect_sqlite_schema(cls, sqlite_path: str) -> Dict[str, Any]:
        """
        Inspects any SQLite database file and extracts tables, columns, data types,
        primary keys, foreign keys, row counts, and sample records.
        """
        engine = create_engine(f"sqlite:///{sqlite_path}")
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        schema_info = {
            "tables": {},
            "relationships": [],
            "table_count": 0,
            "total_columns": 0,
            "total_records": 0
        }

        total_cols = 0
        total_rows = 0

        with engine.connect() as conn:
            for table_name in table_names:
                if table_name in ["sqlite_sequence", "query_history"]:
                    continue

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

                # Row count
                try:
                    count_val = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
                    row_count = int(count_val) if count_val is not None else 0
                except Exception:
                    row_count = 0
                total_rows += row_count

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
                    "row_count": row_count,
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
        schema_info["total_records"] = total_rows
        return schema_info

    @classmethod
    def list_databases(cls) -> List[Dict[str, Any]]:
        """
        Lists all registered databases from MongoDB and persistent registry,
        always ensuring benchmark database is initialized.
        """
        cls.ensure_default_benchmark_database()
        dbs = list_databases_meta()
        if dbs:
            # Ensure local SQLite files exist for any registered DB
            for d in dbs:
                db_id = d.get("database_id")
                if db_id and not os.path.exists(cls.get_local_db_path(db_id)):
                    try:
                        cls.materialize_database(db_id)
                    except Exception:
                        pass
            return dbs

        # Fallback if registry is empty
        target_path = cls.get_local_db_path(DEFAULT_BENCHMARK_DB_ID)
        schema_meta = cls.inspect_sqlite_schema(target_path) if os.path.exists(target_path) else {}

        return [{
            "database_id": DEFAULT_BENCHMARK_DB_ID,
            "database_name": "Sample Benchmark Database (College & Enterprise)",
            "original_filename": "benchmark_dataset.sqlite",
            "file_type": "sqlite",
            "storage_reference": "local_sqlite",
            "upload_date": datetime.utcnow().isoformat(),
            "table_count": schema_meta.get("table_count", 7),
            "record_count": schema_meta.get("total_records", 70),
            "schema_metadata": schema_meta,
            "is_default": True
        }]

    @classmethod
    def get_database(cls, database_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves metadata and validates existence for a specific database."""
        meta = get_database_meta(database_id)
        if meta:
            # Ensure file is materialized on disk
            try:
                cls.materialize_database(database_id)
            except Exception as e:
                print(f"[Materialize Warning] {e}")
            return meta

        # Fallback for default benchmark database
        if database_id == DEFAULT_BENCHMARK_DB_ID:
            cls.ensure_default_benchmark_database()
            target_path = cls.get_local_db_path(DEFAULT_BENCHMARK_DB_ID)
            schema_meta = cls.inspect_sqlite_schema(target_path)
            return {
                "database_id": DEFAULT_BENCHMARK_DB_ID,
                "database_name": "Sample Benchmark Database (College & Enterprise)",
                "original_filename": "benchmark_dataset.sqlite",
                "file_type": "sqlite",
                "storage_reference": "local_sqlite",
                "upload_date": datetime.utcnow().isoformat(),
                "table_count": schema_meta.get("table_count", 7),
                "record_count": schema_meta.get("total_records", 70),
                "schema_metadata": schema_meta,
                "is_default": True
            }

        return None

    @classmethod
    def upload_csv(
        cls,
        file_bytes: bytes,
        filename: str,
        database_name: str,
        table_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses CSV, validates records, infers data types, imports into a new SQLite database,
        stores the database file in MongoDB GridFS, and registers metadata in MongoDB.
        """
        # Parse CSV with pandas
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            raise ValueError(f"Invalid or corrupted CSV file: {str(e)}")

        if df.empty:
            raise ValueError("The uploaded CSV file contains no data rows.")

        # Sanitize column names
        df.columns = [sanitize_identifier(str(col)) for col in df.columns]

        # Determine clean table name
        if not table_name or not table_name.strip():
            raw_tname = os.path.splitext(filename)[0]
            clean_tname = sanitize_identifier(raw_tname)
        else:
            clean_tname = sanitize_identifier(table_name)

        database_id = f"db_{uuid.uuid4().hex[:10]}"
        sqlite_path = cls.get_local_db_path(database_id)

        # Write to SQLite database
        engine = create_engine(f"sqlite:///{sqlite_path}")
        df.to_sql(name=clean_tname, con=engine, if_exists="replace", index=False)

        # Inspect generated SQLite database schema
        schema_meta = cls.inspect_sqlite_schema(sqlite_path)

        # Read the SQLite file bytes and upload to MongoDB GridFS
        with open(sqlite_path, "rb") as f:
            sqlite_bytes = f.read()

        gridfs_id = save_file_to_gridfs(
            sqlite_bytes,
            filename=f"{database_id}.sqlite",
            metadata={
                "database_id": database_id,
                "original_filename": filename,
                "database_name": database_name
            }
        )

        meta = {
            "database_id": database_id,
            "database_name": database_name.strip() or clean_tname.title(),
            "original_filename": filename,
            "file_type": "csv",
            "storage_reference": gridfs_id,
            "upload_date": datetime.utcnow().isoformat(),
            "table_count": schema_meta["table_count"],
            "record_count": schema_meta["total_records"],
            "schema_metadata": schema_meta,
            "is_default": False
        }

        save_database_meta(meta)
        return meta

    @classmethod
    def upload_sqlite(
        cls,
        file_bytes: bytes,
        filename: str,
        database_name: str
    ) -> Dict[str, Any]:
        """
        Validates an uploaded SQLite database file, stores it locally and in MongoDB GridFS,
        inspects all tables and relationships, and registers metadata in MongoDB.
        """
        # Check SQLite header
        if not file_bytes.startswith(b"SQLite format 3\x00"):
            raise ValueError("The uploaded file is not a valid SQLite 3 database.")

        database_id = f"db_{uuid.uuid4().hex[:10]}"
        sqlite_path = cls.get_local_db_path(database_id)

        with open(sqlite_path, "wb") as f:
            f.write(file_bytes)

        # Validate by inspecting schema
        try:
            schema_meta = cls.inspect_sqlite_schema(sqlite_path)
        except Exception as e:
            if os.path.exists(sqlite_path):
                os.remove(sqlite_path)
            raise ValueError(f"Failed to inspect SQLite database tables: {str(e)}")

        if schema_meta["table_count"] == 0:
            if os.path.exists(sqlite_path):
                os.remove(sqlite_path)
            raise ValueError("The uploaded SQLite database contains no readable tables.")

        gridfs_id = save_file_to_gridfs(
            file_bytes,
            filename=f"{database_id}.sqlite",
            metadata={
                "database_id": database_id,
                "original_filename": filename,
                "database_name": database_name
            }
        )

        meta = {
            "database_id": database_id,
            "database_name": database_name.strip() or os.path.splitext(filename)[0].title(),
            "original_filename": filename,
            "file_type": "sqlite",
            "storage_reference": gridfs_id,
            "upload_date": datetime.utcnow().isoformat(),
            "table_count": schema_meta["table_count"],
            "record_count": schema_meta["total_records"],
            "schema_metadata": schema_meta,
            "is_default": False
        }

        save_database_meta(meta)
        return meta

    @classmethod
    def delete_database(cls, database_id: str) -> bool:
        """
        Deletes a database from MongoDB metadata, GridFS storage, and local disk cache.
        """
        if database_id == DEFAULT_BENCHMARK_DB_ID:
            raise ValueError("Cannot delete the default sample benchmark database.")

        meta = get_database_meta(database_id)
        if meta and meta.get("storage_reference"):
            delete_file_from_gridfs(meta["storage_reference"])

        delete_database_meta(database_id)

        local_path = cls.get_local_db_path(database_id)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as e:
                print(f"[Delete Local File Warning] {e}")

        return True

    @classmethod
    def get_table_preview(cls, database_id: str, table_name: str, limit: int = 50) -> Dict[str, Any]:
        """Returns column names and preview rows for a specific table in a database."""
        sqlite_path = cls.materialize_database(database_id)
        clean_table = sanitize_identifier(table_name)
        engine = create_engine(f"sqlite:///{sqlite_path}")

        columns = []
        rows = []
        with engine.connect() as conn:
            res = conn.execute(text(f'SELECT * FROM "{clean_table}" LIMIT :limit'), {"limit": limit})
            columns = list(res.keys())
            for r in res.fetchall():
                row_dict = {}
                for i, col in enumerate(columns):
                    val = r[i]
                    if hasattr(val, "isoformat"):
                        val = val.isoformat()
                    row_dict[col] = val
                rows.append(row_dict)

        return {
            "database_id": database_id,
            "table_name": clean_table,
            "columns": columns,
            "rows": rows,
            "count": len(rows)
        }
