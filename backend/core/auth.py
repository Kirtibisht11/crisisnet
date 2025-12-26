"""
Core Authentication Helpers
Creates and validates JWT tokens.
"""

import jwt
from datetime import datetime, timedelta

SECRET_KEY = "crisisnet-secret"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60


def create_token(payload: dict) -> str:
    """Create a JWT token with expiry."""
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
