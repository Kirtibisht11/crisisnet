from typing import Dict
from .trust import (
    JsonDataHandler,
    TrustScorer,
    CrossVerifier,
    DuplicateDetector,
    ReputationManager,
    RateLimiter
)

class TrustAgent:
 
    def __init__(self, use_json=True, json_data_path=None):
        if use_json:
            self.db = JsonDataHandler(json_data_path)
            print("Using JSON data handler (Round 1 mode)")
        else:
            from .trust import TrustDatabase
            self.db = TrustDatabase()
            print("Using SQLite database")

        self.scorer = TrustScorer()
        self.cross_verifier = CrossVerifier(self.db)
        self.duplicate_detector = DuplicateDetector()
        self.reputation_manager = ReputationManager(self.db)
        self.rate_limiter = RateLimiter(self.db)
        
        print("Trust Agent ready\n")
    
    def verify_alert(self, alert: Dict) -> Dict:
        user_id = alert.get('user_id', 'unknown')
        
        print(f"   Verifying alert from: {user_id}")
        print(f"   Crisis: {alert.get('crisis_type')} at {alert.get('location')}")

        rate_check, reason = self.rate_limiter.check_rate_limit(user_id)
        if not rate_check:
            print(f"   Rate limit: {reason}")
            return {
                'verified': False,
                'decision': 'REJECTED',
                'status': 'Rate limit exceeded',
                'reason': reason,
                'trust_score': 0.0,
                'user_id': user_id
            }
        
        rate_penalty = self.rate_limiter.get_penalty_score(user_id)
  
        is_dup, dup_penalty, dup_reason = self.duplicate_detector.check_duplicate(alert)
        if is_dup and dup_penalty > 0.5:
            print(f"   Duplicate: {dup_reason}")
            return {
                'verified': False,
                'decision': 'REJECTED',
                'status': 'Duplicate detected',
                'reason': dup_reason,
                'trust_score': 0.2,
                'user_id': user_id
            }

        reputation = self.reputation_manager.get_reputation_score(user_id)
        reputation_contribution = self.reputation_manager.calculate_trust_contribution(user_id)
        print(f"   User reputation: {reputation:.2f}")

        cross_score, num_sources, cross_details = self.cross_verifier.verify_alert(alert)
        print(f"   Cross-verification: {cross_score:.2f} ({cross_details})")

        additional_signals = {
            'has_image': alert.get('has_image', False),
            'has_location': alert.get('lat') is not None,
            'sentiment_urgent': self._detect_urgency(alert.get('message', ''))
        }

        score_result = self.scorer.calculate_trust_score(
            cross_verification_score=cross_score,
            reputation_contribution=reputation_contribution,
            duplicate_penalty=dup_penalty if dup_penalty > 0 else -dup_penalty,
            rate_limit_penalty=rate_penalty,
            additional_signals=additional_signals
        )

        alert_id = self.cross_verifier.add_alert(alert)
        self.rate_limiter.record_activity(user_id)
        self.duplicate_detector.record_report(alert)
        
        final_score = score_result['final_score']
        decision = score_result['decision']
        
        print(f"   Trust Score: {final_score:.3f}")
        print(f"   Decision: {decision}")

        return {
            'verified': decision == 'VERIFIED',
            'trust_score': final_score,
            'decision': decision,
            'status': score_result['status'],
            'user_id': user_id,
            'reputation': reputation,
            'cross_verification': {
                'score': cross_score,
                'sources': num_sources,
                'details': cross_details
            },
            'components': score_result['components'],
            'explanation': self.scorer.explain_score(score_result),
            'metadata': {
                'rate_penalty': rate_penalty,
                'duplicate_penalty': dup_penalty,
                'additional_signals': additional_signals,
                'alert_id': alert_id
            }
        }
    
    def update_user_feedback(self, user_id: str, was_accurate: bool) -> Dict:
        old_rep = self.reputation_manager.get_reputation_score(user_id)
        new_rep = self.reputation_manager.update_reputation(user_id, was_accurate)
        
        change = new_rep - old_rep
        action = 'increases' if change > 0 else 'decreases'
        print(f"Reputation {action}: {user_id}: {old_rep:.2f} → {new_rep:.2f}")
        
        return {
            'user_id': user_id,
            'old_reputation': old_rep,
            'new_reputation': new_rep,
            'change': change,
            'was_accurate': was_accurate
        }
    
    def _detect_urgency(self, message: str) -> bool:
        """Detect urgency keywords in message"""
        if not message:
            return False
        
        urgent_keywords = [
            'urgent', 'emergency', 'help', 'danger', 'trapped',
            'severe', 'serious', 'critical', 'immediately', 'sos'
        ]
        
        message_lower = message.lower()
        return any(word in message_lower for word in urgent_keywords)
    
    def get_system_status(self) -> Dict:
        """Get current system status and configuration"""
        return {
            'trust_agent': 'operational',
            'mode': 'json' if isinstance(self.db, JsonDataHandler) else 'database',
            'components': {
                'cross_verifier': self.cross_verifier.get_verification_stats(),
                'duplicate_detector': self.duplicate_detector.get_statistics(),
                'thresholds': self.scorer.get_thresholds()
            },
            'statistics': self.db.get_statistics() if hasattr(self.db, 'get_statistics') else {}
        }
    
    def get_user_profile(self, user_id: str) -> Dict:
        """Get complete user profile"""
        reputation_data = self.db.get_user_reputation(user_id)
        if not reputation_data:
            return None
        
        history = self.reputation_manager.get_user_history(user_id, limit=5)
        
        return {
            'user_id': user_id,
            'reputation': reputation_data['reputation_score'],
            'total_reports': reputation_data['total_reports'],
            'accurate_reports': reputation_data['accurate_reports'],
            'false_reports': reputation_data['false_reports'],
            'recent_history': history
        }