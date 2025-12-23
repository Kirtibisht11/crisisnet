# backend/agents/resource_agent.py

import json
from core.geo import haversine_distance

# ---------------- LOAD DATA ---------------- #

with open("backend/data/resources.json", "r") as f:
    RESOURCES = json.load(f)

with open("backend/data/volunteers.json", "r") as f:
    VOLUNTEERS = json.load(f)


# ---------------- HELPERS ---------------- #

def find_nearest_available(items, alert_location, max_distance_km=10):
    """
    Find the nearest available item (resource or volunteer)
    """
    nearest = None
    min_distance = float("inf")

    for item in items:
        if not item.get("available", False):
            continue

        dist = haversine_distance(
            alert_location["lat"],
            alert_location["lon"],
            item["location"]["lat"],
            item["location"]["lon"]
        )

        if dist < min_distance and dist <= max_distance_km:
            min_distance = dist
            nearest = item

    if nearest:
        return nearest, round(min_distance, 2)

    return None, None


# ---------------- MAIN AGENT ---------------- #

def run(verified_alert: dict):
    """
    Resource Agent
    Input: verified alert from Trust Agent
    Output: assigned resource + volunteer
    """

    location = verified_alert["location"]
    event_type = verified_alert["event_type"]

    # Choose relevant resources
    if event_type == "flood":
        eligible_resources = [
            r for r in RESOURCES if r["type"] in ["boat", "shelter"]
        ]
    else:
        eligible_resources = RESOURCES

    # Assign resource
    resource, resource_distance = find_nearest_available(
        eligible_resources, location
    )

    # Assign volunteer
    volunteer, volunteer_distance = find_nearest_available(
        VOLUNTEERS, location
    )

    # Handle failure
    if not resource and not volunteer:
        return {
            "status": "failed",
            "reason": "No nearby resources or volunteers available"
        }

    # Mark as unavailable (demo realism)
    if resource:
        resource["available"] = False
    if volunteer:
        volunteer["available"] = False

    return {
        "status": "assigned",
        "alert_id": verified_alert.get("alert_id"),
        "event_type": event_type,
        "resource": {
            "id": resource["id"] if resource else None,
            "type": resource["type"] if resource else None,
            "distance_km": resource_distance
        },
        "volunteer": {
            "id": volunteer["id"] if volunteer else None,
            "skill": volunteer["skill"] if volunteer else None,
            "distance_km": volunteer_distance
        }
    }
