
import json
import os
from datetime import datetime, timezone
import uuid

from .detection.signal_ingestion import ingest_signals  
from backend.db.database import SessionLocal
from backend.db.models import Crisis
from backend.db.crud import mark_signal_processed
from .detection.event_classifier import classify_event
from .detection.severity_estimator import estimate_severity
from .detection.confidence_estimator import estimate_confidence
from .detection.spike_detector import detect_spikes
from backend.ws.manager import manager as ws_manager
from backend.agents.trust_agent import TrustAgent
trust_agent = TrustAgent()

def _get_alerts_log_path():
    base_dir = os.path.dirname(os.path.dirname(__file__))  
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "alerts_log.json")

def _load_alerts_log():
    path = _get_alerts_log_path()
    if not os.path.exists(path):
        return {"alerts": [], "total_count": 0, "statistics": {}}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Detection] Warning: Could not load alerts log: {e}")
        return {"alerts": [], "total_count": 0, "statistics": {}}


def _save_alerts_log(data):
    path = _get_alerts_log_path()
    print(f"[Detection] Writing alerts to: {path}")

    try:
        tmp_path = path + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, path)
        print("[Detection] Alerts saved successfully")
    except Exception as e:
        print(f"[Detection] Failed to save alerts: {e}")

async def broadcast_new_alert(alert):
    try:
        await ws_manager.broadcast_alert(alert)
    except Exception as e:
        print(f"[Detection] WebSocket broadcast failed: {e}")

def _format_alert_for_log(signal, event_type, severity, confidence):
    lat = signal.get("lat") if signal.get("lat") is not None else signal.get("latitude")
    lon = signal.get("lon") if signal.get("lon") is not None else signal.get("longitude")

    return {
        "alert_id": f"DET_{uuid.uuid4().hex[:8]}",
        "user_id": signal.get("source", "detection_system"),
        "crisis_type": event_type or "other",
        "location": signal.get("location", "Unknown"),
        "lat": lat,
        "lon": lon,
        "message": signal.get("text", ""),
        "has_image": signal.get("has_image", False),
        "trust_score": confidence,
        "decision": "REVIEW" if confidence < 0.65 else "VERIFIED",
        "status": "Auto-detected by Detection Agent",
        "reputation": 0.5,
        "cross_verification": {"score": 0.5, "sources": 0, "details": "Awaiting cross-verification"},
        "components": {
            "cross_verification": 0.2,
            "source_reputation": 0.25,
            "duplicate_adjustment": 0.0,
            "rate_limit_penalty": 0.0,
            "bonus_signals": 0.05
        },
        "timestamp": signal.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        "verified_at": datetime.utcnow().isoformat() + "Z",
        "severity": severity
    }


def _is_duplicate_signal(signal, existing_alerts, time_window_minutes=30, distance_km=5):
    from datetime import datetime, timedelta
    from backend.core.geo import haversine_distance
    
    signal_text = signal.get('text', '').lower()
    signal_time = signal.get('timestamp')
    signal_lat = signal.get('lat') or signal.get('latitude')
    signal_lon = signal.get('lon') or signal.get('longitude')
    
    if not signal_time:
        return False
    
    if isinstance(signal_time, str):
        try:
            signal_time = datetime.fromisoformat(signal_time.replace('Z', '+00:00'))
        except:
            return False
    elif isinstance(signal_time, datetime) and signal_time.tzinfo is None:
        signal_time = signal_time.replace(tzinfo=timezone.utc)
    
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
    
    for alert in existing_alerts:
        alert_time = alert.get('timestamp')
        
        if isinstance(alert_time, str):
            try:
                alert_time = datetime.fromisoformat(alert_time.replace('Z', '+00:00'))
            except:
                continue
        
        if alert_time < cutoff_time:
            continue
        
        alert_text = alert.get('text', '').lower()
        if len(set(signal_text.split()) & set(alert_text.split())) > 5:

            if signal_lat and signal_lon and alert.get('location'):
                alert_loc = alert['location']
                if isinstance(alert_loc, dict):
                    alert_lat = alert_loc.get('lat')
                    alert_lon = alert_loc.get('lon')
                    
                    if alert_lat and alert_lon:
                        distance = haversine_distance(
                            signal_lat, signal_lon,
                            alert_lat, alert_lon
                        )
                        
                        if distance <= distance_km:
                            return True
    
    return False

def run_detection_pipeline(broadcast=True):

    db = SessionLocal()
    
    try:
        signals = ingest_signals(db)
        print(f"[Detection] Ingested {len(signals)} signals")
    except Exception as e:
        print(f"[Detection] Failed to ingest signals: {e}")
        return {"alerts": [], "spikes": []}

    alerts = []
    log_alerts = []

    recent_log = _load_alerts_log()
    recent_alerts = recent_log.get('alerts', [])[-100:] 

    for signal in signals:
        try:
            if _is_duplicate_signal(signal, recent_alerts):
                print(f"[Detection] Skipping duplicate signal: {signal.get('text', '')[:50]}")
                
                if signal.get('id') and signal.get('source') != 'manual':
                    mark_signal_processed(
                        db, 
                        signal['id'],
                        detection_result={'duplicate': True}
                    )
                continue
            
            event_type = classify_event(signal)
            if not event_type:
                continue

            severity = estimate_severity(signal, event_type)
            confidence = estimate_confidence(signal, event_type)
            
            if signal.get('source') in ['twitter', 'reddit'] and signal.get('engagement_score', 0) > 50:
                confidence = min(confidence + 0.15, 1.0)
                print(f"[Detection] Boosted confidence for high-engagement signal: {confidence}")

            alerts.append({
                "event_type": event_type,
                "severity": severity,
                "confidence": confidence,
                "location": signal.get("location"),
                "timestamp": signal.get("timestamp"),
                "source": signal.get("source"),
                "text": signal.get("text")
            })

            log_alert = _format_alert_for_log(signal, event_type, severity, confidence)

            try:
                trust_result = trust_agent.verify_alert(log_alert)
                log_alert.update(trust_result)
            except Exception as e:
                print(f"[Detection] Trust verification failed: {e}")
                log_alert["decision"] = "ERROR"
                log_alert["verified"] = False

            log_alerts.append(log_alert)

            # --- Save to SQL Database for Dashboard Visibility ---
            try:
                if log_alert.get('lat') is not None and log_alert.get('lon') is not None:
                    new_crisis = Crisis(
                        id=log_alert.get('alert_id'),
                        title=f"{str(log_alert.get('crisis_type', 'Alert')).title()} at {log_alert.get('location', 'Unknown')}",
                        description=log_alert.get('message', ''),
                        crisis_type=log_alert.get('crisis_type', 'other'),
                        severity=log_alert.get('severity', 'medium'),
                        latitude=log_alert.get('lat'),
                        longitude=log_alert.get('lon'),
                        location=log_alert.get('location', 'Unknown'),
                        status=log_alert.get('status', 'Detected'),
                        trust_score=log_alert.get('trust_score', 0.5),
                        verified=log_alert.get('decision') == 'VERIFIED',
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc)
                    )
                    db.add(new_crisis)
                    db.commit()
            except Exception as e:
                print(f"[Detection] Failed to save to DB: {e}")
                db.rollback()
            
            if signal.get('id') and signal.get('source') != 'manual':
                try:
                    mark_signal_processed(
                        db, 
                        signal['id'],
                        detection_result={
                            'event_type': event_type,
                            'severity': severity,
                            'confidence': confidence
                        }
                    )
                except Exception as e:
                    print(f"[Detection] Failed to mark signal as processed: {e}")

        except Exception as e:
            print(f"[Detection] Error processing signal {signal.get('id')}: {e}")

    if broadcast and log_alerts:
        import asyncio
        
        for alert in log_alerts:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(broadcast_new_alert(alert))
                loop.close()
            except Exception as e:
                print(f"[Detection] Broadcast error: {e}")

    if log_alerts:
        try:
            log_data = _load_alerts_log()
            log_data["alerts"].extend(log_alerts)
            log_data["total_count"] = len(log_data["alerts"])
            log_data["last_updated"] = datetime.utcnow().isoformat() + "Z"
            _save_alerts_log(log_data)
        except Exception as e:
            print(f"[Detection] Error saving to alerts_log.json: {e}")

    try:
        spikes = detect_spikes(alerts)
    except Exception as e:
        print(f"[Detection] Spike detection failed: {e}")
        spikes = []
    
    db.close()
    
    return {"alerts": alerts, "spikes": spikes}

if __name__ == "__main__":
    print("[Detection] Running manually...")
    result = run_detection_pipeline()
    print("[Detection] Result:", result)
