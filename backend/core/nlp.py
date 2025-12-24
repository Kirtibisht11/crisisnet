# utils/nlp.py

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
    """
    Normalize text for keyword matching.
    """
    if not text:
        return ""
    return text.lower().strip()


def extract_crisis_types(text: str):
    """
    Returns a list of detected crisis types based on keywords.
    """
    detected = []
    normalized = normalize_text(text)

    for crisis_type, keywords in CRISIS_KEYWORDS.items():
        for keyword in keywords:
            if keyword in normalized:
                detected.append(crisis_type)
                break

    return list(set(detected))


def urgency_score(text: str) -> int:
    """
    Higher score = more urgent situation.
    """
    score = 0
    normalized = normalize_text(text)

    for term in URGENT_TERMS:
        if term in normalized:
            score += 1

    return score


if __name__ == "__main__":
    sample = "Water rising fast, people trapped near bridge"
    print(extract_crisis_types(sample))
    print(urgency_score(sample))
