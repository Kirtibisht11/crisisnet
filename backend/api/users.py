"""
User Registration API (DB-based)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db.models import User
from backend.db import crud

router = APIRouter(prefix="/users", tags=["users"])


# ---------- Models ----------

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: str
    latitude: float
    longitude: float


class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    latitude: float
    longitude: float
    is_active: bool
    created_at: str


# ---------- Routes ----------

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    valid_roles = ["citizen", "volunteer", "authority"]
    if user_data.role not in valid_roles:
        raise HTTPException(400, "Invalid role")

    phone = user_data.phone.strip()
    if not phone.startswith("+"):
        phone = "+" + phone

    # Check if user already exists
    existing = crud.get_user_by_phone(db, phone)
    if existing:
        raise HTTPException(400, "User with this phone already exists")

    new_user = crud.create_user(
        db=db,
        phone=phone,
        password=user_data.password,
        role=user_data.role,
        name=user_data.name,
        latitude=user_data.latitude,
        longitude=user_data.longitude
    )

    # Map DB model to response
    return {
        "id": new_user.id,
        "name": new_user.name,
        "phone": new_user.phone,
        "role": new_user.role,
        "latitude": new_user.latitude,
        "longitude": new_user.longitude,
        "is_active": True, # Default in model is True
        "created_at": new_user.created_at.isoformat() if new_user.created_at else ""
    }


@router.get("/")
def list_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()


@router.get("/stats")
def user_stats(db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "citizens": db.query(User).filter(User.role == "citizen").count(),
        "volunteers": db.query(User).filter(User.role == "volunteer").count(),
        "authorities": db.query(User).filter(User.role == "authority").count()
    }