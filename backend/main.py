import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base, SessionLocal
from models import seed_database
from database_manager import DatabaseManager
from mongo import init_mongo_indexes, check_mongo_connection
from routes.databases import router as databases_router
from routes.query import router as query_router
from routes.dashboard import router as dashboard_router
from routes.explorer import router as explorer_router
from routes.history import router as history_router
from routes.prompt import router as prompt_router
from routes.settings import router as settings_router
from routes.auth import router as auth_router
from services.llm_service import llm_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema, MongoDB indexes, and benchmark database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    try:
        init_mongo_indexes()
        DatabaseManager.ensure_default_benchmark_database()
    except Exception as e:
        print(f"[Lifespan Init Warning] {e}")

    yield

app = FastAPI(
    title="QueryMate – Natural Language to SQL & Multi-Database Storage",
    description="Intelligent NL-to-SQL platform powered by MongoDB GridFS persistence and prompt engineering.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8008", "http://127.0.0.1:8008", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(databases_router)
app.include_router(query_router)
app.include_router(dashboard_router)
app.include_router(explorer_router)
app.include_router(history_router)
app.include_router(prompt_router)
app.include_router(settings_router)
app.include_router(auth_router)

@app.get("/api/health")
def health_check():
    mongo_ok, mongo_msg = check_mongo_connection()
    return {
        "status": "healthy",
        "database": "connected",
        "demo_mode": llm_service.demo_mode,
        "gemini_configured": llm_service.is_configured(),
        "model": llm_service.model_name,
        "mongodb": {
            "connected": mongo_ok,
            "message": mongo_msg
        }
    }

# Mount Frontend Static Assets if built
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return {
        "app": "QueryMate",
        "tagline": "Natural Language to SQL Using Prompt Engineering",
        "version": "2.0.0",
        "docs": "/docs",
        "demo_mode": llm_service.demo_mode
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8008, reload=True)
