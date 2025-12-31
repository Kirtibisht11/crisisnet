from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
import os

import sys
# Add project root to path to allow imports from backend
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
    limit: int = Query(100)
):
    try:
        data = load_alerts_log()
        alerts = data.get("alerts", [])

        if decision:
            alerts = [a for a in alerts if a.get("decision") == decision.upper()]

        if crisis_type:
            alerts = [a for a in alerts if a.get("crisis_type", "").lower() == crisis_type.lower()]

        return {
            "success": True,
            "alerts": alerts[:limit],
            "count": len(alerts),
            "total_available": data.get("total_count", 0),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{alert_id}")
async def get_alert_by_id(alert_id: str):
    data = load_alerts_log()
    alert = next((a for a in data.get("alerts", []) if a.get("alert_id") == alert_id), None)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"success": True, "alert": alert}


@router.get("/alerts/stats")
async def get_alert_statistics():
    data = load_alerts_log()
    return {
        "success": True,
        "statistics": data.get("statistics", {}),
        "total_count": data.get("total_count", 0),
        "last_updated": data.get("last_updated"),
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
