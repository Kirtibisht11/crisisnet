import math
from typing import Dict


EARTH_RADIUS_KM = 6371


def haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculate great-circle distance (in KM) between two lat/lon points.
    """

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )

    return round(
        2 * EARTH_RADIUS_KM * math.atan2(math.sqrt(a), math.sqrt(1 - a)),
        3
    )


def distance_between_locations(
    loc1: Dict,
    loc2: Dict
) -> float:
    """
    Calculate distance (KM) between two location dicts:
    { "lat": float, "lon": float }
    """

    _validate_location(loc1)
    _validate_location(loc2)

    return haversine_distance(
        loc1["lat"],
        loc1["lon"],
        loc2["lat"],
        loc2["lon"]
    )


def _validate_location(location: Dict):
    if not isinstance(location, dict):
        raise ValueError("Location must be a dictionary")

    if "lat" not in location or "lon" not in location:
        raise ValueError("Location must contain 'lat' and 'lon'")

    if not (-90 <= location["lat"] <= 90):
        raise ValueError("Latitude must be between -90 and 90")

    if not (-180 <= location["lon"] <= 180):
        raise ValueError("Longitude must be between -180 and 180")
