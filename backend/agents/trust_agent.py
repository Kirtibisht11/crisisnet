from typing import Dict
import time
from datetime import datetime

# Import trust components
from .trust.database import TrustDatabase
from .trust.trust_scorer import TrustScorer
from .trust.cross_verification import CrossVerifier
from .trust.duplicate_detector import DuplicateDetector
from .trust.source_reputation import ReputationManager
from .trust.rate_limiter import RateLimiter


try:
    from .trust.json_data_handler import JsonDataHandler
except ImportError:
    JsonDataHandler = None

class TrustAgent:
    """
    Enhanced Trust Agent
    
    New Features:
    - SQLite database by default (not JSON)
    - Historical performance tracking
    - Dynamic thresholds based on crisis type
    - Complete audit logging
    - Agent performance recording
    """
 
    def __init__(self, use_database=True, db_path=None, json_data_path=None):
        """
        Initialize Trust Agent
        
        Args:
            use_database: If True, use SQLite (default for Round 2)
            db_path: Path to SQLite database
            json_data_path: Path to JSON files (legacy mode)
        """
        #Default to database mode
        if use_database:
            self.db = TrustDatabase(db_path)
            self.mode = 'database'
            print("Trust Agent using SQLite database (Round 2 mode)")
        else:
            if JsonDataHandler is None:
                raise ImportError("JsonDataHandler not available. Install it for legacy mode.")
            self.db = JsonDataHandler(json_data_path)
            self.mode = 'json'
            print("Trust Agent using JSON data handler (Round 1 legacy mode)")

        # Initialize components with database connection
        self.scorer = TrustScorer(db=self.db)
        self.cross_verifier = CrossVerifier(self.db)
        self.duplicate_detector = DuplicateDetector()
        self.reputation_manager = ReputationManager(self.db)
        self.rate_limiter = RateLimiter(self.db)
        
        print("Trust Agent initialized with all components\n")
    
    def verify_alert(self, alert: Dict) -> Dict:
        """
        Main verification method - ENHANCED for Round 2
        
        New additions:
        - Historical performance consideration
        - Dynamic thresholds by crisis type
        - Complete audit logging
        - Performance tracking
        """
        start_time = time.time()
        
        user_id = alert.get('user_id', 'unknown')
        crisis_type = alert.get('crisis_type', 'unknown')
        alert_id = alert.get('alert_id')
        
        print(f"\n{'='*60}")
        print(f"   TRUST VERIFICATION STARTED")
        print(f"{'='*60}")
        print(f"   User: {user_id}")
        print(f"   Crisis: {crisis_type} at {alert.get('location')}")
        print(f"   Alert ID: {alert_id}")
        print(f"{'='*60}\n")

        # ========== STEP 1: Rate Limit Check ==========
        rate_check, reason = self.rate_limiter.check_rate_limit(user_id)
        if not rate_check:
            print(f"   REJECTED: {reason}")
            result = self._create_rejection_result(
                user_id, 'RATE_LIMIT', reason, 0.0, alert_id
            )
            self._log_decision(alert_id, user_id, result)
            return result
        
        rate_penalty = self.rate_limiter.get_penalty_score(user_id)
        if rate_penalty > 0:
            print(f"   Rate penalty applied: -{rate_penalty:.2f}")
  
        # ========== STEP 2: Duplicate Check ==========
        is_dup, dup_penalty, dup_reason = self.duplicate_detector.check_duplicate(alert)
        if is_dup and dup_penalty > 0.5:
            print(f"   REJECTED: {dup_reason}")
            result = self._create_rejection_result(
                user_id, 'DUPLICATE', dup_reason, 0.2, alert_id
            )
            self._log_decision(alert_id, user_id, result)
            return result
        
        if dup_penalty > 0:
            print(f"   Duplicate penalty: -{dup_penalty:.2f}")

        # ========== STEP 3: User Reputation ==========
        reputation = self.reputation_manager.get_reputation_score(user_id)
        reputation_contribution = self.reputation_manager.calculate_trust_contribution(user_id)
        print(f"   User reputation: {reputation:.2f} (contribution: +{reputation_contribution:.2f})")

        # ========== STEP 4: Cross-Verification ==========
        cross_score, num_sources, cross_details = self.cross_verifier.verify_alert(alert)
        print(f"   Cross-verification: {cross_score:.2f} from {num_sources} sources")
        print(f"     Details: {cross_details}")

        # ========== STEP 5: Additional Signals ==========
        additional_signals = {
            'has_image': alert.get('has_image', False),
            'has_location': alert.get('lat') is not None,
            'sentiment_urgent': self._detect_urgency(alert.get('message', ''))
        }
        
        signal_count = sum(1 for v in additional_signals.values() if v)
        if signal_count > 0:
            print(f"   Bonus signals: {signal_count} detected")

        # ========== STEP 6: Calculate Trust Score with History ==========
        print(f"\n   Calculating trust score with historical data...")
        
        score_result = self.scorer.calculate_trust_score(
            cross_verification_score=cross_score,
            reputation_contribution=reputation_contribution,
            duplicate_penalty=dup_penalty if dup_penalty > 0 else -dup_penalty,
            rate_limit_penalty=rate_penalty,
            additional_signals=additional_signals,
            user_id=user_id,  # NEW: Pass user_id for historical data
            crisis_type=crisis_type  # NEW: Pass crisis type for dynamic thresholds
        )

        # ========== STEP 7: Record Alert in Database ==========
        try:
            alert_data = {
                'user_id': user_id,
                'crisis_type': crisis_type,
                'location': alert.get('location', 'unknown'),
                'lat': alert.get('lat'),
                'lon': alert.get('lon'),
                'message': alert.get('message', ''),
                'fingerprint': alert.get('fingerprint', f"{user_id}_{crisis_type}_{int(time.time())}"),
                'trust_score': score_result['final_score']
            }
            saved_alert_id = self.db.save_alert(alert_data)
            print(f"   Alert saved to database (ID: {saved_alert_id})")
        except Exception as e:
            print(f"   Alert save failed: {e}")
            saved_alert_id = alert_id

        # ========== STEP 8: Log Activities ==========
        try:
            self.rate_limiter.record_activity(user_id)
            self.duplicate_detector.record_report(alert)
        except Exception as e:
            print(f"   Activity logging failed: {e}")

        # ========== STEP 9: Log Cross-Verification ==========
        if self.mode == 'database':
            try:
                self.db.save_cross_verification_log(
                    alert_id=saved_alert_id,
                    primary_source=user_id,
                    verified_sources=[],  # Will be populated by cross_verifier
                    conflicting_sources=[],
                    verification_score=cross_score,
                    consensus_level='HIGH' if cross_score > 0.7 else 'MEDIUM' if cross_score > 0.5 else 'LOW'
                )
            except Exception as e:
                print(f"   Cross-verification logging failed: {e}")

        # ========== STEP 10: Make Final Decision ==========
        final_score = score_result['final_score']
        decision = score_result['decision']
        
        print(f"\n{'='*60}")
        print(f"   TRUST SCORE: {final_score:.3f}")
        print(f"   DECISION: {decision}")
        print(f"{'='*60}\n")

        # ========== STEP 11: Resource Allocation (if verified) ==========
        if decision == "VERIFIED":
            try:
                from backend.agents.resource_agent import agent as resource_agent
                crisis = {
                    "type": crisis_type,
                    "location": alert.get("location"),
                    "lat": alert.get("lat"),
                    "lon": alert.get("lon"),
                    "severity": alert.get("severity", "medium"),
                    "required_skills": self._infer_required_skills(crisis_type),
                    "alert_id": saved_alert_id
                }
                resource_agent.allocate_resources(crisis)
                print(f"   Resources allocated for verified alert")
            except Exception as e:
                print(f"   Resource allocation failed: {e}")

        # ========== STEP 12: Build Result Object ==========
        response_time = time.time() - start_time
        
        result = {
            'verified': decision == 'VERIFIED',
            'trust_score': final_score,
            'decision': decision,
            'status': score_result['status'],
            'user_id': user_id,
            'alert_id': saved_alert_id,
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
                'crisis_type': crisis_type,
                'response_time_ms': round(response_time * 1000, 2)
            }
        }
        
        # Add historical data if available
        if 'historical_performance' in score_result:
            result['historical_performance'] = score_result['historical_performance']

        # ========== STEP 13: Audit Logging ==========
        self._log_decision(saved_alert_id, user_id, result)
        
        # ========== STEP 14:Record Agent Performance ==========
        self._record_performance(decision == 'VERIFIED', response_time, final_score)

        print(f"   Processing completed in {response_time*1000:.0f}ms\n")
        
        return result
    
    def _create_rejection_result(self, user_id: str, reason_type: str, 
                                 reason: str, score: float, alert_id) -> Dict:
        """Helper to create rejection result"""
        return {
            'verified': False,
            'decision': 'REJECTED',
            'status': f'Rejected - {reason_type}',
            'reason': reason,
            'trust_score': score,
            'user_id': user_id,
            'alert_id': alert_id,
            'metadata': {'rejection_type': reason_type}
        }
    
    def _log_decision(self, alert_id, user_id: str, result: Dict):
        """ Log trust decision for audit trail"""
        if self.mode == 'database':
            try:
                self.db.save_trust_decision(
                    alert_id=alert_id,
                    user_id=user_id,
                    decision=result['decision'],
                    trust_score=result['trust_score'],
                    components=result.get('components', {}),
                    reasoning=result.get('explanation', 'No explanation available')
                )
            except Exception as e:
                print(f"   Decision audit logging failed: {e}")
    
    def _record_performance(self, success: bool, response_time: float, accuracy: float):
        """ Record agent's own performance"""
        if self.mode == 'database':
            try:
                self.db.save_agent_performance(
                    agent_type='trust',
                    agent_id='trust_agent_1',
                    task_type='alert_verification',
                    success=success,
                    response_time=response_time,
                    accuracy_score=accuracy,
                    metadata={'timestamp': datetime.now().isoformat()}
                )
            except Exception as e:
                print(f"   Performance recording failed: {e}")
    
    def _infer_required_skills(self, crisis_type: str):
        """Infer required volunteer skills from crisis type"""
        if not crisis_type:
            return []
        mapping = {
            "flood": ["rescue", "first_aid", "swimming"],
            "fire": ["firefighting", "medical", "evacuation"],
            "earthquake": ["rescue", "engineering", "medical"],
            "medical": ["medical", "first_aid"],
            "storm": ["rescue", "first_aid"],
            "landslide": ["rescue", "engineering"],
            "accident": ["medical", "first_aid"]
        }
        return mapping.get(crisis_type.lower(), ["general"])

    def update_user_feedback(self, user_id: str, was_accurate: bool, 
                            alert_id: int = None) -> Dict:
        """
        Update user reputation based on feedback - ENHANCED
        
        Args:
            user_id: User identifier
            was_accurate: Whether the report was accurate
            alert_id: Optional alert ID for tracking
        """
        old_rep = self.reputation_manager.get_reputation_score(user_id)
        new_rep = self.reputation_manager.update_reputation(user_id, was_accurate)
        
        change = new_rep - old_rep
        action = 'increased' if change > 0 else 'decreased'
        
        print(f"\n{'='*60}")
        print(f"   REPUTATION UPDATE")
        print(f"{'='*60}")
        print(f"   User: {user_id}")
        print(f"   Feedback: {'Accurate' if was_accurate else 'Inaccurate'}")
        print(f"   Old Score: {old_rep:.3f}")
        print(f"   New Score: {new_rep:.3f}")
        print(f"   Change: {change:+.3f} ({action})")
        print(f"{'='*60}\n")
        
        return {
            'user_id': user_id,
            'old_reputation': old_rep,
            'new_reputation': new_rep,
            'change': change,
            'was_accurate': was_accurate,
            'alert_id': alert_id
        }
    
    def _detect_urgency(self, message: str) -> bool:
        """Detect urgency keywords in message"""
        if not message:
            return False
        
        urgent_keywords = [
            'urgent', 'emergency', 'help', 'danger', 'trapped',
            'severe', 'serious', 'critical', 'immediately', 'sos',
            'life-threatening', 'casualties', 'injuries'
        ]
        
        message_lower = message.lower()
        return any(word in message_lower for word in urgent_keywords)
    
    def get_system_status(self) -> Dict:
        """Get current system status and configuration - ENHANCED"""
        status = {
            'trust_agent': 'operational',
            'mode': self.mode,
            'database_type': 'SQLite' if self.mode == 'database' else 'JSON',
            'components': {
                'scorer': 'active',
                'cross_verifier': 'active',
                'duplicate_detector': 'active',
                'reputation_manager': 'active',
                'rate_limiter': 'active'
            },
            'thresholds': self.scorer.get_thresholds(),
            'scoring_config': self.scorer.get_scoring_summary()
        }
        
        # Add database statistics if available
        if self.mode == 'database':
            try:
                status['statistics'] = self.db.get_statistics()
            except Exception as e:
                status['statistics'] = {'error': str(e)}
        
        return status
    
    def get_user_profile(self, user_id: str) -> Dict:
        """Get complete user profile - ENHANCED"""
        reputation_data = self.db.get_user_reputation(user_id)
        if not reputation_data:
            return {
                'user_id': user_id,
                'status': 'not_found',
                'message': 'User has no reputation history'
            }
        
        history = self.reputation_manager.get_user_history(user_id, limit=10)
        
        # Calculate accuracy rate
        total = reputation_data['total_reports']
        accurate = reputation_data['accurate_reports']
        accuracy_rate = (accurate / total * 100) if total > 0 else 0
        
        return {
            'user_id': user_id,
            'reputation': reputation_data['reputation_score'],
            'total_reports': total,
            'accurate_reports': accurate,
            'false_reports': reputation_data['false_reports'],
            'accuracy_rate': round(accuracy_rate, 1),
            'last_updated': reputation_data['last_updated'],
            'recent_history': history,
            'status': 'active'
        }
    
    def get_crisis_info(self, crisis_type: str) -> Dict:
        """ Get crisis severity and threshold information"""
        return self.scorer.get_crisis_severity_info(crisis_type)
    
    def get_agent_performance(self, days: int = 7) -> Dict:
        """ Get trust agent's performance statistics"""
        if self.mode != 'database':
            return {'error': 'Only available in database mode'}
        
        try:
            history = self.db.get_agent_performance_history('trust', days=days)
            success_rate = self.db.calculate_agent_success_rate('trust', days=days)
            
            total_tasks = len(history)
            successful = sum(1 for h in history if h['success'])
            
            return {
                'agent_type': 'trust',
                'period_days': days,
                'total_tasks': total_tasks,
                'successful_tasks': successful,
                'success_rate': round(success_rate * 100, 1),
                'recent_history': history[:10]
            }
        except Exception as e:
            return {'error': str(e)}
    
    def switch_mode(self, use_database: bool):
        """Switch between database and JSON mode (for testing)"""
        if use_database and self.mode == 'json':
            print("Switching from JSON to Database mode...")
            self.db = TrustDatabase()
            self.mode = 'database'
        elif not use_database and self.mode == 'database':
            if JsonDataHandler:
                print("Switching from Database to JSON mode...")
                self.db = JsonDataHandler()
                self.mode = 'json'
            else:
                print("Cannot switch to JSON mode - JsonDataHandler not available")
        
        # Reinitialize components with new database
        self.scorer = TrustScorer(db=self.db)
        self.cross_verifier = CrossVerifier(self.db)
        self.reputation_manager = ReputationManager(self.db)
        print(f"Now using {self.mode} mode")


# ========== MODULE-LEVEL AGENT INSTANCE ==========
# Create default agent instance for easy import
agent = TrustAgent(use_database=True)

# For backward compatibility
def verify_alert(alert: Dict) -> Dict:
    """Module-level function for direct verification"""
    return agent.verify_alert(alert)

def update_user_feedback(user_id: str, was_accurate: bool) -> Dict:
    """Module-level function for feedback"""
    return agent.update_user_feedback(user_id, was_accurate)