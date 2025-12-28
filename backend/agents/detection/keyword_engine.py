"""
Keyword Matching Engine
Matches crisis-related keywords in message text.
"""

def keyword_match(text, keyword_map):
    """
    Checks text against keyword map and returns matched crisis types.

    Args:
        text (str): Message text
        keyword_map (dict): crisis_type -> list of keywords

    Returns:
        list: matched crisis types
    """

    if not text or not isinstance(text, str):
        return []

    text = text.lower()
    matches = []

    for crisis_type, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in text:
                matches.append(crisis_type)
                break  # Avoid duplicate entries

    return list(set(matches))
