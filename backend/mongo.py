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
        db.users.create_index("email", unique=True)
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


# --- User Accounts & Authentication MongoDB Collections ---

import hashlib
import secrets
import json
from pathlib import Path

FALLBACK_USERS_FILE = Path(__file__).parent / "data" / "users_fallback.json"

def _ensure_fallback_file():
    FALLBACK_USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not FALLBACK_USERS_FILE.exists():
        FALLBACK_USERS_FILE.write_text("[]", encoding="utf-8")

def _load_fallback_users() -> List[Dict[str, Any]]:
    _ensure_fallback_file()
    try:
        return json.loads(FALLBACK_USERS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []

def _save_fallback_users(users: List[Dict[str, Any]]):
    _ensure_fallback_file()
    FALLBACK_USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")

def _hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt

def save_user_mongo(email: str, password: str, name: Optional[str] = None, role: str = "Developer") -> Dict[str, Any]:
    """Saves a new user account into MongoDB 'users' collection."""
    clean_email = email.strip().lower()
    hashed, salt = _hash_password(password)
    user_name = (name or clean_email.split('@')[0]).strip()
    
    doc = {
        "email": clean_email,
        "name": user_name,
        "password_hash": hashed,
        "salt": salt,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    db = get_mongo_db()
    if db is not None:
        existing = db.users.find_one({"email": clean_email})
        if existing:
            raise ValueError("An account with this email address already exists.")
        res = db.users.insert_one(doc)
        user_id = str(res.inserted_id)
    else:
        # File fallback
        users = _load_fallback_users()
        for u in users:
            if u.get("email") == clean_email:
                raise ValueError("An account with this email address already exists.")
        user_id = f"user_{secrets.token_hex(8)}"
        doc["_id"] = user_id
        users.append(doc)
        _save_fallback_users(users)
        
    return {
        "id": user_id,
        "email": clean_email,
        "name": user_name,
        "role": role,
        "created_at": doc["created_at"]
    }

def authenticate_user_mongo(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Verifies credentials against MongoDB 'users' collection."""
    clean_email = email.strip().lower()
    db = get_mongo_db()
    user_doc = None
    if db is not None:
        user_doc = db.users.find_one({"email": clean_email})
    else:
        users = _load_fallback_users()
        for u in users:
            if u.get("email") == clean_email:
                user_doc = u
                break
                
    if not user_doc:
        return None
        
    salt = user_doc.get("salt", "")
    expected = user_doc.get("password_hash", "")
    actual, _ = _hash_password(password, salt)
    if actual != expected:
        return None
        
    return {
        "id": str(user_doc.get("_id", clean_email)),
        "email": user_doc["email"],
        "name": user_doc.get("name", clean_email.split('@')[0]),
        "role": user_doc.get("role", "Developer"),
        "created_at": user_doc.get("created_at", datetime.utcnow().isoformat())
    }

def update_user_password_mongo(email: str, current_password: str, new_password: str) -> bool:
    """Updates user password in MongoDB after validating current password."""
    clean_email = email.strip().lower()
    user = authenticate_user_mongo(clean_email, current_password)
    if not user:
        raise ValueError("Current password is incorrect.")
        
    new_hash, new_salt = _hash_password(new_password)
    now_str = datetime.utcnow().isoformat()
    
    db = get_mongo_db()
    if db is not None:
        db.users.update_one(
            {"email": clean_email},
            {"$set": {
                "password_hash": new_hash,
                "salt": new_salt,
                "updated_at": now_str
            }}
        )
    else:
        users = _load_fallback_users()
        for u in users:
            if u.get("email") == clean_email:
                u["password_hash"] = new_hash
                u["salt"] = new_salt
                u["updated_at"] = now_str
                break
        _save_fallback_users(users)
    return True

def update_user_email_mongo(old_email: str, new_email: str) -> Dict[str, Any]:
    """Updates user email in MongoDB."""
    clean_old = old_email.strip().lower()
    clean_new = new_email.strip().lower()
    now_str = datetime.utcnow().isoformat()
    
    db = get_mongo_db()
    if db is not None:
        if db.users.find_one({"email": clean_new}):
            raise ValueError("An account with the new email already exists.")
        db.users.update_one(
            {"email": clean_old},
            {"$set": {
                "email": clean_new,
                "updated_at": now_str
            }}
        )
        updated = db.users.find_one({"email": clean_new})
        return {
            "id": str(updated["_id"]),
            "email": updated["email"],
            "name": updated.get("name", clean_new.split('@')[0]),
            "role": updated.get("role", "Developer")
        }
    else:
        users = _load_fallback_users()
        for u in users:
            if u.get("email") == clean_new:
                raise ValueError("An account with the new email already exists.")
        target = None
        for u in users:
            if u.get("email") == clean_old:
                u["email"] = clean_new
                u["updated_at"] = now_str
                target = u
                break
        _save_fallback_users(users)
        return {
            "id": target.get("_id", clean_new) if target else clean_new,
            "email": clean_new,
            "name": target.get("name", clean_new.split('@')[0]) if target else clean_new.split('@')[0],
            "role": target.get("role", "Developer") if target else "Developer"
        }

