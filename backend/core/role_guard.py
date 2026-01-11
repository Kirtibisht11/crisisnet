from fastapi import HTTPException
from typing import List
from .auth import decode_token

def require_role(token: str, allowed_roles: List[str]) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
        
    try:
        payload = decode_token(token)
        user_role = payload.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
            
        return payload
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))