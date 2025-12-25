"""
Communication API Routes
FastAPI endpoints for communication agent
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from backend.agents.communication_agent import communication_agent
from backend.services.notification_service import notification_service

router = APIRouter(prefix="/api/communication", tags=["communication"])


# Request Models
class SendAlertRequest(BaseModel):
    """Request model for sending crisis alert"""
    crisis_id: str
    crisis_type: str
    severity: str
    location: str
    confidence: float = Field(ge=0, le=1)
    verified: bool
    affected_citizens: List[Dict] = []
    assigned_volunteers: List[Dict] = []
    authorities: List[Dict] = []
    nearest_shelter: Optional[str] = None


class SendSMSRequest(BaseModel):
    """Request model for direct SMS"""
    phone: str
    message: str


class SendWhatsAppRequest(BaseModel):
    """Request model for direct WhatsApp"""
    phone: str
    message: str


# Routes
@router.post("/send-alert")
async def send_crisis_alert(request: SendAlertRequest):
    """
    Send crisis alert to all affected parties
    
    This is the main endpoint called by Trust Agent after verification
    """
    try:
        crisis_data = request.dict()
        result = communication_agent.process_crisis_alert(crisis_data)
        
        return {
            "success": True,
            "message": "Crisis alert processed",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process crisis alert: {str(e)}"
        )


@router.post("/send-sms")
async def send_sms(request: SendSMSRequest):
    """
    Send direct SMS (for testing or manual alerts)
    """
    try:
        result = notification_service.send_sms(
            to_number=request.phone,
            message=request.message
        )
        
        if result['success']:
            return {
                "success": True,
                "message": "SMS sent successfully",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Failed to send SMS')
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/send-whatsapp")
async def send_whatsapp(request: SendWhatsAppRequest):
    """
    Send direct WhatsApp message (for testing or manual alerts)
    """
    try:
        result = notification_service.send_whatsapp(
            to_number=request.phone,
            message=request.message
        )
        
        if result['success']:
            return {
                "success": True,
                "message": "WhatsApp sent successfully",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Failed to send WhatsApp')
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status")
async def get_agent_status():
    """
    Get Communication Agent status
    
    Returns agent health, message counts, success rate
    """
    try:
        status = communication_agent.get_agent_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/logs")
async def get_communication_logs(limit: int = 50):
    """
    Get recent communication logs
    
    Args:
        limit: Number of logs to return (default 50)
    """
    try:
        logs = notification_service.get_logs(limit=limit)
        return {
            "success": True,
            "count": len(logs),
            "data": logs
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/message-status/{message_id}")
async def get_message_status(message_id: str):
    """
    Check delivery status of a specific message
    
    Args:
        message_id: Twilio message SID
    """
    try:
        status = notification_service.get_message_status(message_id)
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/retry-failed")
async def retry_failed_messages():
    """
    Retry all failed messages in queue
    """
    try:
        result = communication_agent.retry_failed_messages()
        return {
            "success": True,
            "message": "Retry completed",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Health check
@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "service": "Communication Agent",
        "timestamp": communication_agent.get_agent_status()['last_updated']
    }