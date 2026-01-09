"""
Detection Agent Orchestrator
Runs the full detection pipeline:
- Ingests raw signals
- Classifies crisis type
- Estimates severity & confidence
- Detects spikes
- Logs alerts to alerts_log.json
"""

import json
import os
from datetime import datetime
import uuid

from .detection.signal_ingestion import ingest_signals
from .detection.event_classifier import classify_event
from .detection.severity_estimator import estimate_severity
from .detection.confidence_estimator import estimate_confidence
from .detection.spike_detector import detect_spikes
from backend.agents.trust_agent import TrustAgent
trust_agent = TrustAgent()

def _get_alerts_log_path():
    base_dir = os.path.dirname(os.path.dirname(__file__))  # backend/
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "alerts_log.json")




def _load_alerts_log():
    """Load current alerts log."""
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



def _format_alert_for_log(signal, event_type, severity, confidence):
    """Format detection output as alert for alerts_log.json."""
    return {
        "alert_id": f"DET_{uuid.uuid4().hex[:8]}",
        "user_id": signal.get("source", "detection_system"),
        "crisis_type": event_type or "other",
        "location": signal.get("location", "Unknown"),
        "lat": signal.get("lat"),
        "lon": signal.get("lon"),
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


def run_detection_pipeline():
    """Main entry point for Detection Agent."""

    try:
        signals = ingest_signals()
        print(f"[Detection] Ingested {len(signals)} signals")
    except Exception as e:
        print(f"[Detection] Failed to ingest signals: {e}")
        return {"alerts": [], "spikes": []}

    alerts = []
    log_alerts = []

    for signal in signals:
        try:
            event_type = classify_event(signal)
            if not event_type:
                continue

            severity = estimate_severity(signal, event_type)
            confidence = estimate_confidence(signal, event_type)

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

        except Exception as e:
            print(f"[Detection] Error processing signal {signal.get('id')}: {e}")

    # Save detected alerts to log file
    if log_alerts:
        try:
            log_data = _load_alerts_log()
            log_data["alerts"].extend(log_alerts)
            log_data["total_count"] = len(log_data["alerts"])
            log_data["last_updated"] = datetime.utcnow().isoformat() + "Z"
            _save_alerts_log(log_data)
            try:
                size = os.path.getsize(_get_alerts_log_path())
                with open(_get_alerts_log_path(), 'r', encoding='utf-8') as fh:
                    sample = fh.read(1024)
                print(f"[Detection] alerts_log.json size={size} sample_start={sample[:200]!r}")
            except Exception as e:
                print(f"[Detection] Could not read back alerts_log.json: {e}")
        except Exception as e:
            print(f"[Detection] Error saving to alerts_log.json: {e}")

    try:
        spikes = detect_spikes(alerts)
    except Exception as e:
        print(f"[Detection] Spike detection failed: {e}")
        spikes = []

    return {"alerts": alerts, "spikes": spikes}

if __name__ == "__main__":
    print("[Detection] Running manually...")
    result = run_detection_pipeline()
    print("[Detection] Result:", result)
