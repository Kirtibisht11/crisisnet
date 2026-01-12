from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.crud import (
    create_volunteer_profile,
    get_volunteer_by_id,
    update_volunteer_profile,
    attach_volunteer_to_user,
    get_all_volunteers,
    get_user_by_id
)
from typing import Optional, List

router = APIRouter(prefix="/api/volunteer", tags=["volunteer"])


@router.post("/profile")
def create_profile(
    phone: str,
    password: str,
    name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    skills: Optional[List[str]] = None,
    availability: bool = True,
    db: Session = Depends(get_db)
):
    """Create a new volunteer profile"""
    try:
        volunteer = create_volunteer_profile(
            db=db,
            phone=phone,
            password=password,
            name=name,
            latitude=latitude,
            longitude=longitude,
            skills=skills,
            availability=availability
        )
        return {
            "success": True,
            "volunteer_id": volunteer.id,
            "volunteer": {
                "id": volunteer.id,
                "phone": volunteer.phone,
                "name": volunteer.name,
                "latitude": volunteer.latitude,
                "longitude": volunteer.longitude,
                "skills": volunteer.skills,
                "availability": volunteer.availability,
                "reliability_score": volunteer.reliability_score,
                "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from pydantic import BaseModel
from typing import Optional, List

class AttachVolunteerRequest(BaseModel):
    user_id: str
    skills: Optional[List[str]] = None
    availability: Optional[str] = None
    experience: Optional[str] = None
    emergency_contact: Optional[str] = None
    location: Optional[str] = None
@router.post("/attach-to-user")
def attach_to_user(
    req: AttachVolunteerRequest,
    db: Session = Depends(get_db)
):
    """Attach volunteer profile to an existing user"""
    try:
        user = attach_volunteer_to_user(
            db=db,
            user_id=req.user_id,
            skills=req.skills,
            availability=req.availability,
            experience=req.experience,
            emergency_contact=req.emergency_contact,
            location=req.location
        )
        if not user:
            raise HTTPException(status_code=404, detail='User not found')

        return {
            "success": True,
            "user": {
                "id": user.id,
                "phone": user.phone,
                "name": user.name,
                "role": user.role,
                "latitude": user.latitude,
                "longitude": user.longitude,
                "skills": user.skills,
                "availability": user.availability,
                "reliability_score": user.reliability_score
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
def update_volunteer_profile(
    volunteer_id: str,
    name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    skills: Optional[List[str]] = None,
    availability: Optional[str] = None,
    experience: Optional[str] = None,
    emergency_contact: Optional[str] = None,
    location: Optional[str] = None,
    reliability_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Update an existing volunteer profile by ID"""
    try:
        volunteer = update_volunteer_profile(
            db=db,
            volunteer_id=volunteer_id,
            name=name,
            latitude=latitude,
            longitude=longitude,
            skills=skills,
            availability=availability,
            experience=experience,
            emergency_contact=emergency_contact,
            location=location,
            reliability_score=reliability_score
        )
        if not volunteer:
            raise HTTPException(status_code=404, detail='Volunteer not found')

        return {
            "success": True,
            "volunteer": {
                "id": volunteer.id,
                "phone": volunteer.phone,
                "name": volunteer.name,
                "latitude": volunteer.latitude,
                "longitude": volunteer.longitude,
                "skills": volunteer.skills,
                "availability": volunteer.availability,
                "experience": volunteer.experience,
                "emergency_contact": volunteer.emergency_contact,
                "location": volunteer.location,
                "reliability_score": volunteer.reliability_score,
                "updated_at": volunteer.updated_at.isoformat() if volunteer.updated_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def get_volunteers(db: Session = Depends(get_db)):
    """Get all volunteers"""
    try:
        volunteers = get_all_volunteers(db)
        return {
            "volunteers": [
                {
                    "id": v.id,
                    "phone": v.phone,
                    "name": v.name,
                    "email": v.email,
                    "latitude": v.latitude,
                    "longitude": v.longitude,
                    "location": v.location,
                    "skills": v.skills,
                    "availability": v.availability,
                    "experience": v.experience,
                    "emergency_contact": v.emergency_contact,
                    "reliability_score": v.reliability_score,
                    "created_at": v.created_at.isoformat() if v.created_at else None
                } for v in volunteers
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{volunteer_id}")
def get_volunteer(volunteer_id: str, db: Session = Depends(get_db)):
    """Get a specific volunteer by ID"""
    try:
        volunteer = get_volunteer_by_id(db, volunteer_id)
        if not volunteer:
            raise HTTPException(status_code=404, detail='Volunteer not found')

        return {
            "volunteer": {
                "id": volunteer.id,
                "phone": volunteer.phone,
                "name": volunteer.name,
                "email": volunteer.email,
                "latitude": volunteer.latitude,
                "longitude": volunteer.longitude,
                "location": volunteer.location,
                "skills": volunteer.skills,
                "availability": volunteer.availability,
                "experience": volunteer.experience,
                "emergency_contact": volunteer.emergency_contact,
                "reliability_score": volunteer.reliability_score,
                "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None,
                "updated_at": volunteer.updated_at.isoformat() if volunteer.updated_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
