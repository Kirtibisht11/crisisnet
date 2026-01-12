from fastapi import HTTPException
from typing import List, Optional
from .auth import decode_token
from sqlalchemy.orm import Session
from ..db.models import User

def require_role(token: str, allowed_roles: List[str], db: Optional[Session] = None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")

    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    try:
        payload = decode_token(token)
        user_role = payload.get("role")

        # If database is provided, check the current role in database as well
        if db:
            user_id = payload.get("user_id")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.role:
                    user_role = user.role

        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        return payload
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
