from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
import json
from datetime import datetime
from sqlalchemy.orm import Session

from backend.core.role_guard import require_role
from backend.db.database import get_db
from backend.db.models import Resource, User, Assignment, VolunteerRequest, Crisis

router = APIRouter(prefix="/api/resource", tags=["resource-admin"])


@router.get("/resources")
def list_resources(page: int = 1, per_page: int = 20, type: Optional[str] = None, available: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(Resource)
    if type:
        query = query.filter(Resource.type == type)
    if available is not None:
        query = query.filter(Resource.available == available)

    total = query.count()
    resources = query.offset((page - 1) * per_page).limit(per_page).all()
    
    # Convert to dict
    data = []
    for r in resources:
        data.append({c.name: getattr(r, c.name) for c in r.__table__.columns})

    start = (page - 1) * per_page
    end = start + per_page
    return { 'items': data, 'page': page, 'per_page': per_page, 'total': total }


@router.post("/resources")
def create_resource(payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    try:
        user = require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Append provider to location since Resource model lacks provider column
    loc = payload.get('location', 'Headquarters')
    prov = payload.get('provider')
    final_location = f"{loc} (Provider: {prov})" if prov else loc

    new_resource = Resource(
        id=f"res_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        type=payload.get('type'),
        capacity=int(payload.get('capacity', 0)),
        location=final_location,
        available=True
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return {'status': 'ok', 'resource': {c.name: getattr(new_resource, c.name) for c in new_resource.__table__.columns}}


@router.delete("/resources/{resource_id}")
def delete_resource(resource_id: str, token: str = Header(None), db: Session = Depends(get_db)):
    try:
        require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))
    
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(resource)
    db.commit()
    return {"status": "ok", "message": "Resource deleted"}


@router.put("/resources/{resource_id}")
def update_resource(resource_id: str, payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    try:
        require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if 'type' in payload: resource.type = payload['type']
    if 'capacity' in payload: resource.capacity = int(payload['capacity'])
    if 'location' in payload: resource.location = payload['location']

    db.commit()
    db.refresh(resource)
    return {'status': 'ok', 'resource': {c.name: getattr(resource, c.name) for c in resource.__table__.columns}}


@router.put("/resources/{resource_id}/availability")
def set_resource_availability(resource_id: str, payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    # only authority or admin can change resource availability
    require_role(token, ["authority", "admin"])
    
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail='resource not found')
        
    resource.available = bool(payload.get('available'))
    resource.allocated_to = payload.get('allocated_to') if not resource.available else None
    resource.allocated_at = datetime.utcnow() if not resource.available else None
    
    db.commit()
    db.refresh(resource)
    return {'status': 'ok', 'resource': {c.name: getattr(resource, c.name) for c in resource.__table__.columns}}


@router.get('/volunteers')
def list_volunteers(page: int = 1, per_page: int = 20, skill: Optional[str] = None, available: Optional[bool] = None, db: Session = Depends(get_db)):
    # Volunteers are Users with role='volunteer'
    query = db.query(User).filter(User.role == 'volunteer')
    
    if available is not None:
        query = query.filter(User.availability == available)
        
    # Filter by skill in python since it's JSON
    volunteers = query.all()
    data = []
    for v in volunteers:
        # Map User model to volunteer dict structure expected by frontend
        v_dict = {
            "id": v.id,
            "name": v.name,
            "phone": v.phone,
            "skills": v.skills,
            "available": v.availability,
            "location": v.location,
            "latitude": v.latitude,
            "longitude": v.longitude
        }
        data.append(v_dict)

    if skill:
        data = [v for v in data if skill in (v.get('skills') or [])]
        
    total = len(data)
    start = (page - 1) * per_page
    end = start + per_page
    return { 'items': data[start:end], 'page': page, 'per_page': per_page, 'total': total }


@router.put('/volunteers/{vol_id}/availability')
def set_volunteer_availability(vol_id: str, payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    # volunteers can toggle their own availability; authority/admin can toggle any
    try:
        payload_user = require_role(token, ["volunteer", "citizen", "authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    volunteer = db.query(User).filter(User.id == vol_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail='volunteer not found')
        
    # if role is volunteer or citizen, ensure they only update their own profile
    if payload_user.get('role') in ['volunteer', 'citizen']:
        if volunteer.id != payload_user.get('user_id'):
            raise HTTPException(status_code=403, detail='You can only modify your own availability')
            
    volunteer.availability = bool(payload.get('available'))
    
    db.commit()
    db.refresh(volunteer)
    
    return {'status': 'ok', 'volunteer': {
        "id": volunteer.id,
        "available": volunteer.availability
    }}


@router.get('/assignments')
def get_assignments(page: int = 1, per_page: int = 20, db: Session = Depends(get_db)):
    total = db.query(Assignment).count()
    assignments = db.query(Assignment).offset((page - 1) * per_page).limit(per_page).all()
    
    data = []
    for a in assignments:
        data.append({c.name: getattr(a, c.name) for c in a.__table__.columns})
        
    start = (page - 1) * per_page
    return { 'items': data, 'page': page, 'per_page': per_page, 'total': total }


@router.post('/assignments')
def create_assignment(payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    # only authority/admin can create assignments
    try:
        user = require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    resource_id = payload.get('resource_id')
    volunteer_ids = payload.get('volunteer_ids', [])
    crisis_id = payload.get('crisis_id')
    notes = payload.get('notes')

    if not resource_id or not volunteer_ids:
        raise HTTPException(status_code=400, detail='resource_id and volunteer_ids required')

    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail='resource not found')

    assigned_vols = []
    for vid in volunteer_ids:
        v = db.query(User).filter(User.id == vid).first()
        if not v:
            continue
        # mark volunteer assigned
        v.availability = False
        assigned_vols.append(v.id)

    # mark resource allocated
    resource.available = False
    resource.allocated_to = crisis_id
    resource.allocated_at = datetime.utcnow()

    assignment = Assignment(
        id=f"asgn_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{resource_id}",
        resource_id=resource_id,
        volunteers=assigned_vols,
        crisis_id=crisis_id,
        notes=notes,
        assigned_by=user.get('user_id'),
        created_at=datetime.utcnow()
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return {'status': 'ok', 'assignment': {c.name: getattr(assignment, c.name) for c in assignment.__table__.columns}}


@router.get('/volunteer_requests')
def get_volunteer_requests(page: int = 1, per_page: int = 20, db: Session = Depends(get_db)):
    total = db.query(VolunteerRequest).count()
    requests = db.query(VolunteerRequest).order_by(VolunteerRequest.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    data = []
    for r in requests:
        data.append({c.name: getattr(r, c.name) for c in r.__table__.columns})
        
    start = (page - 1) * per_page
    return { 'items': data, 'page': page, 'per_page': per_page, 'total': total }


@router.post('/volunteer_requests')
def create_volunteer_request(payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    try:
        user = require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Fetch trust_score from alerts if crisis_id is provided
    trust_score = payload.get('trust_score', 0.5)  # default fallback
    if payload.get('crisis_id'):
        alert = db.query(Crisis).filter(Crisis.id == payload.get('crisis_id')).first()
        if alert and alert.trust_score is not None:
            trust_score = alert.trust_score

    new_req = VolunteerRequest(
        id=f"req_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        crisis_id=payload.get('crisis_id'),
        crisis_type=payload.get('crisis_type'),
        trust_score=trust_score,
        location=payload.get('location'),
        lat=payload.get('lat'),
        lon=payload.get('lon'),
        message=payload.get('message'),
        skills_required=payload.get('skills', []),
        volunteers_needed=int(payload.get('count', 1)),
        fulfilled_count=0,
        status="OPEN",
        created_at=datetime.utcnow(),
        created_by=user.get('user_id'),
        accepted_volunteers=[]
    )

    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return {"status": "ok", "request": {c.name: getattr(new_req, c.name) for c in new_req.__table__.columns}}


@router.post('/volunteer_requests/{request_id}/accept')
def accept_volunteer_request(request_id: str, payload: dict, token: str = Header(None), db: Session = Depends(get_db)):
    try:
        user = require_role(token, ["volunteer", "citizen"], db)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    req = db.query(VolunteerRequest).filter(VolunteerRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != 'OPEN':
        raise HTTPException(status_code=400, detail="Request is not open")

    # Determine volunteer ID (prefer volunteer profile ID, fallback to user_id)
    current_user_id = user.get('user_id')
    # In DB, user_id is the ID.
    
    vol_id = current_user_id

    accepted = list(req.accepted_volunteers) if req.accepted_volunteers else []
    if vol_id not in accepted:
        accepted.append(vol_id)
        req.accepted_volunteers = accepted
        req.fulfilled_count = len(accepted)

    if req.fulfilled_count >= req.volunteers_needed:
        req.status = 'FULFILLED'
        
    db.commit()
    return {"status": "ok", "message": "Request accepted"}


@router.get('/volunteer/tasks/{volunteer_id}')
def get_volunteer_tasks(volunteer_id: str, db: Session = Depends(get_db)):
    assignments = db.query(Assignment).all()
    requests = db.query(VolunteerRequest).all()
    resources = db.query(Resource).all()
    
    check_ids = [volunteer_id]
    
    tasks = []
    
    # 1. Assignments
    for a in assignments:
        if any(vid in (a.volunteers or []) for vid in check_ids):
            # Resolve resource location
            res_loc = "Location not specified"
            res_lat = None
            res_lon = None
            res = next((r for r in resources if r.id == a.resource_id), None)
            if res and res.location:
                if isinstance(res.location, dict):
                    res_lat = res.location.get('lat')
                    res_lon = res.location.get('lon')
                    if res_lat and res_lon: res_loc = f"{res_lat}, {res_lon}"
                elif isinstance(res.location, str):
                    res_loc = res.location

            # Fetch trust_score, crisis_type, and location from alerts if crisis_id is provided
            trust_score = 0.5  # default fallback
            crisis_type = 'other'  # default fallback
            alert_location = None
            alert_lat = None
            alert_lon = None
            if a.crisis_id:
                alert = db.query(Crisis).filter(Crisis.id == a.crisis_id).first()
                if alert:
                    trust_score = alert.trust_score or 0.5
                    crisis_type = alert.crisis_type or 'other'
                    alert_location = alert.location
                    alert_lat = alert.latitude
                    alert_lon = alert.longitude

            # Determine priority based on trust_score and crisis_type
            urgent_crises = ['fire', 'medical', 'violence', 'earthquake']
            is_urgent = crisis_type.lower() in urgent_crises

            if trust_score >= 0.65 and is_urgent:
                priority = 'CRITICAL'
            elif trust_score >= 0.65:
                priority = 'HIGH'
            elif trust_score >= 0.45:
                priority = 'MEDIUM'
            else:
                priority = 'LOW'

            # Use alert location if available, otherwise use resource location
            task_location = alert_location or res_loc
            task_lat = alert_lat or res_lat
            task_lon = alert_lon or res_lon

            tasks.append({
                "task_id": a.id,
                "task": f"Resource Support: {a.resource_id}",
                "description": a.notes or "Assigned to support resource allocation",
                "location": task_location,
                "lat": task_lat,
                "lon": task_lon,
                "trust_score": trust_score,
                "crisis_type": crisis_type,
                "priority": priority.lower(),
                "status": "assigned",
                "assigned_at": a.created_at,
                "type": "assignment"
            })

    # 2. Requests
    for r in requests:
        if any(vid in (r.accepted_volunteers or []) for vid in check_ids):
            # Determine priority based on trust_score and crisis_type
            trust_score = r.trust_score or 0.5
            crisis_type = r.crisis_type or ''
            urgent_crises = ['fire', 'medical', 'violence', 'earthquake']
            is_urgent = crisis_type.lower() in urgent_crises

            if trust_score >= 0.65 and is_urgent:
                priority = 'CRITICAL'
            elif trust_score >= 0.65:
                priority = 'HIGH'
            elif trust_score >= 0.45:
                priority = 'MEDIUM'
            else:
                priority = 'LOW'

            tasks.append({
                "task_id": r.id,
                "task": f"Emergency: {r.crisis_type}",
                "description": r.message,
                "location": r.location or "See Dashboard",
                "lat": r.lat,
                "lon": r.lon,
                "trust_score": trust_score,
                "crisis_type": crisis_type,
                "priority": priority.lower(),
                "status": r.status,
                "assigned_at": r.created_at,
                "required_skills": r.skills_required,
                "type": "request"
            })
            
    return {"tasks": tasks}
