"""
Simple auth endpoints for demo login

POST /auth/login
 - body: { username: <name> | phone: <phone> }
 - returns JWT token and user object (if found)

This is intentionally simple for demo purposes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
import bcrypt

from ..core.auth import create_token

router = APIRouter(prefix="/auth", tags=["auth"])

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'users.json')


def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


class LoginRequest(BaseModel):
    username: str | None = None
    phone: str | None = None
    password: str


@router.post('/login')
def login(req: LoginRequest):
    users = load_users().get('users', [])

    # Find by username or phone
    user = None
    if req.username:
        user = next((u for u in users if u.get('name') == req.username or u.get('user_id') == req.username), None)
    if not user and req.phone:
        phone = req.phone if req.phone.startswith('+') else '+' + req.phone
        user = next((u for u in users if u.get('phone') == phone), None)

    # User not found
    if not user:
        raise HTTPException(401, "Invalid username/phone or password")

    # Verify password
    password_hash = user.get('password_hash')
    if not password_hash:
        # Demo fallback: allow login if user exists but no password hash stored
        # This keeps backwards compatibility for demo users created without passwords.
        print(f"[Auth] Demo fallback login for user {user.get('user_id')}")
    else:
        if not bcrypt.checkpw(req.password.encode('utf-8'), password_hash.encode('utf-8')):
            raise HTTPException(401, "Invalid username/phone or password")

    payload = {"user_id": user.get('user_id'), "role": user.get('role')}
    token = create_token(payload)

    return {"access_token": token, "token_type": "bearer", "user": user}
