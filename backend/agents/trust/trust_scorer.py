import json
import os

class TrustScorer:

    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.weights = config['scoring_weights']
        self.thresholds = config['verification_levels']
    
    def calculate_trust_score(self, 
                             cross_verification_score: float,
                             reputation_contribution: float,
                             duplicate_penalty: float,
                             rate_limit_penalty: float,
                             additional_signals: dict = None) -> dict:
        """Calculate final trust score from all components"""

        base_score = (
            cross_verification_score * self.weights['cross_verification'] +
            reputation_contribution * self.weights['source_reputation']
        )

        duplicate_adjustment = duplicate_penalty * self.weights['duplicate_check']
        rate_adjustment = rate_limit_penalty * self.weights['rate_limit_penalty']
        base_score -= duplicate_adjustment
        base_score -= rate_adjustment

        bonus_score = 0.0
        if additional_signals:
            if additional_signals.get('has_image'):
                bonus_score += 0.05
            if additional_signals.get('has_location'):
                bonus_score += 0.03
            if additional_signals.get('sentiment_urgent'):
                bonus_score += 0.02

        final_score = max(0.0, min(1.0, base_score + bonus_score))

        decision, status = self._make_decision(final_score)
        
        return {
            'final_score': round(final_score, 3),
            'decision': decision,
            'status': status,
            'components': {
                'cross_verification': round(cross_verification_score * self.weights['cross_verification'], 3),
                'source_reputation': round(reputation_contribution * self.weights['source_reputation'], 3),
                'duplicate_adjustment': round(-duplicate_adjustment, 3),
                'rate_limit_penalty': round(-rate_adjustment, 3),
                'bonus_signals': round(bonus_score, 3)
            },
            'breakdown': {
                'base_score': round(base_score, 3),
                'adjustments': round(bonus_score - duplicate_adjustment - rate_adjustment, 3)
            }
        }
    
    def _make_decision(self, score: float) -> tuple:
        """Determine verification decision"""
        if score >= self.thresholds['auto_verify']:
            return 'VERIFIED', 'Auto-verified - High confidence'
        elif score >= self.thresholds['needs_review']:
            return 'REVIEW', 'Needs human review'
        elif score >= self.thresholds['reject']:
            return 'UNCERTAIN', 'Low confidence'
        else:
            return 'REJECTED', 'Rejected - Trust score too low'
    
    def explain_score(self, score_result: dict) -> str:
        """Generate human-readable explanation"""
        score = score_result['final_score']
        decision = score_result['decision']
        components = score_result['components']
        
        explanation = f"Trust Score: {score:.2f} → {decision}\n\n"
        explanation += "Score Breakdown:\n"
        explanation += f"  Cross-Verification: +{components['cross_verification']:.2f}\n"
        explanation += f"  Source Reputation:  +{components['source_reputation']:.2f}\n"
        
        if components['duplicate_adjustment'] != 0:
            explanation += f"  Duplicate Check:    {components['duplicate_adjustment']:+.2f}\n"
        if components['rate_limit_penalty'] != 0:
            explanation += f"  Rate Limit:         {components['rate_limit_penalty']:+.2f}\n"
        if components['bonus_signals'] > 0:
            explanation += f"  Bonus Signals:      +{components['bonus_signals']:.2f}\n"
        
        explanation += f"\nFinal Decision: {score_result['status']}"
        return explanation
    
    def get_thresholds(self) -> dict:
        """Return current thresholds"""
        return self.thresholds.copy()