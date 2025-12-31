from fastapi import APIRouter, HTTPException
import json
import os
from datetime import datetime

router = APIRouter(prefix="/api/volunteer", tags=["volunteer"])


def _data_path(filename: str):
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "data", filename)


@router.post("/profile")
def create_profile(profile: dict):
    path = _data_path('volunteers.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []

    # generate an id if not provided
    volunteer_id = profile.get('id') or f"vol_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{len(data)+1}"
    profile['id'] = volunteer_id
    profile.setdefault('registered_at', datetime.utcnow().isoformat())

    data.append(profile)
    try:
        tmp = path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            f.flush(); os.fsync(f.fileno())
        os.replace(tmp, path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "volunteer_id": volunteer_id, "volunteer": profile}


@router.post("/attach-to-user")
def attach_volunteer_to_user(profile: dict):
    """Attach volunteer profile to an existing user in data/users.json.

    Expected keys in profile: user_id or phone. This will add a `volunteer` field
    inside the matching user object and also append the profile to volunteers.json
    for compatibility with other parts of the app.
    """
    users_path = _data_path('users.json')
    volunteers_path = _data_path('volunteers.json')

    # load users
    try:
        with open(users_path, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail='users.json not found')

    # find user by user_id or phone
    user = None
    if profile.get('user_id'):
        user = next((u for u in users_data.get('users', []) if u.get('user_id') == profile['user_id']), None)
    if not user and profile.get('phone'):
        ph = profile['phone']
        if not ph.startswith('+'):
            ph = '+' + ph
        user = next((u for u in users_data.get('users', []) if u.get('phone') == ph), None)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    # ensure volunteer id and timestamp
    try:
        volunteers = []
        try:
            with open(volunteers_path, 'r', encoding='utf-8') as vf:
                volunteers = json.load(vf)
        except FileNotFoundError:
            volunteers = []

        volunteer_id = profile.get('id') or f"vol_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{len(volunteers)+1}"
        profile['id'] = volunteer_id
        profile.setdefault('registered_at', datetime.utcnow().isoformat())

        # attach to user object
        user['volunteer'] = profile
        # optionally mark user as volunteer as well
        user['role'] = user.get('role', 'citizen')
        user['is_volunteer'] = True

        # save users.json atomically
        tmp_users = users_path + '.tmp'
        with open(tmp_users, 'w', encoding='utf-8') as uf:
            json.dump(users_data, uf, indent=2)
            uf.flush(); os.fsync(uf.fileno())
        os.replace(tmp_users, users_path)

        # append to volunteers.json for compatibility
        volunteers.append(profile)
        tmp_vol = volunteers_path + '.tmp'
        with open(tmp_vol, 'w', encoding='utf-8') as vf:
            json.dump(volunteers, vf, indent=2)
            vf.flush(); os.fsync(vf.fileno())
        os.replace(tmp_vol, volunteers_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "user": user, "volunteer": profile}


@router.post("/update")
def update_volunteer_profile(profile: dict):
    """Update an existing volunteer profile by ID.
    
    Expected keys: id (or volunteer_id), and fields to update.
    Updates both volunteers.json and user.volunteer if nested.
    """
    users_path = _data_path('users.json')
    volunteers_path = _data_path('volunteers.json')
    
    volunteer_id = profile.get('id') or profile.get('volunteer_id')
    if not volunteer_id:
        raise HTTPException(status_code=400, detail='Volunteer ID required')
    
    try:
        # Update volunteers.json
        try:
            with open(volunteers_path, 'r', encoding='utf-8') as f:
                volunteers = json.load(f)
        except FileNotFoundError:
            volunteers = []
        
        vol_idx = next((i for i, v in enumerate(volunteers) if v.get('id') == volunteer_id or v.get('volunteer_id') == volunteer_id), -1)
        if vol_idx >= 0:
            volunteers[vol_idx].update(profile)
            tmp_vol = volunteers_path + '.tmp'
            with open(tmp_vol, 'w', encoding='utf-8') as f:
                json.dump(volunteers, f, indent=2)
                f.flush(); os.fsync(f.fileno())
            os.replace(tmp_vol, volunteers_path)
        
        # Update users.json if nested
        try:
            with open(users_path, 'r', encoding='utf-8') as f:
                users_data = json.load(f)
        except FileNotFoundError:
            users_data = {'users': []}
        
        user_idx = next((i for i, u in enumerate(users_data.get('users', [])) if u.get('volunteer', {}).get('id') == volunteer_id), -1)
        if user_idx >= 0:
            users_data['users'][user_idx]['volunteer'].update(profile)
            tmp_users = users_path + '.tmp'
            with open(tmp_users, 'w', encoding='utf-8') as f:
                json.dump(users_data, f, indent=2)
                f.flush(); os.fsync(f.fileno())
            os.replace(tmp_users, users_path)
        
        return {"success": True, "volunteer": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
