from typing import List, Dict


class SkillMatcher:
    """
    Optimized SkillMatcher:
    - Non-mutating
    - Deterministic ranking
    - Round-2 learning friendly
    """

    SKILL_PRIORITY = {
        "medical": 10,
        "paramedic": 10,
        "rescue": 9,
        "search_and_rescue": 9,
        "firefighting": 8,
        "first_aid": 7,
        "swimming": 6,
        "logistics": 5,
        "communication": 4,
        "driver": 4
    }

    # ---------- PUBLIC API ----------

    def match_skills(
        self,
        volunteers: List[Dict],
        required_skills: List[str],
        max_team_size: int = 5
    ) -> List[Dict]:
        """
        Returns a ranked and diverse volunteer team
        """

        scored = [
            {
                **v,
                "match_score": self._calculate_match_score(
                    v.get("skills", []),
                    required_skills
                )
            }
            for v in volunteers
        ]

        ranked = sorted(
            scored,
            key=lambda v: v["match_score"],
            reverse=True
        )

        return self._select_diverse_team(
            ranked,
            required_skills,
            max_team_size
        )

    # ---------- SCORING ----------

    def _calculate_match_score(
        self,
        volunteer_skills: List[str],
        required_skills: List[str]
    ) -> float:
        if not required_skills:
            return 50.0

        matched = set(volunteer_skills) & set(required_skills)

        if not matched:
            return 0.0

        coverage_ratio = len(matched) / len(required_skills)

        quality_score = sum(
            self.SKILL_PRIORITY.get(skill, 3)
            for skill in matched
        ) / (len(required_skills) * 10)

        # Balanced coverage + skill depth
        score = (coverage_ratio * 70) + (quality_score * 30)

        return round(min(100.0, score), 2)

    # ---------- TEAM SELECTION ----------

    def _select_diverse_team(
        self,
        ranked_volunteers: List[Dict],
        required_skills: List[str],
        max_team_size: int
    ) -> List[Dict]:
        selected = []
        covered_skills = set()

        for v in ranked_volunteers:
            v_skills = set(v.get("skills", []))

            # Always take top-ranked initially
            if len(selected) < 2:
                selected.append(v)
                covered_skills |= v_skills
                continue

            # Add only if it improves coverage
            if v_skills - covered_skills:
                selected.append(v)
                covered_skills |= v_skills

            if len(selected) >= max_team_size:
                break

            if set(required_skills).issubset(covered_skills):
                break

        return selected

    # ---------- ANALYSIS (Round-2 Ready) ----------

    def evaluate_team_capability(
        self,
        team: List[Dict],
        required_skills: List[str]
    ) -> Dict:
        team_skills = set()
        for m in team:
            team_skills |= set(m.get("skills", []))

        required = set(required_skills)
        covered = required & team_skills
        missing = required - team_skills

        coverage = (
            (len(covered) / len(required)) * 100
            if required else 100
        )

        avg_score = (
            sum(m.get("match_score", 0) for m in team) / len(team)
            if team else 0
        )

        return {
            "team_size": len(team),
            "covered_skills": list(covered),
            "missing_skills": list(missing),
            "coverage_percent": round(coverage, 2),
            "avg_match_score": round(avg_score, 2),
            "team_ready": not missing
        }

    def suggest_additional_skills(
        self,
        current_team: List[Dict],
        crisis_type: str
    ) -> List[str]:
        crisis_skill_map = {
            "flood": ["rescue", "swimming", "first_aid", "logistics"],
            "fire": ["firefighting", "first_aid", "rescue", "paramedic"],
            "medical": ["medical", "paramedic", "first_aid"],
            "earthquake": ["search_and_rescue", "rescue", "first_aid", "medical"],
            "default": ["first_aid", "rescue", "communication"]
        }

        ideal = set(crisis_skill_map.get(
            crisis_type,
            crisis_skill_map["default"]
        ))

        current = set()
        for m in current_team:
            current |= set(m.get("skills", []))

        return sorted(ideal - current)
