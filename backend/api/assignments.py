from fastapi import APIRouter
import json

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

@router.get("/my")
def my_assignments(user_id: str):
    with open("assignments.json") as f:
        data = json.load(f)
    return [a for a in data if user_id in a["assigned_volunteers"]]
