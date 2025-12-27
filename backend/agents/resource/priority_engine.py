from typing import Dict, List
from datetime import datetime


class PriorityEngine:
    """
    Round-1 MVP:
    - Calculates a priority score (1–10) for a crisis
    - Uses simple, explainable factors
    """

    CRISIS_TYPE_SEVERITY = {
        "fire": 9,
        "flood": 8,
        "medical_emergency": 10,
        "earthquake": 9,
        "accident": 7,
        "collapse": 9,
        "chemical_spill": 8,
        "explosion": 10
    }

    # ---------- CORE PRIORITY ----------

    def calculate_priority(self, crisis: Dict) -> int:
        type_severity = self._type_severity(crisis.get("type"))
        time_urgency = self._time_urgency(crisis.get("timestamp"))
        population_impact = self._population_impact(crisis.get("affected_population", 0))
        vulnerability = self._vulnerability_score(crisis.get("vulnerable_groups", []))
        trust = self._trust_factor(crisis.get("trust_score", 5))

        # Weighted but simple formula
        priority_score = (
            type_severity * 0.4 +
            time_urgency * 0.2 +
            population_impact * 0.2 +
            vulnerability * 0.1 +
            trust * 0.1
        )

        return max(1, min(10, round(priority_score)))

    # ---------- FACTORS ----------

    def _type_severity(self, crisis_type: str | None) -> float:
        return self.CRISIS_TYPE_SEVERITY.get(crisis_type, 5)

    def _time_urgency(self, timestamp: str | None) -> float:
        if not timestamp:
            return 5.0

        try:
            crisis_time = datetime.fromisoformat(timestamp)
            minutes = (datetime.utcnow() - crisis_time).total_seconds() / 60

            if minutes < 5:
                return 10.0
            if minutes < 15:
                return 8.0
            if minutes < 30:
                return 6.0
            if minutes < 60:
                return 4.0
            return 2.0
        except Exception:
            return 5.0

    def _population_impact(self, count: int) -> float:
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

    def _vulnerability_score(self, groups: List[str]) -> float:
        score = 5.0

        if "children" in groups:
            score += 2.0
        if "elderly" in groups:
            score += 1.5
        if "disabled" in groups:
            score += 1.5
        if "pregnant" in groups:
            score += 2.0

        return min(10.0, score)

    def _trust_factor(self, trust_score: int) -> float:
        # Normalize trust score to 0–10 range
        return max(1.0, min(10.0, trust_score))

    # ---------- HELPERS ----------

    def compare_priorities(self, crisis1: Dict, crisis2: Dict) -> Dict:
        p1 = self.calculate_priority(crisis1)
        p2 = self.calculate_priority(crisis2)

        return {
            "crisis1_priority": p1,
            "crisis2_priority": p2,
            "should_reallocate": p2 > p1,
            "priority_difference": abs(p2 - p1)
        }

    def batch_prioritize(self, crises: List[Dict]) -> List[Dict]:
        prioritized = []

        for crisis in crises:
            prioritized.append({
                **crisis,
                "calculated_priority": self.calculate_priority(crisis)
            })

        return sorted(
            prioritized,
            key=lambda x: x["calculated_priority"],
            reverse=True
        )
