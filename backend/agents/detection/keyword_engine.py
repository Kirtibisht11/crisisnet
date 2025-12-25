def keyword_match(text, keyword_map):
    """
    Matches disaster-related keywords in text.

    Args:
        text (str): Incoming message text
        keyword_map (dict): Disaster type → keyword list

    Returns:
        list: Matched disaster types
    """

    if not text:
        return []

    text = text.lower()
    matches = []

    for disaster_type, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in text:
                matches.append(disaster_type)
                break

    return list(set(matches))
