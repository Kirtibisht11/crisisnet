from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from datetime import datetime
from .resource.matcher import ResourceMatcher
from .resource.geo_optimizer import GeoOptimizer
from .resource.availability_manager import AvailabilityManager
from .resource.priority_engine import PriorityEngine
from .resource.skill_matcher import SkillMatcher
from .resource.reassignment_engine import ReassignmentEngine
import json

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
async def allocate_resources(crisis: Dict):
    try:
        allocation = agent.allocate_resources(crisis)
        return {"status": "success", "allocation": allocation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reassign")
async def reassign_resources(crisis: Dict):
    try:
        reassignment = agent.handle_reassignment(crisis)
        return {"status": "success", "reassignment": reassignment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/release/{allocation_id}")
async def release_resources(allocation_id: str):
    try:
        agent.release_resources(allocation_id)
        return {"status": "success", "message": "Resources released"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status():
    available = len([r for r in agent.resources if r['available']])
    total = len(agent.resources)
    return {
        "available_resources": available,
        "total_resources": total,
        "utilization": round((1 - available/total) * 100, 2) if total > 0 else 0
    }