"""
Database Models for CrisisNet
"""

from datetime import datetime
from typing import Optional
import uuid

# In-memory database storage
USERS_DB = []
CRISES_DB = []

class User:
    def __init__(self, name: str, phone: str, role: str, 
                 latitude: float, longitude: float):
        self.user_id = str(uuid.uuid4())[:8]
        self.name = name
        self.phone = phone
        self.role = role  # 'citizen', 'volunteer', or 'authority'
        self.latitude = latitude
        self.longitude = longitude
        self.is_active = True
        self.created_at = datetime.now()
        self.last_updated = datetime.now()
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "phone": self.phone,
            "role": self.role,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat()
        }

class Crisis:
    def __init__(self, crisis_type: str, severity: str, 
                 latitude: float, longitude: float, radius_km: float):
        self.crisis_id = str(uuid.uuid4())[:8]
        self.crisis_type = crisis_type
        self.severity = severity
        self.latitude = latitude
        self.longitude = longitude
        self.radius_km = radius_km
        self.location_name = f"Location: {latitude}, {longitude}"
        self.detected_at = datetime.now()
        self.status = "active"  # active, resolved, false_alarm
    
    def to_dict(self):
        return {
            "crisis_id": self.crisis_id,
            "crisis_type": self.crisis_type,
            "severity": self.severity,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "location_name": self.location_name,
            "detected_at": self.detected_at.isoformat(),
            "status": self.status
        }


# Helper functions for database operations
def add_user(user: User):
    """Add user to database"""
    USERS_DB.append(user.to_dict())
    return user.to_dict()

def get_all_users():
    """Get all users"""
    return USERS_DB

def get_users_by_role(role: str):
    """Get users by role"""
    return [u for u in USERS_DB if u['role'] == role]

def add_crisis(crisis: Crisis):
    """Add crisis to database"""
    CRISES_DB.append(crisis.to_dict())
    return crisis.to_dict()

def get_all_crises():
    """Get all crises"""
    return CRISES_DB

def get_active_crises():
    """Get active crises (last 24 hours)"""
    from datetime import datetime, timedelta
    cutoff = datetime.now() - timedelta(hours=24)
    
    active = []
    for crisis in CRISES_DB:
        detected_at = datetime.fromisoformat(crisis['detected_at'].replace('Z', '+00:00'))
        if detected_at > cutoff and crisis['status'] == 'active':
            active.append(crisis)
    
    return active