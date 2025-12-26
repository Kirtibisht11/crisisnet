from typing import List, Dict
from datetime import datetime
import uuid


class ResourceMatcher:
    """
    Round-1 MVP:
    - Bundles matched resources and volunteers into a single allocation
    - Keeps allocation logic simple and demo-safe
    """

    def __init__(self):
        self.allocation_history = []

    def create_allocation(
        self,
        crisis: Dict,
        resources: List[Dict],
        volunteers: List[Dict]
    ) -> Dict:
        allocation_id = str(uuid.uuid4())

        allocation = {
            "allocation_id": allocation_id,
            "crisis_id": crisis.get("id", allocation_id),
            "crisis_type": crisis.get("type"),
            "location": crisis.get("location"),
            "timestamp": datetime.utcnow().isoformat(),
            "resources": self._format_resources(resources),
            "volunteers": self._format_volunteers(volunteers),
            "eta_minutes": self._calculate_overall_eta(resources),
            "status": "allocated"
        }

        self.allocation_history.append(allocation)
        return allocation

    # ---------- FORMATTERS ----------

    def _format_resources(self, resources: List[Dict]) -> List[Dict]:
        return [
            {
                "id": r.get("id"),
                "type": r.get("type"),
                "distance_km": r.get("distance_km", 0),
                "eta_minutes": r.get("eta_minutes", 0)
            }
            for r in resources
        ]

    def _format_volunteers(self, volunteers: List[Dict]) -> List[Dict]:
        return [
            {
                "id": v.get("id"),
                "skills": v.get("skills", [])
            }
            for v in volunteers
        ]

    # ---------- HELPERS ----------

    def _calculate_overall_eta(self, resources: List[Dict]) -> int:
        """
        Round-1 rule:
        Overall ETA is based on fastest arriving resource.
        Volunteers are assumed to coordinate locally.
        """
        if not resources:
            return 999

        return min(r.get("eta_minutes", 999) for r in resources)

    # ---------- OPTIONAL (ROUND-2) ----------

    def get_allocation_by_id(self, allocation_id: str) -> Dict | None:
        for allocation in self.allocation_history:
            if allocation["allocation_id"] == allocation_id:
                return allocation
        return None
