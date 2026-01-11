"""
Simple auth endpoints for demo login

POST /auth/login
 - body: { username: <name> | phone: <phone> }
 - returns JWT token and user object (if found)

This is intentionally simple for demo purposes.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import json
import os
import bcrypt
from typing import Optional
from datetime import datetime
import uuid

from ..core.auth import create_token, decode_token

router = APIRouter(tags=["auth"])

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'users.json')


def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

# Secret token for authority registration
AUTHORITY_SECRET = os.getenv("AUTHORITY_SECRET", "CRISIS_NET_ADMIN_2025")


class LoginRequest(BaseModel):
    username: str | None = None
    phone: str | None = None
    password: str


@router.post('/auth/login')
@router.post('/api/auth/login')
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


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\+\d{10,15}$")
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(citizen|volunteer|authority)$")
    latitude: float = 0.0
    longitude: float = 0.0
    organization_name: Optional[str] = None
    designation: Optional[str] = None
    authority_token: Optional[str] = None


def get_users_list():
    data = load_users()
    return data.get('users', [])


def save_users(users):
    try:
        dirpath = os.path.dirname(USERS_FILE)
        if dirpath:
            os.makedirs(dirpath, exist_ok=True)

        tmp_path = USERS_FILE + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump({'users': users}, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, USERS_FILE)
        return True
    except Exception as e:
        print(f"Error saving users: {e}")
        return False


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def generate_user_id() -> str:
    return f"u_{uuid.uuid4().hex[:8]}"


@router.post('/auth/signup', status_code=status.HTTP_201_CREATED)
@router.post('/api/auth/signup', status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    users = get_users_list()

    # Normalize phone: ensure leading +
    phone = req.phone if req.phone.startswith('+') else '+' + req.phone

    # Check existing phone
    if any(u.get('phone') == phone for u in users):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phone number already registered")

    # For authority role, require organization details
    if req.role == 'authority':
        if not req.organization_name or not req.designation:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Organization name and designation are required for authority users")
        
        if req.authority_token != AUTHORITY_SECRET:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid authority access token")

    user_id = generate_user_id()
    password_hash = hash_password(req.password)

    new_user = {
        'user_id': user_id,
        'name': req.name,
        'phone': phone,
        'password_hash': password_hash,
        'role': req.role,
        'latitude': req.latitude,
        'longitude': req.longitude,
        'is_active': True,
        'created_at': datetime.utcnow().isoformat() + 'Z'
    }

    if req.role == 'authority':
        new_user['organization_name'] = req.organization_name
        new_user['designation'] = req.designation

    users.append(new_user)
    if not save_users(users):
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to save user data")

    token_payload = {'user_id': user_id, 'phone': phone, 'role': req.role}
    token = create_token(token_payload)

    user_response = {k: v for k, v in new_user.items() if k != 'password_hash'}

    return {'message': 'User registered successfully', 'access_token': token, 'token_type': 'bearer', 'user': user_response}


@router.get('/auth/verify')
@router.get('/api/auth/verify')
def verify(token: str):
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))

    user_id = payload.get('user_id')
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Invalid token payload')

    users = get_users_list()
    user = next((u for u in users if u.get('user_id') == user_id), None)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'User not found')

    user_response = {k: v for k, v in user.items() if k != 'password_hash'}
    return {'valid': True, 'user': user_response}
