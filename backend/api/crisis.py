"""
Crisis Detection and Alert API (JSON users)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os
import uuid

from ..services.location_service import location_service
# from ..agents.communication_agent import communication_agent


router = APIRouter(prefix="/crisis", tags=["crisis"])

USERS_FILE = "users.json"
CRISIS_FILE = "crises.json"


# ---------- Helpers ----------

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)["users"]


def load_crises():
    if not os.path.exists(CRISIS_FILE):
        return []
    with open(CRISIS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)["crises"]


def save_crisis(crisis):
    data = {"crises": load_crises()}
    data["crises"].append(crisis)
    with open(CRISIS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ---------- Models ----------

class CrisisCreate(BaseModel):
    crisis_type: str
    severity: str
    latitude: float
    longitude: float
    radius_km: float = 5.0
    location_name: Optional[str] = "Unknown"


# ---------- Routes ----------

@router.post("/detect")
def detect_crisis(crisis: CrisisCreate, background_tasks: BackgroundTasks):

    crisis_data = {
        "crisis_id": f"c_{uuid.uuid4().hex[:8]}",
        "crisis_type": crisis.crisis_type,
        "severity": crisis.severity,
        "latitude": crisis.latitude,
        "longitude": crisis.longitude,
        "radius_km": crisis.radius_km,
        "location_name": crisis.location_name,
        "detected_at": datetime.utcnow().isoformat() + "Z",
        "status": "active"
    }

    save_crisis(crisis_data)

    background_tasks.add_task(process_and_send_alerts, crisis_data)

    return crisis_data


# ---------- Background Logic ----------

def process_and_send_alerts(crisis):

    users = load_users()

    affected_citizens = location_service.find_users_in_radius(
        crisis["latitude"],
        crisis["longitude"],
        crisis["radius_km"],
        [u for u in users if u["role"] == "citizen"]
    )

    volunteers = location_service.find_nearby_volunteers(
        crisis["latitude"],
        crisis["longitude"],
        [u for u in users if u["role"] == "volunteer"],
        max_distance=10
    )[:5]

    authorities = [u for u in users if u["role"] == "authority"]

    agent_input = {
        "crisis": crisis,
        "affected_users": affected_citizens,
        "available_volunteers": volunteers,
        "authorities": authorities
    }

    # payload = communication_agent.process_crisis(agent_input)
    
    return {"status": "ok"}
