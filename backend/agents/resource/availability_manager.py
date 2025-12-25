from typing import List, Dict
from datetime import datetime, timedelta

class AvailabilityManager:
    def __init__(self):
        self.allocated_resources = {}
        self.allocation_timestamps = {}
    
    def get_available(self, resources: List[Dict], crisis_type: str) -> List[Dict]:
        compatible_types = self._get_compatible_types(crisis_type)
        
        available = [
            r for r in resources 
            if r.get('available', True) and r['type'] in compatible_types
        ]
        
        return available
    
    def get_available_volunteers(self, volunteers: List[Dict], crisis_type: str) -> List[Dict]:
        required_skills = self._get_required_skills(crisis_type)
        
        available = [
            v for v in volunteers
            if v.get('available', True) and 
            any(skill in v.get('skills', []) for skill in required_skills)
        ]
        
        return available
    
    def mark_allocated(self, items: List[Dict]):
        for item in items:
            item_id = item['id']
            item['available'] = False
            self.allocated_resources[item_id] = item
            self.allocation_timestamps[item_id] = datetime.now()
    
    def release(self, allocation_id: str, resources: List[Dict], volunteers: List[Dict]):
        for resource in resources:
            if resource['id'] in self.allocated_resources:
                resource['available'] = True
                del self.allocated_resources[resource['id']]
                if resource['id'] in self.allocation_timestamps:
                    del self.allocation_timestamps[resource['id']]
        
        for volunteer in volunteers:
            if volunteer['id'] in self.allocated_resources:
                volunteer['available'] = True
                del self.allocated_resources[volunteer['id']]
                if volunteer['id'] in self.allocation_timestamps:
                    del self.allocation_timestamps[volunteer['id']]
    
    def auto_release_expired(self, resources: List[Dict], volunteers: List[Dict], timeout_hours: int = 4):
        now = datetime.now()
        expired_ids = []
        
        for item_id, timestamp in self.allocation_timestamps.items():
            if now - timestamp > timedelta(hours=timeout_hours):
                expired_ids.append(item_id)
        
        for item_id in expired_ids:
            for resource in resources:
                if resource['id'] == item_id:
                    resource['available'] = True
            for volunteer in volunteers:
                if volunteer['id'] == item_id:
                    volunteer['available'] = True
            
            if item_id in self.allocated_resources:
                del self.allocated_resources[item_id]
            if item_id in self.allocation_timestamps:
                del self.allocation_timestamps[item_id]
        
        return len(expired_ids)
    
    def _get_compatible_types(self, crisis_type: str) -> List[str]:
        compatibility_map = {
            'flood': ['boat', 'rescue_vehicle', 'ambulance'],
            'fire': ['fire_truck', 'ambulance', 'rescue_vehicle'],
            'medical': ['ambulance', 'rescue_vehicle'],
            'earthquake': ['rescue_vehicle', 'ambulance', 'shelter'],
            'accident': ['ambulance', 'rescue_vehicle'],
            'default': ['ambulance', 'rescue_vehicle']
        }
        return compatibility_map.get(crisis_type, compatibility_map['default'])
    
    def _get_required_skills(self, crisis_type: str) -> List[str]:
        skill_map = {
            'flood': ['rescue', 'swimming', 'first_aid'],
            'fire': ['firefighting', 'first_aid', 'rescue'],
            'medical': ['first_aid', 'medical', 'paramedic'],
            'earthquake': ['rescue', 'first_aid', 'search_and_rescue'],
            'accident': ['first_aid', 'rescue'],
            'default': ['first_aid', 'rescue']
        }
        return skill_map.get(crisis_type, skill_map['default'])
    
    def get_utilization_stats(self, resources: List[Dict], volunteers: List[Dict]) -> Dict:
        total_resources = len(resources)
        available_resources = len([r for r in resources if r.get('available', True)])
        
        total_volunteers = len(volunteers)
        available_volunteers = len([v for v in volunteers if v.get('available', True)])
        
        return {
            "resources": {
                "total": total_resources,
                "available": available_resources,
                "allocated": total_resources - available_resources,
                "utilization_percent": round((1 - available_resources/total_resources) * 100, 2) if total_resources > 0 else 0
            },
            "volunteers": {
                "total": total_volunteers,
                "available": available_volunteers,
                "allocated": total_volunteers - available_volunteers,
                "utilization_percent": round((1 - available_volunteers/total_volunteers) * 100, 2) if total_volunteers > 0 else 0
            }
        }