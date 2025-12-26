"""
User Registration API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database.models import User, add_user, get_all_users, get_users_by_role

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    name: str
    phone: str
    role: str  # citizen, volunteer, authority
    latitude: float
    longitude: float

class UserResponse(BaseModel):
    user_id: str
    name: str
    phone: str
    role: str
    latitude: float
    longitude: float
    is_active: bool
    created_at: str

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate):
    """Register a new user"""
    
    # Validate role
    valid_roles = ['citizen', 'volunteer', 'authority']
    if user_data.role not in valid_roles:
        raise HTTPException(400, f"Role must be one of: {', '.join(valid_roles)}")
    
    # Validate phone format (simple check)
    phone = user_data.phone.strip()
    if not phone.startswith('+'):
        phone = '+' + phone
    
    # Create user object
    user = User(
        name=user_data.name,
        phone=phone,
        role=user_data.role,
        latitude=user_data.latitude,
        longitude=user_data.longitude
    )
    
    # Add to database
    user_dict = add_user(user)
    
    return user_dict

@router.get("/", response_model=List[UserResponse])
def list_users(role: Optional[str] = None):
    """List all users, optionally filtered by role"""
    if role:
        if role not in ['citizen', 'volunteer', 'authority']:
            raise HTTPException(400, "Invalid role")
        return get_users_by_role(role)
    return get_all_users()

@router.get("/stats")
def user_statistics():
    """Get user statistics"""
    users = get_all_users()
    
    stats = {
        "total_users": len(users),
        "citizens": sum(1 for u in users if u['role'] == 'citizen'),
        "volunteers": sum(1 for u in users if u['role'] == 'volunteer'),
        "authorities": sum(1 for u in users if u['role'] == 'authority'),
        "active_users": sum(1 for u in users if u['is_active']),
        "inactive_users": sum(1 for u in users if not u['is_active'])
    }
    
    return stats

@router.post("/demo-setup")
def setup_demo_users():
    """Setup demo users for testing"""
    from database.models import USERS_DB
    
    # Clear existing users
    USERS_DB.clear()
    
    # Demo Delhi coordinates
    base_lat = 28.6139
    base_lon = 77.2090
    
    demo_users = [
        {
            "name": "Demo Citizen",
            "phone": "+917500900626",
            "role": "citizen",
            "latitude": base_lat,
            "longitude": base_lon
        },
        {
            "name": "Demo Volunteer",
            "phone": "+917500900626",
            "role": "volunteer",
            "latitude": base_lat + 0.001,
            "longitude": base_lon + 0.001
        },
        {
            "name": "Demo Authority",
            "phone": "+917500900626",
            "role": "authority",
            "latitude": base_lat + 0.002,
            "longitude": base_lon + 0.002
        }
    ]
    
    created_users = []
    for user_data in demo_users:
        user = User(**user_data)
        created_users.append(add_user(user))
    
    return {
        "message": "Demo users created",
        "users_created": len(created_users),
        "users": created_users
    }