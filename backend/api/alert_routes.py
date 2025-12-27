from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
import os

router = APIRouter(prefix="/api", tags=["Alerts"])


def load_alerts_log():
    """Load alerts from alerts_log.json"""
    alerts_log_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'data',
        'alerts_log.json'
    )
    
    try:
        with open(alerts_log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"alerts": [], "total_count": 0, "statistics": {}}

def load_mock_scenarios():
    """Load mock scenarios from mock_alerts.json"""
    mock_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'agents',
        'trust',
        'mock_alerts.json'
    )
    
    try:
        with open(mock_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"scenarios": {}, "user_profiles": {}}


@router.get("/alerts")
async def get_all_alerts(
    decision: Optional[str] = Query(None, description="Filter by decision: VERIFIED, REVIEW, REJECTED, UNCERTAIN"),
    crisis_type: Optional[str] = Query(None, description="Filter by crisis type"),
    limit: Optional[int] = Query(100, description="Maximum number of alerts to return")
):
    """
    Get all alerts from alerts_log.json
    
    **This is the main endpoint used by frontend**
    
    **Query Parameters:**
    - decision: Filter by verification decision
    - crisis_type: Filter by crisis type
    - limit: Max results (default: 100)
    
    **Returns:** List of verified/processed alerts
    """
    try:
        data = load_alerts_log()
        alerts = data.get('alerts', [])

        if decision:
            alerts = [a for a in alerts if a.get('decision') == decision.upper()]
        
        if crisis_type:
            alerts = [a for a in alerts if a.get('crisis_type', '').lower() == crisis_type.lower()]
 
        alerts = alerts[:limit]
        
        return {
            "success": True,
            "alerts": alerts,
            "count": len(alerts),
            "total_available": data.get('total_count', 0)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load alerts: {str(e)}"
        )

@router.get("/alerts/{alert_id}")
async def get_alert_by_id(alert_id: str):
    """
    Get specific alert by ID
    
    **Returns:** Single alert details
    """
    try:
        data = load_alerts_log()
        alerts = data.get('alerts', [])
        
        alert = next((a for a in alerts if a.get('alert_id') == alert_id), None)
        
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        
        return {
            "success": True,
            "alert": alert
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load alert: {str(e)}"
        )

@router.get("/alerts/stats")
async def get_alert_statistics():
    """
    Get alert statistics
    
    **Returns:** Verification stats, averages, counts
    """
    try:
        data = load_alerts_log()
        
        return {
            "success": True,
            "statistics": data.get('statistics', {}),
            "total_count": data.get('total_count', 0),
            "last_updated": data.get('last_updated')
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load statistics: {str(e)}"
        )


@router.get("/mock-scenarios")
async def get_mock_scenarios():
    """
    Get all mock test scenarios
    
    **For demo/testing purposes**
    
    **Returns:** All scenarios from mock_alerts.json
    """
    try:
        data = load_mock_scenarios()
        
        return {
            "success": True,
            "scenarios": data.get('scenarios', {}),
            "user_profiles": data.get('user_profiles', {}),
            "test_expectations": data.get('test_expectations', {})
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load mock scenarios: {str(e)}"
        )

@router.get("/mock-scenarios/{scenario_name}")
async def get_scenario_by_name(scenario_name: str):
    """
    Get specific test scenario
    
    **Example scenarios:**
    - scenario_1_high_confidence
    - scenario_2_duplicate_spam
    - scenario_3_rate_limiting
    - scenario_4_low_confidence
    - scenario_5_different_locations
    """
    try:
        data = load_mock_scenarios()
        scenarios = data.get('scenarios', {})
        
        if scenario_name not in scenarios:
            raise HTTPException(
                status_code=404,
                detail=f"Scenario '{scenario_name}' not found"
            )
        
        return {
            "success": True,
            "scenario": scenarios[scenario_name]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load scenario: {str(e)}"
        )


@router.get("/crisis-types")
async def get_crisis_types():
    """
    Get list of supported crisis types
    
    **Returns:** List of valid crisis types with metadata
    """
    crisis_types = [
        {"type": "flood", "label": "Flood", "urgent": False},
        {"type": "fire", "label": "Fire", "urgent": True},
        {"type": "earthquake", "label": "Earthquake", "urgent": True},
        {"type": "accident", "label": "Accident", "urgent": False},
        {"type": "medical", "label": "Medical Emergency", "urgent": True},
        {"type": "violence", "label": "Violence", "urgent": True},
        {"type": "storm", "label": "Storm", "urgent": False},
        {"type": "landslide", "label": "Landslide", "urgent": False},
        {"type": "other", "label": "Other Emergency", "urgent": False}
    ]
    
    return {
        "success": True,
        "crisis_types": crisis_types
    }