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

    # If user not found, return a demo token with provided role="citizen"
    if not user:
        demo_payload = {"user_id": "demo_user", "role": "citizen"}
        token = create_token(demo_payload)
        return {"access_token": token, "token_type": "bearer", "user": demo_payload}

    payload = {"user_id": user.get('user_id'), "role": user.get('role')}
    token = create_token(payload)

    return {"access_token": token, "token_type": "bearer", "user": user}
