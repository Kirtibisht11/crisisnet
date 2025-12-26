from typing import List, Dict

class SkillMatcher:
    SKILL_PRIORITY = {
        'medical': 10,
        'paramedic': 10,
        'rescue': 9,
        'search_and_rescue': 9,
        'firefighting': 8,
        'first_aid': 7,
        'swimming': 6,
        'logistics': 5,
        'communication': 4,
        'driver': 4
    }
    
    def match_skills(self, volunteers: List[Dict], required_skills: List[str]) -> List[Dict]:
        for volunteer in volunteers:
            volunteer['match_score'] = self._calculate_match_score(
                volunteer.get('skills', []),
                required_skills
            )
            volunteer['eta_minutes'] = volunteer.get('eta_minutes', 30)
        
        sorted_volunteers = sorted(
            volunteers,
            key=lambda v: (v['match_score'], -v['eta_minutes']),
            reverse=True
        )
        
        return self._select_diverse_team(sorted_volunteers, required_skills)
    
    def _calculate_match_score(self, volunteer_skills: List[str], required_skills: List[str]) -> float:
        if not required_skills:
            return 50.0
        
        matched_skills = set(volunteer_skills) & set(required_skills)
        
        if not matched_skills:
            return 0.0
        
        skill_priority_sum = sum(
            self.SKILL_PRIORITY.get(skill, 3) for skill in matched_skills
        )
        
        coverage_score = (len(matched_skills) / len(required_skills)) * 100
        
        quality_score = skill_priority_sum * 5
        
        return min(100.0, (coverage_score * 0.6 + quality_score * 0.4))
    
    def _select_diverse_team(self, sorted_volunteers: List[Dict], required_skills: List[str]) -> List[Dict]:
        selected = []
        covered_skills = set()
        
        for volunteer in sorted_volunteers:
            volunteer_skills = set(volunteer.get('skills', []))
            
            if len(selected) < 3:
                selected.append(volunteer)
                covered_skills.update(volunteer_skills)
            elif len(covered_skills) < len(required_skills):
                new_skills = volunteer_skills - covered_skills
                if new_skills:
                    selected.append(volunteer)
                    covered_skills.update(volunteer_skills)
            
            if len(covered_skills) >= len(required_skills) and len(selected) >= 3:
                break
        
        return selected[:5]
    
    def evaluate_team_capability(self, team: List[Dict], required_skills: List[str]) -> Dict:
        all_team_skills = set()
        for member in team:
            all_team_skills.update(member.get('skills', []))
        
        covered_skills = set(required_skills) & all_team_skills
        missing_skills = set(required_skills) - all_team_skills
        
        coverage_percent = (len(covered_skills) / len(required_skills) * 100) if required_skills else 100
        
        avg_match_score = sum(m.get('match_score', 0) for m in team) / len(team) if team else 0
        
        return {
            "team_size": len(team),
            "covered_skills": list(covered_skills),
            "missing_skills": list(missing_skills),
            "coverage_percent": round(coverage_percent, 2),
            "avg_match_score": round(avg_match_score, 2),
            "team_ready": len(missing_skills) == 0
        }
    
    def suggest_additional_skills(self, current_team: List[Dict], crisis_type: str) -> List[str]:
        crisis_skill_map = {
            'flood': ['rescue', 'swimming', 'first_aid', 'logistics'],
            'fire': ['firefighting', 'first_aid', 'rescue', 'paramedic'],
            'medical': ['medical', 'paramedic', 'first_aid'],
            'earthquake': ['search_and_rescue', 'rescue', 'first_aid', 'medical'],
            'default': ['first_aid', 'rescue', 'communication']
        }
        
        ideal_skills = set(crisis_skill_map.get(crisis_type, crisis_skill_map['default']))
        
        current_skills = set()
        for member in current_team:
            current_skills.update(member.get('skills', []))
        
        return list(ideal_skills - current_skills)