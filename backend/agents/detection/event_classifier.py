"""
Event Classifier
Determines crisis type from message content.
"""

from backend.agents.detection.keyword_engine import keyword_match

# Crisis keywords
CRISIS_KEYWORDS = {
    "flood": ["flood", "water rising", "submerged"],
    "fire": ["fire", "smoke", "burning"],
    "earthquake": ["earthquake", "tremor", "shaking"],
    "medical": ["injured", "unconscious", "bleeding", "ambulance"],
    "collapse": ["collapsed", "building fell", "structure fell"],
    "landslide": ["landslide", "rocks falling", "mud"]
}


def classify_event(signal):
    """
    Classifies signal into a crisis type.

    Args:
        signal (dict): raw signal

    Returns:
        str or None
    """

    text = signal.get("text")
    if not text:
        return None

    matches = keyword_match(text, CRISIS_KEYWORDS)
    return matches[0] if matches else None
