from datetime import datetime, timedelta
from typing import List, Dict
import hashlib

class DuplicateDetector:
    """Detects duplicate/repeated crisis reports"""
    
    def __init__(self):
        self.recent_reports: List[Dict] = []
        self.max_history = 100
        self.similarity_window_hours = 2
    
    def check_duplicate(self, alert: Dict) -> tuple:
        """Check if alert is duplicate"""
        fingerprint = self._create_fingerprint(alert)
  
        if self._find_exact_match(fingerprint, alert.get('user_id')):
            return True, 0.8, "Exact duplicate from same user"
 
        similarity = self._check_user_repetition(alert)
        if similarity > 0.7:
            return True, 0.6, "Very similar to recent report"
        
        flooding = self._check_flooding_pattern(alert)
        if flooding > 0.8:
            return False, -0.2, "Multiple sources confirming"
        
        return False, 0.0, "No duplicate detected"
    
    def record_report(self, alert: Dict):
        """Store report for future checks"""
        report_record = {
            'fingerprint': self._create_fingerprint(alert),
            'user_id': alert.get('user_id'),
            'crisis_type': alert.get('crisis_type'),
            'location': alert.get('location'),
            'timestamp': datetime.now(),
            'message': alert.get('message', '')[:100]
        }
        
        self.recent_reports.append(report_record)
        
        if len(self.recent_reports) > self.max_history:
            self.recent_reports.pop(0)
        
        self._cleanup_old_reports()
    
    def _create_fingerprint(self, alert: Dict) -> str:
        """Create unique hash for alert"""
        content = f"{alert.get('crisis_type', '')}|{alert.get('location', '')}|{alert.get('message', '')}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _find_exact_match(self, fingerprint: str, user_id: str) -> bool:
        """Check exact match from same user"""
        cutoff = datetime.now() - timedelta(hours=self.similarity_window_hours)
        
        for report in self.recent_reports:
            if (report['fingerprint'] == fingerprint and 
                report['user_id'] == user_id and
                report['timestamp'] > cutoff):
                return True
        return False
    
    def _check_user_repetition(self, alert: Dict) -> float:
        """Check similarity to user's recent reports"""
        user_id = alert.get('user_id')
        cutoff = datetime.now() - timedelta(hours=self.similarity_window_hours)
        
        user_reports = [r for r in self.recent_reports 
                       if r['user_id'] == user_id and r['timestamp'] > cutoff]
        
        if not user_reports:
            return 0.0
        
        similar_count = 0
        for report in user_reports:
            similarity = 0.0
            if report['crisis_type'] == alert.get('crisis_type'):
                similarity += 0.5
            if report['location'] == alert.get('location'):
                similarity += 0.5
            if similarity >= 0.7:
                similar_count += 1
        
        return similar_count / len(user_reports) if user_reports else 0.0
    
    def _check_flooding_pattern(self, alert: Dict) -> float:
        """Check if many reports about same crisis (good sign)"""
        cutoff = datetime.now() - timedelta(minutes=30)
        
        similar = [r for r in self.recent_reports
                  if (r['crisis_type'] == alert.get('crisis_type') and
                      r['location'] == alert.get('location') and
                      r['timestamp'] > cutoff and
                      r['user_id'] != alert.get('user_id'))]
        
        return min(1.0, len(similar) / 5.0)
    
    def _cleanup_old_reports(self):
        """Remove old reports"""
        cutoff = datetime.now() - timedelta(hours=self.similarity_window_hours * 2)
        self.recent_reports = [r for r in self.recent_reports if r['timestamp'] > cutoff]
    
    def get_statistics(self) -> Dict:
        """Get detector statistics"""
        return {
            'total_reports_tracked': len(self.recent_reports),
            'window_hours': self.similarity_window_hours
        }