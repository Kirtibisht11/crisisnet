import json
import os
import math

class CrossVerifier:
 
    def __init__(self, data_handler=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.config = config['cross_verification']
        
        if data_handler is None:
            try:
                from .json_data_handler import JsonDataHandler
                self.db = JsonDataHandler()
            except:
                from .database import TrustDatabase
                self.db = TrustDatabase()
        else:
            self.db = data_handler
    
    def verify_alert(self, new_alert: dict) -> tuple:
        matching_alerts = self.db.find_similar_alerts(
            crisis_type=new_alert.get('crisis_type'),
            location=new_alert.get('location'),
            minutes=self.config['time_window_minutes'],
            exclude_user=new_alert.get('user_id')
        )
        
        if not matching_alerts:
            return 0.5, 0, "First report - no cross-verification available"
   
        if new_alert.get('lat') and new_alert.get('lon'):
            matching_alerts = [
                alert for alert in matching_alerts
                if self._is_nearby(
                    new_alert['lat'], new_alert['lon'],
                    alert['latitude'], alert['longitude']
                )
            ]
        
        num_sources = len(matching_alerts)
        unique_users = len(set(alert['user_id'] for alert in matching_alerts))
        
        if unique_users >= self.config['min_sources']:
            base_score = 0.7
            bonus = min(0.25, (unique_users - self.config['min_sources']) * 0.08)
            verification_score = base_score + bonus
        else:
            verification_score = 0.4 + (unique_users * 0.15)
        
        details = f"Confirmed by {unique_users} independent source(s)"
        return verification_score, unique_users, details
    
    def add_alert(self, alert: dict) -> int:
        import hashlib
        
        content = f"{alert.get('crisis_type', '')}|{alert.get('location', '')}|{alert.get('message', '')}"
        fingerprint = hashlib.md5(content.encode()).hexdigest()
        
        alert_data = {
            'user_id': alert.get('user_id'),
            'crisis_type': alert.get('crisis_type'),
            'location': alert.get('location'),
            'lat': alert.get('lat'),
            'lon': alert.get('lon'),
            'message': alert.get('message', ''),
            'fingerprint': fingerprint
        }
        
        return self.db.save_alert(alert_data)
    
    def _is_nearby(self, lat1: float, lon1: float, lat2: float, lon2: float) -> bool:
        if None in (lat1, lon1, lat2, lon2):
            return True
        
        distance = self._haversine_distance(lat1, lon1, lat2, lon2)
        return distance <= self.config['location_radius_km']
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371  
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def get_verification_stats(self) -> dict:
        return {
            'time_window_minutes': self.config['time_window_minutes'],
            'location_radius_km': self.config['location_radius_km'],
            'min_sources_required': self.config['min_sources']
        }