from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
import json
import random
import os
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.db.database import get_db
from backend.db.models import Crisis
from backend.db.crud import get_available_crises

import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from backend.agents.detection_agent import run_detection_pipeline

router = APIRouter(prefix="/api", tags=["Alerts"])


def _project_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def load_alerts_log():
    alerts_log_path = os.path.join(_project_root(), "data", "alerts_log.json")

    if not os.path.exists(alerts_log_path):
        return {"alerts": [], "total_count": 0, "statistics": {}}

    try:
        with open(alerts_log_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"alerts": [], "total_count": 0, "statistics": {}}
    except Exception as e:
        raise RuntimeError(f"Failed reading alerts_log.json: {e}")


def save_alerts_log(data):
    path = os.path.join(_project_root(), "data", "alerts_log.json")
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, path)


def load_mock_scenarios():
    mock_path = os.path.join(_project_root(), "agents", "trust", "mock_alerts.json")

    if not os.path.exists(mock_path):
        return {"scenarios": {}, "user_profiles": {}}

    with open(mock_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_companion_guidance():
    path = os.path.join(_project_root(), "data", "predefined_guidance.json")

    if not os.path.exists(path):
        return {}

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/alerts")
async def get_all_alerts(
    decision: Optional[str] = Query(None),
    crisis_type: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Crisis).order_by(Crisis.created_at.desc())

        if decision:
            if decision.upper() == "VERIFIED":
                query = query.filter(Crisis.verified == True)
            elif decision.upper() in ["REVIEW", "PENDING"]:
                query = query.filter(Crisis.verified == False)

        if crisis_type:
            query = query.filter(Crisis.crisis_type == crisis_type)

        crises = query.limit(limit).all()
        
        alerts = []
        for c in crises:
            # Determine decision based on verified status and rejection
            if c.verified:
                decision = "VERIFIED"
            elif c.status == "rejected":
                decision = "REJECTED"
            else:
                decision = "REVIEW"

            alerts.append({
                "alert_id": c.id,
                "crisis_type": c.crisis_type,
                "severity": c.severity,
                "location": c.location,
                "lat": c.latitude,
                "lon": c.longitude,
                "message": c.description,
                "trust_score": c.trust_score,
                "status": c.status,
                "verified": c.verified,
                "timestamp": c.created_at.isoformat() if c.created_at else None,
                "decision": decision,
                "sources": int((c.trust_score or 0.5) * 20) + random.randint(1, 5)  # Simulated source count for demo
            })

        return {
            "success": True,
            "alerts": alerts[:limit],
            "count": len(alerts),
            "total_available": len(alerts),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{alert_id}")
async def get_alert_by_id(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Crisis).filter(Crisis.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Determine decision based on verified status and rejection
    if alert.verified:
        decision = "VERIFIED"
    elif alert.status == "rejected":
        decision = "REJECTED"
    else:
        decision = "REVIEW"

    alert_data = {
        "alert_id": alert.id,
        "crisis_type": alert.crisis_type,
        "severity": alert.severity,
        "location": alert.location,
        "lat": alert.latitude,
        "lon": alert.longitude,
        "message": alert.description,
        "trust_score": alert.trust_score,
        "status": alert.status,
        "verified": alert.verified,
        "timestamp": alert.created_at.isoformat() if alert.created_at else None,
        "decision": decision
    }
    return {"success": True, "alert": alert_data}


@router.put("/alerts/{alert_id}/decision")
async def update_alert_decision(alert_id: str, payload: dict, db: Session = Depends(get_db)):
    alert = db.query(Crisis).filter(Crisis.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    response_data = {
        "alert_id": alert.id,
        "status": alert.status,
        "verified": alert.verified
    }

    if "decision" in payload:
        decision = payload["decision"].upper()
        if decision == "VERIFIED":
            alert.verified = True
            alert.status = "accepted"
            if "approved_by" in payload:
                response_data["approved_by"] = payload["approved_by"]
            if "approved_at" in payload:
                response_data["approved_at"] = payload["approved_at"]
        elif decision == "REJECTED":
            alert.verified = False
            alert.status = "rejected"
            if "rejected_by" in payload:
                response_data["rejected_by"] = payload["rejected_by"]
            if "rejected_at" in payload:
                response_data["rejected_at"] = payload["rejected_at"]

    db.commit()
    db.refresh(alert)
    return {"success": True, "alert": response_data}


@router.get("/alerts/stats")
async def get_alert_statistics(db: Session = Depends(get_db)):
    total = db.query(Crisis).count()
    verified = db.query(Crisis).filter(Crisis.verified == True).count()
    rejected = db.query(Crisis).filter(Crisis.status == "rejected").count()
    
    return {
        "success": True,
        "statistics": {
            "verified": verified,
            "rejected": rejected,
            "pending": total - verified - rejected
        },
        "total_count": total,
        "last_updated": datetime.utcnow().isoformat(),
    }


@router.post("/run-pipeline")
async def trigger_pipeline():
    try:
        result = run_detection_pipeline()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mock-scenarios")
async def get_mock_scenarios():
    data = load_mock_scenarios()
    return {"success": True, **data}


@router.get("/crisis-types")
async def get_crisis_types():
    return {
        "success": True,
        "crisis_types": [
            {"type": "flood", "label": "Flood", "urgent": False},
            {"type": "fire", "label": "Fire", "urgent": True},
            {"type": "earthquake", "label": "Earthquake", "urgent": True},
            {"type": "medical", "label": "Medical Emergency", "urgent": True},
        ],
    }


@router.get("/companion/{ctype}")
async def get_companion_guidance(ctype: str):
    data = load_companion_guidance()
    return {"success": True, "guidance": data.get(ctype.lower(), data.get("default"))}

@router.get("/alerts/from-db")
async def get_alerts_from_database(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get alerts from database (Crisis table)"""
    try:
        crises = db.query(Crisis).order_by(Crisis.created_at.desc()).limit(limit).all()
        
        alerts = []
        for crisis in crises:
            alerts.append({
                "alert_id": f"DB_{crisis.id}",
                "crisis_type": crisis.crisis_type,
                "severity": crisis.severity,
                "location": crisis.location,
                "lat": crisis.latitude,
                "lon": crisis.longitude,
                "message": crisis.description or crisis.title,
                "trust_score": crisis.trust_score,
                "confidence": crisis.confidence,
                "status": crisis.status,
                "timestamp": crisis.created_at.isoformat() if crisis.created_at else None,
                "verified": crisis.verified
            })
        
        return {
            "success": True,
            "source": "database",
            "alerts": alerts,
            "count": len(alerts)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
