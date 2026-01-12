"""
Simple auth endpoints for demo login
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
import os
import bcrypt
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.core.auth import create_token, decode_token
from backend.db.database import get_db
from backend.db.models import User
from backend.db import crud

router = APIRouter(tags=["auth"])


# Secret token for authority registration
AUTHORITY_SECRET = os.getenv("AUTHORITY_SECRET", "CRISIS_NET_ADMIN_2025")


class LoginRequest(BaseModel):
    username: str | None = None
    phone: str | None = None
    password: str


@router.post('/auth/login')
@router.post('/api/auth/login')
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Find by username (name/id) or phone
    query = db.query(User)
    
    if req.username:
        # Try matching name or ID
        user = query.filter(or_(User.name == req.username, User.id == req.username)).first()
    elif req.phone:
        phone = req.phone if req.phone.startswith('+') else '+' + req.phone
        user = query.filter(User.phone == phone).first()
    else:
        raise HTTPException(400, "Username or phone required")

    # User not found
    if not user:
        raise HTTPException(401, "Invalid username/phone or password")

    # Verify password
    if not bcrypt.checkpw(req.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(401, "Invalid username/phone or password")

    # Convert to dict for response
    user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}

    payload = {"user_id": user.id, "role": user.role}
    token = create_token(payload)

    return {"access_token": token, "token_type": "bearer", "user": user}


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\+\d{10,15}$")
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(citizen|volunteer|authority)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organization_name: Optional[str] = None
    designation: Optional[str] = None
    authority_token: Optional[str] = None


@router.post('/auth/signup', status_code=status.HTTP_201_CREATED)
@router.post('/api/auth/signup', status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Normalize phone: ensure leading +
    phone = req.phone if req.phone.startswith('+') else '+' + req.phone

    # Check existing phone
    if crud.get_user_by_phone(db, phone):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phone number already registered")

    # For authority role, require organization details
    if req.role == 'authority':
        if not req.organization_name or not req.designation:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Organization name and designation are required for authority users")
        
        if req.authority_token != AUTHORITY_SECRET:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid authority access token")

    # Create user via CRUD
    new_user = crud.create_user(
        db=db,
        phone=phone,
        password=req.password, # CRUD handles hashing
        role=req.role,
        name=req.name,
        latitude=req.latitude,
        longitude=req.longitude,
        organization_name=req.organization_name if req.role == 'authority' else None,
        # designation not in standard create_user but can be added if needed,
        # or we assume organization_name covers it for now
    )

    token_payload = {'user_id': new_user.id, 'phone': phone, 'role': req.role}
    token = create_token(token_payload)

    user_response = {c.name: getattr(new_user, c.name) for c in new_user.__table__.columns}
    if 'password' in user_response: del user_response['password']

    return {'message': 'User registered successfully', 'access_token': token, 'token_type': 'bearer', 'user': user_response}


@router.get('/auth/verify')
@router.get('/api/auth/verify')
def verify(token: str, db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(e))

    user_id = payload.get('user_id')
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Invalid token payload')

    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'User not found')

    user_response = {c.name: getattr(user, c.name) for c in user.__table__.columns if c.name != 'password'}
    return {'valid': True, 'user': user_response}
