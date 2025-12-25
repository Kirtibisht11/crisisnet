from typing import List, Dict
from datetime import datetime
import uuid

class ResourceMatcher:
    def __init__(self):
        self.allocation_history = []
    
    def create_allocation(self, crisis: Dict, resources: List[Dict], volunteers: List[Dict]) -> Dict:
        allocation_id = str(uuid.uuid4())
        
        allocation = {
            "allocation_id": allocation_id,
            "crisis_id": crisis.get('id', str(uuid.uuid4())),
            "crisis_type": crisis['type'],
            "location": crisis['location'],
            "timestamp": datetime.now().isoformat(),
            "resources": self._format_resources(resources),
            "volunteers": self._format_volunteers(volunteers),
            "eta_minutes": self._calculate_eta(resources, volunteers, crisis['location']),
            "status": "allocated"
        }
        
        self.allocation_history.append(allocation)
        return allocation
    
    def _format_resources(self, resources: List[Dict]) -> List[Dict]:
        return [{
            "id": r['id'],
            "type": r['type'],
            "distance_km": r.get('distance', 0),
            "eta_minutes": r.get('eta_minutes', 0)
        } for r in resources]
    
    def _format_volunteers(self, volunteers: List[Dict]) -> List[Dict]:
        return [{
            "id": v['id'],
            "skills": v['skills'],
            "distance_km": v.get('distance', 0),
            "match_score": v.get('match_score', 0)
        } for v in volunteers]
    
    def _calculate_eta(self, resources: List[Dict], volunteers: List[Dict], location: Dict) -> int:
        if not resources and not volunteers:
            return 999
        
        all_etas = []
        
        for r in resources:
            all_etas.append(r.get('eta_minutes', 0))
        
        for v in volunteers:
            all_etas.append(v.get('eta_minutes', 0))
        
        return min(all_etas) if all_etas else 999
    
    def get_allocation_by_id(self, allocation_id: str) -> Dict:
        for allocation in self.allocation_history:
            if allocation['allocation_id'] == allocation_id:
                return allocation
        return None
    
    def calculate_response_efficiency(self, allocation: Dict) -> float:
        resource_count = len(allocation['resources'])
        volunteer_count = len(allocation['volunteers'])
        eta = allocation['eta_minutes']
        
        efficiency_score = (resource_count + volunteer_count * 0.8) / (eta / 10 + 1)
        return round(efficiency_score, 2)