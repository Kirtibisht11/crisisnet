from fastapi import APIRouter, HTTPException
from typing import Dict
from datetime import datetime
import json
import os

from .resource.matcher import ResourceMatcher
from .resource.geo_optimizer import GeoOptimizer
from .resource.availability_manager import AvailabilityManager
from .resource.priority_engine import PriorityEngine
from .resource.skill_matcher import SkillMatcher
from .resource.reassignment_engine import ReassignmentEngine

router = APIRouter(prefix="/resource", tags=["resource"])


class ResourceAgent:
    def __init__(self):
        self.matcher = ResourceMatcher()
        self.geo_optimizer = GeoOptimizer()
        self.availability_manager = AvailabilityManager()
        self.priority_engine = PriorityEngine()
        self.skill_matcher = SkillMatcher()
        self.reassignment_engine = ReassignmentEngine()
        self._load_data()

    def _data_path(self, filename: str) -> str:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        return os.path.join(base_dir, "data", filename)

    def _load_data(self):
        try:
            with open(self._data_path("resources.json"), "r") as f:
                self.resources = json.load(f)
        except FileNotFoundError:
            self.resources = []

        try:
            with open(self._data_path("volunteers.json"), "r") as f:
                self.volunteers = json.load(f)
        except FileNotFoundError:
            self.volunteers = []

    def _save_data(self):
        with open(self._data_path("resources.json"), "w") as f:
            json.dump(self.resources, f, indent=2)

        with open(self._data_path("volunteers.json"), "w") as f:
            json.dump(self.volunteers, f, indent=2)

    # ---------- CORE RESOURCE LOGIC ----------

    def allocate_resources(self, crisis: Dict) -> Dict:
        crisis_priority = self.priority_engine.calculate_priority(crisis)

        available_resources = self.availability_manager.get_available(
            self.resources, crisis.get("type")
        )

        available_volunteers = self.availability_manager.get_available_volunteers(
            self.volunteers, crisis.get("type")
        )

        optimized_resources = self.geo_optimizer.optimize_allocation(
            available_resources, crisis.get("location"), crisis_priority
        )

        matched_volunteers = self.skill_matcher.match_skills(
            available_volunteers, crisis.get("required_skills", [])
        )

        allocation = self.matcher.create_allocation(
            crisis, optimized_resources, matched_volunteers
        )

        self.availability_manager.mark_allocated(
            allocation.get("resources", []) + allocation.get("volunteers", [])
        )

        self._save_data()
        return allocation

    # ---------- VOLUNTEER REGISTRATION ----------

    def register_volunteer(self, volunteer: Dict) -> Dict:
        if not volunteer.get("name") or not volunteer.get("skills") or not volunteer.get("location"):
            raise HTTPException(
                status_code=400,
                detail="Name, skills, and location are required"
            )

        # Prevent duplicate registrations (simple MVP check)
        if any(v["name"].lower() == volunteer["name"].lower() for v in self.volunteers):
            raise HTTPException(
                status_code=400,
                detail="Volunteer already registered"
            )

        volunteer_id = f"vol_{len(self.volunteers) + 1:03d}"

        skills = volunteer["skills"]
        if not isinstance(skills, list):
            skills = [skills]

        new_volunteer = {
            "id": volunteer_id,
            "name": volunteer["name"],
            "skills": [s.strip().lower() for s in skills],
            "location": volunteer["location"],
            "available": volunteer.get("available", True),
            "registered_at": datetime.utcnow().isoformat()
        }

        self.volunteers.append(new_volunteer)
        self._save_data()

        return new_volunteer


agent = ResourceAgent()

# ---------- API ROUTES ----------

@router.post("/allocate")
async def allocate_resources(crisis: Dict):
    try:
        allocation = agent.allocate_resources(crisis)
        return {"status": "success", "allocation": allocation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/volunteer/register")
async def register_volunteer(volunteer: Dict):
    try:
        new_volunteer = agent.register_volunteer(volunteer)
        return {
            "status": "success",
            "message": "Volunteer registered successfully",
            "volunteer": new_volunteer
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/volunteer/tasks/{volunteer_id}")
async def get_volunteer_tasks(volunteer_id: str):
    """
    Round-1 MVP:
    Tasks are mocked to avoid persistence complexity.
    """
    mock_tasks = [
        {
            "volunteer_id": volunteer_id,
            "task": "Flood rescue assistance",
            "location": "Ward 12",
            "priority": "High"
        }
    ]

    return {
        "status": "success",
        "tasks": mock_tasks
    }
