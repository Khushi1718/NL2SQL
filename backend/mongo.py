import os
import json
import secrets
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from dotenv import load_dotenv
from bson import ObjectId
import pymongo
from pymongo import MongoClient
import gridfs
import urllib.parse
import re

# Load backend/.env automatically regardless of launching directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv()

def sanitize_mongo_uri(raw_uri: str) -> str:
    if not raw_uri:
        return "mongodb://127.0.0.1:27017/querymate"
    if "<db_password>" in raw_uri or "<password>" in raw_uri:
        return "mongodb://127.0.0.1:27017/querymate"

    # Strip accidental < > around password: :<pwd>@ -> :pwd@
    uri = re.sub(r':<([^>]+)>@', r':\1@', raw_uri)

    # URL-encode special characters in password (such as '@') if unescaped
    m = re.match(r'^(mongodb(?:\+srv)?://)([^:]+):(.*)@([^@/]+.*)$', uri)
    if m:
        prefix = m.group(1)
        user = m.group(2)
        pwd = m.group(3)
        rest = m.group(4)
        if "@" in pwd:
            pwd = urllib.parse.quote_plus(pwd)
        return f"{prefix}{user}:{pwd}@{rest}"
    return uri

raw_uri = os.getenv("MONGODB_URI", "").strip()
MONGODB_URI = sanitize_mongo_uri(raw_uri)

MONGODB_DB_NAME = os.getenv("MONGODB_DATABASE_NAME", "querymate")

_client: Optional[MongoClient] = None

def get_mongo_client() -> Optional[MongoClient]:
    global _client
    if not MONGODB_URI:
        return None

    # If an existing client is cached, verify it is alive and not closed
    if _client is not None:
        try:
            _client.admin.command("ping")
            return _client
        except Exception:
            try:
                _client.close()
            except Exception:
                pass
            _client = None

    # Attempt primary MONGODB_URI
    try:
        candidate = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=800,
            connectTimeoutMS=800
        )
        candidate.admin.command("ping")
        _client = candidate
        return _client
    except Exception:
        try:
            candidate.close()
        except Exception:
            pass

    # If primary URI is different from standard localhost, try localhost fallback
    if "127.0.0.1:27017" not in MONGODB_URI and "localhost:27017" not in MONGODB_URI:
        try:
            candidate = MongoClient(
                "mongodb://127.0.0.1:27017",
                serverSelectionTimeoutMS=800,
                connectTimeoutMS=800
            )
            candidate.admin.command("ping")
            _client = candidate
            return _client
        except Exception:
            try:
                candidate.close()
            except Exception:
                pass

    _client = None
    return None

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

    client = get_mongo_client()
    if client is None:
        return False, "Could not connect to MongoDB server. Local SQLite storage active."

    try:
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
        db.databases.create_index("user_email")
        db.query_history.create_index([("database_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
        db.users.create_index("email", unique=True)
    except Exception as e:
        print(f"[MongoDB Index Warning] {e}")


# --- GridFS & Fallback Storage Operations ---

GRIDFS_FALLBACK_DIR = Path(__file__).parent / "storage" / "gridfs_fallback"
FALLBACK_DB_REGISTRY = Path(__file__).parent / "data" / "databases_registry.json"

def _ensure_storage_fallback():
    GRIDFS_FALLBACK_DIR.mkdir(parents=True, exist_ok=True)
    FALLBACK_DB_REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    if not FALLBACK_DB_REGISTRY.exists():
        FALLBACK_DB_REGISTRY.write_text("[]", encoding="utf-8")

def _load_fallback_db_meta() -> List[Dict[str, Any]]:
    _ensure_storage_fallback()
    try:
        return json.loads(FALLBACK_DB_REGISTRY.read_text(encoding="utf-8"))
    except Exception:
        return []

def _save_fallback_db_meta(dbs: List[Dict[str, Any]]):
    _ensure_storage_fallback()
    FALLBACK_DB_REGISTRY.write_text(json.dumps(dbs, indent=2), encoding="utf-8")

def save_file_to_gridfs(file_bytes: bytes, filename: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    """Stores binary file in GridFS (with disk fallback) and returns the reference string."""
    _ensure_storage_fallback()
    fs = get_gridfs()
    if fs is not None:
        try:
            file_id = fs.put(file_bytes, filename=filename, metadata=metadata or {})
            return str(file_id)
        except Exception as e:
            print(f"[GridFS Save Warning] {e}. Using persistent fallback.")
            
    # Persistent fallback file
    file_id = f"gfs_{secrets.token_hex(12)}"
    fallback_path = GRIDFS_FALLBACK_DIR / f"{file_id}.sqlite"
    fallback_path.write_bytes(file_bytes)
    return file_id

def read_file_from_gridfs(file_id_str: str) -> bytes:
    """Reads binary file contents from GridFS or persistent fallback storage."""
    _ensure_storage_fallback()
    fs = get_gridfs()
    if fs is not None and ObjectId.is_valid(file_id_str):
        try:
            obj_id = ObjectId(file_id_str)
            grid_out = fs.get(obj_id)
            return grid_out.read()
        except Exception:
            pass

    # Check local fallback
    fallback_path = GRIDFS_FALLBACK_DIR / f"{file_id_str}.sqlite"
    if fallback_path.exists():
        return fallback_path.read_bytes()

    raise FileNotFoundError(f"Database archive reference '{file_id_str}' could not be located in GridFS or local storage.")

def delete_file_from_gridfs(file_id_str: str) -> bool:
    """Deletes a file from GridFS and local fallback."""
    _ensure_storage_fallback()
    deleted = False
    fs = get_gridfs()
    if fs is not None and ObjectId.is_valid(file_id_str):
        try:
            obj_id = ObjectId(file_id_str)
            fs.delete(obj_id)
            deleted = True
        except Exception:
            pass

    fallback_path = GRIDFS_FALLBACK_DIR / f"{file_id_str}.sqlite"
    if fallback_path.exists():
        try:
            fallback_path.unlink()
            deleted = True
        except Exception:
            pass

    return deleted


# --- Database Metadata Operations in MongoDB & Registry ---

def save_database_meta(meta: Dict[str, Any]):
    """Upserts database metadata in MongoDB 'databases' collection and persistent local registry."""
    _ensure_storage_fallback()
    meta_copy = dict(meta)
    if "_id" in meta_copy:
        del meta_copy["_id"]

    db = get_mongo_db()
    if db is not None:
        try:
            db.databases.update_one(
                {"database_id": meta["database_id"]},
                {"$set": meta_copy},
                upsert=True
            )
        except Exception as e:
            print(f"[MongoDB Meta Save Warning] {e}")

    # Always persist to local fallback registry as well
    dbs = _load_fallback_db_meta()
    existing_idx = next((i for i, d in enumerate(dbs) if d.get("database_id") == meta["database_id"]), -1)
    if existing_idx >= 0:
        dbs[existing_idx] = meta_copy
    else:
        dbs.insert(0, meta_copy)
    _save_fallback_db_meta(dbs)

def get_database_meta(database_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves metadata for a specific database from MongoDB or local registry."""
    db = get_mongo_db()
    if db is not None:
        try:
            doc = db.databases.find_one({"database_id": database_id})
            if doc:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                return doc
        except Exception:
            pass

    dbs = _load_fallback_db_meta()
    for d in dbs:
        if d.get("database_id") == database_id:
            return d
    return None

def list_databases_meta(user_email: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lists registered databases from MongoDB or persistent registry belonging exclusively to user_email."""
    norm_email = (user_email or "user@nl2sql.local").strip().lower()
    seen_ids = set()
    results = []

    db = get_mongo_db()
    if db is not None:
        try:
            cursor = db.databases.find({"user_email": norm_email}).sort("upload_date", pymongo.DESCENDING)
            for doc in cursor:
                db_id = doc.get("database_id")
                if db_id and db_id not in seen_ids:
                    if "_id" in doc:
                        doc["_id"] = str(doc["_id"])
                    seen_ids.add(db_id)
                    results.append(doc)
        except Exception:
            pass

    # Merge with persistent fallback registry
    dbs = _load_fallback_db_meta()
    for d in dbs:
        db_id = d.get("database_id")
        d_email = (d.get("user_email") or "").strip().lower()
        if db_id and db_id not in seen_ids and d_email == norm_email:
            seen_ids.add(db_id)
            results.append(d)

    return results

def delete_database_meta(database_id: str) -> bool:
    """Deletes database metadata from MongoDB and registry."""
    db = get_mongo_db()
    if db is not None:
        try:
            db.databases.delete_one({"database_id": database_id})
        except Exception:
            pass

    dbs = _load_fallback_db_meta()
    new_dbs = [d for d in dbs if d.get("database_id") != database_id]
    _save_fallback_db_meta(new_dbs)
    return True


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
    user_id = None
    if db is not None:
        try:
            existing = db.users.find_one({"email": clean_email})
            if existing:
                raise ValueError("An account with this email address already exists.")
            res = db.users.insert_one(doc)
            user_id = str(res.inserted_id)
        except ValueError:
            raise
        except Exception as mongo_err:
            print(f"[Mongo Auth Save Fallback] {mongo_err}")
            db = None

    if db is None:
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
        try:
            user_doc = db.users.find_one({"email": clean_email})
        except Exception as mongo_err:
            print(f"[Mongo Auth Find Fallback] {mongo_err}")
            db = None

    if db is None:
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

