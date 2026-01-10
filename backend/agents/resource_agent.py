from fastapi import APIRouter, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import json
import logging
from db.database import get_db
from db import crud, models
from .resource.matcher import ResourceMatcher
from .resource.geo_optimizer import GeoOptimizer
from .resource.availability_manager import AvailabilityManager
from .resource.priority_engine import PriorityEngine
from .resource.skill_matcher import SkillMatcher
from .resource.reassignment_engine import ReassignmentEngine
from backend.api.notify import notify
from backend.core.role_guard import require_role

router = APIRouter(prefix="/resource", tags=["resource"])
logger = logging.getLogger(__name__)


class ResourceAgent:

    def __init__(self, db: Session = None):
        self.db = db
        
        self.matcher = ResourceMatcher()
        self.geo_optimizer = GeoOptimizer()
        self.availability_manager = AvailabilityManager()
        self.priority_engine = PriorityEngine()
        self.skill_matcher = SkillMatcher()
        self.reassignment_engine = ReassignmentEngine()
        self.max_search_radius_km = 50.0
    
    
    #DISTANCE & ETA CALCULATIONS
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        
        R = 6371  # Earth radius
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
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
async def register_volunteer(volunteer: Dict, token: str = Header(None)):
    # Allow anonymous registration from frontend for demo/dev flows.
    # In production, re-enable role checks via require_role(token, ["volunteer"]).
    try:
        if not volunteer.get('name') or not volunteer.get('skills') or not volunteer.get('location'):
            raise HTTPException(status_code=400, detail="Name, skills, and location are required")
        
        Factors:
        - Skill match: 40%
        - Distance: 30%
        - Reliability: 20%
        - Availability: 10%
        
        Returns: (total_score, breakdown_dict)
        """
        breakdown = {}
        total_score = 0.0
        
        # 1. Skill Match (40 points)
        skill_score = 0
        if task.required_skill:
            if volunteer.skills and task.required_skill in volunteer.skills:
                skill_score = 40
                breakdown["skill_match"] = "exact"
            else:
                skill_score = 10
                breakdown["skill_match"] = "partial"
        else:
            skill_score = 30
            breakdown["skill_match"] = "not_required"
        
        total_score += skill_score
        
        # 2. Distance Score (30 points)
        if volunteer.latitude and volunteer.longitude and task.latitude and task.longitude:
            distance = self.calculate_distance(
                volunteer.latitude, volunteer.longitude,
                task.latitude, task.longitude
            )
            
            if distance <= 5:
                distance_score = 30
            elif distance <= 15:
                distance_score = 20
            elif distance <= 30:
                distance_score = 10
            else:
                distance_score = 5
            
            breakdown["distance_km"] = round(distance, 2)
        else:
            distance_score = 15
            breakdown["distance_km"] = None
        
        breakdown["distance_score"] = distance_score
        total_score += distance_score
        
        # 3. Reliability (20 points)
        reliability_score = volunteer.reliability_score * 20
        breakdown["reliability"] = round(volunteer.reliability_score, 2)
        total_score += reliability_score
        
        # 4. Availability (10 points)
        availability_score = 10 if volunteer.availability else 0
        breakdown["available"] = volunteer.availability
        total_score += availability_score
        
        breakdown["total_score"] = round(total_score, 1)
        
        return total_score, breakdown
    
    
    # ============= TASK GENERATION =============
    
    def generate_tasks_for_crisis(self, crisis: models.Crisis) -> List[Dict]:
        """Generate appropriate tasks based on crisis type"""
        
        task_templates = {
            "fire": [
                {"title": "Fire Suppression", "type": "rescue", "skill": "firefighting", "priority": 10},
                {"title": "Evacuate Residents", "type": "evacuation", "skill": "rescue", "priority": 9},
                {"title": "Medical Support", "type": "medical", "skill": "first_aid", "priority": 8}
            ],
            "flood": [
                {"title": "Water Rescue", "type": "rescue", "skill": "water_rescue", "priority": 10},
                {"title": "Shelter Setup", "type": "supply", "skill": "logistics", "priority": 7},
                {"title": "Medical Aid", "type": "medical", "skill": "first_aid", "priority": 8}
            ],
            "medical": [
                {"title": "Emergency Medical Response", "type": "medical", "skill": "first_aid", "priority": 10},
                {"title": "Transport to Hospital", "type": "transport", "skill": "driver", "priority": 9}
            ],
            "accident": [
                {"title": "Victim Extraction", "type": "rescue", "skill": "rescue", "priority": 10},
                {"title": "First Aid", "type": "medical", "skill": "first_aid", "priority": 9},
                {"title": "Traffic Control", "type": "support", "priority": 6}
            ],
            "earthquake": [
                {"title": "Search & Rescue", "type": "rescue", "skill": "rescue", "priority": 10},
                {"title": "Medical Triage", "type": "medical", "skill": "first_aid", "priority": 9},
                {"title": "Shelter Coordination", "type": "supply", "skill": "logistics", "priority": 7}
            ]
        }
        
        return task_templates.get(crisis.crisis_type, [
            {"title": "Emergency Response", "type": "general", "priority": 8},
            {"title": "Support Operations", "type": "support", "priority": 6}
        ])
    
    
    # ============= MAIN MATCHING FUNCTION =============
    
    def match_volunteers_to_crisis(self, crisis_id: int) -> List[Dict]:
        """
        V2 Main Matching Algorithm
        
        Process:
        1. Get crisis details
        2. Generate appropriate tasks
        3. Find available volunteers
        4. Score all volunteers for each task
        5. Assign best matches
        6. Record metrics
        
        Returns: List of assignments
        """
        logger.info(f" [Resource Agent V2] Matching for crisis {crisis_id}")
        
        if not self.db:
            raise Exception("Database session required")
        
        # Get crisis
        crisis = crud.get_crisis_by_id(self.db, crisis_id)
        if not crisis:
            logger.error(f"Crisis {crisis_id} not found")
            return []
        
        # Generate tasks
        task_templates = self.generate_tasks_for_crisis(crisis)
        assignments = []
        
        for template in task_templates:
            # Create task in database
            task = crud.create_task(
                self.db,
                crisis_id=crisis.id,
                title=template["title"],
                task_type=template["type"],
                required_skill=template.get("skill"),
                description=f"Auto-generated for {crisis.crisis_type} crisis",
                latitude=crisis.latitude,
                longitude=crisis.longitude,
                priority=template.get("priority", 5)
            )
            
            logger.info(f" Created task: {task.title}")
            
            # Find volunteers
            volunteers = crud.get_available_volunteers(
                self.db,
                latitude=crisis.latitude,
                longitude=crisis.longitude,
                required_skill=template.get("skill"),
                max_distance_km=self.max_search_radius_km
            )
            
            if not volunteers:
                logger.warning(f"⚠️ No volunteers available for {task.title}")
                continue
            
            # Score all volunteers
            scored_volunteers = []
            for volunteer in volunteers:
                score, breakdown = self.score_volunteer(volunteer, task, crisis)
                scored_volunteers.append({
                    "volunteer": volunteer,
                    "score": score,
                    "breakdown": breakdown
                })
            
            # Sort by score
            scored_volunteers.sort(key=lambda x: x["score"], reverse=True)
            
            # Assign to best volunteer
            best = scored_volunteers[0]
            volunteer = best["volunteer"]
            
            crud.assign_task(self.db, task.id, volunteer.id)
            
            # Calculate ETA
            distance = best["breakdown"].get("distance_km", 0) or 0
            eta = self.calculate_eta(distance, crisis.severity)
            
            # Record performance metric
            crud.record_metric(
                self.db,
                entity_type="task",
                entity_id=task.id,
                metric_type="assignment_score",
                metric_value=best["score"],
                crisis_id=crisis.id,
                task_id=task.id,
                metadata=best["breakdown"]
            )
            
            logger.info(
                f" Assigned {volunteer.name} to {task.title} "
                f"(score: {best['score']}, ETA: {eta}min)"
            )
            
            assignment = {
                "task_id": task.id,
                "task_title": task.title,
                "task_type": task.task_type,
                "volunteer_id": volunteer.id,
                "volunteer_name": volunteer.name,
                "volunteer_phone": volunteer.phone,
                "score": best["score"],
                "breakdown": best["breakdown"],
                "eta_minutes": eta,
                "priority": task.priority
            }
            
            assignments.append(assignment)
            
            # Notify volunteer
            try:
                notify({
                    "type": "task_assignment",
                    "volunteer": volunteer.name,
                    "task": task.title,
                    "crisis": crisis.title,
                    "eta": eta
                })
            except Exception as e:
                logger.warning(f"Notification failed: {e}")
        
        return assignments
    
    
    # ============= REASSIGNMENT =============
    
    def reassign_failed_task(self, task_id: int, reason: str = "timeout") -> Optional[Dict]:
        """
        Reassign task when volunteer fails/delays
        
        Actions:
        1. Penalize original volunteer's reliability
        2. Find new volunteer
        3. Assign and notify
        """
        logger.info(f" Reassigning task {task_id} (reason: {reason})")
        
        task = crud.get_task_by_id(self.db, task_id)
        if not task:
            return None
        
        # Penalize original volunteer
        if task.volunteer_id:
            old_volunteer = crud.get_user_by_id(self.db, task.volunteer_id)
            if old_volunteer:
                new_reliability = max(0.5, old_volunteer.reliability_score - 0.1)
                crud.update_volunteer_reliability(self.db, old_volunteer.id, new_reliability)
                logger.info(f"⬇ Lowered {old_volunteer.name} reliability to {new_reliability}")
                
                # Record metric
                crud.record_metric(
                    self.db,
                    entity_type="volunteer",
                    entity_id=old_volunteer.id,
                    metric_type="task_failure",
                    metric_value=1.0,
                    task_id=task_id,
                    metadata={"reason": reason}
                )
        
        # Reset task
        old_volunteer_id = task.volunteer_id
        task.volunteer_id = None
        task.status = "pending"
        self.db.commit()
        
        # Find alternative volunteers
        crisis = crud.get_crisis_by_id(self.db, task.crisis_id)
        volunteers = crud.get_available_volunteers(
            self.db,
            latitude=task.latitude or crisis.latitude,
            longitude=task.longitude or crisis.longitude,
            required_skill=task.required_skill,
            max_distance_km=self.max_search_radius_km
        )
        
        # Exclude failed volunteer
        volunteers = [v for v in volunteers if v.id != old_volunteer_id]
        
        if not volunteers:
            logger.warning(f" No alternative volunteers for task {task_id}")
            return None
        
        # Score and assign
        scored = []
        for v in volunteers:
            score, breakdown = self.score_volunteer(v, task, crisis)
            scored.append({"volunteer": v, "score": score, "breakdown": breakdown})
        
        scored.sort(key=lambda x: x["score"], reverse=True)
        best = scored[0]
        
        crud.assign_task(self.db, task.id, best["volunteer"].id)
        
        logger.info(f" Reassigned to {best['volunteer'].name} (score: {best['score']})")
        
        return {
            "task_id": task.id,
            "task_title": task.title,
            "new_volunteer_id": best["volunteer"].id,
            "new_volunteer_name": best["volunteer"].name,
            "score": best["score"],
            "reason": reason
        }


# ============= API ENDPOINTS =============

# Create global agent (will be initialized per request with DB session)
def get_agent(db: Session = Depends(get_db)) -> ResourceAgent:
    """Dependency to get ResourceAgent with DB session"""
    return ResourceAgent(db)


@router.post("/allocate")
async def allocate_resources(
    crisis_id: int,
    token: str = Header(...),
    agent: ResourceAgent = Depends(get_agent)
):
    """
    V2: Allocate resources to crisis using intelligent matching
    """
    require_role(token, ["authority", "ngo"])
    
    try:
        assignments = agent.match_volunteers_to_crisis(crisis_id)
        
        return {
            "status": "success",
            "crisis_id": crisis_id,
            "assignments_count": len(assignments),
            "assignments": assignments
        }
    except Exception as e:
        logger.error(f"Allocation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reassign/{task_id}")
async def reassign_task(
    task_id: int,
    reason: str = "timeout",
    token: str = Header(...),
    agent: ResourceAgent = Depends(get_agent)
):
    """
    V2: Reassign failed/delayed task
    """
    require_role(token, ["authority", "ngo"])
    
    try:
        result = agent.reassign_failed_task(task_id, reason)
        
        if not result:
            raise HTTPException(status_code=404, detail="No alternative volunteers available")
        
        return {
            "status": "success",
            "reassignment": result
        }
    except Exception as e:
        logger.error(f"Reassignment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/volunteer/tasks/{volunteer_id}")
async def get_volunteer_tasks(volunteer_id: str, token: str = Header(None)):
    # Allow anonymous access in dev/demo mode. In production, enforce role checks:
    # require_role(token, ["volunteer"])

    try:
        with open('data/assignments_log.json', 'r') as f:
            assignments = json.load(f)
    except FileNotFoundError:
        assignments = []
    
    tasks = crud.get_tasks_by_volunteer(db, volunteer_id)
    
    result = []
    for task in tasks:
        crisis = crud.get_crisis_by_id(db, task.crisis_id)
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "type": task.task_type,
            "status": task.status,
            "priority": task.priority,
            "crisis": {
                "id": crisis.id,
                "title": crisis.title,
                "type": crisis.crisis_type,
                "severity": crisis.severity
            },
            "location": {
                "latitude": task.latitude,
                "longitude": task.longitude
            },
            "assigned_at": task.assigned_at.isoformat() if task.assigned_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None
        })
    
    return {"status": "success", "tasks": result}

@router.get("/volunteer/profile/{volunteer_id}")
async def get_volunteer_profile(volunteer_id: str, token: str = Header(None)):
    # Allow anonymous access in dev/demo mode. In production, enforce role checks:
    # require_role(token, ["volunteer"])

    try:
        volunteer = next((v for v in agent.volunteers if v['id'] == volunteer_id), None)
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        return {"status": "success", "volunteer": volunteer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/volunteer/profile/{volunteer_id}")
async def update_volunteer_profile(
    volunteer_id: int,
    updates: Dict,
    token: str = Header(...),
    db: Session = Depends(get_db)
):
    """Update volunteer profile"""
    require_role(token, ["volunteer"])
    
    volunteer = crud.get_user_by_id(db, volunteer_id)
    if not volunteer or volunteer.role != "volunteer":
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Update allowed fields
    if "name" in updates:
        volunteer.name = updates["name"]
    if "skills" in updates:
        volunteer.skills = updates["skills"]
    if "availability" in updates:
        volunteer.availability = updates["availability"]
    if "latitude" in updates:
        volunteer.latitude = updates["latitude"]
    if "longitude" in updates:
        volunteer.longitude = updates["longitude"]
    
    db.commit()
    db.refresh(volunteer)
    
    return {
        "status": "success",
        "volunteer": {
            "id": volunteer.id,
            "name": volunteer.name,
            "phone": volunteer.phone,
            "skills": volunteer.skills,
            "availability": volunteer.availability,
            "reliability_score": volunteer.reliability_score,
            "location": {
                "latitude": volunteer.latitude,
                "longitude": volunteer.longitude
            }
        }
    }


@router.get("/status")
async def get_resource_status(
    token: str = Header(...),
    db: Session = Depends(get_db)
):
    """Get system resource status"""
    require_role(token, ["authority"])
    
    # Count volunteers
    from sqlalchemy import func
    total_volunteers = db.query(func.count(models.User.id)).filter(
        models.User.role == "volunteer"
    ).scalar()
    
    available_volunteers = db.query(func.count(models.User.id)).filter(
        models.User.role == "volunteer",
        models.User.availability == True
    ).scalar()
    
    # Count active tasks
    active_tasks = db.query(func.count(models.Task.id)).filter(
        models.Task.status.in_(["pending", "assigned", "in_progress"])
    ).scalar()
    
    return {
        "status": "success",
        "volunteers": {
            "total": total_volunteers,
            "available": available_volunteers,
            "utilization": round((1 - available_volunteers/total_volunteers) * 100, 2) if total_volunteers else 0
        },
        "tasks": {
            "active": active_tasks
        }
    }


@router.put("/task/{task_id}/status")
async def update_task_status(
    task_id: int,
    status: str,
    actual_duration: Optional[int] = None,
    token: str = Header(...),
    db: Session = Depends(get_db)
):
    """Update task status (volunteer completes task)"""
    require_role(token, ["volunteer", "authority"])
    
    task = crud.update_task_status(db, task_id, status, actual_duration)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If task completed successfully, reward volunteer
    if status == "completed" and task.volunteer_id:
        volunteer = crud.get_user_by_id(db, task.volunteer_id)
        if volunteer:
            new_reliability = min(1.0, volunteer.reliability_score + 0.05)
            crud.update_volunteer_reliability(db, volunteer.id, new_reliability)
            
            # Record success metric
            crud.record_metric(
                db,
                entity_type="volunteer",
                entity_id=volunteer.id,
                metric_type="task_success",
                metric_value=1.0,
                task_id=task_id,
                metadata={"duration": actual_duration}
            )
    
    return {
        "status": "success",
        "task": {
            "id": task.id,
            "status": task.status,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None
        }
    }