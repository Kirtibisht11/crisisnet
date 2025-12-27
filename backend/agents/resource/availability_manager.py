from typing import List, Dict
from datetime import datetime


class AvailabilityManager:
    """
    Round-1 MVP:
    - Tracks availability of resources and volunteers
    - Marks them allocated or released
    - No time-based auto-release (Round-2 feature)
    """

    def __init__(self):
        self.allocated_items = {}

    # ---------- AVAILABILITY CHECKS ----------

    def get_available(self, resources: List[Dict], crisis_type: str) -> List[Dict]:
        compatible_types = self._get_compatible_types(crisis_type)

        return [
            r for r in resources
            if r.get("available", True) and r.get("type") in compatible_types
        ]

    def get_available_volunteers(self, volunteers: List[Dict]) -> List[Dict]:
        return [
            v for v in volunteers
            if v.get("available", True)
        ]

    # ---------- ALLOCATION MANAGEMENT ----------

    def mark_allocated(self, items: List[Dict]):
        for item in items:
            item_id = item["id"]
            item["available"] = False
            self.allocated_items[item_id] = {
                "item": item,
                "allocated_at": datetime.utcnow().isoformat()
            }

    def release_items(self, items: List[Dict]):
        for item in items:
            item_id = item["id"]
            item["available"] = True
            if item_id in self.allocated_items:
                del self.allocated_items[item_id]

    # ---------- HELPERS ----------

    def _get_compatible_types(self, crisis_type: str) -> List[str]:
        compatibility_map = {
            "flood": ["boat", "rescue_vehicle", "ambulance"],
            "fire": ["fire_truck", "ambulance", "rescue_vehicle"],
            "medical": ["ambulance", "rescue_vehicle"],
            "earthquake": ["rescue_vehicle", "ambulance", "shelter"],
            "accident": ["ambulance", "rescue_vehicle"]
        }
        return compatibility_map.get(crisis_type, ["ambulance", "rescue_vehicle"])
