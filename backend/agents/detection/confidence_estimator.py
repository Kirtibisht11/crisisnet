def estimate_confidence(signal, event_type):
    """
    Estimates confidence score for a detected disaster signal.

    Args:
        signal (dict): Raw disaster signal
        event_type (str): Classified disaster type

    Returns:
        float: Confidence score (0.0 to 1.0)
    """

    confidence = 0.5  # base confidence

    # Source-based confidence
    if signal.get("source") == "sms":
        confidence += 0.2
    elif signal.get("source") == "manual":
        confidence += 0.3

    # Text detail confidence
    text_length = len(signal.get("text", ""))
    if text_length > 40:
        confidence += 0.1

    # Cap confidence between 0 and 1
    return round(min(confidence, 1.0), 2)
