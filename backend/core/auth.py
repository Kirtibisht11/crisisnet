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

    # =========================
    # 🔹 ADD: issued-at time
    # =========================
    data["iat"] = datetime.utcnow()

    # =========================
    # 🔹 ADD: optional location passthrough
    # =========================
    # If location exists in payload, include it in token
    # If not present, token works exactly as before
    if "location" in payload:
        data["location"] = payload.get("location")

    # Existing expiry logic (UNCHANGED)
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


# =========================
# 🔹 ADD: optional helper
# =========================
def extract_user_context(token: str) -> dict:
    """
    Extract commonly used user context from token.
    Safe even if location is missing.
    """
    payload = decode_token(token)

    return {
        "user_id": payload.get("user_id"),
        "username": payload.get("username"),
        "phone": payload.get("phone"),
        "role": payload.get("role"),
        "location": payload.get("location")
    }
