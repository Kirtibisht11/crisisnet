import json
import os

class ReputationManager:
 
    def __init__(self, data_handler=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.config = config['reputation']

        if data_handler is None:
            try:
                from .json_data_handler import JsonDataHandler
                self.db = JsonDataHandler()
            except:
                from .database import TrustDatabase
                self.db = TrustDatabase()
        else:
            self.db = data_handler
    
    def get_reputation_score(self, user_id: str) -> float:
        """Get user's current reputation"""
        user_data = self.db.get_user_reputation(user_id)
        
        if not user_data:
            self.db.create_user_reputation(user_id, self.config['new_user_score'])
            return self.config['new_user_score']
        
        return user_data['reputation_score']
    
    def update_reputation(self, user_id: str, was_accurate: bool) -> float:
        """Update reputation based on accuracy"""
        current_score = self.get_reputation_score(user_id)
        
        if was_accurate:
            new_score = min(
                self.config['max_score'],
                current_score + (1 - current_score) * 0.15
            )
        else:
            new_score = max(
                self.config['min_score'],
                current_score * self.config['decay_factor'] * 0.7
            )
        
        self.db.update_user_reputation(user_id, new_score, was_accurate, current_score)
        return new_score
    
    def calculate_trust_contribution(self, user_id: str) -> float:
        """Calculate how much reputation contributes to trust"""
        reputation = self.get_reputation_score(user_id)

        if reputation >= 0.8:
            return 1.0
        elif reputation >= 0.6:
            return 0.9
        elif reputation >= 0.4:
            return 0.75
        else:
            return 0.6  
        
    def get_user_history(self, user_id: str, limit: int = 10) -> list:
        """Get recent reputation history for a user"""
        history = self.db.get_reputation_history(user_id, limit)
        return history
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get complete user statistics"""
        user_data = self.db.get_user_reputation(user_id)
        if not user_data:
            return None
        return user_data