from typing import Dict
from .trust import (
    TrustScorer,
    CrossVerifier,
    DuplicateDetector,
    ReputationManager,
    RateLimiter,
    TrustDatabase
)

class TrustAgent:
    """Main Trust Agent - Orchestrates all trust verification"""
    
    def __init__(self):
        print("Initializing Trust Agent...")
        
        self.db = TrustDatabase()
        self.scorer = TrustScorer()
        self.cross_verifier = CrossVerifier()
        self.duplicate_detector = DuplicateDetector()
        self.reputation_manager = ReputationManager()
        self.rate_limiter = RateLimiter()
        
        print("Trust Agent ready")
    
    def verify_alert(self, alert: Dict) -> Dict:
        """Main verification pipeline"""
        user_id = alert.get('user_id', 'unknown')
        
        print(f"\nVerifying alert from: {user_id}")
        print(f"   Crisis: {alert.get('crisis_type')} at {alert.get('location')}")

        rate_check, reason = self.rate_limiter.check_rate_limit(user_id)
        if not rate_check:
            print(f"   Rate limit: {reason}")
            return {
                'verified': False,
                'decision': 'REJECTED',
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
    
    def update_user_feedback(self, user_id: str, was_accurate: bool):
        """Update reputation based on feedback"""
        old_rep = self.reputation_manager.get_reputation_score(user_id)
        new_rep = self.reputation_manager.update_reputation(user_id, was_accurate)
        
        change = new_rep - old_rep
        print(f"{'increases' if change > 0 else 'decreases'} {user_id}: {old_rep:.2f} → {new_rep:.2f}")
        
        return {
            'user_id': user_id,
            'old_reputation': old_rep,
            'new_reputation': new_rep,
            'change': change,
            'was_accurate': was_accurate
        }
    
    def _detect_urgency(self, message: str) -> bool:
        """Simple urgency detection"""
        urgent = ['urgent', 'emergency', 'help', 'danger', 'trapped']
        return any(word in message.lower() for word in urgent)
    
    def get_system_status(self) -> Dict:
        """Get system status"""
        return {
            'trust_agent': 'operational',
            'components': {
                'cross_verifier': self.cross_verifier.get_verification_stats(),
                'duplicate_detector': self.duplicate_detector.get_statistics(),
                'thresholds': self.scorer.get_thresholds()
            }
        }