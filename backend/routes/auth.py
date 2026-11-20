from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from mongo import (
    save_user_mongo,
    authenticate_user_mongo,
    update_user_password_mongo,
    update_user_email_mongo
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Accounts"])

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = "Developer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChangeEmailRequest(BaseModel):
    old_email: EmailStr
    new_email: EmailStr

class ChangePasswordRequest(BaseModel):
    email: EmailStr
    current_password: str
    new_password: str

@router.post("/signup")
def signup(req: SignupRequest):
    """Creates and persists a new user account in MongoDB."""
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )
    try:
        user = save_user_mongo(
            email=req.email,
            password=req.password,
            name=req.name,
            role=req.role or "Developer"
        )
        return {
            "success": True,
            "message": "User account created and saved in MongoDB.",
            "user": user
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register account: {str(e)}"
        )

@router.post("/login")
def login(req: LoginRequest):
    """Authenticates user against MongoDB 'users' collection."""
    try:
        user = authenticate_user_mongo(email=req.email, password=req.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please verify credentials."
            )
        return {
            "success": True,
            "message": "Authentication successful.",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login validation error: {str(e)}"
        )

@router.post("/change-email")
def change_email(req: ChangeEmailRequest):
    """Updates user email address in MongoDB."""
    try:
        updated = update_user_email_mongo(old_email=req.old_email, new_email=req.new_email)
        return {
            "success": True,
            "message": "Email updated successfully in MongoDB.",
            "user": updated
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update email: {str(e)}"
        )

@router.post("/change-password")
def change_password(req: ChangePasswordRequest):
    """Updates password in MongoDB."""
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )
    try:
        update_user_password_mongo(
            email=req.email,
            current_password=req.current_password,
            new_password=req.new_password
        )
        return {
            "success": True,
            "message": "Password updated successfully in MongoDB."
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}"
        )
