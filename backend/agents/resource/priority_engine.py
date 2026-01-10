from typing import Dict, List
from datetime import datetime


class PriorityEngine:
    
    SEVERITY_MAP = {
        "fire": 9,
        "flood": 8,
        "medical_emergency": 10,
        "medical": 10,
        "earthquake": 9,
        "accident": 7,
        "collapse": 9,
        "chemical_spill": 8,
        "explosion": 10,
        "landslide": 7,
        "violence": 9
    }

    def __init__(self, db=None):
        self.db = db
        self.history = []

    def calculate_priority(self, crisis: Dict) -> int:
        typ = crisis.get("type") or crisis.get("crisis_type", "")
        ts = crisis.get("timestamp") or crisis.get("reported_at")
        pop = crisis.get("affected_population", 0)
        vuln = crisis.get("vulnerable_groups", [])
        trust = crisis.get("trust_score", 0.5)

        type_sev = self._get_type_severity(typ)
        time_urg = self._calc_time_urgency(ts)
        pop_impact = self._calc_population_impact(pop)
        vuln_score = self._calc_vulnerability(vuln)
        trust_factor = self._normalize_trust(trust)

        weighted = (
            type_sev * 0.4 +
            time_urg * 0.2 +
            pop_impact * 0.2 +
            vuln_score * 0.1 +
            trust_factor * 0.1
        )

        if self.db:
            past_perf = self._get_past_performance(typ)
            if past_perf and past_perf < 0.6:
                weighted *= 1.15

        priority = max(1, min(10, round(weighted)))
        
        self.history.append({
            "crisis_id": crisis.get("id"),
            "priority": priority,
            "timestamp": datetime.utcnow()
        })
        
        return priority

    def _get_type_severity(self, ctype: str) -> float:
        if not ctype:
            return 5.0
        
        normalized = ctype.lower().replace(" ", "_")
        base = self.SEVERITY_MAP.get(normalized, 5.0)
        
        return float(base)

    def _calc_time_urgency(self, ts: str) -> float:
        if not ts:
            return 5.0

        try:
            if isinstance(ts, str):
                crisis_time = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            else:
                crisis_time = ts
            
            elapsed_mins = (datetime.utcnow() - crisis_time.replace(tzinfo=None)).total_seconds() / 60

            if elapsed_mins < 5:
                return 10.0
            elif elapsed_mins < 15:
                return 8.0
            elif elapsed_mins < 30:
                return 6.0
            elif elapsed_mins < 60:
                return 4.0
            else:
                return max(2.0, 10.0 - (elapsed_mins / 60))
        except:
            return 5.0

    def _calc_population_impact(self, count: int) -> float:
        if count >= 100:
            return 10.0
        if count >= 50:
            return 8.0
        if count >= 20:
            return 6.0
        if count >= 10:
            return 5.0
        if count >= 5:
            return 4.0
        return 3.0

    def _calc_vulnerability(self, groups: List[str]) -> float:
        base = 5.0
        
        for group in groups:
            g = group.lower()
            if "child" in g:
                base += 2.0
            elif "elderly" in g or "senior" in g:
                base += 1.5
            elif "disabled" in g or "handicap" in g:
                base += 1.5
            elif "pregnant" in g:
                base += 2.0

        return min(10.0, base)

    def _normalize_trust(self, trust: float) -> float:
        if isinstance(trust, (int, float)):
            if trust <= 1.0:
                return trust * 10.0
            return max(1.0, min(10.0, trust))
        return 5.0

    def _get_past_performance(self, ctype: str) -> float:
        if not self.db or not ctype:
            return None
        
        try:
            from db import models
            
            past = self.db.query(models.Crisis).filter(
                models.Crisis.crisis_type == ctype,
                models.Crisis.status == "resolved"
            ).limit(10).all()
            
            if not past:
                return None
            
            success_count = 0
            for c in past:
                tasks = self.db.query(models.Task).filter(
                    models.Task.crisis_id == c.id
                ).all()
                
                if tasks:
                    completed = len([t for t in tasks if t.status == models.TaskStatus.COMPLETED])
                    if completed / len(tasks) >= 0.7:
                        success_count += 1
            
            return success_count / len(past)
        except:
            return None

    def compare_priorities(self, c1: Dict, c2: Dict) -> Dict:
        p1 = self.calculate_priority(c1)
        p2 = self.calculate_priority(c2)

        return {
            "crisis1_priority": p1,
            "crisis2_priority": p2,
            "should_reallocate": p2 > p1,
            "difference": abs(p2 - p1)
        }

    def batch_prioritize(self, crises: List[Dict]) -> List[Dict]:
        results = []
        
        for c in crises:
            calc_pri = self.calculate_priority(c)
            results.append({
                **c,
                "calculated_priority": calc_pri,
                "priority_label": self._get_priority_label(calc_pri)
            })

        results.sort(key=lambda x: x["calculated_priority"], reverse=True)
        return results

    def _get_priority_label(self, score: int) -> str:
        if score >= 9:
            return "CRITICAL"
        elif score >= 7:
            return "HIGH"
        elif score >= 5:
            return "MEDIUM"
        else:
            return "LOW"

    def get_recommendations(self, crisis: Dict) -> Dict:
        priority = self.calculate_priority(crisis)
        ctype = crisis.get("type") or crisis.get("crisis_type")
        
        rec = {
            "priority": priority,
            "label": self._get_priority_label(priority),
            "recommended_resources": self._recommend_resources(ctype, priority),
            "estimated_volunteers": self._estimate_volunteers_needed(priority),
            "response_window": self._calc_response_window(priority)
        }
        
        return rec

    def _recommend_resources(self, ctype: str, priority: int) -> List[str]:
        base_resources = {
            "fire": ["fire_truck", "ambulance", "water_supply"],
            "flood": ["boat", "rescue_vehicle", "shelter_supplies"],
            "medical": ["ambulance", "medical_supplies"],
            "earthquake": ["rescue_vehicle", "medical_supplies", "shelter_supplies"],
            "collapse": ["rescue_vehicle", "heavy_machinery", "ambulance"]
        }
        
        resources = base_resources.get(ctype.lower() if ctype else "", ["rescue_vehicle"])
        
        if priority >= 8:
            resources.append("helicopter")
        
        return resources

    def _estimate_volunteers_needed(self, priority: int) -> int:
        if priority >= 9:
            return 10
        elif priority >= 7:
            return 7
        elif priority >= 5:
            return 5
        else:
            return 3

    def _calc_response_window(self, priority: int) -> str:
        if priority >= 9:
            return "immediate"
        elif priority >= 7:
            return "15_minutes"
        elif priority >= 5:
            return "30_minutes"
        else:
            return "1_hour"