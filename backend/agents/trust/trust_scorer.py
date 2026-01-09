import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import math

class TrustScorer:
    """Enhanced Trust Scorer with Historical Data"""

    def __init__(self, db=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.weights = config['scoring_weights']
        self.thresholds = config['verification_levels']
        self.db = db  # Database connection for historical data
        
        # Historical data settings
        self.history_decay_factor = 0.95  # Recent data weighted more
        self.history_window_days = 30  # Look back 30 days
        self.min_history_samples = 5  # Minimum samples needed for historical scoring
    
    def calculate_trust_score(self, 
                             cross_verification_score: float,
                             reputation_contribution: float,
                             duplicate_penalty: float,
                             rate_limit_penalty: float,
                             additional_signals: dict = None,
                             user_id: str = None,
                             crisis_type: str = None) -> dict:
        """
        Calculate final trust score from all components
        ENHANCED: Now includes historical performance weighting
        """

        # === STEP 1: Calculate base score ===
        base_score = (
            cross_verification_score * self.weights['cross_verification'] +
            reputation_contribution * self.weights['source_reputation']
        )

        # === STEP 2: Apply penalties ===
        duplicate_adjustment = duplicate_penalty * self.weights['duplicate_check']
        rate_adjustment = rate_limit_penalty * self.weights['rate_limit_penalty']
        base_score -= duplicate_adjustment
        base_score -= rate_adjustment

        # === STEP 3: Add bonus signals ===
        bonus_score = 0.0
        if additional_signals:
            if additional_signals.get('has_image'):
                bonus_score += 0.05
            if additional_signals.get('has_location'):
                bonus_score += 0.03
            if additional_signals.get('sentiment_urgent'):
                bonus_score += 0.02

        # === STEP 4: ROUND 2 ENHANCEMENT - Apply historical performance boost ===
        historical_boost = 0.0
        historical_data = None
        
        if self.db and user_id:
            historical_data = self._calculate_historical_boost(user_id)
            historical_boost = historical_data.get('boost', 0.0)
            base_score += historical_boost

        # === STEP 5: Calculate final score ===
        final_score = max(0.0, min(1.0, base_score + bonus_score))

        # === STEP 6: ROUND 2 ENHANCEMENT - Use dynamic thresholds ===
        decision, status = self._make_decision_dynamic(final_score, crisis_type)
        
        result = {
            'final_score': round(final_score, 3),
            'decision': decision,
            'status': status,
            'components': {
                'cross_verification': round(cross_verification_score * self.weights['cross_verification'], 3),
                'source_reputation': round(reputation_contribution * self.weights['source_reputation'], 3),
                'duplicate_adjustment': round(-duplicate_adjustment, 3),
                'rate_limit_penalty': round(-rate_adjustment, 3),
                'bonus_signals': round(bonus_score, 3),
                'historical_boost': round(historical_boost, 3)  # NEW
            },
            'breakdown': {
                'base_score': round(base_score, 3),
                'adjustments': round(bonus_score - duplicate_adjustment - rate_adjustment, 3)
            }
        }
        
        # Add historical data if available
        if historical_data:
            result['historical_performance'] = historical_data
        
        return result
    
    def _calculate_historical_boost(self, user_id: str) -> Dict:
        """
        Calculate trust boost based on historical performance
        
        Algorithm:
        - Get user's recent report history
        - Apply time decay (recent reports weighted more)
        - Calculate weighted accuracy rate
        - Convert to boost/penalty value
        """
        if not self.db:
            return {'boost': 0.0, 'reason': 'No database connection'}
        
        try:
            # Get reputation history
            history = self.db.get_reputation_history(user_id, limit=50)
            
            if not history or len(history) < self.min_history_samples:
                return {
                    'boost': 0.0,
                    'reason': f'Insufficient history ({len(history) if history else 0} samples)',
                    'samples': len(history) if history else 0
                }
            
            # Calculate time-weighted accuracy
            now = datetime.now()
            weighted_sum = 0.0
            total_weight = 0.0
            
            for record in history:
                # Parse timestamp
                if isinstance(record['timestamp'], str):
                    timestamp = datetime.fromisoformat(record['timestamp'])
                else:
                    timestamp = record['timestamp']
                
                # Calculate time decay weight
                days_ago = (now - timestamp).days
                weight = self.history_decay_factor ** days_ago
                
                # Add to weighted sum
                accurate = 1.0 if record['was_accurate'] else 0.0
                weighted_sum += accurate * weight
                total_weight += weight
            
            # Calculate weighted accuracy rate
            weighted_accuracy = weighted_sum / total_weight if total_weight > 0 else 0.5
            
            # Convert to boost/penalty (-0.1 to +0.1)
            # Accuracy > 0.7 = boost, < 0.5 = penalty
            if weighted_accuracy >= 0.7:
                boost = (weighted_accuracy - 0.7) * 0.33  # Max +0.1 at 100%
            elif weighted_accuracy < 0.5:
                boost = (weighted_accuracy - 0.5) * 0.2  # Max -0.1 at 0%
            else:
                boost = 0.0  # Neutral zone
            
            return {
                'boost': round(boost, 3),
                'weighted_accuracy': round(weighted_accuracy, 3),
                'samples': len(history),
                'reason': f'Based on {len(history)} historical reports'
            }
            
        except Exception as e:
            print(f"[TrustScorer] Historical boost calculation failed: {e}")
            return {'boost': 0.0, 'reason': f'Error: {str(e)}'}
    
    def _make_decision(self, score: float) -> tuple:
        """Original decision logic (kept for backward compatibility)"""
        if score >= self.thresholds['auto_verify']:
            return 'VERIFIED', 'Auto-verified - High confidence'
        elif score >= self.thresholds['needs_review']:
            return 'REVIEW', 'Needs human review'
        elif score >= self.thresholds['reject']:
            return 'UNCERTAIN', 'Low confidence'
        else:
            return 'REJECTED', 'Rejected - Trust score too low'
    
    def _make_decision_dynamic(self, score: float, crisis_type: str = None) -> tuple:
        """
        Dynamic thresholds based on crisis type
        
        Different crisis types have different threshold requirements:
        - High-severity crises (earthquake, fire): Lower thresholds (more lenient)
        - Medium crises (flood): Standard thresholds
        - Low-severity reports: Higher thresholds (more strict)
        """
        
        # Get dynamic thresholds
        thresholds = self._get_dynamic_thresholds(crisis_type)
        
        if score >= thresholds['auto_verify']:
            return 'VERIFIED', f'Auto-verified - High confidence (threshold: {thresholds["auto_verify"]})'
        elif score >= thresholds['needs_review']:
            return 'REVIEW', f'Needs human review (threshold: {thresholds["needs_review"]})'
        elif score >= thresholds['reject']:
            return 'UNCERTAIN', f'Low confidence (threshold: {thresholds["reject"]})'
        else:
            return 'REJECTED', f'Rejected - Trust score too low (threshold: {thresholds["reject"]})'
    
    def _get_dynamic_thresholds(self, crisis_type: str = None) -> Dict[str, float]:
        """
        ROUND 2 NEW METHOD: Get dynamic thresholds based on crisis type
        
        Crisis Severity Levels:
        - CRITICAL (earthquake, fire, explosion): Thresholds -0.15
        - HIGH (flood, landslide, tsunami): Thresholds -0.10
        - MEDIUM (storm, accident): Standard thresholds
        - LOW (other): Thresholds +0.10
        """
        
        base_thresholds = self.thresholds.copy()
        
        if not crisis_type:
            return base_thresholds
        
        crisis_lower = crisis_type.lower()
        
        # Critical severity - lower thresholds (more lenient)
        if crisis_lower in ['earthquake', 'fire', 'explosion', 'terrorist']:
            adjustment = -0.15
        # High severity
        elif crisis_lower in ['flood', 'landslide', 'tsunami', 'cyclone']:
            adjustment = -0.10
        # Medium severity (standard)
        elif crisis_lower in ['storm', 'accident', 'medical']:
            adjustment = 0.0
        # Low severity - higher thresholds (more strict)
        else:
            adjustment = 0.10
        
        return {
            'auto_verify': max(0.5, min(0.95, base_thresholds['auto_verify'] + adjustment)),
            'needs_review': max(0.4, min(0.85, base_thresholds['needs_review'] + adjustment)),
            'reject': max(0.2, min(0.6, base_thresholds['reject'] + adjustment))
        }
    
    def get_crisis_severity_info(self, crisis_type: str) -> Dict:
        """Get severity level and threshold info for a crisis type"""
        thresholds = self._get_dynamic_thresholds(crisis_type)
        base = self.thresholds
        
        adjustment = thresholds['auto_verify'] - base['auto_verify']
        
        if adjustment < -0.10:
            severity = "CRITICAL"
            explanation = "Lower thresholds - alerts treated with higher urgency"
        elif adjustment < 0:
            severity = "HIGH"
            explanation = "Slightly lower thresholds - important alerts"
        elif adjustment == 0:
            severity = "MEDIUM"
            explanation = "Standard thresholds"
        else:
            severity = "LOW"
            explanation = "Higher thresholds - requires more verification"
        
        return {
            'crisis_type': crisis_type,
            'severity': severity,
            'thresholds': thresholds,
            'adjustment': round(adjustment, 2),
            'explanation': explanation
        }
    
    def explain_score(self, score_result: dict) -> str:
        """Generate human-readable explanation (ENHANCED)"""
        score = score_result['final_score']
        decision = score_result['decision']
        components = score_result['components']
        
        explanation = f"Trust Score: {score:.2f} → {decision}\n\n"
        explanation += "Score Breakdown:\n"
        explanation += f"  Cross-Verification: +{components['cross_verification']:.2f}\n"
        explanation += f"  Source Reputation:  +{components['source_reputation']:.2f}\n"
        
        # NEW: Historical boost
        if components.get('historical_boost', 0) != 0:
            explanation += f"  Historical Performance: {components['historical_boost']:+.2f}\n"
        
        if components['duplicate_adjustment'] != 0:
            explanation += f"  Duplicate Check:    {components['duplicate_adjustment']:+.2f}\n"
        if components['rate_limit_penalty'] != 0:
            explanation += f"  Rate Limit:         {components['rate_limit_penalty']:+.2f}\n"
        if components['bonus_signals'] > 0:
            explanation += f"  Bonus Signals:      +{components['bonus_signals']:.2f}\n"
        
        # Add historical data if available
        if 'historical_performance' in score_result:
            hist = score_result['historical_performance']
            explanation += f"\nHistorical Data: {hist['reason']}\n"
            if 'weighted_accuracy' in hist:
                explanation += f"  Weighted Accuracy: {hist['weighted_accuracy']:.1%}\n"
        
        explanation += f"\nFinal Decision: {score_result['status']}"
        return explanation
    
    def get_thresholds(self, crisis_type: str = None) -> dict:
        """Return current thresholds (optionally for specific crisis type)"""
        if crisis_type:
            return self._get_dynamic_thresholds(crisis_type)
        return self.thresholds.copy()
    
    def calculate_agent_trust_modifier(self, agent_type: str, days: int = 7) -> float:
        """
        Calculate trust modifier based on agent's historical performance
        
        This can be used to adjust trust scores based on which agent detected/verified the alert
        
        Returns: Modifier value between -0.1 and +0.1
        """
        if not self.db:
            return 0.0
        
        try:
            success_rate = self.db.calculate_agent_success_rate(agent_type, days)
            
            # Convert success rate to modifier
            # 90%+ success = +0.1 boost
            # 50% success = 0 (neutral)
            # <30% success = -0.1 penalty
            
            if success_rate >= 0.9:
                return 0.1
            elif success_rate >= 0.7:
                return (success_rate - 0.7) * 0.5  # Scale 0.7-0.9 to 0-0.1
            elif success_rate >= 0.5:
                return 0.0  # Neutral zone
            elif success_rate >= 0.3:
                return (success_rate - 0.5) * 0.5  # Scale 0.3-0.5 to -0.1-0
            else:
                return -0.1
                
        except Exception as e:
            print(f"[TrustScorer] Agent modifier calculation failed: {e}")
            return 0.0
    
    def get_scoring_summary(self) -> Dict:
        """Get comprehensive summary of scoring configuration"""
        return {
            'weights': self.weights,
            'base_thresholds': self.thresholds,
            'historical_settings': {
                'decay_factor': self.history_decay_factor,
                'window_days': self.history_window_days,
                'min_samples': self.min_history_samples
            },
            'crisis_severity_levels': {
                'CRITICAL': ['earthquake', 'fire', 'explosion', 'terrorist'],
                'HIGH': ['flood', 'landslide', 'tsunami', 'cyclone'],
                'MEDIUM': ['storm', 'accident', 'medical'],
                'LOW': ['other']
            }
        }