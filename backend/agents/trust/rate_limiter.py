import json
import os
from datetime import datetime, timedelta
from .database import TrustDatabase

class RateLimiter:
    """Prevents spam by limiting reports per user"""
    
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.limits = config['rate_limits']
        self.db = TrustDatabase()
    
    def check_rate_limit(self, user_id: str) -> tuple:
        """Check if user can submit report"""
        is_blocked, reason = self.db.is_user_blocked(user_id)
        if is_blocked:
            return False, reason

        recent_activity = self.db.get_user_activity(user_id, hours=24)

        hour_ago = datetime.now() - timedelta(hours=1)
        reports_last_hour = sum(
            1 for activity in recent_activity 
            if datetime.fromisoformat(activity['timestamp']) > hour_ago
        )
        
        if reports_last_hour >= self.limits['max_reports_per_hour']:
            self._apply_cooldown(user_id)
            return False, f"Too many reports ({reports_last_hour}/{self.limits['max_reports_per_hour']})"

        if len(recent_activity) >= self.limits['max_reports_per_day']:
            self._apply_cooldown(user_id)
            return False, f"Daily limit reached ({len(recent_activity)}/{self.limits['max_reports_per_day']})"
        
        return True, "OK"
    
    def record_activity(self, user_id: str):
        """Record user submitted a report"""
        self.db.record_activity(user_id)
    
    def _apply_cooldown(self, user_id: str):
        """Block user temporarily"""
        self.db.block_user(
            user_id, 
            self.limits['cooldown_minutes'],
            "Rate limit exceeded"
        )
    
    def get_penalty_score(self, user_id: str) -> float:
        """Calculate penalty based on usage"""
        recent_activity = self.db.get_user_activity(user_id, hours=1)
        reports_last_hour = len(recent_activity)
        
        usage_ratio = reports_last_hour / self.limits['max_reports_per_hour']
        
        if usage_ratio < 0.5:
            return 0.0
        elif usage_ratio < 0.75:
            return 0.2
        elif usage_ratio < 0.9:
            return 0.4
        else:
            return 0.7