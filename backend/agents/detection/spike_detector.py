from collections import defaultdict


def geo_bucket(lat, lon, precision=2):
    """
    Groups nearby locations by rounding coordinates.
    precision=2 ≈ same neighborhood / locality
    """
    return round(lat, precision), round(lon, precision)


def detect_spikes(alerts, threshold=2):
    """
    Detects spikes where multiple alerts originate from
    approximately the same location.

    Args:
        alerts (list): List of alert dictionaries
        threshold (int): Minimum number of reports to be a spike

    Returns:
        list: Detected spike objects
    """

    buckets = defaultdict(list)

    for alert in alerts:
        lat = alert["location"]["lat"]
        lon = alert["location"]["lon"]
        key = geo_bucket(lat, lon)
        buckets[key].append(alert)

    spikes = []

    for location_key, grouped_alerts in buckets.items():
        if len(grouped_alerts) >= threshold:
            spikes.append({
                "location": {
                    "lat": location_key[0],
                    "lon": location_key[1]
                },
                "report_count": len(grouped_alerts),
                "alerts": grouped_alerts
            })

    return spikes
