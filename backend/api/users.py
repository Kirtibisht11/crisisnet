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
import bcrypt
import time
import logging

router = APIRouter(prefix="/users", tags=["users"])

# Use the data/users.json path to match other modules
USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'users.json')

logger = logging.getLogger(__name__)


# ---------- Utility Functions ----------

def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(data):
    # atomic write to reduce partial writes
    dir_path = os.path.dirname(USERS_FILE)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)

    tmp = USERS_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        # Ensure data is written to disk before replacing
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, USERS_FILE)


# ---------- Models ----------

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
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

    # Check if user already exists
    existing = next((u for u in users_data["users"] if u.get("phone") == phone), None)
    if existing:
        raise HTTPException(400, "User with this phone already exists")

    try:
        # Measure hashing time to detect slowness
        t0 = time.time()
        # use 10 rounds to be faster on demo systems; increase in production
        password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')
        t_hash = time.time() - t0
        logger.info(f"Password hashing took {t_hash:.3f}s for phone={phone}")
    except Exception as ex:
        logger.exception("Error hashing password")
        raise HTTPException(500, "Internal error processing password")

    new_user = {
        "user_id": f"u_{uuid.uuid4().hex[:8]}",
        "name": user_data.name,
        "phone": phone,
        "password_hash": password_hash,
        "role": user_data.role,
        "latitude": user_data.latitude,
        "longitude": user_data.longitude,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    users_data["users"].append(new_user)
    try:
        t0 = time.time()
        save_users(users_data)
        t_save = time.time() - t0
        logger.info(f"Saving users.json took {t_save:.3f}s for phone={phone}")
    except Exception as ex:
        logger.exception("Failed to save users.json")
        raise HTTPException(500, "Failed to save user data")

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