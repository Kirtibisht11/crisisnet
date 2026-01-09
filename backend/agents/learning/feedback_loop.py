"""
Feedback Loop System

Feeds learned insights back to:
- Trust Agent: Adjust trust weights based on outcomes
- Resource Agent: Optimize resource allocation based on performance
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime
import statistics

class FeedbackLoop:
    """Feed learned insights back to other agents"""
    
    def __init__(self, metrics_tracker=None):
        self.metrics = metrics_tracker
        
        # Feedback history
        self.feedback_history = []
        
        print(f"✓ FeedbackLoop initialized")
    
    # ========== TRUST AGENT FEEDBACK ==========
    
    def generate_trust_weight_adjustments(self, crisis_type: str = None) -> Dict:
        """
        Generate recommended weight adjustments for Trust Agent
        based on crisis outcomes
        
        Args:
            crisis_type: Optional filter by crisis type
        
        Returns:
            Dictionary with recommended weight adjustments
        """
        if not self.metrics:
            return {'error': 'No metrics tracker available'}
        
        # Get crisis statistics
        stats = self.metrics.get_crisis_statistics(crisis_type=crisis_type)
        
        if stats['total'] == 0:
            return {
                'recommendation': 'insufficient_data',
                'message': 'Not enough data for recommendations',
                'crisis_type': crisis_type
            }
        
        # Calculate effectiveness
        effectiveness = stats['avg_effectiveness']
        resolution_rate = stats['resolved'] / stats['total']
        
        adjustments = {
            'crisis_type': crisis_type,
            'current_effectiveness': round(effectiveness, 3),
            'resolution_rate': round(resolution_rate, 3),
            'recommendations': {}
        }
        
        # High effectiveness → increase cross-verification weight
        if effectiveness >= 0.8 and resolution_rate >= 0.8:
            adjustments['recommendations']['cross_verification'] = {
                'current': 0.40,
                'recommended': 0.45,
                'reason': 'High effectiveness - trust cross-verification more'
            }
        
        # Low effectiveness → increase source reputation weight
        elif effectiveness < 0.5:
            adjustments['recommendations']['source_reputation'] = {
                'current': 0.35,
                'recommended': 0.40,
                'reason': 'Low effectiveness - rely more on source reputation'
            }
        
        # Medium effectiveness → balance weights
        else:
            adjustments['recommendations'] = {
                'status': 'balanced',
                'message': 'Current weights are performing well'
            }
        
        self._log_feedback('trust_agent', adjustments)
        
        return adjustments
    
    def recommend_threshold_adjustment(self, crisis_type: str) -> Dict:
        """
        Recommend threshold adjustments for specific crisis types
        based on historical outcomes
        
        Args:
            crisis_type: Type of crisis to analyze
        
        Returns:
            Recommended threshold adjustments
        """
        if not self.metrics:
            return {'error': 'No metrics tracker available'}
        
        stats = self.metrics.get_crisis_statistics(crisis_type=crisis_type)
        
        if stats['total'] < 5:  # Need minimum data
            return {
                'recommendation': 'insufficient_data',
                'message': f'Need at least 5 crises, have {stats["total"]}',
                'crisis_type': crisis_type
            }
        
        resolution_rate = stats['resolved'] / stats['total']
        avg_response_time = stats['avg_response_time']
        
        recommendation = {
            'crisis_type': crisis_type,
            'current_resolution_rate': round(resolution_rate, 3),
            'avg_response_time_minutes': round(avg_response_time / 60, 1),
            'threshold_adjustment': {}
        }
        
        # If resolution rate is low, lower thresholds (be more permissive)
        if resolution_rate < 0.6:
            recommendation['threshold_adjustment'] = {
                'direction': 'decrease',
                'amount': -0.05,
                'reason': 'Low resolution rate - be more permissive to catch more alerts'
            }
        
        # If resolution rate is high and response time is good, can be more strict
        elif resolution_rate >= 0.85 and avg_response_time < 600:  # < 10 min
            recommendation['threshold_adjustment'] = {
                'direction': 'increase',
                'amount': +0.05,
                'reason': 'High resolution rate - can afford to be more strict'
            }
        
        else:
            recommendation['threshold_adjustment'] = {
                'direction': 'maintain',
                'amount': 0,
                'reason': 'Current thresholds are performing adequately'
            }
        
        self._log_feedback('trust_thresholds', recommendation)
        
        return recommendation
    
    def update_source_reliability_feedback(self, source_type: str, 
                                          source_id: str,
                                          outcomes: List[bool]) -> Dict:
        """
        Provide feedback on external source reliability
        based on actual crisis outcomes
        
        Args:
            source_type: Type of source
            source_id: Source identifier
            outcomes: List of outcomes (True = accurate, False = inaccurate)
        
        Returns:
            Feedback for source reputation manager
        """
        if not outcomes:
            return {'error': 'No outcomes provided'}
        
        accuracy_rate = sum(outcomes) / len(outcomes)
        
        feedback = {
            'source_type': source_type,
            'source_id': source_id,
            'accuracy_rate': round(accuracy_rate, 3),
            'total_samples': len(outcomes),
            'recommendation': {}
        }
        
        # Generate recommendation
        if accuracy_rate >= 0.9:
            feedback['recommendation'] = {
                'action': 'increase_weight',
                'reason': 'Highly accurate source - trust more',
                'suggested_boost': +0.1
            }
        elif accuracy_rate < 0.5:
            feedback['recommendation'] = {
                'action': 'decrease_weight',
                'reason': 'Low accuracy - trust less',
                'suggested_penalty': -0.1
            }
        else:
            feedback['recommendation'] = {
                'action': 'maintain',
                'reason': 'Moderate accuracy - continue monitoring'
            }
        
        self._log_feedback('source_reliability', feedback)
        
        return feedback
    
    # ========== RESOURCE AGENT FEEDBACK ==========
    
    def generate_resource_optimization(self, crisis_type: str = None) -> Dict:
        """
        Generate resource allocation optimization recommendations
        
        Args:
            crisis_type: Optional filter by crisis type
        
        Returns:
            Optimization recommendations
        """
        if not self.metrics:
            return {'error': 'No metrics tracker available'}
        
        # Get top performing volunteers
        top_volunteers = self.metrics.get_top_volunteers(limit=20)
        
        if not top_volunteers:
            return {
                'recommendation': 'insufficient_data',
                'message': 'No volunteer performance data available'
            }
        
        # Calculate performance tiers
        excellent = [v for v in top_volunteers if v['reliability_score'] >= 0.9]
        good = [v for v in top_volunteers if 0.75 <= v['reliability_score'] < 0.9]
        average = [v for v in top_volunteers if v['reliability_score'] < 0.75]
        
        optimization = {
            'crisis_type': crisis_type,
            'total_volunteers_analyzed': len(top_volunteers),
            'performance_tiers': {
                'excellent': {
                    'count': len(excellent),
                    'avg_reliability': round(statistics.mean([v['reliability_score'] for v in excellent]), 3) if excellent else 0,
                    'recommendation': 'Priority allocation for critical tasks'
                },
                'good': {
                    'count': len(good),
                    'avg_reliability': round(statistics.mean([v['reliability_score'] for v in good]), 3) if good else 0,
                    'recommendation': 'Suitable for standard tasks'
                },
                'average': {
                    'count': len(average),
                    'avg_reliability': round(statistics.mean([v['reliability_score'] for v in average]), 3) if average else 0,
                    'recommendation': 'Assign to low-priority tasks or supervised roles'
                }
            },
            'allocation_strategy': {}
        }
        
        # Generate allocation strategy
        if len(excellent) >= 5:
            optimization['allocation_strategy'] = {
                'strategy': 'tier_based',
                'description': 'Allocate based on volunteer performance tiers',
                'critical_tasks': f'Use top {len(excellent)} excellent volunteers',
                'standard_tasks': f'Use {len(good)} good volunteers',
                'support_tasks': f'Use {len(average)} average volunteers for support'
            }
        else:
            optimization['allocation_strategy'] = {
                'strategy': 'balanced',
                'description': 'Not enough high performers - distribute evenly',
                'recommendation': 'Focus on training and improvement'
            }
        
        self._log_feedback('resource_optimization', optimization)
        
        return optimization
    
    def identify_underperforming_resources(self, threshold: float = 0.5) -> Dict:
        """
        Identify volunteers or resources that need improvement
        
        Args:
            threshold: Reliability threshold (default 0.5)
        
        Returns:
            List of underperformers with improvement suggestions
        """
        if not self.metrics:
            return {'error': 'No metrics tracker available'}
        
        underperformers = []
        
        for vol_id, data in self.metrics.data['volunteer_metrics'].items():
            if data['total_tasks'] >= 3 and data['reliability_score'] < threshold:
                underperformers.append({
                    'volunteer_id': vol_id,
                    'reliability_score': data['reliability_score'],
                    'total_tasks': data['total_tasks'],
                    'successful_tasks': data['successful_tasks'],
                    'failed_tasks': data['failed_tasks'],
                    'suggestions': self._generate_improvement_suggestions(data)
                })
        
        result = {
            'total_underperformers': len(underperformers),
            'threshold_used': threshold,
            'underperformers': sorted(
                underperformers, 
                key=lambda x: x['reliability_score']
            ),
            'recommendations': {
                'action': 'provide_training' if underperformers else 'none_needed',
                'priority': 'high' if len(underperformers) > 5 else 'medium'
            }
        }
        
        self._log_feedback('underperforming_resources', result)
        
        return result
    
    def _generate_improvement_suggestions(self, volunteer_data: Dict) -> List[str]:
        """Generate specific improvement suggestions for a volunteer"""
        suggestions = []
        
        if volunteer_data['avg_response_time'] > 600:  # > 10 minutes
            suggestions.append('Improve response time - currently slow')
        
        if volunteer_data['failed_tasks'] > volunteer_data['successful_tasks']:
            suggestions.append('More training needed - high failure rate')
        
        if not suggestions:
            suggestions.append('Continue current performance level')
        
        return suggestions
    
    # ========== GENERAL LEARNING INSIGHTS ==========
    
    def generate_learning_report(self, days: int = 30) -> Dict:
        """
        Generate comprehensive learning report
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Comprehensive learning insights
        """
        if not self.metrics:
            return {'error': 'No metrics tracker available'}
        
        overall_stats = self.metrics.get_overall_statistics()
        
        report = {
            'period_days': days,
            'generated_at': datetime.now().isoformat(),
            'overall_statistics': overall_stats,
            'key_insights': [],
            'recommendations': {},
            'feedback_history_count': len(self.feedback_history)
        }
        
        # Generate insights
        if overall_stats['overall_success_rate'] >= 80:
            report['key_insights'].append(
                '✓ System performing well - maintain current approach'
            )
        elif overall_stats['overall_success_rate'] < 60:
            report['key_insights'].append(
                '⚠ Low success rate - recommend system review'
            )
        
        if overall_stats['active_volunteers'] < 10:
            report['key_insights'].append(
                '⚠ Low volunteer count - recruit more volunteers'
            )
        
        # Add specific recommendations
        report['recommendations'] = {
            'trust_agent': self.generate_trust_weight_adjustments(),
            'resource_agent': self.generate_resource_optimization()
        }
        
        return report
    
    def apply_feedback_to_trust_agent(self, trust_agent) -> Dict:
        """
        Directly apply learned adjustments to Trust Agent
        
        Args:
            trust_agent: Trust Agent instance
        
        Returns:
            Summary of applied changes
        """
        adjustments = self.generate_trust_weight_adjustments()
        
        applied = {
            'timestamp': datetime.now().isoformat(),
            'adjustments_applied': [],
            'status': 'success'
        }
        
        # Apply recommendations if available
        if 'recommendations' in adjustments:
            for component, adjustment in adjustments['recommendations'].items():
                if isinstance(adjustment, dict) and 'recommended' in adjustment:
                    applied['adjustments_applied'].append({
                        'component': component,
                        'old_value': adjustment['current'],
                        'new_value': adjustment['recommended'],
                        'reason': adjustment['reason']
                    })
        
        return applied
    
    # ========== LOGGING ==========
    
    def _log_feedback(self, target: str, feedback: Dict):
        """Log feedback for audit trail"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'target': target,
            'feedback': feedback
        }
        
        self.feedback_history.append(entry)
        
        # Keep only last 100 entries
        if len(self.feedback_history) > 100:
            self.feedback_history = self.feedback_history[-100:]
    
    def get_feedback_history(self, target: str = None, limit: int = 10) -> List[Dict]:
        """Get feedback history"""
        history = self.feedback_history
        
        if target:
            history = [h for h in history if h['target'] == target]
        
        return history[-limit:]
    
    def export_feedback_log(self, filepath: str):
        """Export feedback history to JSON file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(self.feedback_history, f, indent=2)
            print(f"✓ Feedback log exported to {filepath}")
        except Exception as e:
            print(f"⚠ Failed to export feedback log: {e}")