"""
Confidence Estimator
Estimates confidence of detection based on clarity of signal.
"""

def estimate_confidence(signal, event_type):
    """
    Estimates confidence score (0–1).

    Args:
        signal (dict)
        event_type (str)

    Returns:
        float
    """

    text = signal.get("text", "")
    source = signal.get("source", "")

    score = 0.4  # base confidence

    if len(text) > 30:
        score += 0.2

    if source in ["sms", "manual"]:
        score += 0.2  # more trustworthy

    if event_type:
        score += 0.2

    return round(min(score, 1.0), 2)
