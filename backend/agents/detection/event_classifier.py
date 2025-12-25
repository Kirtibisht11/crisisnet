import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from backend.agents.detection.keyword_engine import keyword_match


KEYWORD_MAP = {
    "flood": [
        "flood",
        "water rising",
        "submerged",
        "people stuck",
        "overflow"
    ],
    "fire": [
        "fire",
        "smoke",
        "burning",
        "blast",
        "explosion"
    ],
    "medical": [
        "injured",
        "unconscious",
        "bleeding",
        "medical help"
    ],
    "earthquake": [
        "earthquake",
        "tremor",
        "shaking"
    ],
    "collapse": [
        "collapsed",
        "building fell",
        "structure fell"
    ]
}


def classify_event(signal):
    """
    Classifies disaster type based on message text.

    Args:
        signal (dict): Raw signal data

    Returns:
        str or None: Disaster type
    """

    text = signal.get("text", "")
    matches = keyword_match(text, KEYWORD_MAP)

    if not matches:
        return None

    # Return the most relevant disaster type
    return matches[0]
