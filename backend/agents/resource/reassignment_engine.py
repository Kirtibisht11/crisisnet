from typing import List, Dict
from datetime import datetime
from .priority_engine import PriorityEngine
from .geo_optimizer import GeoOptimizer


class ReassignmentEngine:
    """
    Optimized Round-1 implementation:
    - Intelligent reassignment scoring
    - Authority-triggered execution
    - Fully compatible with Round-2 learning & analytics
    """

    PRIORITY_DELTA_THRESHOLD = 2
    MAX_RESOURCE_DISTANCE_KM = 25
    MAX_VOLUNTEER_DISTANCE_KM = 15

    def __init__(self):
        self.priority_engine = PriorityEngine()
        self.geo_optimizer = GeoOptimizer()
        self.reassignment_log = []

    # ---------- CORE LOGIC ----------

    def analyze_reassignment_need(
        self,
        new_crisis: Dict,
        resources: List[Dict],
        volunteers: List[Dict]
    ) -> Dict:
        """
        Analyzes whether reassignment is justified and proposes candidates.
        Does NOT mutate state.
        """

        new_priority = self.priority_engine.calculate_priority(new_crisis)

        candidates = {
            "resources": [],
            "volunteers": [],
            "new_priority": new_priority,
            "reassignment_recommended": False
        }

        for r in resources:
            if self._is_reassignable(r, new_priority, new_crisis, is_resource=True):
                candidates["resources"].append(r)

        for v in volunteers:
            if self._is_reassignable(v, new_priority, new_crisis, is_resource=False):
                candidates["volunteers"].append(v)

        if candidates["resources"] or candidates["volunteers"]:
            candidates["reassignment_recommended"] = True

        return candidates

    # ---------- EXECUTION ----------

    def execute_reassignment(
        self,
        approved_resources: List[Dict],
        approved_volunteers: List[Dict],
        new_crisis: Dict
    ) -> Dict:
        """
        Executes reassignment AFTER authority approval.
        """

        new_priority = self.priority_engine.calculate_priority(new_crisis)
        crisis_id = new_crisis.get("id", "unknown")

        reassigned = []

        for r in approved_resources:
            self._apply_reassignment(r, crisis_id, new_priority)
            reassigned.append({"resource_id": r["id"]})

        for v in approved_volunteers:
            self._apply_reassignment(v, crisis_id, new_priority)
            reassigned.append({"volunteer_id": v["id"]})

        record = {
            "crisis_id": crisis_id,
            "priority": new_priority,
            "reassigned_assets": reassigned,
            "timestamp": datetime.utcnow().isoformat()
        }

        self.reassignment_log.append(record)
        return record

    # ---------- INTERNAL HELPERS ----------

    def _is_reassignable(
        self,
        asset: Dict,
        new_priority: int,
        new_crisis: Dict,
        is_resource: bool
    ) -> bool:
        """
        Determines whether an asset can be reassigned based on:
        - Allocation status
        - Priority delta
        - Distance feasibility
        """

        if asset.get("available", True):
            return False

        current_priority = asset.get("allocation_priority", 0)

        if new_priority <= current_priority + self.PRIORITY_DELTA_THRESHOLD:
            return False

        distance = self.geo_optimizer.haversine_distance(
            asset["location"], new_crisis["location"]
        )

        max_distance = (
            self.MAX_RESOURCE_DISTANCE_KM
            if is_resource
            else self.MAX_VOLUNTEER_DISTANCE_KM
        )

        return distance <= max_distance

    def _apply_reassignment(
        self,
        asset: Dict,
        crisis_id: str,
        priority: int
    ):
        asset["allocated_to"] = crisis_id
        asset["allocation_priority"] = priority
        asset["allocated_at"] = datetime.utcnow().isoformat()
        asset["available"] = False
