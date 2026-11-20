import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import seed_database
from services.llm_service import llm_service

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class UpdateSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    demo_mode: Optional[bool] = None

class TestApiKeyRequest(BaseModel):
    api_key: str
    model: Optional[str] = "gemini-2.5-flash"

def mask_key(key: str) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "********"
    return f"{key[:4]}...{key[-4:]}"

@router.get("")
def get_settings():
    """
    Returns current active application settings and AI configuration status.
    """
    key = llm_service.api_key
    return {
        "gemini_api_key_configured": bool(key),
        "masked_api_key": mask_key(key),
        "gemini_model": llm_service.model_name,
        "demo_mode": llm_service.demo_mode,
        "query_timeout_seconds": int(os.getenv("QUERY_TIMEOUT_SECONDS", "5")),
        "max_rows_limit": int(os.getenv("MAX_ROWS_LIMIT", "500")),
        "supported_models": [
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ]
    }

@router.post("")
def update_settings(request: UpdateSettingsRequest):
    """
    Updates runtime settings for Gemini API and execution modes.
    """
    llm_service.update_config(
        api_key=request.gemini_api_key,
        model_name=request.gemini_model,
        demo_mode=request.demo_mode
    )

    return {
        "message": "Settings updated successfully.",
        "settings": {
            "gemini_api_key_configured": bool(llm_service.api_key),
            "masked_api_key": mask_key(llm_service.api_key),
            "gemini_model": llm_service.model_name,
            "demo_mode": llm_service.demo_mode
        }
    }

@router.post("/test-api-key")
def test_gemini_api_key(request: TestApiKeyRequest):
    """
    Verifies that a provided Gemini API key can successfully contact the API.
    """
    api_key = request.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=request.model or "gemini-2.5-flash",
            contents="Respond with the exact word: OK"
        )
        output = response.text.strip() if response and response.text else "OK"
        return {
            "valid": True,
            "message": "Connection to Google Gemini API verified successfully!",
            "response": output
        }
    except Exception as e:
        return {
            "valid": False,
            "message": f"Gemini API connection failed: {str(e)}"
        }

@router.post("/reset-database")
def reset_database(db: Session = Depends(get_db)):
    """
    Clears and re-seeds the sample database with realistic initial data.
    """
    try:
        # Recreate tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        seed_database(db)
        return {"message": "Database successfully reset and re-seeded with realistic sample records."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset database: {str(e)}")
