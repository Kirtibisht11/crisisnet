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
    except FileNotFoundError:
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
        payload_user = require_role(token, ["volunteer", "authority", "admin"])
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
            # if role is volunteer, ensure they only update their own id
            if payload_user.get('role') == 'volunteer' and payload_user.get('user_id') != vol_id:
                raise HTTPException(status_code=403, detail='volunteers can only modify their own availability')
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
