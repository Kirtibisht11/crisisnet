"""
Severity Estimator
Assigns severity level based on urgency score.
"""

from backend.agents.detection.sentiment_engine import sentiment_score


def estimate_severity(signal, event_type):
    """
    Estimates severity of a crisis.

    Args:
        signal (dict)
        event_type (str)

    Returns:
        str: low, medium, or high
    """

    text = signal.get("text", "")
    score = sentiment_score(text)

    if score >= 3:
        return "high"
    elif score == 2:
        return "medium"
    else:
        return "low"
