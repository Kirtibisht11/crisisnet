"""
Detection Agent Orchestrator
Runs the full detection pipeline:
- Ingests raw signals
- Classifies crisis type
- Estimates severity & confidence
- Detects spikes
"""

from backend.agents.detection.signal_ingestion import ingest_signals
from backend.agents.detection.event_classifier import classify_event
from backend.agents.detection.severity_estimator import estimate_severity
from backend.agents.detection.confidence_estimator import estimate_confidence
from backend.agents.detection.spike_detector import detect_spikes


def run_detection_pipeline():
    """Main entry point for Detection Agent."""

    try:
        signals = ingest_signals()
    except Exception as e:
        print(f"[Detection] Failed to ingest signals: {e}")
        return {"alerts": [], "spikes": []}

    alerts = []

    for signal in signals:
        try:
            event_type = classify_event(signal)
            if not event_type:
                continue  # Skip non-crisis messages

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

        except Exception as e:
            # Skip any problematic signal but don't crash system
            print(f"[Detection] Error processing signal {signal.get('id')}: {e}")

    try:
        spikes = detect_spikes(alerts)
    except Exception as e:
        print(f"[Detection] Spike detection failed: {e}")
        spikes = []

    return {"alerts": alerts, "spikes": spikes}


