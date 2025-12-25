# backend/agents/detection_agent.py

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.agents.detection.signal_ingestion import ingest_signals
from backend.agents.detection.event_classifier import classify_event
from backend.agents.detection.severity_estimator import estimate_severity
from backend.agents.detection.confidence_estimator import estimate_confidence
from backend.agents.detection.spike_detector import detect_spikes


def run_detection_pipeline():
    """
    Main Detection Agent pipeline.
    Converts raw signals into structured alerts.
    """

    # 1. Get raw signals (social media / SMS / manual)
    signals = ingest_signals()

    alerts = []

    # 2. Process each signal
    for signal in signals:

        # Classify disaster type
        event_type = classify_event(signal)
        if not event_type:
            continue  # Ignore non-crisis messages

        # Estimate severity (how bad)
        severity = estimate_severity(signal, event_type)

        # Estimate confidence (how reliable)
        confidence = estimate_confidence(signal, event_type)

        # Build alert object
        alert = {
            "event_type": event_type,
            "severity": severity,
            "confidence": confidence,
            "location": {
                "lat": signal.get("lat"),
                "lon": signal.get("lon")
            },
            "timestamp": signal["timestamp"],
            "source": signal["source"],
            "text": signal["text"]
        }

        alerts.append(alert)

    # 3. Detect spikes (multiple reports from same area)
    spikes = detect_spikes(alerts)

    return {
        "alerts": alerts,
        "spikes": spikes
    }


# Local testing
if __name__ == "__main__":
    output = run_detection_pipeline()
    print(output)
