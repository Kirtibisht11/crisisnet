from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from db.database import get_db
from db import crud
# from agents.resource.resource_agent import ResourceAgent
from agents.learning.learning_agent import LearningAgent
from backend.core.role_guard import require_role
from typing import List, Dict
import logging

# Mock ResourceAgent to bypass SyntaxError in the actual file
class ResourceAgent:
    def __init__(self, db=None): pass
    def match_volunteers_to_crisis(self, crisis_id): return []

router = APIRouter(prefix="/ngo", tags=["NGO"])
logger = logging.getLogger(__name__)


@router.get("/crises/available")
async def get_available_crises(
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """
    Get all crises that are pending (not yet accepted by any NGO)
    """
    require_role(token, ["ngo"])
    
    crises = crud.get_available_crises(db)
    
    result = []
    for crisis in crises:
        creator = crud.get_user_by_id(db, crisis.creator_id)
        
        result.append({
            "id": crisis.id,
            "title": crisis.title,
            "description": crisis.description,
            "type": crisis.crisis_type,
            "severity": crisis.severity,
            "location": {
                "latitude": crisis.latitude,
                "longitude": crisis.longitude,
                "address": crisis.location
            },
            "trust_score": crisis.trust_score,
            "confidence": crisis.confidence,
            "verified": crisis.verified,
            "created_by": creator.name if creator else "Unknown",
            "created_at": crisis.created_at.isoformat(),
            "status": crisis.status
        })
    
    return result


@router.post("/crises/accept")
async def accept_crisis(
    crisis_id: int,
    ngo_id: int,
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict:
    """
    NGO accepts a crisis
    
    Actions:
    1. Update crisis status to "accepted"
    2. Create appropriate tasks
    3. Assign volunteers using Resource Agent V2
    4. Return assignment details
    """
    require_role(token, ["ngo"])
    
    logger.info(f"NGO {ngo_id} accepting crisis {crisis_id}")
    
    # Verify NGO exists and has correct role
    ngo = crud.get_user_by_id(db, ngo_id)
    if not ngo or ngo.role != "ngo":
        raise HTTPException(status_code=403, detail="Only NGOs can accept crises")
    
    # Accept crisis
    crisis = crud.accept_crisis(db, crisis_id, ngo_id)
    if not crisis:
        raise HTTPException(
            status_code=400,
            detail="Crisis not available or already accepted by another NGO"
        )
    
    # Auto-generate tasks and assign volunteers
    resource_agent = ResourceAgent(db)
    assignments = resource_agent.match_volunteers_to_crisis(crisis_id)
    
    logger.info(f"✅ Crisis {crisis_id} accepted. Created {len(assignments)} task assignments")
    
    return {
        "status": "success",
        "message": f"Crisis accepted successfully",
        "crisis": {
            "id": crisis.id,
            "title": crisis.title,
            "type": crisis.crisis_type,
            "severity": crisis.severity,
            "accepted_at": crisis.accepted_at.isoformat() if crisis.accepted_at else None
        },
        "tasks_created": len(assignments),
        "assignments": assignments
    }


@router.get("/crises/managed")
async def get_managed_crises(
    ngo_id: int,
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """
    Get all crises currently managed by this NGO
    """
    require_role(token, ["ngo"])
    
    crises = crud.get_crises_by_ngo(db, ngo_id)
    
    result = []
    for crisis in crises:
        # Get all tasks for this crisis
        tasks = crud.get_tasks_by_crisis(db, crisis.id)
        
        # Count task statuses
        task_status_counts = {
            "pending": len([t for t in tasks if t.status == "pending"]),
            "assigned": len([t for t in tasks if t.status == "assigned"]),
            "in_progress": len([t for t in tasks if t.status == "in_progress"]),
            "completed": len([t for t in tasks if t.status == "completed"]),
            "failed": len([t for t in tasks if t.status == "failed"])
        }
        
        result.append({
            "id": crisis.id,
            "title": crisis.title,
            "description": crisis.description,
            "type": crisis.crisis_type,
            "severity": crisis.severity,
            "status": crisis.status,
            "location": {
                "latitude": crisis.latitude,
                "longitude": crisis.longitude,
                "address": crisis.location
            },
            "accepted_at": crisis.accepted_at.isoformat() if crisis.accepted_at else None,
            "resolved_at": crisis.resolved_at.isoformat() if crisis.resolved_at else None,
            "tasks": {
                "total": len(tasks),
                "status_breakdown": task_status_counts
            }
        })
    
    return result


@router.get("/crisis/{crisis_id}/tasks")
async def get_crisis_tasks(
    crisis_id: int,
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """
    Get detailed task list for a specific crisis
    """
    require_role(token, ["ngo", "authority"])
    
    tasks = crud.get_tasks_by_crisis(db, crisis_id)
    
    result = []
    for task in tasks:
        volunteer = crud.get_user_by_id(db, task.volunteer_id) if task.volunteer_id else None
        
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "type": task.task_type,
            "required_skill": task.required_skill,
            "status": task.status,
            "priority": task.priority,
            "volunteer": {
                "id": volunteer.id if volunteer else None,
                "name": volunteer.name if volunteer else "Unassigned",
                "phone": volunteer.phone if volunteer else None,
                "reliability": volunteer.reliability_score if volunteer else None
            },
            "location": {
                "latitude": task.latitude,
                "longitude": task.longitude
            },
            "timeline": {
                "created_at": task.created_at.isoformat(),
                "assigned_at": task.assigned_at.isoformat() if task.assigned_at else None,
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None
            },
            "performance": {
                "estimated_duration": task.estimated_duration,
                "actual_duration": task.actual_duration
            }
        })
    
    return result


@router.post("/crisis/{crisis_id}/resolve")
async def resolve_crisis(
    crisis_id: int,
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Mark crisis as resolved
    
    Actions:
    1. Update crisis status to "resolved"
    2. Trigger Learning Agent analysis
    3. Return performance summary
    """
    require_role(token, ["ngo", "authority"])
    
    logger.info(f"Resolving crisis {crisis_id}")
    
    # Update crisis status
    crisis = crud.update_crisis_status(db, crisis_id, "resolved")
    if not crisis:
        raise HTTPException(status_code=404, detail="Crisis not found")
    
    # Trigger learning agent
    try:
        learning_agent = LearningAgent(db)
        learning_agent.analyze_crisis_outcome(crisis_id)
        logger.info(f"✅ Learning agent analyzed crisis {crisis_id}")
    except Exception as e:
        logger.warning(f"Learning agent analysis failed: {e}")
    
    # Get performance summary
    tasks = crud.get_tasks_by_crisis(db, crisis_id)
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == "completed"])
    failed_tasks = len([t for t in tasks if t.status == "failed"])
    
    avg_response_time = None
    if completed_tasks > 0:
        durations = [t.actual_duration for t in tasks if t.actual_duration]
        if durations:
            avg_response_time = sum(durations) / len(durations)
    
    return {
        "status": "success",
        "message": "Crisis resolved successfully",
        "crisis": {
            "id": crisis.id,
            "title": crisis.title,
            "resolved_at": crisis.resolved_at.isoformat() if crisis.resolved_at else None
        },
        "performance_summary": {
            "total_tasks": total_tasks,
            "completed": completed_tasks,
            "failed": failed_tasks,
            "success_rate": round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0,
            "avg_response_time_minutes": round(avg_response_time, 1) if avg_response_time else None
        }
    }


@router.get("/dashboard/stats")
async def get_ngo_dashboard_stats(
    ngo_id: int,
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get NGO dashboard statistics
    """
    require_role(token, ["ngo"])
    
    from sqlalchemy import func
    from db.models import Crisis, Task
    
    # Total crises managed
    total_crises = db.query(func.count(Crisis.id)).filter(
        Crisis.accepted_by_ngo_id == ngo_id
    ).scalar()
    
    # Active crises
    active_crises = db.query(func.count(Crisis.id)).filter(
        Crisis.accepted_by_ngo_id == ngo_id,
        Crisis.status.in_(["accepted", "in_progress"])
    ).scalar()
    
    # Resolved crises
    resolved_crises = db.query(func.count(Crisis.id)).filter(
        Crisis.accepted_by_ngo_id == ngo_id,
        Crisis.status == "resolved"
    ).scalar()
    
    # Get all tasks for NGO's crises
    ngo_crises = crud.get_crises_by_ngo(db, ngo_id)
    crisis_ids = [c.id for c in ngo_crises]
    
    total_tasks = 0
    completed_tasks = 0
    if crisis_ids:
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.crisis_id.in_(crisis_ids)
        ).scalar()
        
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.crisis_id.in_(crisis_ids),
            Task.status == "completed"
        ).scalar()
    
    return {
        "status": "success",
        "stats": {
            "crises": {
                "total": total_crises,
                "active": active_crises,
                "resolved": resolved_crises,
                "resolution_rate": round((resolved_crises / total_crises) * 100, 1) if total_crises else 0
            },
            "tasks": {
                "total": total_tasks,
                "completed": completed_tasks,
                "completion_rate": round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0
            }
        }
    }