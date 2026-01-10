from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agents.trust_agent import TrustAgent

router = APIRouter(prefix="/api/trust", tags=["Trust Agent"])


trust_agent = TrustAgent(use_database=True)

# ========== REQUEST MODELS ==========

class AlertRequest(BaseModel):
    """Request model for alert verification"""
    user_id: str = Field(..., description="User identifier")
    crisis_type: str = Field(..., description="Type of crisis (earthquake, flood, fire, etc.)")
    location: str = Field(..., description="Location description")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    message: str = Field(..., description="Alert message/description")
    severity: Optional[str] = Field("medium", description="Severity: low, medium, high, critical")
    has_image: bool = Field(False, description="Whether alert includes image evidence")
    alert_id: Optional[int] = Field(None, description="Alert ID (optional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "crisis_type": "earthquake",
                "location": "Downtown Delhi",
                "lat": 28.6139,
                "lon": 77.2090,
                "message": "Strong tremors felt, building shaking severely",
                "severity": "high",
                "has_image": True,
                "alert_id": 101
            }
        }

class FeedbackRequest(BaseModel):
    """Request model for user feedback"""
    user_id: str = Field(..., description="User identifier")
    was_accurate: bool = Field(..., description="Whether the report was accurate")
    alert_id: Optional[int] = Field(None, description="Alert ID being reviewed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "was_accurate": True,
                "alert_id": 101
            }
        }

class SourceTrackingRequest(BaseModel):
    """Request model for tracking external sources"""
    source_type: str = Field(..., description="Type: twitter, news, api, official")
    source_id: str = Field(..., description="Unique source identifier")
    source_name: Optional[str] = Field(None, description="Human-readable name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "source_type": "twitter",
                "source_id": "@emergency_alerts",
                "source_name": "Emergency Department Official"
            }
        }

class SourceFeedbackRequest(BaseModel):
    """Request model for source feedback"""
    source_type: str
    source_id: str
    was_accurate: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "source_type": "news",
                "source_id": "cnn_breaking",
                "was_accurate": True
            }
        }

# ========== CORE ENDPOINTS ==========

@router.post("/verify", response_model=Dict)
async def verify_alert(alert: AlertRequest):
    """
    **Verify a crisis alert using Trust Agent**
    
    ### Process:
    1. Rate limit check
    2. Duplicate detection
    3. User reputation lookup (with historical data)
    4. Cross-verification with existing reports
    5. Dynamic threshold selection based on crisis type
    6. Trust score calculation
    7. Decision logging for audit trail
    8. Resource allocation (if verified)
    
    ### Returns:
    - **trust_score**: Final trust score (0.0 - 1.0)
    - **decision**: VERIFIED, REVIEW, UNCERTAIN, or REJECTED
    - **reputation**: User's current reputation
    - **cross_verification**: Details of cross-verification
    - **components**: Score breakdown
    - **explanation**: Human-readable explanation
    - **historical_performance**: User's historical data (if available)
    """
    try:
        alert_data = alert.dict()
        result = trust_agent.verify_alert(alert_data)
        
        return {
            "success": True,
            "data": result,
            "message": f"Alert {result['decision']}: {result['status']}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )

@router.post("/feedback", response_model=Dict)
async def submit_feedback(feedback: FeedbackRequest):
    """
    **Submit feedback on alert accuracy**
    
    Updates user reputation based on accuracy. This is used for continuous
    learning and improving trust scores.
    
    ### Returns:
    - Old and new reputation scores
    - Change amount
    """
    try:
        result = trust_agent.update_user_feedback(
            user_id=feedback.user_id,
            was_accurate=feedback.was_accurate,
            alert_id=feedback.alert_id
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

# ========== USER ENDPOINTS ==========

@router.get("/user/{user_id}", response_model=Dict)
async def get_user_profile(user_id: str):
    """
    **Get user trust profile **
    
    ### Returns:
    - Reputation score
    - Total reports (accurate vs false)
    - Accuracy rate
    - Recent history
    - Current status
    """
    try:
        profile = trust_agent.get_user_profile(user_id)
        
        if profile is None or profile.get('status') == 'not_found':
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

@router.get("/user/{user_id}/history", response_model=Dict)
async def get_user_history(
    user_id: str,
    limit: int = Query(10, ge=1, le=100, description="Number of records to return")
):
    """
    **Get user's reputation history**
    
    Returns recent reputation changes for the user.
    """
    try:
        history = trust_agent.reputation_manager.get_user_history(user_id, limit)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "history": history,
                "count": len(history)
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user history: {str(e)}"
        )

# ========== SOURCE REPUTATION ENDPOINTS ==========

@router.post("/sources/track", response_model=Dict)
async def track_external_source(source: SourceTrackingRequest):
    """
    **Track external source (news, social media, API)**
    
    Initialize tracking for an external information source.
    
    ### Examples:
    - Twitter accounts: `@emergency_dept`
    - News outlets: `cnn_breaking`
    - APIs: `weather_api`
    - Official channels: `govt_alerts`
    """
    try:
        trust_agent.reputation_manager.track_external_source(
            source_type=source.source_type,
            source_id=source.source_id,
            source_name=source.source_name
        )
        
        return {
            "success": True,
            "message": f"Source {source.source_id} is now being tracked",
            "data": {
                "source_type": source.source_type,
                "source_id": source.source_id,
                "source_name": source.source_name
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to track source: {str(e)}"
        )

@router.post("/sources/feedback", response_model=Dict)
async def submit_source_feedback(feedback: SourceFeedbackRequest):
    """
    **Submit feedback for external source**
    
    Update source reliability based on accuracy.
    """
    try:
        trust_agent.reputation_manager.update_source_reputation(
            source_type=feedback.source_type,
            source_id=feedback.source_id,
            was_accurate=feedback.was_accurate
        )
        
        # Get updated stats
        stats = trust_agent.reputation_manager.get_source_stats(
            feedback.source_type,
            feedback.source_id
        )
        
        return {
            "success": True,
            "message": "Source reputation updated",
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update source feedback: {str(e)}"
        )

@router.get("/sources/{source_type}/{source_id}", response_model=Dict)
async def get_source_stats(source_type: str, source_id: str):
    """
    **Get source reliability statistics**
    """
    try:
        stats = trust_agent.reputation_manager.get_source_stats(source_type, source_id)
        
        if stats is None:
            return {
                "success": False,
                "message": f"Source {source_type}:{source_id} not found",
                "data": None
            }
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch source stats: {str(e)}"
        )

# ========== CRISIS INFO ENDPOINTS ==========

@router.get("/crisis-info/{crisis_type}", response_model=Dict)
async def get_crisis_info(crisis_type: str):
    """
    **Get crisis severity and threshold information**
    
    Shows how different crisis types are handled with dynamic thresholds.
    
    ### Examples:
    - `earthquake` → CRITICAL (lower thresholds)
    - `flood` → HIGH
    - `storm` → MEDIUM
    - `traffic` → LOW (higher thresholds)
    """
    try:
        info = trust_agent.get_crisis_info(crisis_type)
        
        return {
            "success": True,
            "data": info
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch crisis info: {str(e)}"
        )

# ========== SYSTEM ENDPOINTS ==========

@router.get("/status", response_model=Dict)
async def get_system_status():
    """
    **Get Trust Agent system status**
    
    ### Returns:
    - Agent operational status
    - Database mode (SQLite)
    - Component status
    - Configuration settings
    - System statistics
    - Scoring configuration
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

@router.get("/statistics", response_model=Dict)
async def get_statistics():
    """
    **Get trust system statistics**
    
    ### Returns:
    - Total users tracked
    - Total alerts processed
    - Verified alerts count
    - Tracked external sources
    - Agent performance metrics
    """
    try:
        stats = trust_agent.db.get_statistics()
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch statistics: {str(e)}"
        )

@router.get("/performance", response_model=Dict)
async def get_agent_performance(
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze")
):
    """
    **Get Trust Agent's own performance metrics**
    
    Shows how well the Trust Agent itself is performing.
    """
    try:
        performance = trust_agent.get_agent_performance(days)
        
        return {
            "success": True,
            "data": performance
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch agent performance: {str(e)}"
        )

@router.get("/health", response_model=Dict)
async def health_check():
    """
    **Health check endpoint**
    
    Quick check if Trust Agent is operational.
    """
    try:
        status = trust_agent.get_system_status()
        
        return {
            "status": "healthy",
            "trust_agent": status.get('trust_agent', 'unknown'),
            "mode": status.get('mode', 'unknown'),
            "database": status.get('database_type', 'unknown'),
            "timestamp": status.get('timestamp', None)
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# ========== ROUND 2 NEW: RATE LIMITER ENDPOINTS ==========

@router.get("/rate-limit/{user_id}", response_model=Dict)
async def get_rate_limit_status(user_id: str):
    """
    **Get user's rate limit status**
    
    Shows current usage and remaining quota.
    """
    try:
        stats = trust_agent.rate_limiter.get_user_usage_stats(user_id)
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch rate limit status: {str(e)}"
        )

# ========== ADMIN ENDPOINTS (Optional) ==========

@router.get("/thresholds", response_model=Dict)
async def get_thresholds(crisis_type: Optional[str] = None):
    """
    **Get current trust thresholds**
    
    Optionally filter by crisis type to see dynamic thresholds.
    """
    try:
        thresholds = trust_agent.scorer.get_thresholds(crisis_type)
        
        return {
            "success": True,
            "data": {
                "crisis_type": crisis_type,
                "thresholds": thresholds
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch thresholds: {str(e)}"
        )

@router.get("/config", response_model=Dict)
async def get_configuration():
    """
    **Get complete Trust Agent configuration**
    
    Returns all configuration settings.
    """
    try:
        config = trust_agent.scorer.get_scoring_summary()
        
        return {
            "success": True,
            "data": config
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch configuration: {str(e)}"
        )