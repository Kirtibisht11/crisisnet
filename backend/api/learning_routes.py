from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.learning import LearningAgent

router = APIRouter(prefix="/api/learning", tags=["Learning Agent"])

# Initialize Learning Agent
learning_agent = LearningAgent()

# ========== REQUEST MODELS ==========

class TaskStartRequest(BaseModel):
    """Request model for starting a task"""
    task_id: str = Field(..., description="Task identifier")
    volunteer_id: str = Field(..., description="Volunteer assigned")
    task_type: Optional[str] = Field(None, description="Type of task (rescue, medical, etc.)")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "task_001",
                "volunteer_id": "vol_123",
                "task_type": "rescue"
            }
        }

class TaskCompleteRequest(BaseModel):
    """Request model for completing a task"""
    task_id: str
    volunteer_id: str
    success: bool = Field(..., description="Whether task was successful")
    task_type: Optional[str] = None
    completion_time: Optional[float] = Field(None, description="Time taken in seconds")
    notes: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "task_001",
                "volunteer_id": "vol_123",
                "success": True,
                "task_type": "rescue",
                "completion_time": 450.5,
                "notes": "Successfully rescued 3 people"
            }
        }

class ResponseTimeRequest(BaseModel):
    """Request model for recording response time"""
    volunteer_id: str
    task_id: str
    response_time_seconds: float = Field(..., description="Response time in seconds")
    task_type: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "volunteer_id": "vol_123",
                "task_id": "task_001",
                "response_time_seconds": 120.5,
                "task_type": "rescue"
            }
        }

class CrisisOutcomeRequest(BaseModel):
    """Request model for recording crisis outcome"""
    crisis_id: str
    crisis_type: str = Field(..., description="Type of crisis")
    outcome: str = Field(..., description="Outcome: resolved, partial, or failed")
    resources_used: List[str] = Field(..., description="List of volunteer/resource IDs")
    response_time: float = Field(..., description="Total response time in seconds")
    effectiveness_score: float = Field(..., ge=0.0, le=1.0, description="Effectiveness (0-1)")
    notes: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "crisis_id": "crisis_001",
                "crisis_type": "earthquake",
                "outcome": "resolved",
                "resources_used": ["vol_123", "vol_456"],
                "response_time": 1200.0,
                "effectiveness_score": 0.85,
                "notes": "All victims rescued successfully"
            }
        }

# ========== TASK TRACKING ENDPOINTS ==========

@router.post("/tasks/start", response_model=Dict)
async def start_task(request: TaskStartRequest):
    """
    **Start tracking a task**
    
    Records the start of a task assignment to track completion time and performance.
    
    ### Returns:
    - Task tracking information
    """
    try:
        result = learning_agent.start_task(
            task_id=request.task_id,
            volunteer_id=request.volunteer_id,
            task_type=request.task_type
        )
        
        return {
            "success": True,
            "data": result,
            "message": f"Task {request.task_id} started"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start task: {str(e)}"
        )

@router.post("/tasks/complete", response_model=Dict)
async def complete_task(request: TaskCompleteRequest):
    """
    **Complete a task and record metrics**
    
    Records task completion and updates volunteer performance metrics.
    
    ### Returns:
    - Completion summary with volunteer reliability update
    """
    try:
        # Create task info structure
        task_info = {
            'task_id': request.task_id,
            'volunteer_id': request.volunteer_id,
            'task_type': request.task_type,
            'start_time': 0  # Will be ignored if completion_time provided
        }
        
        # If completion time not provided, use current time
        if request.completion_time is None:
            import time
            task_info['start_time'] = time.time() - 300  # Default 5 min
        
        result = learning_agent.complete_task(
            task_info=task_info,
            success=request.success,
            notes=request.notes
        )
        
        return {
            "success": True,
            "data": result,
            "message": f"Task completed: {'Success' if request.success else 'Failed'}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete task: {str(e)}"
        )

@router.post("/tasks/record-result", response_model=Dict)
async def record_task_result(request: TaskCompleteRequest):
    """
    **Record task result directly (without start/complete workflow)**
    
    Use this when you just want to record a task result without tracking start time.
    """
    try:
        learning_agent.metrics.record_task_result(
            task_id=request.task_id,
            volunteer_id=request.volunteer_id,
            success=request.success,
            task_type=request.task_type,
            completion_time=request.completion_time,
            notes=request.notes
        )
        
        # Get updated volunteer reliability
        reliability = learning_agent.get_volunteer_profile(request.volunteer_id)
        
        return {
            "success": True,
            "data": {
                "task_id": request.task_id,
                "volunteer_reliability": reliability
            },
            "message": "Task result recorded"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record task result: {str(e)}"
        )

@router.post("/response-time", response_model=Dict)
async def record_response_time(request: ResponseTimeRequest):
    """
    **Record volunteer response time**
    
    Tracks how quickly volunteers respond to task assignments.
    """
    try:
        learning_agent.record_response(
            volunteer_id=request.volunteer_id,
            task_id=request.task_id,
            response_time_seconds=request.response_time_seconds,
            task_type=request.task_type
        )
        
        # Get average response time
        avg_time = learning_agent.metrics.get_avg_response_time(request.volunteer_id)
        
        return {
            "success": True,
            "data": {
                "volunteer_id": request.volunteer_id,
                "response_time": request.response_time_seconds,
                "avg_response_time": avg_time
            },
            "message": "Response time recorded"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record response time: {str(e)}"
        )

# ========== CRISIS OUTCOME ENDPOINTS ==========

@router.post("/crisis-outcome", response_model=Dict)
async def record_crisis_outcome(request: CrisisOutcomeRequest):
    """
    **Record crisis outcome for learning**
    
    Records the complete outcome of a crisis response including effectiveness
    and resources used.
    
    ### Returns:
    - Outcome summary with immediate learning insights
    """
    try:
        result = learning_agent.record_crisis_outcome(
            crisis_id=request.crisis_id,
            crisis_type=request.crisis_type,
            outcome=request.outcome,
            resources_used=request.resources_used,
            response_time=request.response_time,
            effectiveness_score=request.effectiveness_score,
            notes=request.notes
        )
        
        return {
            "success": True,
            "data": result,
            "message": f"Crisis outcome recorded: {request.outcome}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record crisis outcome: {str(e)}"
        )

@router.get("/crisis-statistics", response_model=Dict)
async def get_crisis_statistics(
    crisis_type: Optional[str] = Query(None, description="Filter by crisis type"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Filter by days")
):
    """
    **Get crisis outcome statistics**
    
    ### Query Parameters:
    - `crisis_type`: Filter by specific crisis type (optional)
    - `days`: Only include crises from last N days (optional)
    
    ### Returns:
    - Total crises
    - Resolution rates
    - Average response times
    - Average effectiveness
    """
    try:
        stats = learning_agent.metrics.get_crisis_statistics(
            crisis_type=crisis_type,
            days=days
        )
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get crisis statistics: {str(e)}"
        )

# ========== VOLUNTEER PERFORMANCE ENDPOINTS ==========

@router.get("/volunteers/{volunteer_id}", response_model=Dict)
async def get_volunteer_profile(volunteer_id: str):
    """
    **Get comprehensive volunteer profile**
    
    Returns complete performance data and recommendations for a volunteer.
    """
    try:
        profile = learning_agent.get_volunteer_profile(volunteer_id)
        
        return {
            "success": True,
            "data": profile
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get volunteer profile: {str(e)}"
        )

@router.get("/volunteers", response_model=Dict)
async def get_top_volunteers(
    limit: int = Query(10, ge=1, le=100, description="Number of volunteers to return")
):
    """
    **Get top performing volunteers**
    
    Returns list of volunteers sorted by reliability score.
    """
    try:
        top_vols = learning_agent.get_top_volunteers(limit=limit)
        
        return {
            "success": True,
            "data": {
                "volunteers": top_vols,
                "count": len(top_vols)
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get top volunteers: {str(e)}"
        )

@router.get("/volunteers/training-needs", response_model=Dict)
async def get_training_needs():
    """
    **Identify volunteers needing training**
    
    Returns volunteers with low performance and training recommendations.
    """
    try:
        training = learning_agent.identify_training_needs()
        
        return {
            "success": True,
            "data": training
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to identify training needs: {str(e)}"
        )

# ========== FEEDBACK GENERATION ENDPOINTS ==========

@router.get("/feedback/trust-agent", response_model=Dict)
async def get_trust_agent_feedback(
    crisis_type: Optional[str] = Query(None, description="Filter by crisis type")
):
    """
    **Generate feedback for Trust Agent**
    
    Provides weight and threshold adjustment recommendations based on outcomes.
    
    ### Returns:
    - Weight adjustment recommendations
    - Threshold adjustment recommendations
    - Reasoning for each adjustment
    """
    try:
        feedback = learning_agent.generate_trust_agent_feedback(
            crisis_type=crisis_type
        )
        
        return {
            "success": True,
            "data": feedback
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate trust agent feedback: {str(e)}"
        )

@router.get("/feedback/resource-agent", response_model=Dict)
async def get_resource_agent_feedback(
    crisis_type: Optional[str] = Query(None, description="Filter by crisis type")
):
    """
    **Generate feedback for Resource Agent**
    
    Provides resource allocation optimization recommendations.
    
    ### Returns:
    - Performance tier breakdown
    - Allocation strategy recommendations
    - Volunteer utilization optimization
    """
    try:
        feedback = learning_agent.generate_resource_agent_feedback(
            crisis_type=crisis_type
        )
        
        return {
            "success": True,
            "data": feedback
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resource agent feedback: {str(e)}"
        )

# ========== REPORTING ENDPOINTS ==========

@router.get("/report", response_model=Dict)
async def get_learning_report(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    **Generate comprehensive learning report**
    
    Provides complete analysis of system performance and learning insights.
    
    ### Returns:
    - Overall statistics
    - Key insights
    - Recommendations for all agents
    - Session information
    """
    try:
        report = learning_agent.generate_learning_report(days=days)
        
        return {
            "success": True,
            "data": report
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate learning report: {str(e)}"
        )

@router.get("/performance", response_model=Dict)
async def get_system_performance():
    """
    **Get system performance metrics**
    
    Returns overall system performance with health status and grade.
    """
    try:
        performance = learning_agent.get_system_performance()
        
        return {
            "success": True,
            "data": performance
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system performance: {str(e)}"
        )

@router.get("/statistics", response_model=Dict)
async def get_overall_statistics():
    """
    **Get overall learning statistics**
    
    Returns complete statistics including volunteers, tasks, and crises.
    """
    try:
        stats = learning_agent.metrics.get_overall_statistics()
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )

# ========== SYSTEM STATUS ENDPOINTS ==========

@router.get("/status", response_model=Dict)
async def get_agent_status():
    """
    **Get Learning Agent status**
    
    Returns agent operational status and capabilities.
    """
    try:
        status = learning_agent.get_status()
        
        return {
            "success": True,
            "data": status
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get agent status: {str(e)}"
        )

@router.get("/health", response_model=Dict)
async def health_check():
    """
    **Health check endpoint**
    
    Quick check if Learning Agent is operational.
    """
    try:
        status = learning_agent.get_status()
        
        return {
            "status": "healthy",
            "agent": status['agent'],
            "operational": status['status'] == 'operational',
            "metrics_available": status['metrics_available'],
            "feedback_loop_active": status['feedback_loop_active']
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# ========== ADMIN ENDPOINTS ==========

@router.post("/reset-session", response_model=Dict)
async def reset_session():
    """
    **Reset learning session**
    
    Resets session counters (does not delete stored data).
    """
    try:
        learning_agent.reset_session()
        
        return {
            "success": True,
            "message": "Learning Agent session reset"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset session: {str(e)}"
        )

@router.get("/metrics/success-rate", response_model=Dict)
async def get_success_rate(
    volunteer_id: Optional[str] = Query(None, description="Filter by volunteer"),
    task_type: Optional[str] = Query(None, description="Filter by task type"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Filter by days")
):
    """
    **Get success rate metrics**
    
    Returns success rate filtered by various criteria.
    """
    try:
        success_rate = learning_agent.metrics.get_success_rate(
            volunteer_id=volunteer_id,
            task_type=task_type,
            days=days
        )
        
        return {
            "success": True,
            "data": {
                "success_rate": success_rate,
                "success_rate_percent": success_rate * 100,
                "filters": {
                    "volunteer_id": volunteer_id,
                    "task_type": task_type,
                    "days": days
                }
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get success rate: {str(e)}"
        )

@router.get("/metrics/response-time", response_model=Dict)
async def get_response_time(
    volunteer_id: Optional[str] = Query(None, description="Filter by volunteer"),
    task_type: Optional[str] = Query(None, description="Filter by task type")
):
    """
    **Get average response time**
    
    Returns average response time filtered by criteria.
    """
    try:
        avg_time = learning_agent.metrics.get_avg_response_time(
            volunteer_id=volunteer_id,
            task_type=task_type
        )
        
        return {
            "success": True,
            "data": {
                "avg_response_time_seconds": avg_time,
                "avg_response_time_minutes": avg_time / 60,
                "filters": {
                    "volunteer_id": volunteer_id,
                    "task_type": task_type
                }
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get response time: {str(e)}"
        )