from typing import List, Dict
from .priority_engine import PriorityEngine
from .geo_optimizer import GeoOptimizer

class ReassignmentEngine:
    def __init__(self):
        self.priority_engine = PriorityEngine()
        self.geo_optimizer = GeoOptimizer()
        self.reassignment_history = []
    
    def reallocate(self, high_priority_crisis: Dict, resources: List[Dict], volunteers: List[Dict]) -> Dict:
        new_priority = self.priority_engine.calculate_priority(high_priority_crisis)
        
        if new_priority < 8:
            return {
                "reassignment_needed": False,
                "reason": "Priority too low for reallocation"
            }
        
        candidates = self._find_reallocation_candidates(
            resources, volunteers, high_priority_crisis, new_priority
        )
        
        if not candidates['resources'] and not candidates['volunteers']:
            return {
                "reassignment_needed": False,
                "reason": "No suitable candidates for reallocation"
            }
        
        reassignment = {
            "reassignment_needed": True,
            "new_crisis_id": high_priority_crisis.get('id', 'unknown'),
            "new_priority": new_priority,
            "reassigned_resources": candidates['resources'],
            "reassigned_volunteers": candidates['volunteers'],
            "original_allocations": candidates['original_allocations']
        }
        
        self._execute_reassignment(
            candidates['resources'], 
            candidates['volunteers'],
            high_priority_crisis
        )
        
        self.reassignment_history.append(reassignment)
        
        return reassignment
    
    def _find_reallocation_candidates(self, resources: List[Dict], volunteers: List[Dict], 
                                      new_crisis: Dict, new_priority: int) -> Dict:
        resource_candidates = []
        volunteer_candidates = []
        original_allocations = []
        
        for resource in resources:
            if not resource.get('available', True):
                current_allocation_priority = resource.get('allocation_priority', 0)
                
                if new_priority > current_allocation_priority + 2:
                    distance = self.geo_optimizer.haversine_distance(
                        resource['location'], new_crisis['location']
                    )
                    
                    if distance < 20:
                        resource_candidates.append(resource)
                        original_allocations.append({
                            "resource_id": resource['id'],
                            "original_crisis_id": resource.get('allocated_to', 'unknown')
                        })
        
        for volunteer in volunteers:
            if not volunteer.get('available', True):
                current_allocation_priority = volunteer.get('allocation_priority', 0)
                
                if new_priority > current_allocation_priority + 2:
                    distance = self.geo_optimizer.haversine_distance(
                        volunteer['location'], new_crisis['location']
                    )
                    
                    if distance < 15:
                        volunteer_candidates.append(volunteer)
                        original_allocations.append({
                            "volunteer_id": volunteer['id'],
                            "original_crisis_id": volunteer.get('allocated_to', 'unknown')
                        })
        
        return {
            "resources": resource_candidates[:2],
            "volunteers": volunteer_candidates[:2],
            "original_allocations": original_allocations
        }
    
    def _execute_reassignment(self, resources: List[Dict], volunteers: List[Dict], new_crisis: Dict):
        new_priority = self.priority_engine.calculate_priority(new_crisis)
        new_crisis_id = new_crisis.get('id', 'unknown')
        
        for resource in resources:
            resource['allocated_to'] = new_crisis_id
            resource['allocation_priority'] = new_priority
        
        for volunteer in volunteers:
            volunteer['allocated_to'] = new_crisis_id
            volunteer['allocation_priority'] = new_priority
    
    def calculate_reassignment_impact(self, reassignment: Dict) -> Dict:
        total_reassigned = (
            len(reassignment.get('reassigned_resources', [])) +
            len(reassignment.get('reassigned_volunteers', []))
        )
        
        affected_crises = len(set(
            alloc.get('original_crisis_id', 'unknown')
            for alloc in reassignment.get('original_allocations', [])
        ))
        
        return {
            "total_assets_reassigned": total_reassigned,
            "affected_original_crises": affected_crises,
            "reassignment_justified": reassignment.get('new_priority', 0) >= 8,
            "impact_level": "high" if affected_crises > 2 else "medium" if affected_crises > 0 else "low"
        }
    
    def get_reassignment_stats(self) -> Dict:
        if not self.reassignment_history:
            return {
                "total_reassignments": 0,
                "avg_priority_gain": 0,
                "success_rate": 0
            }
        
        total = len(self.reassignment_history)
        
        priority_gains = [
            r['new_priority'] - r.get('original_priority', 0)
            for r in self.reassignment_history
        ]
        
        avg_gain = sum(priority_gains) / len(priority_gains) if priority_gains else 0
        
        return {
            "total_reassignments": total,
            "avg_priority_gain": round(avg_gain, 2),
            "reassignments_this_session": total
        }