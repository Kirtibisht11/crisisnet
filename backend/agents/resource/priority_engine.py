from typing import Dict
from datetime import datetime

class PriorityEngine:
    SEVERITY_WEIGHTS = {
        'critical': 10,
        'high': 7,
        'medium': 5,
        'low': 3
    }
    
    CRISIS_TYPE_SEVERITY = {
        'fire': 9,
        'flood': 8,
        'medical_emergency': 10,
        'earthquake': 9,
        'accident': 7,
        'collapse': 9,
        'chemical_spill': 8,
        'explosion': 10,
        'default': 5
    }
    
    def calculate_priority(self, crisis: Dict) -> int:
        base_severity = self._get_type_severity(crisis.get('type', 'default'))
        
        time_factor = self._calculate_time_urgency(crisis.get('timestamp'))
        
        population_factor = self._calculate_population_factor(
            crisis.get('affected_population', 0)
        )
        
        vulnerability_factor = self._calculate_vulnerability_factor(crisis)
        
        trust_factor = crisis.get('trust_score', 5) / 10
        
        priority = (
            base_severity * 0.35 +
            time_factor * 0.15 +
            population_factor * 0.25 +
            vulnerability_factor * 0.15 +
            (trust_factor * base_severity) * 0.10
        )
        
        return min(10, max(1, int(priority)))
    
    def _get_type_severity(self, crisis_type: str) -> int:
        return self.CRISIS_TYPE_SEVERITY.get(crisis_type, self.CRISIS_TYPE_SEVERITY['default'])
    
    def _calculate_time_urgency(self, timestamp: str) -> float:
        if not timestamp:
            return 5.0
        
        try:
            crisis_time = datetime.fromisoformat(timestamp)
            now = datetime.now()
            minutes_elapsed = (now - crisis_time).total_seconds() / 60
            
            if minutes_elapsed < 5:
                return 10.0
            elif minutes_elapsed < 15:
                return 8.0
            elif minutes_elapsed < 30:
                return 6.0
            elif minutes_elapsed < 60:
                return 4.0
            else:
                return 2.0
        except:
            return 5.0
    
    def _calculate_population_factor(self, affected_count: int) -> float:
        if affected_count >= 100:
            return 10.0
        elif affected_count >= 50:
            return 8.0
        elif affected_count >= 20:
            return 6.0
        elif affected_count >= 10:
            return 5.0
        elif affected_count >= 5:
            return 4.0
        else:
            return 3.0
    
    def _calculate_vulnerability_factor(self, crisis: Dict) -> float:
        vulnerable_indicators = crisis.get('vulnerable_groups', [])
        
        score = 5.0
        
        if 'children' in vulnerable_indicators:
            score += 2.0
        if 'elderly' in vulnerable_indicators:
            score += 1.5
        if 'disabled' in vulnerable_indicators:
            score += 1.5
        if 'pregnant' in vulnerable_indicators:
            score += 2.0
        
        return min(10.0, score)
    
    def compare_priorities(self, crisis1: Dict, crisis2: Dict) -> Dict:
        priority1 = self.calculate_priority(crisis1)
        priority2 = self.calculate_priority(crisis2)
        
        return {
            "crisis1_priority": priority1,
            "crisis2_priority": priority2,
            "should_reallocate": priority2 > priority1,
            "priority_difference": abs(priority2 - priority1)
        }
    
    def batch_prioritize(self, crises: list) -> list:
        prioritized = []
        for crisis in crises:
            crisis['calculated_priority'] = self.calculate_priority(crisis)
            prioritized.append(crisis)
        
        return sorted(prioritized, key=lambda x: x['calculated_priority'], reverse=True)