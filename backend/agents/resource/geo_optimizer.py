import math
from typing import List, Dict, Tuple

class GeoOptimizer:
    EARTH_RADIUS_KM = 6371
    AVG_SPEED_KMH = {
        'ambulance': 60,
        'boat': 25,
        'fire_truck': 50,
        'rescue_vehicle': 55,
        'volunteer': 40
    }
    
    def haversine_distance(self, loc1: Dict, loc2: Dict) -> float:
        lat1, lon1 = math.radians(loc1['lat']), math.radians(loc1['lon'])
        lat2, lon2 = math.radians(loc2['lat']), math.radians(loc2['lon'])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return self.EARTH_RADIUS_KM * c
    
    def calculate_eta(self, distance_km: float, resource_type: str) -> int:
        speed = self.AVG_SPEED_KMH.get(resource_type, 40)
        return int((distance_km / speed) * 60)
    
    def optimize_allocation(self, resources: List[Dict], crisis_location: Dict, priority: int) -> List[Dict]:
        for resource in resources:
            resource['distance'] = self.haversine_distance(
                resource['location'], crisis_location
            )
            resource['eta_minutes'] = self.calculate_eta(
                resource['distance'], resource['type']
            )
            resource['priority_score'] = self._calculate_priority_score(
                resource['distance'], resource['eta_minutes'], priority
            )
        
        sorted_resources = sorted(resources, key=lambda x: x['priority_score'], reverse=True)
        
        return self._select_optimal_set(sorted_resources, priority)
    
    def _calculate_priority_score(self, distance: float, eta: int, crisis_priority: int) -> float:
        distance_score = max(0, 100 - (distance * 2))
        eta_score = max(0, 100 - eta)
        priority_multiplier = 1 + (crisis_priority / 10)
        
        return (distance_score * 0.4 + eta_score * 0.6) * priority_multiplier
    
    def _select_optimal_set(self, sorted_resources: List[Dict], priority: int) -> List[Dict]:
        if priority >= 8:
            return sorted_resources[:5]
        elif priority >= 5:
            return sorted_resources[:3]
        else:
            return sorted_resources[:2]
    
    def calculate_coverage_radius(self, resources: List[Dict], center: Dict) -> float:
        if not resources:
            return 0.0
        
        max_distance = max(
            self.haversine_distance(r['location'], center) for r in resources
        )
        return round(max_distance, 2)
    
    def find_optimal_staging_point(self, crisis_locations: List[Dict]) -> Dict:
        if not crisis_locations:
            return {"lat": 0, "lon": 0}
        
        avg_lat = sum(loc['lat'] for loc in crisis_locations) / len(crisis_locations)
        avg_lon = sum(loc['lon'] for loc in crisis_locations) / len(crisis_locations)
        
        return {"lat": round(avg_lat, 6), "lon": round(avg_lon, 6)}