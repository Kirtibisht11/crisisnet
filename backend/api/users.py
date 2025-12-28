"""
User Registration API (JSON-based)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import uuid
import os

router = APIRouter(prefix="/users", tags=["users"])

USERS_FILE = "users.json"


# ---------- Utility Functions ----------

def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(data):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ---------- Models ----------

class UserCreate(BaseModel):
    name: str
    phone: str
    role: str
    latitude: float
    longitude: float


class UserResponse(BaseModel):
    user_id: str
    name: str
    phone: str
    role: str
    latitude: float
    longitude: float
    is_active: bool
    created_at: str


# ---------- Routes ----------

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate):
    valid_roles = ["citizen", "volunteer", "authority"]
    if user_data.role not in valid_roles:
        raise HTTPException(400, "Invalid role")

    phone = user_data.phone.strip()
    if not phone.startswith("+"):
        phone = "+" + phone

    users_data = load_users()

    new_user = {
        "user_id": f"u_{uuid.uuid4().hex[:8]}",
        "name": user_data.name,
        "phone": phone,
        "role": user_data.role,
        "latitude": user_data.latitude,
        "longitude": user_data.longitude,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    users_data["users"].append(new_user)
    save_users(users_data)

    return new_user


@router.get("/", response_model=List[UserResponse])
def list_users(role: Optional[str] = None):
    users = load_users()["users"]
    if role:
        return [u for u in users if u["role"] == role]
    return users


@router.get("/stats")
def user_stats():
    users = load_users()["users"]

    return {
        "total_users": len(users),
        "citizens": sum(1 for u in users if u["role"] == "citizen"),
        "volunteers": sum(1 for u in users if u["role"] == "volunteer"),
        "authorities": sum(1 for u in users if u["role"] == "authority"),
        "active_users": sum(1 for u in users if u["is_active"]),
        "inactive_users": sum(1 for u in users if not u["is_active"])
    }