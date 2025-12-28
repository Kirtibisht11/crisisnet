import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict

class JsonDataHandler:
    
    def __init__(self, mock_alerts_path: str = None):
        if mock_alerts_path is None:
            mock_alerts_path = os.path.join(os.path.dirname(__file__), 'mock_alerts.json')
        
        self.mock_alerts_path = mock_alerts_path
        self.load_mock_data()
        
        # In-memory storage for runtime data
        self.user_reputation = {}
        self.reputation_history = []
        self.alert_history = []
        self.rate_limits = []
        self.blocked_users = {}
        
        # Initialize user reputations from mock data
        self._init_user_reputations()
        
        print("JSON Data Handler initialized (mock_alerts.json)")
    
    def load_mock_data(self):
        """Load mock alerts from JSON file"""
        try:
            with open(self.mock_alerts_path, 'r', encoding='utf-8') as f:
                self.mock_data = json.load(f)
            print(f"Loaded mock data from {self.mock_alerts_path}")
        except FileNotFoundError:
            print(f"Warning: {self.mock_alerts_path} not found, using empty mock data")
            self.mock_data = {"user_profiles": {"trusted_users": [], "new_users": [], "suspicious_users": []}}
    
    def _init_user_reputations(self):
        """Initialize user reputations from mock data"""
        if 'user_profiles' not in self.mock_data:
            return
        
        profiles = self.mock_data['user_profiles']
        
        # Load trusted users
        for user in profiles.get('trusted_users', []):
            self.user_reputation[user['user_id']] = {
                'user_id': user['user_id'],
                'reputation_score': user['reputation'],
                'total_reports': user['total_reports'],
                'accurate_reports': user['accurate_reports'],
                'false_reports': user['false_reports'],
                'last_updated': datetime.now(),
                'created_at': datetime.fromisoformat(user['member_since'] + 'T00:00:00')
            }
        
        # Load new users
        for user in profiles.get('new_users', []):
            self.user_reputation[user['user_id']] = {
                'user_id': user['user_id'],
                'reputation_score': user['reputation'],
                'total_reports': user['total_reports'],
                'accurate_reports': user['accurate_reports'],
                'false_reports': user['false_reports'],
                'last_updated': datetime.now(),
                'created_at': datetime.fromisoformat(user['member_since'] + 'T00:00:00')
            }
        
        # Load suspicious users
        for user in profiles.get('suspicious_users', []):
            self.user_reputation[user['user_id']] = {
                'user_id': user['user_id'],
                'reputation_score': user['reputation'],
                'total_reports': user['total_reports'],
                'accurate_reports': user['accurate_reports'],
                'false_reports': user['false_reports'],
                'last_updated': datetime.now(),
                'created_at': datetime.fromisoformat(user['member_since'] + 'T00:00:00')
            }
        
        print(f"Initialized {len(self.user_reputation)} user reputations from mock data")
    
    def get_connection(self):
        """Mock connection - returns None (compatibility with database interface)"""
        return None
    
    def init_database(self):
        """No initialization needed for JSON"""
        pass
    
    def get_user_reputation(self, user_id: str) -> Optional[Dict]:
        """Get user's reputation data"""
        return self.user_reputation.get(user_id)
    
    def create_user_reputation(self, user_id: str, initial_score: float = 0.5):
        """Create new user reputation entry"""
        if user_id not in self.user_reputation:
            self.user_reputation[user_id] = {
                'user_id': user_id,
                'reputation_score': float(initial_score),
                'total_reports': 0,
                'accurate_reports': 0,
                'false_reports': 0,
                'last_updated': datetime.now(),
                'created_at': datetime.now()
            }
    
    def update_user_reputation(self, user_id: str, new_score: float, was_accurate: bool, old_score: float):
        """Update user reputation based on accuracy"""
        if user_id not in self.user_reputation:
            self.create_user_reputation(user_id)
        
        user = self.user_reputation[user_id]
        user['reputation_score'] = float(new_score)
        user['total_reports'] += 1
        user['last_updated'] = datetime.now()
        
        if was_accurate:
            user['accurate_reports'] += 1
        else:
            user['false_reports'] += 1
        
        # Store history
        self.reputation_history.append({
            'id': len(self.reputation_history) + 1,
            'user_id': user_id,
            'was_accurate': bool(was_accurate),
            'old_score': float(old_score),
            'new_score': float(new_score),
            'timestamp': datetime.now()
        })
    
    def save_alert(self, alert_data: Dict) -> int:
        """Save alert to memory"""
        alert_id = len(self.alert_history) + 1
        alert = {
            'id': alert_id,
            'user_id': alert_data['user_id'],
            'crisis_type': alert_data['crisis_type'],
            'location': alert_data['location'],
            'latitude': alert_data.get('lat'),
            'longitude': alert_data.get('lon'),
            'message': alert_data.get('message', ''),
            'fingerprint': alert_data['fingerprint'],
            'timestamp': datetime.now(),
            'verified': False,
            'trust_score': None
        }
        self.alert_history.append(alert)
        return alert_id
    
    def find_similar_alerts(self, crisis_type: str, location: str, 
                           minutes: int = 30, exclude_user: str = None) -> List[Dict]:
        """Find similar alerts within time window"""
        cutoff = datetime.now() - timedelta(minutes=minutes)
        
        similar = []
        for alert in self.alert_history:
            if (alert['crisis_type'] == crisis_type and 
                alert['location'] == location and
                alert['timestamp'] > cutoff):
                if exclude_user and alert['user_id'] == exclude_user:
                    continue
                similar.append(alert)
        
        return similar
    
    def record_activity(self, user_id: str):
        """Record user activity for rate limiting"""
        self.rate_limits.append({
            'id': len(self.rate_limits) + 1,
            'user_id': user_id,
            'action_type': 'report',
            'timestamp': datetime.now()
        })
    
    def get_user_activity(self, user_id: str, hours: int = 24) -> List[Dict]:
        """Get user's recent activity"""
        cutoff = datetime.now() - timedelta(hours=hours)
        
        activities = []
        for activity in self.rate_limits:
            if activity['user_id'] == user_id and activity['timestamp'] > cutoff:
                activity_copy = activity.copy()
                activity_copy['timestamp'] = activity['timestamp'].isoformat()
                activities.append(activity_copy)
        
        return activities
    
    def is_user_blocked(self, user_id: str) -> tuple:
        """Check if user is currently blocked"""
        if user_id in self.blocked_users:
            blocked_until = self.blocked_users[user_id]['blocked_until']
            if blocked_until > datetime.now():
                return True, self.blocked_users[user_id]['reason']
        
        return False, None
    
    def block_user(self, user_id: str, minutes: int, reason: str):
        """Block user temporarily"""
        blocked_until = datetime.now() + timedelta(minutes=minutes)
        self.blocked_users[user_id] = {
            'user_id': user_id,
            'blocked_until': blocked_until,
            'reason': reason or "No reason provided",
            'created_at': datetime.now()
        }
    
    def get_reputation_history(self, user_id: str, limit: int = 10) -> list:
        """Get user's reputation change history"""
        user_history = [
            h for h in self.reputation_history 
            if h['user_id'] == user_id
        ]
        sorted_history = sorted(user_history, key=lambda x: x['timestamp'], reverse=True)
        return sorted_history[:limit]
    
    def get_all_alerts(self, limit: int = 100) -> List[Dict]:
        """Get recent alerts"""
        sorted_alerts = sorted(self.alert_history, key=lambda x: x['timestamp'], reverse=True)
        return sorted_alerts[:limit]
    
    def get_statistics(self) -> Dict:
        """Get system statistics"""
        return {
            'total_users': len(self.user_reputation),
            'total_alerts': len(self.alert_history),
            'total_activities': len(self.rate_limits),
            'blocked_users': len([u for u in self.blocked_users.values() 
                                 if u['blocked_until'] > datetime.now()]),
            'reputation_changes': len(self.reputation_history)
        }
    
    def get_mock_scenarios(self) -> Dict:
        """Get all mock test scenarios"""
        return self.mock_data.get('scenarios', {})