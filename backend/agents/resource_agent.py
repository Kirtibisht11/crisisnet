from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime
from .resource.matcher import ResourceMatcher
from .resource.geo_optimizer import GeoOptimizer
from .resource.availability_manager import AvailabilityManager
from .resource.priority_engine import PriorityEngine
from .resource.skill_matcher import SkillMatcher
from .resource.reassignment_engine import ReassignmentEngine
from backend.agents.communication_agent import notify
import json
from fastapi import Header
from backend.core.role_guard import require_role



router = APIRouter(prefix="/resource", tags=["resource"])

class ResourceAgent:
    def __init__(self):
        self.matcher = ResourceMatcher()
        self.geo_optimizer = GeoOptimizer()
        self.availability_manager = AvailabilityManager()
        self.priority_engine = PriorityEngine()
        self.skill_matcher = SkillMatcher()
        self.reassignment_engine = ReassignmentEngine()
        self.load_resources()
        
    def load_resources(self):
        try:
            with open('data/resources.json', 'r') as f:
                self.resources = json.load(f)
            with open('data/volunteers.json', 'r') as f:
                self.volunteers = json.load(f)
        except FileNotFoundError:
            self.resources = []
            self.volunteers = []
    
    def save_resources(self):
        with open('data/resources.json', 'w') as f:
            json.dump(self.resources, f, indent=2)
        with open('data/volunteers.json', 'w') as f:
            json.dump(self.volunteers, f, indent=2)
    
    def allocate_resources(self, crisis: Dict) -> Dict:
        crisis_priority = self.priority_engine.calculate_priority(crisis)
        
        available_resources = self.availability_manager.get_available(
            self.resources, crisis['type']
        )
        available_volunteers = self.availability_manager.get_available_volunteers(
            self.volunteers, crisis['type']
        )
        
        optimized_resources = self.geo_optimizer.optimize_allocation(
            available_resources, crisis['location'], crisis_priority
        )
        
        matched_volunteers = self.skill_matcher.match_skills(
            available_volunteers, crisis['required_skills']
        )
        
        allocation = self.matcher.create_allocation(
            crisis, optimized_resources, matched_volunteers
        )
        
        self.availability_manager.mark_allocated(
            allocation['resources'] + allocation['volunteers']
        )
        self.save_resources()
        try:
            notify(allocation)
        except Exception as e:
            print(f"[Resource] Notification failed: {e}")
        
        return allocation
    
    def handle_reassignment(self, higher_priority_crisis: Dict) -> Dict:
        reassignment = self.reassignment_engine.reallocate(
            higher_priority_crisis, self.resources, self.volunteers
        )
        self.save_resources()
        return reassignment
    
    def release_resources(self, allocation_id: str):
        self.availability_manager.release(allocation_id, self.resources, self.volunteers)
        self.save_resources()

agent = ResourceAgent()

@router.post("/allocate")
async def allocate_resources(crisis: Dict, token: str = Header(...)):
    require_role(token, ["authority"])
    try:
        allocation = agent.allocate_resources(crisis)
        return {"status": "success", "allocation": allocation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reassign")
async def reassign_resources(crisis: Dict, token: str = Header(...)):
    require_role(token, ["authority"])
    try:
        reassignment = agent.handle_reassignment(crisis)
        return {"status": "success", "reassignment": reassignment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/release/{allocation_id}")
async def release_resources(allocation_id: str, token: str = Header(...)):
    require_role(token, ["authority"])
    try:
        agent.release_resources(allocation_id)
        return {"status": "success", "message": "Resources released"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status(token: str = Header(...)):
    require_role(token, ["authority"])
    available = len([r for r in agent.resources if r['available']])
    total = len(agent.resources)
    return {
        "available_resources": available,
        "total_resources": total,
        "utilization": round((1 - available/total) * 100, 2) if total > 0 else 0
    }

@router.post("/volunteer/register")
async def register_volunteer(volunteer: Dict, token: str = Header(...)):
    require_role(token, ["volunteer"])
    try:
        if not volunteer.get('name') or not volunteer.get('skills') or not volunteer.get('location'):
            raise HTTPException(status_code=400, detail="Name, skills, and location are required")
        
        volunteer_id = f"vol_{len(agent.volunteers) + 1:03d}"
        
        new_volunteer = {
            "id": volunteer_id,
            "name": volunteer['name'],
            "skills": volunteer['skills'] if isinstance(volunteer['skills'], list) else [volunteer['skills']],
            "location": volunteer['location'],
            "available": volunteer.get('available', True),
            "registered_at": datetime.now().isoformat()
        }
        
        agent.volunteers.append(new_volunteer)
        agent.save_resources()
        
        return {
            "status": "success",
            "message": "Volunteer registered successfully",
            "volunteer_id": volunteer_id,
            "volunteer": new_volunteer
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/volunteer/tasks/{volunteer_id}")
async def get_volunteer_tasks(volunteer_id: str, token: str = Header(...)):
    require_role(token, ["volunteer"])

    try:
        with open('data/assignments_log.json', 'r') as f:
            assignments = json.load(f)
    except FileNotFoundError:
        assignments = []
    
    volunteer_tasks = [task for task in assignments if task.get('volunteer_id') == volunteer_id]
    
    return {"status": "success", "tasks": volunteer_tasks}

@router.get("/volunteer/tasks")
async def get_all_tasks(token: str = Header(...)):
    require_role(token, ["authority"])


    try:
        with open('data/assignments_log.json', 'r') as f:
            assignments = json.load(f)
    except FileNotFoundError:
        assignments = []
    
    return {"status": "success", "tasks": assignments}

@router.get("/volunteer/profile/{volunteer_id}")
async def get_volunteer_profile(volunteer_id: str, token: str = Header(...)):
    require_role(token, ["volunteer"])

    try:
        volunteer = next((v for v in agent.volunteers if v['id'] == volunteer_id), None)
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        return {"status": "success", "volunteer": volunteer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/volunteer/profile/{volunteer_id}")
async def update_volunteer_profile(volunteer_id: str, updates: Dict, token: str = Header(...)):
    require_role(token, ["volunteer"])

    try:
        volunteer_index = next((i for i, v in enumerate(agent.volunteers) if v['id'] == volunteer_id), None)
        
        if volunteer_index is None:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        agent.volunteers[volunteer_index].update(updates)
        agent.save_resources()
        
        return {"status": "success", "volunteer": agent.volunteers[volunteer_index]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))