import os
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from bson import ObjectId
import pymongo
from pymongo import MongoClient
import gridfs

raw_uri = os.getenv("MONGODB_URI", "").strip()
if "<" in raw_uri and ">" in raw_uri:
    # Contains unconfigured placeholder credentials, fallback to local MongoDB
    MONGODB_URI = "mongodb://127.0.0.1:27017/querymate"
elif raw_uri:
    MONGODB_URI = raw_uri
else:
    MONGODB_URI = "mongodb://127.0.0.1:27017/querymate"

MONGODB_DB_NAME = os.getenv("MONGODB_DATABASE_NAME", "querymate")

_client: Optional[MongoClient] = None

def get_mongo_client() -> Optional[MongoClient]:
    global _client
    if not MONGODB_URI:
        return None
    if _client is None:
        try:
            _client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500
            )
            # Test connection
            _client.admin.command("ping")
        except Exception as e:
            print(f"[MongoDB Primary URI Failed: {e}]. Attempting local fallback mongodb://127.0.0.1:27017")
            try:
                _client = MongoClient(
                    "mongodb://127.0.0.1:27017",
                    serverSelectionTimeoutMS=2000,
                    connectTimeoutMS=2000
                )
                _client.admin.command("ping")
            except Exception as e2:
                print(f"[MongoDB Fallback Failed: {e2}]")
                _client = None
    return _client

def get_mongo_db():
    client = get_mongo_client()
    if client is None:
        return None
    return client[MONGODB_DB_NAME]

def get_gridfs():
    db = get_mongo_db()
    if db is None:
        return None
    return gridfs.GridFS(db)

def check_mongo_connection() -> Tuple[bool, str]:
    """
    Checks real live MongoDB connectivity.
    Returns (is_connected: bool, message: str).
    """
    if not MONGODB_URI:
        return False, "MONGODB_URI is not configured in backend/.env."

    try:
        client = get_mongo_client()
        if client is None:
            return False, "Failed to instantiate MongoClient."
        client.admin.command("ping")
        return True, f"Connected to MongoDB ({MONGODB_DB_NAME})"
    except Exception as e:
        return False, f"MongoDB connection error: {str(e)}"


def init_mongo_indexes():
    """Initializes indexes on MongoDB collections."""
    db = get_mongo_db()
    if db is None:
        return
    try:
        db.databases.create_index("database_id", unique=True)
        db.query_history.create_index([("database_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
    except Exception as e:
        print(f"[MongoDB Index Warning] {e}")


# --- GridFS File Operations ---

def save_file_to_gridfs(file_bytes: bytes, filename: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Stores binary file persistently in GridFS and returns the ObjectId string."""
    fs = get_gridfs()
    if fs is None:
        raise RuntimeError("MongoDB GridFS is not available. Please verify MONGODB_URI.")
    file_id = fs.put(file_bytes, filename=filename, metadata=metadata or {})
    return str(file_id)

def read_file_from_gridfs(file_id_str: str) -> bytes:
    """Reads binary file contents from GridFS using the ObjectId string."""
    fs = get_gridfs()
    if fs is None:
        raise RuntimeError("MongoDB GridFS is not available. Please verify MONGODB_URI.")
    obj_id = ObjectId(file_id_str)
    grid_out = fs.get(obj_id)
    return grid_out.read()

def delete_file_from_gridfs(file_id_str: str) -> bool:
    """Deletes a file from GridFS."""
    fs = get_gridfs()
    if fs is None:
        return False
    try:
        obj_id = ObjectId(file_id_str)
        fs.delete(obj_id)
        return True
    except Exception as e:
        print(f"[GridFS Delete Error] {e}")
        return False


# --- Database Metadata Operations in MongoDB ---

def save_database_meta(meta: Dict[str, Any]):
    """Upserts database metadata in the 'databases' MongoDB collection."""
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not available. Please verify MONGODB_URI in backend/.env.")
    
    meta_copy = dict(meta)
    if "_id" in meta_copy:
        del meta_copy["_id"]

    db.databases.update_one(
        {"database_id": meta["database_id"]},
        {"$set": meta_copy},
        upsert=True
    )

def get_database_meta(database_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata for a specific database from MongoDB."""
    db = get_mongo_db()
    if db is None:
        return None
    doc = db.databases.find_one({"database_id": database_id})
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def list_databases_meta() -> List[Dict[str, Any]]:
    """Lists all databases registered in MongoDB."""
    db = get_mongo_db()
    if db is None:
        return []
    cursor = db.databases.find({}).sort("upload_date", pymongo.DESCENDING)
    results = []
    for doc in cursor:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results

def delete_database_meta(database_id: str) -> bool:
    """Deletes database metadata from MongoDB."""
    db = get_mongo_db()
    if db is None:
        return False
    res = db.databases.delete_one({"database_id": database_id})
    return res.deleted_count > 0


# --- Query History Operations in MongoDB ---

def save_query_history_mongo(record: Dict[str, Any]):
    """Saves a query execution history record in MongoDB."""
    db = get_mongo_db()
    if db is None:
        return
    rec = dict(record)
    if "created_at" not in rec or not rec["created_at"]:
        rec["created_at"] = datetime.utcnow().isoformat()
    db.query_history.insert_one(rec)

def get_query_history_mongo(database_id: Optional[str] = None, limit: int = 50, offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
    """Retrieves paginated query history from MongoDB."""
    db = get_mongo_db()
    if db is None:
        return [], 0
    query = {}
    if database_id and database_id != "all":
        query["database_id"] = database_id

    total = db.query_history.count_documents(query)
    cursor = db.query_history.find(query).sort("created_at", pymongo.DESCENDING).skip(offset).limit(limit)
    items = []
    for doc in cursor:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items, total

def delete_query_history_item_mongo(query_id: str) -> bool:
    """Deletes a query history record by query_id or _id."""
    db = get_mongo_db()
    if db is None:
        return False
    res = db.query_history.delete_one({"query_id": query_id})
    if res.deleted_count == 0 and ObjectId.is_valid(query_id):
        res = db.query_history.delete_one({"_id": ObjectId(query_id)})
    return res.deleted_count > 0
