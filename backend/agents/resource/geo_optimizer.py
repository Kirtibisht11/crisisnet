import math
from typing import List, Dict, Optional


class GeoOptimizer:
    """
    Round-1 MVP:
    - Calculates distance and ETA
    - Ranks resources based on proximity + crisis priority
    - Does NOT mutate original resource objects

    Location Enhancements:
    - Safe handling of missing / partial coordinates
    - Supports fallback/manual locations without breaking MVP
    """

    EARTH_RADIUS_KM = 6371

    AVG_SPEED_KMH = {
        "ambulance": 60,
        "boat": 25,
        "fire_truck": 50,
        "rescue_vehicle": 55
    }

    # ---------- CORE GEOGRAPHY ----------

    def _normalize_location(self, loc: Dict) -> Optional[Dict]:
        """
        NEW (safe helper):
        Ensures location always has usable lat/lon.
        Returns None if location is unusable.
        """
        if not loc:
            return None

        lat = loc.get("lat")
        lon = loc.get("lon")

        if lat is None or lon is None:
            return None

        try:
            return {
                "lat": float(lat),
                "lon": float(lon)
            }
        except (ValueError, TypeError):
            return None

    def haversine_distance(self, loc1: Dict, loc2: Dict) -> float:
        """
        UPDATED (non-breaking):
        - Returns large distance if location is missing
        """

        loc1 = self._normalize_location(loc1)
        loc2 = self._normalize_location(loc2)

        # NEW: fallback if location missing
        if not loc1 or not loc2:
            return 9999.0  # effectively de-prioritizes invalid locations

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

        # NEW: prevent division explosions
        if distance_km <= 0:
            return 1

        return max(1, int((distance_km / speed) * 60))

    # ---------- OPTIMIZATION ----------

    def optimize_allocation(
        self,
        resources: List[Dict],
        crisis_location: Dict,
        crisis_priority: int
    ) -> List[Dict]:

        crisis_location = self._normalize_location(crisis_location)

        # NEW: if crisis location is unknown, return empty allocation
        if not crisis_location:
            return []

        scored_resources = []

        for r in resources:
            resource_location = self._normalize_location(r.get("location", {}))

            distance = self.haversine_distance(
                resource_location or {},
                crisis_location
            )

            eta = self.calculate_eta_minutes(distance, r.get("type", "unknown"))
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

        return round(
            (distance_score * 0.4 + eta_score * 0.6) * priority_weight,
            2
        )

    def _select_top(self, resources: List[Dict], priority: int) -> List[Dict]:
        if priority >= 8:
            return resources[:5]
        if priority >= 5:
            return resources[:3]
        return resources[:2]

    # ---------- ROUND-2 HELPERS (UNCHANGED) ----------

    def calculate_coverage_radius(self, resources: List[Dict], center: Dict) -> float:
        center = self._normalize_location(center)
        if not resources or not center:
            return 0.0

        return max(
            self.haversine_distance(r.get("location", {}), center)
            for r in resources
        )

    def find_optimal_staging_point(self, crisis_locations: List[Dict]) -> Dict:
        valid_locations = [
            self._normalize_location(loc) for loc in crisis_locations
        ]
        valid_locations = [loc for loc in valid_locations if loc]

        if not valid_locations:
            return {"lat": 0.0, "lon": 0.0}

        avg_lat = sum(loc["lat"] for loc in valid_locations) / len(valid_locations)
        avg_lon = sum(loc["lon"] for loc in valid_locations) / len(valid_locations)

        return {
            "lat": round(avg_lat, 6),
            "lon": round(avg_lon, 6)
        }
