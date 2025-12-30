"""
Crisis Detection and Alert API
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from data.models import Crisis, add_crisis, get_all_crises, get_active_crises, get_all_users
#from services.location_service import location_service
#from agents.communication_agent import communication_agent
#from services.whatsapp_service import whatsapp_service

router = APIRouter(prefix="/crisis", tags=["crisis"])

class CrisisCreate(BaseModel):
    crisis_type: str  # earthquake, flood, fire, etc.
    severity: str    # low, medium, high, critical
    latitude: float
    longitude: float
    radius_km: float = 5.0
    location_name: Optional[str] = None

class CrisisResponse(BaseModel):
    crisis_id: str
    crisis_type: str
    severity: str
    latitude: float
    longitude: float
    radius_km: float
    location_name: str
    detected_at: str
    status: str

@router.post("/detect", response_model=CrisisResponse)
def detect_crisis(crisis_data: CrisisCreate, background_tasks: BackgroundTasks):
    """Detect a new crisis and trigger alerts"""
    
    # Validate crisis type
    valid_types = ['earthquake', 'flood', 'fire', 'tsunami', 'cyclone', 
                   'medical', 'terrorist', 'industrial', 'other']
    if crisis_data.crisis_type not in valid_types:
        raise HTTPException(400, f"Crisis type must be one of: {', '.join(valid_types)}")
    
    # Validate severity
    valid_severities = ['low', 'medium', 'high', 'critical']
    if crisis_data.severity not in valid_severities:
        raise HTTPException(400, f"Severity must be one of: {', '.join(valid_severities)}")
    
    # Create crisis
    crisis = Crisis(
        crisis_type=crisis_data.crisis_type,
        severity=crisis_data.severity,
        latitude=crisis_data.latitude,
        longitude=crisis_data.longitude,
        radius_km=crisis_data.radius_km
    )
    
    # Set location name if provided
    if crisis_data.location_name:
        crisis.location_name = crisis_data.location_name
    
    # Add to database
    crisis_dict = add_crisis(crisis)
    
    # Trigger alerts in background
    background_tasks.add_task(process_and_send_alerts, crisis_dict)
    
    return crisis_dict

@router.get("/", response_model=List[CrisisResponse])
def list_crises(active_only: bool = False):
    """List all crises or active crises only"""
    if active_only:
        return get_active_crises()
    return get_all_crises()

@router.get("/stats")
def crisis_statistics():
    """Get crisis statistics"""
    all_crises = get_all_crises()
    active = get_active_crises()
    
    # Count by type
    by_type = {}
    for crisis in all_crises:
        ctype = crisis['crisis_type']
        by_type[ctype] = by_type.get(ctype, 0) + 1
    
    # Count by severity
    by_severity = {}
    for crisis in all_crises:
        severity = crisis['severity']
        by_severity[severity] = by_severity.get(severity, 0) + 1
    
    return {
        "total_crises": len(all_crises),
        "active_crises": len(active),
        "by_type": by_type,
        "by_severity": by_severity,
        "last_24_hours": len([c for c in all_crises 
                              if datetime.fromisoformat(c['detected_at'].replace('Z', '+00:00')) 
                              > datetime.now().replace(hour=0, minute=0, second=0)])
    }

@router.post("/demo-alert")
def trigger_demo_alert(background_tasks: BackgroundTasks):
    """Trigger a demo crisis alert"""
    
    # Demo crisis in Delhi
    demo_crisis = {
        "crisis_type": "earthquake",
        "severity": "high",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "radius_km": 3.0,
        "location_name": "Demo Zone - Hackathon"
    }
    
    # Process as normal crisis
    crisis_create = CrisisCreate(**demo_crisis)
    crisis_response = detect_crisis(crisis_create, background_tasks)
    
    return {
        "message": "Demo crisis alert triggered",
        "crisis": crisis_response,
        "note": "WhatsApp alerts being sent to registered users"
    }

def process_and_send_alerts(crisis_data: dict):
    """Background task to process and send alerts"""
    
    print(f"\n🚨 PROCESSING ALERTS FOR CRISIS: {crisis_data['crisis_id']}")
    print("=" * 60)
    
    # Step 1: Get all users from database
    all_users = get_all_users()
    
    # Step 2: Find affected citizens
    affected_citizens = location_service.find_users_in_radius(
        crisis_data['latitude'], 
        crisis_data['longitude'],
        crisis_data['radius_km'],
        [u for u in all_users if u['role'] == 'citizen']
    )
    
    # Step 3: Find nearby volunteers
    nearby_volunteers = location_service.find_nearby_volunteers(
        crisis_data['latitude'],
        crisis_data['longitude'],
        [u for u in all_users if u['role'] == 'volunteer'],
        max_distance=10.0  # Within 10km
    )[:5]  # Top 5 closest volunteers
    
    # Step 4: Get all authorities
    authorities = [u for u in all_users if u['role'] == 'authority']
    
    # Step 5: Prepare data for communication agent
    agent_input = {
        "crisis_id": crisis_data['crisis_id'],
        "crisis_type": crisis_data['crisis_type'],
        "severity": crisis_data['severity'],
        "location": crisis_data['location_name'],
        "latitude": crisis_data['latitude'],
        "longitude": crisis_data['longitude'],
        "radius_km": crisis_data['radius_km'],
        "timestamp": crisis_data['detected_at'],
        "affected_users": affected_citizens,
        "available_volunteers": nearby_volunteers
    }
    
    # Step 6: Process through communication agent
    agent_result = communication_agent.process_crisis(agent_input)
    
    print(f"👥 Affected Citizens: {len(affected_citizens)}")
    print(f"🦺 Assigned Volunteers: {len(nearby_volunteers)}")
    print(f"👮 Notified Authorities: {len(authorities)}")
    print(f"📝 Templates Created: {len(agent_result['delivery_payload']['templates'])}")
    
    # Step 7: Send WhatsApp alerts
    send_whatsapp_alerts(agent_result['delivery_payload'])
    
    print("=" * 60)
    print("✅ ALERT PROCESSING COMPLETE")

def send_whatsapp_alerts(delivery_payload: dict):
    """Send alerts via WhatsApp"""
    
    templates = delivery_payload['templates']
    recipients = delivery_payload['recipients']
    
    # Send to citizens
    if recipients['citizens']:
        print(f"\n📱 Sending to {len(recipients['citizens'])} citizens...")
        whatsapp_service.send_bulk(recipients['citizens'], templates['citizen'])
    
    # Send to volunteers
    if recipients['volunteers']:
        print(f"\n🦺 Sending to {len(recipients['volunteers'])} volunteers...")
        whatsapp_service.send_bulk(recipients['volunteers'], templates['volunteer'])
    
    # Send to authorities
    if recipients['authorities']:
        print(f"\n👮 Sending to {len(recipients['authorities'])} authorities...")
        whatsapp_service.send_bulk(recipients['authorities'], templates['authority'])