import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.agents.detection.sentiment_engine import sentiment_score


def estimate_severity(signal, event_type):
    """
    Estimates severity of the disaster.

    Args:
        signal (dict): Raw disaster signal
        event_type (str): Classified disaster type

    Returns:
        int: Severity score (1 to 5)
    """

    # Base severity from urgency in text
    base_severity = sentiment_score(signal.get("text", ""))

    # Disaster-type-based escalation
    if event_type in ["earthquake", "collapse"]:
        base_severity += 2
    elif event_type in ["fire"]:
        base_severity += 1

    # Cap severity between 1 and 5
    severity = max(1, min(base_severity, 5))

    return severity
