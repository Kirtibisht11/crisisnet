import math
from typing import List, Dict


class GeoOptimizer:
    """
    Round-1 MVP:
    - Calculates distance and ETA
    - Ranks resources based on proximity + crisis priority
    - Does NOT mutate original resource objects
    """

    EARTH_RADIUS_KM = 6371

    AVG_SPEED_KMH = {
        "ambulance": 60,
        "boat": 25,
        "fire_truck": 50,
        "rescue_vehicle": 55
    }

    # ---------- CORE GEOGRAPHY ----------

    def haversine_distance(self, loc1: Dict, loc2: Dict) -> float:
        lat1, lon1 = math.radians(loc1["lat"]), math.radians(loc1["lon"])
        lat2, lon2 = math.radians(loc2["lat"]), math.radians(loc2["lon"])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        return round(self.EARTH_RADIUS_KM * c, 2)

    def calculate_eta_minutes(self, distance_km: float, resource_type: str) -> int:
        speed = self.AVG_SPEED_KMH.get(resource_type, 40)
        return max(1, int((distance_km / speed) * 60))

    # ---------- OPTIMIZATION ----------

    def optimize_allocation(
        self,
        resources: List[Dict],
        crisis_location: Dict,
        crisis_priority: int
    ) -> List[Dict]:
        scored_resources = []

        for r in resources:
            distance = self.haversine_distance(r["location"], crisis_location)
            eta = self.calculate_eta_minutes(distance, r["type"])

            score = self._priority_score(distance, eta, crisis_priority)

            scored_resources.append({
                **r,
                "distance_km": distance,
                "eta_minutes": eta,
                "score": score
            })

        scored_resources.sort(key=lambda x: x["score"], reverse=True)

        return self._select_top(scored_resources, crisis_priority)

    def _priority_score(self, distance: float, eta: int, crisis_priority: int) -> float:
        distance_score = max(0, 100 - (distance * 2))
        eta_score = max(0, 100 - eta)

        priority_weight = 1 + (crisis_priority * 0.1)

        return round((distance_score * 0.4 + eta_score * 0.6) * priority_weight, 2)

    def _select_top(self, resources: List[Dict], priority: int) -> List[Dict]:
        if priority >= 8:
            return resources[:5]
        if priority >= 5:
            return resources[:3]
        return resources[:2]

    # ---------- ROUND-2 HELPERS (NOT USED IN MVP) ----------

    def calculate_coverage_radius(self, resources: List[Dict], center: Dict) -> float:
        if not resources:
            return 0.0
        return max(
            self.haversine_distance(r["location"], center) for r in resources
        )

    def find_optimal_staging_point(self, crisis_locations: List[Dict]) -> Dict:
        if not crisis_locations:
            return {"lat": 0.0, "lon": 0.0}

        avg_lat = sum(loc["lat"] for loc in crisis_locations) / len(crisis_locations)
        avg_lon = sum(loc["lon"] for loc in crisis_locations) / len(crisis_locations)

        return {
            "lat": round(avg_lat, 6),
            "lon": round(avg_lon, 6)
        }
