"""
Geo Clustering Utility
Groups nearby alerts using simple rounding logic.
"""

def cluster_by_location(alerts, precision=2):
    """
    Groups alerts by rounded latitude and longitude.

    Args:
        alerts (list): list of alert dicts

    Returns:
        dict: (lat, lon) -> list of alerts
    """

    clusters = {}

    for alert in alerts:
        loc = alert.get("location")
        if not loc:
            continue

        try:
            key = (round(float(loc["lat"]), precision), round(float(loc["lon"]), precision))
        except Exception:
            continue

        clusters.setdefault(key, []).append(alert)

    return clusters
