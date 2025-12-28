from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ..agents.trust_agent import TrustAgent

router = APIRouter(prefix="/api/trust", tags=["Trust Agent"])

mock_alerts_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'agents',
    'trust',
    'mock_alerts.json'
)
trust_agent = TrustAgent(use_json=True, json_data_path=mock_alerts_path)

class AlertRequest(BaseModel):
    """Request model for alert verification"""
    user_id: str
    crisis_type: str
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    message: str
    has_image: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "test_user_123",
                "crisis_type": "flood",
                "location": "Test Location, Mumbai",
                "lat": 19.0760,
                "lon": 72.8777,
                "message": "Severe flooding reported!",
                "has_image": True
            }
        }

class FeedbackRequest(BaseModel):
    """Request model for user feedback"""
    user_id: str
    was_accurate: bool
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "test_user_123",
                "was_accurate": True
            }
        }

@router.post("/verify")
async def verify_alert(alert: AlertRequest):
    """
    Verify a crisis alert using Trust Agent
    
    **Process:**
    1. Check rate limits
    2. Detect duplicates
    3. Cross-verify with existing reports
    4. Calculate trust score
    5. Make verification decision
    
    **Returns:** Trust score, decision, and detailed breakdown
    """
    try:
        alert_data = alert.dict()
        result = trust_agent.verify_alert(alert_data)
        
        return {
            "success": True,
            "data": result,
            "message": f"Alert {result['decision']}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit feedback on alert accuracy
    
    **Updates:** User reputation based on accuracy
    
    **Returns:** New reputation score
    """
    try:
        result = trust_agent.update_user_feedback(
            user_id=feedback.user_id,
            was_accurate=feedback.was_accurate
        )
        
        return {
            "success": True,
            "message": "Reputation updated successfully",
            "data": result
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Feedback submission failed: {str(e)}"
        )

@router.get("/user/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user trust profile
    
    **Returns:** Reputation score, report history, statistics
    """
    try:
        profile = trust_agent.get_user_profile(user_id)
        
        if profile is None:
            return {
                "success": False,
                "message": f"User '{user_id}' not found",
                "data": None
            }
        
        return {
            "success": True,
            "data": profile
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user profile: {str(e)}"
        )

@router.get("/status")
async def get_system_status():
    """
    Get Trust Agent system status
    
    **Returns:** 
    - Agent operational status
    - Configuration settings
    - System statistics
    """
    try:
        status = trust_agent.get_system_status()
        
        return {
            "success": True,
            "data": status
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch system status: {str(e)}"
        )

@router.get("/statistics")
async def get_statistics():
    """
    Get trust system statistics
    
    **Returns:** Total alerts, users, verification stats
    """
    try:
        stats = trust_agent.db.get_statistics() if hasattr(trust_agent.db, 'get_statistics') else {}
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch statistics: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Check if Trust Agent is operational"""
    try:
        status = trust_agent.get_system_status()
        
        return {
            "status": "healthy",
            "trust_agent": status.get('trust_agent', 'unknown'),
            "mode": status.get('mode', 'unknown')
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }