# agents/detection.py

import sys
import os
import json
from collections import defaultdict

# Add parent directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from core.nlp import extract_crisis_types, urgency_score


def load_social_feed(path=None):
    """
    Loads social feed messages from JSON file.
    """
    if path is None:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(backend_dir, "data", "social_feed.json")
    with open(path, "r") as f:
        return json.load(f)


def detect_from_message(message):
    """
    Converts a raw social message into an alert candidate.
    Returns None if no crisis detected.
    """
    text = message.get("text", "")
    crisis_types = extract_crisis_types(text)

    if not crisis_types:
        return None  # noise / non-crisis message

    score = urgency_score(text)

    alert = {
        "message_id": message["id"],
        "crisis_type": crisis_types,
        "urgency_score": score,
        "location": {
            "lat": message["lat"],
            "lon": message["lon"]
        },
        "timestamp": message["timestamp"],
        "source": message["source"]
    }

    return alert


def run_detection():
    """
    Runs detection on entire social feed.
    """
    feed = load_social_feed()
    detected_alerts = []

    for msg in feed:
        alert = detect_from_message(msg)
        if alert:
            detected_alerts.append(alert)

    return detected_alerts


def geo_bucket(lat, lon, precision=2):
    """
    Groups nearby locations by rounding coordinates.
    precision=2 ≈ ~1km resolution
    """
    return (round(lat, precision), round(lon, precision))


def detect_spikes(alerts, min_reports=2):
    """
    Detects clusters of alerts from nearby locations.
    """
    buckets = defaultdict(list)

    for alert in alerts:
        lat = alert["location"]["lat"]
        lon = alert["location"]["lon"]
        key = geo_bucket(lat, lon)
        buckets[key].append(alert)

    spikes = []

    for location_key, grouped_alerts in buckets.items():
        if len(grouped_alerts) >= min_reports:
            spikes.append({
                "location_bucket": {
                    "lat": location_key[0],
                    "lon": location_key[1]
                },
                "report_count": len(grouped_alerts),
                "alerts": grouped_alerts
            })

    return spikes


if __name__ == "__main__":
    alerts = run_detection()
    print(f"[DETECTION] Total alerts detected: {len(alerts)}")

    for alert in alerts:
        print(alert)

    spikes = detect_spikes(alerts)
    print(f"\n[DETECTION] Spikes detected: {len(spikes)}")

    for spike in spikes:
        print("\n[SPIKE]")
        print(f"Location bucket: {spike['location_bucket']}")
        print(f"Reports: {spike['report_count']}")
