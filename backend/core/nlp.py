# core/nlp.py

CRISIS_KEYWORDS = {
    "flood": [
        "flood", "water rising", "submerged",
        "water entering", "people stuck", "overflow"
    ],
    "fire": [
        "fire", "smoke", "burning",
        "blast", "explosion"
    ],
    "medical": [
        "injured", "unconscious", "bleeding",
        "medical help", "ambulance"
    ],
    "earthquake": [
        "earthquake", "tremor", "shaking"
    ],
    "collapse": [
        "collapsed", "building fell", "structure fell"
    ]
}

URGENT_TERMS = [
    "urgent", "help", "emergency",
    "trapped", "danger", "critical",
    "immediately", "people stuck"
]


def normalize_text(text: str) -> str:
    """Lowercase and clean text."""
    if not text:
        return ""
    return text.lower().strip()


def extract_crisis_types(text: str):
    """Returns list of detected crisis categories."""
    detected = []
    normalized = normalize_text(text)

    for crisis_type, keywords in CRISIS_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized:
                detected.append(crisis_type)
                break

    return list(set(detected))


def urgency_score(text: str) -> int:
    """Returns urgency score based on emergency terms."""
    score = 0
    normalized = normalize_text(text)

    for term in URGENT_TERMS:
        if term in normalized:
            score += 1

    return score
