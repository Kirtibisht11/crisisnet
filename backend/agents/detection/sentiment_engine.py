"""
Urgency / Sentiment Engine
Scores urgency of a crisis message based on keywords.
"""

URGENT_TERMS = [
    "urgent", "help", "emergency", "trapped",
    "danger", "critical", "bleeding", "unconscious"
]


def sentiment_score(text):
    """
    Calculates urgency score.

    Args:
        text (str): message text

    Returns:
        int: urgency score
    """

    if not text or not isinstance(text, str):
        return 0

    score = 0
    text = text.lower()

    for term in URGENT_TERMS:
        if term in text:
            score += 1

    return score
