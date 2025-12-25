# backend/agents/detection/sentiment_engine.py

URGENT_TERMS = [
    "urgent",
    "help",
    "emergency",
    "trapped",
    "danger",
    "critical",
    "bleeding",
    "unconscious"
]


def sentiment_score(text):
    """
    Calculates urgency score based on presence of critical terms.

    Args:
        text (str): Message text

    Returns:
        int: Urgency score (higher = more urgent)
    """

    if not text:
        return 0

    text = text.lower()
    score = 0

    for term in URGENT_TERMS:
        if term in text:
            score += 1

    return score
