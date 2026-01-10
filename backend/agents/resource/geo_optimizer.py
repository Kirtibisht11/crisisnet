import math
from typing import List, Dict, Optional
from datetime import datetime


class GeoOptimizer:
    
    EARTH_R = 6371
    
    SPEEDS = {
        "ambulance": 60,
        "boat": 25,
        "fire_truck": 50,
        "rescue_vehicle": 55,
        "volunteer_car": 40,
        "volunteer_bike": 25,
        "on_foot": 5
    }

    TRAFFIC_MULT = {
        "rush": 0.6,
        "normal": 1.0,
        "late": 1.2
    }

    def __init__(self, db=None):
        self.db = db
        self.cache = {}

    def _safe_coords(self, loc: Dict) -> Optional[Dict]:
        if not loc:
            return None

        lat = loc.get("lat") or loc.get("latitude")
        lon = loc.get("lon") or loc.get("longitude")

        if lat is None or lon is None:
            return None

        try:
            return {"lat": float(lat), "lon": float(lon)}
        except (ValueError, TypeError):
            return None

    def haversine_distance(self, loc1: Dict, loc2: Dict) -> float:
        p1 = self._safe_coords(loc1)
        p2 = self._safe_coords(loc2)

        if not p1 or not p2:
            return 9999.0

        cache_key = f"{p1['lat']},{p1['lon']}-{p2['lat']},{p2['lon']}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        lat1 = math.radians(p1["lat"])
        lon1 = math.radians(p1["lon"])
        lat2 = math.radians(p2["lat"])
        lon2 = math.radians(p2["lon"])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        dist = round(self.EARTH_R * c, 2)
        
        self.cache[cache_key] = dist
        return dist

    def calc_eta(self, dist_km: float, res_type: str, traffic: str = "normal") -> int:
        if dist_km <= 0:
            return 1

        base_speed = self.SPEEDS.get(res_type, 40)
        traffic_factor = self.TRAFFIC_MULT.get(traffic, 1.0)
        
        actual_speed = base_speed * traffic_factor
        eta_mins = int((dist_km / actual_speed) * 60)
        
        return max(1, eta_mins)

    def get_traffic_condition(self) -> str:
        hour = datetime.now().hour
        
        if 7 <= hour <= 10 or 17 <= hour <= 20:
            return "rush"
        elif 22 <= hour or hour <= 5:
            return "late"
        return "normal"

    def optimize_allocation(self, resources: List[Dict], crisis_loc: Dict, crisis_pri: int) -> List[Dict]:
        crisis_loc = self._safe_coords(crisis_loc)
        
        if not crisis_loc:
            return []

        traffic = self.get_traffic_condition()
        scored = []

        for r in resources:
            r_loc = self._safe_coords(r.get("location", {}))
            
            dist = self.haversine_distance(r_loc or {}, crisis_loc)
            eta = self.calc_eta(dist, r.get("type", "unknown"), traffic)
            
            reliability = self._get_reliability(r)
            score = self._calc_score(dist, eta, crisis_pri, reliability)

            scored.append({
                **r,
                "distance_km": dist,
                "eta_minutes": eta,
                "score": score,
                "reliability": reliability
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return self._select_best(scored, crisis_pri)

    def _get_reliability(self, resource: Dict) -> float:
        if not self.db:
            return 0.8
        
        res_id = resource.get("id")
        if not res_id:
            return 0.8
        
        try:
            from db import models
            
            perf = self.db.query(models.VolunteerPerformance).filter(
                models.VolunteerPerformance.volunteer_id == res_id
            ).first()
            
            if perf:
                return perf.reliability_score
            
            return 0.8
        except:
            return 0.8

    def _calc_score(self, dist: float, eta: int, pri: int, rel: float) -> float:
        dist_score = max(0, 100 - (dist * 2))
        eta_score = max(0, 100 - eta)
        rel_score = rel * 100
        
        pri_weight = 1 + (pri * 0.1)
        
        composite = (
            dist_score * 0.3 +
            eta_score * 0.4 +
            rel_score * 0.3
        ) * pri_weight
        
        return round(composite, 2)

    def _select_best(self, resources: List[Dict], pri: int) -> List[Dict]:
        if pri >= 8:
            return resources[:5]
        elif pri >= 5:
            return resources[:3]
        return resources[:2]

    def calc_coverage_radius(self, resources: List[Dict], center: Dict) -> float:
        center = self._safe_coords(center)
        if not resources or not center:
            return 0.0

        max_dist = 0.0
        for r in resources:
            r_loc = self._safe_coords(r.get("location", {}))
            if r_loc:
                d = self.haversine_distance(r_loc, center)
                max_dist = max(max_dist, d)
        
        return round(max_dist, 2)

    def find_staging_point(self, crisis_locs: List[Dict]) -> Dict:
        valid = [self._safe_coords(loc) for loc in crisis_locs]
        valid = [v for v in valid if v]

        if not valid:
            return {"lat": 0.0, "lon": 0.0}

        avg_lat = sum(v["lat"] for v in valid) / len(valid)
        avg_lon = sum(v["lon"] for v in valid) / len(valid)

        return {"lat": round(avg_lat, 6), "lon": round(avg_lon, 6)}

    def get_nearest_resources(self, loc: Dict, resources: List[Dict], count: int = 5) -> List[Dict]:
        loc = self._safe_coords(loc)
        if not loc:
            return resources[:count]

        with_dist = []
        for r in resources:
            r_loc = self._safe_coords(r.get("location", {}))
            dist = self.haversine_distance(r_loc or {}, loc)
            with_dist.append({**r, "distance_km": dist})

        with_dist.sort(key=lambda x: x["distance_km"])
        return with_dist[:count]

    def estimate_response_coverage(self, volunteers: List[Dict], crisis_loc: Dict, time_limit: int = 30) -> Dict:
        crisis_loc = self._safe_coords(crisis_loc)
        if not crisis_loc:
            return {"reachable": 0, "total": len(volunteers), "coverage": 0.0}

        reachable = 0
        for v in volunteers:
            v_loc = self._safe_coords(v.get("location", {}))
            if not v_loc:
                continue
            
            dist = self.haversine_distance(v_loc, crisis_loc)
            eta = self.calc_eta(dist, "volunteer_car")
            
            if eta <= time_limit:
                reachable += 1

        coverage = reachable / len(volunteers) if volunteers else 0.0
        
        return {
            "reachable": reachable,
            "total": len(volunteers),
            "coverage": round(coverage, 2),
            "time_limit_mins": time_limit
        }

    def suggest_deployment_zones(self, crises: List[Dict], num_zones: int = 3) -> List[Dict]:
        valid_crises = [c for c in crises if self._safe_coords(c)]
        
        if not valid_crises:
            return []

        if len(valid_crises) <= num_zones:
            return [
                {
                    "zone_id": i,
                    "center": self._safe_coords(c),
                    "crisis_ids": [c.get("id")]
                }
                for i, c in enumerate(valid_crises)
            ]

        zones = []
        for i in range(num_zones):
            subset = valid_crises[i::num_zones]
            center = self.find_staging_point([c for c in subset])
            crisis_ids = [c.get("id") for c in subset]
            
            zones.append({
                "zone_id": i,
                "center": center,
                "crisis_ids": crisis_ids,
                "crisis_count": len(crisis_ids)
            })

        return zones