from fastapi import APIRouter
import json

router = APIRouter(prefix="/api/volunteer", tags=["volunteer"])

@router.post("/profile")
def create_profile(profile: dict):
    with open("volunteers.json") as f:
        data = json.load(f)
    data.append(profile)
    with open("volunteers.json", "w") as f:
        json.dump(data, f, indent=2)
    return {"success": True}
