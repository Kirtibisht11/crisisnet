import json
import os
from typing import Dict, Optional, List
from datetime import datetime, timedelta

class ReputationManager:
    """
    Reputation Manager
    
    New Features:
    - External source reputation tracking (news, social media, APIs)
    - Separate tracking for users vs external sources
    - Source reliability scoring
    - Historical source performance analysis
    """
 
    def __init__(self, data_handler=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Load user reputation config
        self.config = config.get('reputation_settings', config.get('reputation', {}))

        # Initialize database
        if data_handler is None:
            try:
                from .json_data_handler import JsonDataHandler
                self.db = JsonDataHandler()
                self.db_mode = 'json'
            except:
                from .database import TrustDatabase
                self.db = TrustDatabase()
                self.db_mode = 'database'
        else:
            self.db = data_handler
            self.db_mode = 'database' if hasattr(data_handler, 'save_source_reputation') else 'json'
        
        print(f"ReputationManager initialized in {self.db_mode} mode")
    
    # ========== USER REPUTATION METHODS (EXISTING + ENHANCED) ==========
    
    def get_reputation_score(self, user_id: str) -> float:
        """Get user's current reputation"""
        user_data = self.db.get_user_reputation(user_id)
        
        if not user_data:
            initial_score = self.config.get('initial_score', self.config.get('new_user_score', 0.5))
            self.db.create_user_reputation(user_id, initial_score)
            return initial_score
        
        return user_data['reputation_score']
    
    def update_reputation(self, user_id: str, was_accurate: bool) -> float:
        """
        Update reputation based on accuracy - ENHANCED
        
        Changes:
        - Uses config values from trust_thresholds.json
        - Better decay calculation
        - Logs to database for historical tracking
        """
        current_score = self.get_reputation_score(user_id)
        
        if was_accurate:
            # Reward accurate reports
            boost = self.config.get('accurate_report_boost', 0.05)
            new_score = min(
                self.config['max_score'],
                current_score + (1 - current_score) * boost * 3
            )
        else:
            # Penalize false reports
            penalty = self.config.get('false_report_penalty', 0.10)
            decay = self.config.get('decay_factor', 0.95)
            new_score = max(
                self.config['min_score'],
                current_score * decay - penalty
            )
        
        self.db.update_user_reputation(user_id, new_score, was_accurate, current_score)
        return new_score
    
    def calculate_trust_contribution(self, user_id: str) -> float:
        """
        Calculate how much reputation contributes to trust - ENHANCED
        
        Uses smoother curve for better scoring
        """
        reputation = self.get_reputation_score(user_id)

        # Smooth curve: reputation^2 for non-linear scaling
        if reputation >= 0.8:
            return 1.0
        elif reputation >= 0.6:
            return 0.85 + (reputation - 0.6) * 0.75
        elif reputation >= 0.4:
            return 0.65 + (reputation - 0.4) * 1.0
        elif reputation >= 0.2:
            return 0.50 + (reputation - 0.2) * 0.75
        else:
            return 0.40 + reputation * 0.5
        
    def get_user_history(self, user_id: str, limit: int = 10) -> list:
        """Get recent reputation history for a user"""
        history = self.db.get_reputation_history(user_id, limit)
        return history
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get complete user statistics"""
        user_data = self.db.get_user_reputation(user_id)
        if not user_data:
            return None
        
        # Calculate accuracy rate
        total = user_data.get('total_reports', 0)
        accurate = user_data.get('accurate_reports', 0)
        accuracy_rate = (accurate / total * 100) if total > 0 else 0
        
        return {
            **user_data,
            'accuracy_rate': round(accuracy_rate, 1),
            'status': self._get_reputation_status(user_data['reputation_score'])
        }
    
    def _get_reputation_status(self, score: float) -> str:
        """Get status label for reputation score"""
        if score >= 0.9:
            return "Excellent"
        elif score >= 0.7:
            return "Good"
        elif score >= 0.5:
            return "Average"
        elif score >= 0.3:
            return "Poor"
        else:
            return "Very Poor"
    
    # ========== EXTERNAL SOURCE REPUTATION TRACKING ==========
    
    def track_external_source(self, source_type: str, source_id: str, 
                              source_name: str = None):
        """
        Initialize tracking for external source
        
        Args:
            source_type: Type of source (e.g., 'twitter', 'news', 'api', 'official')
            source_id: Unique identifier for the source
            source_name: Human-readable name (optional)
        
        Example:
            track_external_source('news', 'cnn_alerts', 'CNN Breaking News')
            track_external_source('twitter', '@emergency_dept', 'Emergency Department')
        """
        if self.db_mode != 'database':
            print(f"External source tracking only available in database mode")
            return
        
        try:
            self.db.save_source_reputation(source_type, source_id, source_name)
            print(f"Tracking external source: {source_name or source_id} ({source_type})")
        except Exception as e:
            print(f"Failed to track source: {e}")
    
    def update_source_reputation(self, source_type: str, source_id: str, 
                                 was_accurate: bool):
        """
        Update external source reputation
        
        Args:
            source_type: Type of source
            source_id: Source identifier
            was_accurate: Whether the information from this source was accurate
        """
        if self.db_mode != 'database':
            return
        
        try:
            self.db.update_source_reputation(source_type, source_id, was_accurate)
            
            # Get updated score
            source_data = self.db.get_source_reputation(source_type, source_id)
            if source_data:
                new_score = source_data['reliability_score']
                action = 'improved' if was_accurate else 'decreased'
                print(f"   Source {source_id} reputation {action}: {new_score:.3f}")
        except Exception as e:
            print(f"Failed to update source reputation: {e}")
    
    def get_source_reliability(self, source_type: str, source_id: str) -> float:
        """
        Get reliability score for external source
        
        Returns:
            Reliability score (0.0 to 1.0), or 0.5 if source not tracked
        """
        if self.db_mode != 'database':
            return 0.5  # Default neutral score
        
        try:
            source_data = self.db.get_source_reputation(source_type, source_id)
            if source_data:
                return source_data['reliability_score']
            return 0.5  # Default for new sources
        except Exception as e:
            print(f"Failed to get source reliability: {e}")
            return 0.5
    
    def get_source_stats(self, source_type: str, source_id: str) -> Optional[Dict]:
        """
        Get complete statistics for external source
        
        Returns:
            Dictionary with source statistics or None if not found
        """
        if self.db_mode != 'database':
            return None
        
        try:
            source_data = self.db.get_source_reputation(source_type, source_id)
            if not source_data:
                return None
            
            total = source_data['total_reports']
            accurate = source_data['accurate_reports']
            accuracy_rate = (accurate / total * 100) if total > 0 else 0
            
            return {
                'source_type': source_data['source_type'],
                'source_id': source_data['source_id'],
                'source_name': source_data.get('source_name'),
                'reliability_score': source_data['reliability_score'],
                'total_reports': total,
                'accurate_reports': accurate,
                'false_reports': source_data['false_reports'],
                'accuracy_rate': round(accuracy_rate, 1),
                'status': self._get_reputation_status(source_data['reliability_score']),
                'last_updated': source_data.get('last_updated'),
                'created_at': source_data.get('created_at')
            }
        except Exception as e:
            print(f"Failed to get source stats: {e}")
            return None
    
    def calculate_source_trust_contribution(self, source_type: str, 
                                           source_id: str) -> float:
        """
        Calculate trust contribution from external source
        
        Returns:
            Trust contribution value (0.4 to 1.0)
        """
        reliability = self.get_source_reliability(source_type, source_id)
        
        # Convert reliability to trust contribution
        if reliability >= 0.9:
            return 1.0
        elif reliability >= 0.7:
            return 0.85 + (reliability - 0.7) * 0.75
        elif reliability >= 0.5:
            return 0.70 + (reliability - 0.5) * 0.75
        else:
            return 0.50 + reliability * 0.4
    
    def get_top_sources(self, source_type: str = None, limit: int = 10) -> List[Dict]:
        """
        Get top-rated external sources
        
        Args:
            source_type: Filter by source type (optional)
            limit: Maximum number of sources to return
        
        Returns:
            List of top sources sorted by reliability
        """
        if self.db_mode != 'database':
            return []
        
        try:
            # This would need a new database method
            # For now, return empty list
            # TODO: Implement db.get_top_sources()
            return []
        except Exception as e:
            print(f"Failed to get top sources: {e}")
            return []
    
    def compare_sources(self, source_pairs: List[tuple]) -> Dict:
        """
        Compare reliability of multiple sources
        
        Args:
            source_pairs: List of (source_type, source_id) tuples
        
        Returns:
            Comparison dictionary with scores and rankings
        """
        if self.db_mode != 'database':
            return {'error': 'Only available in database mode'}
        
        results = []
        for source_type, source_id in source_pairs:
            stats = self.get_source_stats(source_type, source_id)
            if stats:
                results.append({
                    'source': f"{source_type}:{source_id}",
                    'name': stats.get('source_name', source_id),
                    'reliability': stats['reliability_score'],
                    'accuracy_rate': stats['accuracy_rate'],
                    'total_reports': stats['total_reports']
                })
        
        # Sort by reliability
        results.sort(key=lambda x: x['reliability'], reverse=True)
        
        return {
            'sources_compared': len(results),
            'rankings': results,
            'most_reliable': results[0] if results else None,
            'least_reliable': results[-1] if results else None
        }
    
    def get_reputation_summary(self) -> Dict:
        """
        Get overall reputation system summary
        
        Returns:
            Summary of all reputation data
        """
        summary = {
            'mode': self.db_mode,
            'user_reputation': {
                'config': self.config
            }
        }
        
        if self.db_mode == 'database':
            try:
                stats = self.db.get_statistics()
                summary['statistics'] = {
                    'total_users': stats.get('total_users', 0),
                    'tracked_sources': stats.get('tracked_sources', 0)
                }
            except:
                pass
        
        return summary
    
    # ========== HELPER METHODS ==========
    
    def bulk_update_feedback(self, feedback_list: List[Dict]) -> Dict:
        """
        Process multiple feedback updates at once
        
        Args:
            feedback_list: List of dicts with 'user_id', 'was_accurate', 'source_type' (optional), 'source_id' (optional)
        
        Returns:
            Summary of updates
        """
        results = {
            'users_updated': 0,
            'sources_updated': 0,
            'errors': []
        }
        
        for feedback in feedback_list:
            try:
                # Update user reputation
                if 'user_id' in feedback:
                    self.update_reputation(feedback['user_id'], feedback['was_accurate'])
                    results['users_updated'] += 1
                
                # Update source reputation if provided
                if 'source_type' in feedback and 'source_id' in feedback:
                    self.update_source_reputation(
                        feedback['source_type'],
                        feedback['source_id'],
                        feedback['was_accurate']
                    )
                    results['sources_updated'] += 1
                    
            except Exception as e:
                results['errors'].append({
                    'feedback': feedback,
                    'error': str(e)
                })
        
        return results
    
    def reset_user_reputation(self, user_id: str) -> float:
        """Reset user reputation to initial score"""
        initial_score = self.config.get('initial_score', 0.5)
        current_score = self.get_reputation_score(user_id)
        self.db.update_user_reputation(user_id, initial_score, True, current_score)
        print(f"Reset {user_id} reputation to {initial_score}")
        return initial_score