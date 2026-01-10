import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta


class GeoOptimizer:
    EARTH_RADIUS_KM = 6371
    
    AVG_SPEED_KMH = {
        "ambulance": 60,
        "boat": 25,
        "fire_truck": 50,
        "rescue_vehicle": 55
    }

    def _normalize_location(self, loc: Dict) -> Optional[Dict]:
        if not loc:
            return None
        
        lat = loc.get("lat")
        lon = loc.get("lon")
        
        if lat is None or lon is None:
            return None
        
        try:
            return {"lat": float(lat), "lon": float(lon)}
        except (ValueError, TypeError):
            return None

    def haversine_distance(self, loc1: Dict, loc2: Dict) -> float:
        loc1 = self._normalize_location(loc1)
        loc2 = self._normalize_location(loc2)
        
        if not loc1 or not loc2:
            return 9999.0
        
        lat1_rad = math.radians(loc1["lat"])
        lon1_rad = math.radians(loc1["lon"])
        lat2_rad = math.radians(loc2["lat"])
        lon2_rad = math.radians(loc2["lon"])
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        
        return round(self.EARTH_RADIUS_KM * c, 2)

    def calculate_eta_minutes(self, distance_km: float, resource_type: str) -> int:
        speed = self.AVG_SPEED_KMH.get(resource_type, 40)
        
        if distance_km <= 0:
            return 1
        
        return max(1, int((distance_km / speed) * 60))

    def _compute_skill_match_score(self, volunteer_skills: List[str], 
                                   required_skills: List[str]) -> float:
        if not required_skills:
            return 50.0
        
        if not volunteer_skills:
            return 0.0
        
        matches = sum(1 for skill in required_skills if skill in volunteer_skills)
        return (matches / len(required_skills)) * 100

    def _calculate_reliability_weight(self, volunteer: Dict) -> float:
        base_reliability = volunteer.get("reliability_score", 0.7)
        recent_completions = volunteer.get("tasks_completed", 0)
        
        completion_bonus = min(recent_completions * 0.05, 0.3)
        return min(base_reliability + completion_bonus, 1.0)

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

    def optimize_allocation(self, resources: List[Dict], crisis_location: Dict, 
                          crisis_priority: int) -> List[Dict]:
        crisis_location = self._normalize_location(crisis_location)
        
        if not crisis_location:
            return []
        
        scored_resources = []
        
        for r in resources:
            resource_location = self._normalize_location(r.get("location", {}))
            distance = self.haversine_distance(resource_location or {}, crisis_location)
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

    def match_volunteers_to_crisis(self, volunteers: List[Dict], crisis: Dict,
                                   required_count: int) -> List[Dict]:
        crisis_loc = self._normalize_location(crisis.get("location", {}))
        if not crisis_loc:
            return []
        
        required_skills = crisis.get("required_skills", [])
        crisis_priority = crisis.get("priority", 5)
        
        scored_volunteers = []
        
        for vol in volunteers:
            if not vol.get("available", False):
                continue
            
            vol_loc = self._normalize_location(vol.get("location", {}))
            distance = self.haversine_distance(vol_loc or {}, crisis_loc)
            eta = self.calculate_eta_minutes(distance, "rescue_vehicle")
            
            skill_score = self._compute_skill_match_score(
                vol.get("skills", []), 
                required_skills
            )
            
            reliability = self._calculate_reliability_weight(vol)
            
            distance_score = max(0, 100 - distance * 3)
            time_score = max(0, 100 - eta * 0.8)
            
            composite_score = (
                skill_score * 0.35 +
                distance_score * 0.25 +
                time_score * 0.25 +
                (reliability * 100) * 0.15
            ) * (1 + crisis_priority * 0.08)
            
            scored_volunteers.append({
                **vol,
                "distance_km": distance,
                "eta_minutes": eta,
                "skill_match_score": skill_score,
                "reliability": reliability,
                "composite_score": round(composite_score, 2)
            })
        
        scored_volunteers.sort(key=lambda x: x["composite_score"], reverse=True)
        return scored_volunteers[:required_count]

    def handle_reassignment(self, failed_volunteer_id: str, crisis: Dict,
                           available_volunteers: List[Dict]) -> Optional[Dict]:
        replacement = self.match_volunteers_to_crisis(available_volunteers, crisis, 1)
        
        if replacement:
            return {
                "replacement_volunteer": replacement[0],
                "failed_volunteer_id": failed_volunteer_id,
                "reassignment_timestamp": datetime.utcnow().isoformat(),
                "crisis_id": crisis.get("crisis_id")
            }
        
        return None

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
        
        return {"lat": round(avg_lat, 6), "lon": round(avg_lon, 6)}