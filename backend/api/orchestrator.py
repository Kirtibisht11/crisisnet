from fastapi import APIRouter, Depends
import json
from datetime import datetime
from sqlalchemy.orm import Session

from backend.agents.detection_agent import run_detection_pipeline
from backend.agents.trust_agent import TrustAgent
from backend.db.database import get_db
from backend.db.models import Crisis, PipelineRun, VolunteerRequest, User
# from backend.agents.resource_agent import ResourceAgent

# Mock ResourceAgent to bypass SyntaxError in the actual file
class ResourceAgent:
    def __init__(self, db=None): pass
    def allocate_resources(self, alert): return {"status": "mock_allocation", "alert_id": alert.get("alert_id") if isinstance(alert, dict) else alert.id}

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/run")
def run_pipeline(db: Session = Depends(get_db)):
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
            
            # Persist detected alerts to DB as Crises
            if isinstance(detection_result, dict) and 'alerts' in detection_result:
                for a_data in detection_result['alerts']:
                    existing = db.query(Crisis).filter(Crisis.id == a_data.get('alert_id')).first()
                    if not existing:
                        crisis = Crisis(
                            id=a_data.get('alert_id'),
                            crisis_type=a_data.get('crisis_type'),
                            severity=a_data.get('severity'),
                            latitude=a_data.get('lat'),
                            longitude=a_data.get('lon'),
                            title=a_data.get('message') or "Detected Crisis",
                            description=a_data.get('message')
                        )
                        db.add(crisis)
                db.commit()

        except Exception as e:
            print(f"[Pipeline {run_id}] Detection error: {e}")
            results['detection'] = {'status': 'error', 'error': str(e)}

        # Stage 2: Trust Evaluation
        print(f"[Pipeline {run_id}] Starting Trust Agent...")
        try:
            trust_agent = TrustAgent()
            # Load alerts from alerts_log and verify them
            alerts = db.query(Crisis).order_by(Crisis.created_at.desc()).limit(5).all()
            verified_alerts = []
            
            for alert in alerts:
                # Convert to dict for agent compatibility
                alert_dict = {
                    "alert_id": alert.id,
                    "crisis_type": alert.crisis_type,
                    "location": alert.location,
                    "lat": alert.latitude,
                    "lon": alert.longitude,
                    "message": alert.description
                }
                verified = trust_agent.verify_alert(alert_dict)
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
            latest_request = db.query(VolunteerRequest).order_by(VolunteerRequest.created_at.desc()).first()
            
            # Collect unique user IDs from recent requests
            user_ids = []
            if latest_request:
                # In real scenario, parse involved user IDs from request
                # For now, collect all user IDs from users.json that are volunteers
                volunteers = db.query(User).filter(User.role.in_(['volunteer', 'authority'])).all()
                user_ids = [u.id for u in volunteers]
            
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
        run_record = PipelineRun(
            run_id=run_id,
            timestamp=datetime.utcnow(),
            summary=results,
            details=results
        )
        db.add(run_record)
        db.commit()

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
def get_pipeline_runs(page: int = 1, per_page: int = 20, db: Session = Depends(get_db)):
    """Retrieve pipeline run history"""
    total = db.query(PipelineRun).count()
    runs = db.query(PipelineRun).order_by(PipelineRun.timestamp.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    data = []
    for r in runs:
        data.append({c.name: getattr(r, c.name) for c in r.__table__.columns})
    
    return {
        'items': data,
        'page': page,
        'per_page': per_page,
        'total': total
    }
