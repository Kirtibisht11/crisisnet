from fastapi import APIRouter, Header
from backend.core.role_guard import require_role
import json

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/status")
def status(token: str = Header(...)):
    require_role(token, ["authority"])
    return {
        "detection": "ok",
        "trust": "ok",
        "resource": "ok",
        "communication": "ok"
    }

@router.get("/events")
def events(token: str = Header(...)):
    require_role(token, ["authority"])
    try:
        with open("event_timeline.json") as f:
            return json.load(f)
    except FileNotFoundError:
        return []
