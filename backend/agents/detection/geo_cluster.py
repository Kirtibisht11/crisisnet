def cluster_by_location(alerts, precision=2):
    """
    Groups alerts by approximate location using rounded coordinates.

    Args:
        alerts (list): List of alert dictionaries
        precision (int): Decimal precision for grouping

    Returns:
        dict: location_key → list of alerts
    """

    clusters = {}

    for alert in alerts:
        lat = round(alert["location"]["lat"], precision)
        lon = round(alert["location"]["lon"], precision)
        key = f"{lat}_{lon}"

        if key not in clusters:
            clusters[key] = []

        clusters[key].append(alert)

    return clusters
