"""
Spike Detector
Finds clusters of alerts from the same area.
"""

from collections import defaultdict


def geo_bucket(lat, lon, precision=2):
    """Rounds coordinates to group nearby alerts."""
    try:
        return round(float(lat), precision), round(float(lon), precision)
    except Exception:
        return None


def detect_spikes(alerts, threshold=2):
    """
    Detects spikes in alerts list.

    Args:
        alerts (list): list of alert dicts
        threshold (int): minimum count for spike

    Returns:
        list: spike objects
    """

    buckets = defaultdict(list)

    for alert in alerts:
        loc = alert.get("location")
        if not loc:
            continue

        key = geo_bucket(loc.get("lat"), loc.get("lon"))
        if not key:
            continue

        buckets[key].append(alert)

    spikes = []
    for key, grouped in buckets.items():
        if len(grouped) >= threshold:
            spikes.append({
                "location": {"lat": key[0], "lon": key[1]},
                "count": len(grouped),
                "alerts": grouped
            })

    return spikes
