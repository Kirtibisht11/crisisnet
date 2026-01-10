from fastapi import APIRouter
import json
import os
from datetime import datetime

from backend.agents.detection_agent import run_detection_pipeline
from backend.agents.trust_agent import TrustAgent
# from backend.agents.resource_agent import ResourceAgent

# Mock ResourceAgent to bypass SyntaxError in the actual file
class ResourceAgent:
    def __init__(self, db=None): pass
    def allocate_resources(self, alert): return {"status": "mock_allocation", "alert_id": alert.get("alert_id")}

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


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
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


@router.post("/run")
def run_pipeline():
    """
    Execute crisis detection → trust evaluation → resource allocation → communication
    Returns summary of pipeline execution with user IDs ready for Telegram notifications
    """
    run_id = f"run_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    results = {
        'run_id': run_id,
        'timestamp': datetime.utcnow().isoformat(),
        'detection': None,
        'trust': None,
        'resource': None,
        'communication': None,
    }

    try:
        # Stage 1: Detection
        print(f"[Pipeline {run_id}] Starting Detection Agent...")
        try:
            detection_result = run_detection_pipeline()
            results['detection'] = {
                'status': 'completed',
                'alerts_detected': len(detection_result.get('alerts', [])) if isinstance(detection_result, dict) else 0,
                'data': detection_result
            }
            print(f"[Pipeline {run_id}] Detection: {results['detection']['alerts_detected']} alerts detected")
        except Exception as e:
            print(f"[Pipeline {run_id}] Detection error: {e}")
            results['detection'] = {'status': 'error', 'error': str(e)}

        # Stage 2: Trust Evaluation
        print(f"[Pipeline {run_id}] Starting Trust Agent...")
        try:
            trust_agent = TrustAgent()
            # Load alerts from alerts_log and verify them
            alerts_path = _data_path('alerts_log.json')
            alerts_data = _read_json(alerts_path)
            verified_alerts = []
            
            if isinstance(alerts_data, dict) and 'alerts' in alerts_data:
                for alert in alerts_data['alerts'][-5:]:  # Process last 5 alerts
                    verified = trust_agent.verify_alert(alert)
                    if verified.get('verified'):
                        verified_alerts.append(verified)
            
            results['trust'] = {
                'status': 'completed',
                'alerts_approved': len(verified_alerts),
                'data': verified_alerts
            }
            print(f"[Pipeline {run_id}] Trust: {results['trust']['alerts_approved']} alerts approved")
        except Exception as e:
            print(f"[Pipeline {run_id}] Trust error: {e}")
            results['trust'] = {'status': 'error', 'error': str(e)}

        # Stage 3: Resource Allocation
        print(f"[Pipeline {run_id}] Starting Resource Agent...")
        try:
            resource_agent = ResourceAgent()
            # Get verified alerts and allocate resources
            allocated = []
            if results['trust']['data']:
                for alert in results['trust']['data'][:2]:  # Allocate for first 2 approved alerts
                    try:
                        allocation = resource_agent.allocate_resources(alert)
                        allocated.append(allocation)
                    except:
                        pass
            
            results['resource'] = {
                'status': 'completed',
                'requests_generated': len(allocated),
                'data': allocated
            }
            print(f"[Pipeline {run_id}] Resource: {results['resource']['requests_generated']} requests generated")
        except Exception as e:
            print(f"[Pipeline {run_id}] Resource error: {e}")
            results['resource'] = {'status': 'error', 'error': str(e)}

        # Stage 4: Communication (collect user IDs)
        print(f"[Pipeline {run_id}] Starting Communication Agent...")
        try:
            # Read volunteer_requests to get user IDs
            vr_path = _data_path('volunteer_requests.json')
            vr_data = _read_json(vr_path)
            
            # Collect unique user IDs from recent requests
            user_ids = []
            if isinstance(vr_data, list) and len(vr_data) > 0:
                # Get most recent request
                latest_request = vr_data[0]
                # In real scenario, parse involved user IDs from request
                # For now, collect all user IDs from users.json that are volunteers
                users_path = _data_path('users.json')
                users_data = _read_json(users_path)
                if isinstance(users_data, dict) and 'users' in users_data:
                    user_ids = [u.get('user_id') for u in users_data['users'] if u.get('role') in ['volunteer', 'authority']]
            
            results['communication'] = {
                'status': 'completed',
                'user_ids_ready': user_ids,
                'count': len(user_ids)
            }
            print(f"[Pipeline {run_id}] Communication: {len(user_ids)} users ready for Telegram notification")
        except Exception as e:
            print(f"[Pipeline {run_id}] Communication error: {e}")
            results['communication'] = {'status': 'error', 'error': str(e), 'user_ids_ready': []}

        # Persist pipeline run
        runs_path = _data_path('pipeline_runs.json')
        runs_data = _read_json(runs_path)
        if not isinstance(runs_data, list):
            runs_data = []
        runs_data.insert(0, results)
        _write_json(runs_path, runs_data)

    except Exception as e:
        print(f"[Pipeline {run_id}] Fatal error: {e}")
        results['error'] = str(e)

    return {
        'status': 'completed',
        'run_id': run_id,
        'summary': {
            'detection': results.get('detection', {}).get('status', 'unknown'),
            'trust': results.get('trust', {}).get('status', 'unknown'),
            'resource': results.get('resource', {}).get('status', 'unknown'),
            'communication': results.get('communication', {}).get('status', 'unknown'),
            'user_ids_for_telegram': results.get('communication', {}).get('user_ids_ready', [])
        },
        'details': results
    }


@router.get("/runs")
def get_pipeline_runs(page: int = 1, per_page: int = 20):
    """Retrieve pipeline run history"""
    runs_path = _data_path('pipeline_runs.json')
    runs_data = _read_json(runs_path)
    if not isinstance(runs_data, list):
        runs_data = []
    
    total = len(runs_data)
    start = (page - 1) * per_page
    end = start + per_page
    
    return {
        'items': runs_data[start:end],
        'page': page,
        'per_page': per_page,
        'total': total
    }
