"""
Learning Agent - Main Module

Responsibilities:
- Learn from past crisis outcomes
- Improve future resource & trust scoring
- Maintain responder reliability
- Track response times and task success/failure
- Feed weights back to Resource & Trust agents
"""

from typing import Dict, List, Optional
from datetime import datetime
import time

from .metrics import MetricsTracker
from .feedback_loop import FeedbackLoop

class LearningAgent:
    """
    Main Learning Agent
    
    Orchestrates learning from system performance and
    provides feedback to improve other agents
    """
    
    def __init__(self, metrics_path: str = None):
        """
        Initialize Learning Agent
        
        Args:
            metrics_path: Path to metrics data file
        """
        self.metrics = MetricsTracker(metrics_path)
        self.feedback_loop = FeedbackLoop(self.metrics)
        
        self.session_start = datetime.now()
        self.tasks_processed = 0
        
        print("\n" + "="*60)
        print("  LEARNING AGENT INITIALIZED")
        print("="*60)
        print(f"  Metrics Tracker: ✓ Ready")
        print(f"  Feedback Loop: ✓ Ready")
        print(f"  Session Started: {self.session_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60 + "\n")
    
    # ========== TASK TRACKING ==========
    
    def start_task(self, task_id: str, volunteer_id: str, 
                   task_type: str = None) -> Dict:
        """
        Start tracking a task
        
        Args:
            task_id: Task identifier
            volunteer_id: Volunteer assigned
            task_type: Type of task
        
        Returns:
            Task tracking information
        """
        task_info = {
            'task_id': task_id,
            'volunteer_id': volunteer_id,
            'task_type': task_type,
            'start_time': time.time(),
            'status': 'in_progress'
        }
        
        print(f"\n📋 Task Started: {task_id}")
        print(f"   Volunteer: {volunteer_id}")
        print(f"   Type: {task_type or 'unspecified'}")
        
        return task_info
    
    def complete_task(self, task_info: Dict, success: bool, 
                     notes: str = None) -> Dict:
        """
        Complete a task and record metrics
        
        Args:
            task_info: Task information from start_task()
            success: Whether task was successful
            notes: Additional notes
        
        Returns:
            Completion summary
        """
        end_time = time.time()
        completion_time = end_time - task_info['start_time']
        
        # Record task result
        self.metrics.record_task_result(
            task_id=task_info['task_id'],
            volunteer_id=task_info['volunteer_id'],
            success=success,
            task_type=task_info.get('task_type'),
            completion_time=completion_time,
            notes=notes
        )
        
        self.tasks_processed += 1
        
        status_emoji = "✅" if success else "❌"
        print(f"\n{status_emoji} Task Completed: {task_info['task_id']}")
        print(f"   Time: {completion_time:.1f}s")
        print(f"   Status: {'Success' if success else 'Failed'}")
        
        # Get updated volunteer reliability
        reliability = self.metrics.get_volunteer_reliability(
            task_info['volunteer_id']
        )
        
        return {
            'task_id': task_info['task_id'],
            'volunteer_id': task_info['volunteer_id'],
            'success': success,
            'completion_time': completion_time,
            'volunteer_reliability': reliability
        }
    
    def record_response(self, volunteer_id: str, task_id: str,
                       response_time_seconds: float,
                       task_type: str = None):
        """
        Record volunteer response time
        
        Args:
            volunteer_id: Volunteer identifier
            task_id: Task identifier  
            response_time_seconds: Time to respond
            task_type: Type of task
        """
        self.metrics.record_response_time(
            volunteer_id=volunteer_id,
            task_id=task_id,
            response_time_seconds=response_time_seconds,
            task_type=task_type
        )
        
        print(f"\n⏱️  Response Recorded: {volunteer_id}")
        print(f"   Task: {task_id}")
        print(f"   Time: {response_time_seconds:.1f}s")
    
    # ========== CRISIS OUTCOME TRACKING ==========
    
    def record_crisis_outcome(self, crisis_id: str, crisis_type: str,
                             outcome: str, resources_used: List[str],
                             response_time: float, 
                             effectiveness_score: float,
                             notes: str = None) -> Dict:
        """
        Record the complete outcome of a crisis response
        
        Args:
            crisis_id: Crisis identifier
            crisis_type: Type of crisis
            outcome: 'resolved', 'partial', 'failed'
            resources_used: List of resource/volunteer IDs
            response_time: Total response time in seconds
            effectiveness_score: Effectiveness rating (0-1)
            notes: Additional notes
        
        Returns:
            Outcome summary with learning insights
        """
        self.metrics.record_crisis_outcome(
            crisis_id=crisis_id,
            crisis_type=crisis_type,
            outcome=outcome,
            resources_used=resources_used,
            response_time=response_time,
            effectiveness_score=effectiveness_score,
            notes=notes
        )
        
        # Generate immediate learning insights
        insights = self._generate_immediate_insights(
            crisis_type, outcome, effectiveness_score
        )
        
        print(f"\n🎯 Crisis Outcome Recorded: {crisis_id}")
        print(f"   Type: {crisis_type}")
        print(f"   Outcome: {outcome}")
        print(f"   Effectiveness: {effectiveness_score:.2f}")
        print(f"   Response Time: {response_time/60:.1f} minutes")
        
        if insights:
            print(f"\n💡 Learning Insights:")
            for insight in insights:
                print(f"   • {insight}")
        
        return {
            'crisis_id': crisis_id,
            'outcome': outcome,
            'effectiveness_score': effectiveness_score,
            'learning_insights': insights
        }
    
    def _generate_immediate_insights(self, crisis_type: str, 
                                    outcome: str,
                                    effectiveness: float) -> List[str]:
        """Generate immediate learning insights from crisis outcome"""
        insights = []
        
        if outcome == 'resolved' and effectiveness >= 0.8:
            insights.append(f"Excellent handling of {crisis_type} crisis")
        elif outcome == 'failed' or effectiveness < 0.4:
            insights.append(f"Review {crisis_type} response procedures")
            insights.append("Consider additional training or resources")
        
        return insights
    
    # ========== VOLUNTEER MANAGEMENT ==========
    
    def get_volunteer_profile(self, volunteer_id: str) -> Dict:
        """
        Get comprehensive volunteer profile with recommendations
        
        Args:
            volunteer_id: Volunteer identifier
        
        Returns:
            Complete volunteer profile
        """
        profile = self.metrics.get_volunteer_reliability(volunteer_id)
        
        # Add recommendations
        if profile['reliability_score'] >= 0.9:
            profile['recommendation'] = 'Excellent performer - assign to critical tasks'
        elif profile['reliability_score'] >= 0.75:
            profile['recommendation'] = 'Good performer - suitable for most tasks'
        elif profile['reliability_score'] >= 0.5:
            profile['recommendation'] = 'Average performer - assign to standard tasks'
        else:
            profile['recommendation'] = 'Needs improvement - provide training'
        
        return profile
    
    def get_top_volunteers(self, limit: int = 10) -> List[Dict]:
        """
        Get top performing volunteers
        
        Args:
            limit: Maximum number to return
        
        Returns:
            List of top volunteers
        """
        return self.metrics.get_top_volunteers(limit=limit)
    
    def identify_training_needs(self) -> Dict:
        """
        Identify volunteers who need additional training
        
        Returns:
            Training recommendations
        """
        underperformers = self.feedback_loop.identify_underperforming_resources(
            threshold=0.5
        )
        
        return {
            'needs_training': underperformers['total_underperformers'],
            'volunteers': underperformers['underperformers'],
            'priority': underperformers['recommendations']['priority'],
            'recommendations': [
                'Schedule training sessions',
                'Pair with experienced volunteers',
                'Review task assignment criteria'
            ] if underperformers['total_underperformers'] > 0 else []
        }
    
    # ========== FEEDBACK TO OTHER AGENTS ==========
    
    def generate_trust_agent_feedback(self, crisis_type: str = None) -> Dict:
        """
        Generate feedback for Trust Agent
        
        Args:
            crisis_type: Optional crisis type filter
        
        Returns:
            Recommended adjustments for Trust Agent
        """
        print(f"\n🔄 Generating Trust Agent Feedback...")
        
        # Weight adjustments
        weight_feedback = self.feedback_loop.generate_trust_weight_adjustments(
            crisis_type=crisis_type
        )
        
        # Threshold adjustments
        threshold_feedback = None
        if crisis_type:
            threshold_feedback = self.feedback_loop.recommend_threshold_adjustment(
                crisis_type=crisis_type
            )
        
        feedback = {
            'weight_adjustments': weight_feedback,
            'threshold_adjustments': threshold_feedback,
            'generated_at': datetime.now().isoformat()
        }
        
        print(f"   ✓ Feedback generated")
        
        return feedback
    
    def generate_resource_agent_feedback(self, crisis_type: str = None) -> Dict:
        """
        Generate feedback for Resource Agent
        
        Args:
            crisis_type: Optional crisis type filter
        
        Returns:
            Resource allocation optimization recommendations
        """
        print(f"\n🔄 Generating Resource Agent Feedback...")
        
        optimization = self.feedback_loop.generate_resource_optimization(
            crisis_type=crisis_type
        )
        
        print(f"   ✓ Optimization recommendations generated")
        
        return optimization
    
    def apply_learning(self, trust_agent=None, resource_agent=None) -> Dict:
        """
        Apply learned improvements to other agents
        
        Args:
            trust_agent: Trust Agent instance (optional)
            resource_agent: Resource Agent instance (optional)
        
        Returns:
            Summary of applied learning
        """
        print(f"\n🔄 Applying Learning to Agents...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'applied_to': [],
            'feedback': {}
        }
        
        # Apply to Trust Agent
        if trust_agent:
            trust_feedback = self.feedback_loop.apply_feedback_to_trust_agent(
                trust_agent
            )
            results['applied_to'].append('trust_agent')
            results['feedback']['trust_agent'] = trust_feedback
            print(f"   ✓ Trust Agent feedback applied")
        
        # Apply to Resource Agent (placeholder)
        if resource_agent:
            resource_feedback = self.generate_resource_agent_feedback()
            results['applied_to'].append('resource_agent')
            results['feedback']['resource_agent'] = resource_feedback
            print(f"   ✓ Resource Agent feedback generated")
        
        return results
    
    # ========== REPORTING ==========
    
    def generate_learning_report(self, days: int = 30) -> Dict:
        """
        Generate comprehensive learning report
        
        Args:
            days: Number of days to analyze
        
        Returns:
            Complete learning report
        """
        print(f"\n📊 Generating Learning Report ({days} days)...")
        
        report = self.feedback_loop.generate_learning_report(days=days)
        
        # Add session info
        report['session_info'] = {
            'session_start': self.session_start.isoformat(),
            'tasks_processed_this_session': self.tasks_processed,
            'uptime_minutes': (datetime.now() - self.session_start).total_seconds() / 60
        }
        
        print(f"   ✓ Report generated")
        
        return report
    
    def get_system_performance(self) -> Dict:
        """
        Get overall system performance metrics
        
        Returns:
            System performance summary
        """
        overall_stats = self.metrics.get_overall_statistics()
        
        # Add performance indicators
        performance = {
            **overall_stats,
            'performance_grade': self._calculate_performance_grade(overall_stats),
            'health_status': self._determine_health_status(overall_stats)
        }
        
        return performance
    
    def _calculate_performance_grade(self, stats: Dict) -> str:
        """Calculate overall performance grade"""
        success_rate = stats['overall_success_rate']
        
        if success_rate >= 90:
            return 'A - Excellent'
        elif success_rate >= 80:
            return 'B - Good'
        elif success_rate >= 70:
            return 'C - Satisfactory'
        elif success_rate >= 60:
            return 'D - Needs Improvement'
        else:
            return 'F - Critical Issues'
    
    def _determine_health_status(self, stats: Dict) -> str:
        """Determine system health status"""
        if stats['overall_success_rate'] >= 80 and stats['active_volunteers'] >= 10:
            return 'healthy'
        elif stats['overall_success_rate'] >= 60:
            return 'warning'
        else:
            return 'critical'
    
    def get_status(self) -> Dict:
        """Get Learning Agent status"""
        return {
            'agent': 'learning',
            'status': 'operational',
            'session_start': self.session_start.isoformat(),
            'tasks_processed': self.tasks_processed,
            'metrics_available': True,
            'feedback_loop_active': True,
            'capabilities': [
                'Task tracking',
                'Response time monitoring',
                'Volunteer reliability scoring',
                'Crisis outcome analysis',
                'Trust Agent feedback',
                'Resource optimization',
                'Performance reporting'
            ]
        }
    
    def reset_session(self):
        """Reset session counters"""
        self.session_start = datetime.now()
        self.tasks_processed = 0
        print("✓ Learning Agent session reset")


# ========== MODULE-LEVEL AGENT INSTANCE ==========
agent = LearningAgent()

# Module-level convenience functions
def record_task_result(task_id: str, volunteer_id: str, 
                      success: bool, task_type: str = None,
                      completion_time: float = None):
    """Module-level function for recording task results"""
    agent.metrics.record_task_result(
        task_id=task_id,
        volunteer_id=volunteer_id,
        success=success,
        task_type=task_type,
        completion_time=completion_time
    )

def get_volunteer_reliability(volunteer_id: str) -> Dict:
    """Module-level function for getting volunteer reliability"""
    return agent.get_volunteer_profile(volunteer_id)