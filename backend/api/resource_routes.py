from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import json
import os
from datetime import datetime

from backend.core.role_guard import require_role

router = APIRouter(prefix="/api/resource", tags=["resource-admin"])


def _data_path(filename: str):
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "data", filename)


def _read_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _write_json(path, data):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, indent=2)
        fh.flush(); os.fsync(fh.fileno())
    os.replace(tmp, path)


@router.get("/resources")
def list_resources(page: int = 1, per_page: int = 20, type: Optional[str] = None, available: Optional[bool] = None):
    data = _read_json(_data_path('resources.json'))
    if type:
        data = [d for d in data if d.get('type') == type]
    if available is not None:
        data = [d for d in data if d.get('available') == available]

    total = len(data)
    start = (page - 1) * per_page
    end = start + per_page
    return { 'items': data[start:end], 'page': page, 'per_page': per_page, 'total': total }


@router.put("/resources/{resource_id}/availability")
def set_resource_availability(resource_id: str, payload: dict, token: str = Header(None)):
    # only authority or admin can change resource availability
    require_role(token, ["authority", "admin"])
    path = _data_path('resources.json')
    data = _read_json(path)
    updated = None
    for r in data:
        if r.get('id') == resource_id:
            r['available'] = bool(payload.get('available'))
            r['allocated_to'] = payload.get('allocated_to') if not r['available'] else None
            r['allocated_at'] = datetime.utcnow().isoformat() if not r['available'] else None
            updated = r
            break
    if not updated:
        raise HTTPException(status_code=404, detail='resource not found')
    _write_json(path, data)
    return {'status': 'ok', 'resource': updated}


@router.get('/volunteers')
def list_volunteers(page: int = 1, per_page: int = 20, skill: Optional[str] = None, available: Optional[bool] = None):
    users_data = _read_json(_data_path('users.json'))
    users = users_data.get('users', []) if isinstance(users_data, dict) else []
    data = [u.get('volunteer') for u in users if u.get('volunteer')]

    if skill:
        data = [v for v in data if skill in (v.get('skills') or [])]
    if available is not None:
        data = [v for v in data if v.get('available') == available]
    total = len(data)
    start = (page - 1) * per_page
    end = start + per_page
    return { 'items': data[start:end], 'page': page, 'per_page': per_page, 'total': total }


@router.put('/volunteers/{vol_id}/availability')
def set_volunteer_availability(vol_id: str, payload: dict, token: str = Header(None)):
    # volunteers can toggle their own availability; authority/admin can toggle any
    try:
        payload_user = require_role(token, ["volunteer", "citizen", "authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    path = _data_path('users.json')
    data_wrapper = _read_json(path)
    users = data_wrapper.get('users', []) if isinstance(data_wrapper, dict) else []
    updated = None
    for u in users:
        v = u.get('volunteer')
        if not v: continue
        if v.get('id') == vol_id:
            # if role is volunteer or citizen, ensure they only update their own profile
            if payload_user.get('role') in ['volunteer', 'citizen']:
                if u.get('user_id') != payload_user.get('user_id'):
                    raise HTTPException(status_code=403, detail='You can only modify your own availability')
            v['available'] = bool(payload.get('available'))
            v['allocated_to'] = payload.get('allocated_to') if not v['available'] else None
            v['allocated_at'] = datetime.utcnow().isoformat() if not v['available'] else None
            updated = v
            break
    if not updated:
        raise HTTPException(status_code=404, detail='volunteer not found')
    _write_json(path, data_wrapper)
    return {'status': 'ok', 'volunteer': updated}


@router.get('/assignments')
def get_assignments(page: int = 1, per_page: int = 20):
    data = _read_json(_data_path('assignments.json'))
    total = len(data)
    start = (page - 1) * per_page
    return { 'items': data[start:start+per_page], 'page': page, 'per_page': per_page, 'total': total }


@router.post('/assignments')
def create_assignment(payload: dict, token: str = Header(None)):
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

    resources_path = _data_path('resources.json')
    users_path = _data_path('users.json')
    assignments_path = _data_path('assignments.json')

    resources = _read_json(resources_path)
    users_data = _read_json(users_path)
    users = users_data.get('users', []) if isinstance(users_data, dict) else []
    assignments = _read_json(assignments_path)

    resource = next((r for r in resources if r.get('id') == resource_id), None)
    if not resource:
        raise HTTPException(status_code=404, detail='resource not found')

    assigned_vols = []
    for vid in volunteer_ids:
        user = next((u for u in users if u.get('volunteer', {}).get('id') == vid), None)
        v = user.get('volunteer') if user else None
        if not v:
            continue
        # mark volunteer assigned
        v['available'] = False
        v['allocated_to'] = crisis_id
        v['allocated_at'] = datetime.utcnow().isoformat()
        assigned_vols.append(v.get('id'))

    # mark resource allocated
    resource['available'] = False
    resource['allocated_to'] = crisis_id
    resource['allocated_at'] = datetime.utcnow().isoformat()

    assignment = {
        'assignment_id': f"asgn_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{resource_id}",
        'resource_id': resource_id,
        'volunteers': assigned_vols,
        'crisis_id': crisis_id,
        'notes': notes,
        'assigned_by': user.get('user_id'),
        'created_at': datetime.utcnow().isoformat()
    }

    assignments.insert(0, assignment)

    # persist all
    _write_json(resources_path, resources)
    _write_json(users_path, users_data)
    _write_json(assignments_path, assignments)

    return {'status': 'ok', 'assignment': assignment}


@router.get('/volunteer_requests')
def get_volunteer_requests(page: int = 1, per_page: int = 20):
    data = _read_json(_data_path('volunteer_requests.json'))
    total = len(data)
    start = (page - 1) * per_page
    return { 'items': data[start:start+per_page], 'page': page, 'per_page': per_page, 'total': total }


@router.post('/volunteer_requests')
def create_volunteer_request(payload: dict, token: str = Header(None)):
    try:
        user = require_role(token, ["authority", "admin"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    path = _data_path('volunteer_requests.json')
    requests = _read_json(path)

    # Fetch trust_score from alerts if crisis_id is provided
    trust_score = payload.get('trust_score', 0.5)  # default fallback
    if payload.get('crisis_id'):
        alerts_log = _read_json(_data_path('alerts_log.json'))
        alert = next((a for a in alerts_log if a.get('alert_id') == payload.get('crisis_id')), None)
        if alert and alert.get('trust_score') is not None:
            trust_score = alert.get('trust_score')

    new_req = {
        "request_id": f"req_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "crisis_id": payload.get('crisis_id'),
        "crisis_type": payload.get('crisis_type'),
        "trust_score": trust_score,
        "location": payload.get('location'),
        "lat": payload.get('lat'),
        "lon": payload.get('lon'),
        "message": payload.get('message'),
        "skills_required": payload.get('skills', []),
        "volunteers_needed": int(payload.get('count', 1)),
        "fulfilled_count": 0,
        "status": "OPEN",
        "created_at": datetime.utcnow().isoformat(),
        "created_by": user.get('user_id')
    }

    requests.insert(0, new_req)
    _write_json(path, requests)
    return {"status": "ok", "request": new_req}


@router.post('/volunteer_requests/{request_id}/accept')
def accept_volunteer_request(request_id: str, payload: dict, token: str = Header(None)):
    try:
        user = require_role(token, ["volunteer", "citizen"])
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

    req_path = _data_path('volunteer_requests.json')
    requests = _read_json(req_path)
    
    req = next((r for r in requests if r.get('request_id') == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.get('status') != 'OPEN':
        raise HTTPException(status_code=400, detail="Request is not open")

    # Determine volunteer ID (prefer volunteer profile ID, fallback to user_id)
    # Load users to resolve volunteer ID correctly from DB
    users_data = _read_json(_data_path('users.json'))
    users_list = users_data.get('users', []) if isinstance(users_data, dict) else []
    
    current_user_id = user.get('user_id')
    db_user = next((u for u in users_list if u.get('user_id') == current_user_id), None)
    
    vol_id = current_user_id
    if db_user and db_user.get('volunteer') and db_user['volunteer'].get('id'):
        vol_id = db_user['volunteer']['id']

    accepted = req.get('accepted_volunteers', [])
    if vol_id not in accepted:
        accepted.append(vol_id)
        req['accepted_volunteers'] = accepted
        req['fulfilled_count'] = len(accepted)

    if req['fulfilled_count'] >= req.get('volunteers_needed', 1):
        req['status'] = 'FULFILLED'
        
    _write_json(req_path, requests)
    return {"status": "ok", "message": "Request accepted"}


@router.get('/volunteer/tasks/{volunteer_id}')
def get_volunteer_tasks(volunteer_id: str):
    assignments = _read_json(_data_path('assignments.json'))
    requests = _read_json(_data_path('volunteer_requests.json'))
    resources = _read_json(_data_path('resources.json'))
    
    # Resolve user_id from volunteer_id to support legacy/mismatched data
    users_data = _read_json(_data_path('users.json'))
    users_list = users_data.get('users', []) if isinstance(users_data, dict) else []
    
    user_id = None
    for u in users_list:
        v = u.get('volunteer')
        if v and v.get('id') == volunteer_id:
            user_id = u.get('user_id')
            break
            
    check_ids = [volunteer_id]
    if user_id:
        check_ids.append(user_id)
    
    tasks = []
    
    # 1. Assignments
    for a in assignments:
        if any(vid in (a.get('volunteers') or []) for vid in check_ids):
            # Resolve resource location
            res_loc = "Location not specified"
            res_lat = None
            res_lon = None
            res = next((r for r in resources if r.get('id') == a.get('resource_id')), None)
            if res and res.get('location'):
                if isinstance(res['location'], dict):
                    res_lat = res['location'].get('lat')
                    res_lon = res['location'].get('lon')
                    if res_lat and res_lon: res_loc = f"{res_lat}, {res_lon}"
                elif isinstance(res['location'], str):
                    res_loc = res['location']

            # Fetch trust_score, crisis_type, and location from alerts if crisis_id is provided
            trust_score = 0.5  # default fallback
            crisis_type = 'other'  # default fallback
            alert_location = None
            alert_lat = None
            alert_lon = None
            if a.get('crisis_id'):
                alerts_log = _read_json(_data_path('alerts_log.json'))
                alert = next((al for al in alerts_log if al.get('alert_id') == a.get('crisis_id')), None)
                if alert:
                    trust_score = alert.get('trust_score', 0.5)
                    crisis_type = alert.get('crisis_type', 'other')
                    alert_location = alert.get('location')
                    alert_lat = alert.get('lat')
                    alert_lon = alert.get('lon')

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
                "task_id": a.get("assignment_id"),
                "task": f"Resource Support: {a.get('resource_id')}",
                "description": a.get("notes") or "Assigned to support resource allocation",
                "location": task_location,
                "lat": task_lat,
                "lon": task_lon,
                "trust_score": trust_score,
                "crisis_type": crisis_type,
                "priority": priority.lower(),
                "status": "assigned",
                "assigned_at": a.get("created_at"),
                "type": "assignment"
            })

    # 2. Requests
    for r in requests:
        if any(vid in (r.get('accepted_volunteers') or []) for vid in check_ids):
            # Determine priority based on trust_score and crisis_type
            trust_score = r.get('trust_score', 0.5)
            crisis_type = r.get('crisis_type', '')
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
                "task_id": r.get("request_id"),
                "task": f"Emergency: {r.get('crisis_type')}",
                "description": r.get("message"),
                "location": r.get("location") or "See Dashboard",
                "lat": r.get("lat"),
                "lon": r.get("lon"),
                "trust_score": trust_score,
                "crisis_type": crisis_type,
                "priority": priority.lower(),
                "status": r.get("status"),
                "assigned_at": r.get("created_at"),
                "required_skills": r.get("skills_required"),
                "type": "request"
            })
            
    return {"tasks": tasks}
