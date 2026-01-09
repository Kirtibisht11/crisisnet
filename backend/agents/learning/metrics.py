"""
Metrics Tracker for Learning Agent

Tracks:
- Response times for volunteers/resources
- Task success/failure rates
- Volunteer reliability scores
- Crisis outcome effectiveness
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import statistics

class MetricsTracker:
    """Track performance metrics for learning and optimization"""
    
    def __init__(self, data_path: str = None):
        if data_path is None:
            data_path = os.path.join(
                os.path.dirname(__file__), 
                '..', '..', 
                'data', 
                'learning_metrics.json'
            )
        
        self.data_path = data_path
        self.data = self._load_data()
        
        print(f"✓ MetricsTracker initialized")
    
    def _load_data(self) -> Dict:
        """Load metrics data from file"""
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠ Failed to load metrics: {e}")
        
        # Initialize empty structure
        return {
            'volunteer_metrics': {},
            'crisis_outcomes': [],
            'resource_performance': {},
            'response_times': [],
            'task_results': [],
            'metadata': {
                'created_at': datetime.now().isoformat(),
                'last_updated': None,
                'total_tasks': 0,
                'total_volunteers': 0
            }
        }
    
    def _save_data(self):
        """Save metrics data to file"""
        try:
            os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
            self.data['metadata']['last_updated'] = datetime.now().isoformat()
            
            with open(self.data_path, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"⚠ Failed to save metrics: {e}")
    
    # ========== RESPONSE TIME TRACKING ==========
    
    def record_response_time(self, volunteer_id: str, task_id: str, 
                            response_time_seconds: float, 
                            task_type: str = None):
        """
        Record how long a volunteer took to respond to a task
        
        Args:
            volunteer_id: Volunteer identifier
            task_id: Task identifier
            response_time_seconds: Time taken to respond
            task_type: Type of task (rescue, medical, etc.)
        """
        entry = {
            'volunteer_id': volunteer_id,
            'task_id': task_id,
            'response_time': response_time_seconds,
            'task_type': task_type,
            'timestamp': datetime.now().isoformat()
        }
        
        self.data['response_times'].append(entry)
        
        # Update volunteer metrics
        if volunteer_id not in self.data['volunteer_metrics']:
            self.data['volunteer_metrics'][volunteer_id] = {
                'total_tasks': 0,
                'successful_tasks': 0,
                'failed_tasks': 0,
                'avg_response_time': 0,
                'response_times': [],
                'reliability_score': 0.5,
                'last_active': None
            }
        
        vol_metrics = self.data['volunteer_metrics'][volunteer_id]
        vol_metrics['response_times'].append(response_time_seconds)
        vol_metrics['last_active'] = datetime.now().isoformat()
        
        # Calculate running average
        vol_metrics['avg_response_time'] = statistics.mean(vol_metrics['response_times'])
        
        self._save_data()
        
        print(f"   ✓ Response time recorded: {volunteer_id} - {response_time_seconds:.1f}s")
    
    def get_avg_response_time(self, volunteer_id: str = None, 
                             task_type: str = None) -> float:
        """
        Get average response time
        
        Args:
            volunteer_id: If specified, get for specific volunteer
            task_type: If specified, filter by task type
        
        Returns:
            Average response time in seconds
        """
        if volunteer_id:
            vol_data = self.data['volunteer_metrics'].get(volunteer_id)
            if vol_data and vol_data['response_times']:
                return vol_data['avg_response_time']
            return 0.0
        
        # Get overall or filtered average
        times = self.data['response_times']
        
        if task_type:
            times = [t for t in times if t.get('task_type') == task_type]
        
        if not times:
            return 0.0
        
        return statistics.mean([t['response_time'] for t in times])
    
    # ========== TASK SUCCESS/FAILURE TRACKING ==========
    
    def record_task_result(self, task_id: str, volunteer_id: str, 
                          success: bool, task_type: str = None,
                          completion_time: float = None,
                          notes: str = None):
        """
        Record whether a task was completed successfully
        
        Args:
            task_id: Task identifier
            volunteer_id: Volunteer who performed the task
            success: Whether task was successful
            task_type: Type of task
            completion_time: Time taken to complete (seconds)
            notes: Additional notes
        """
        entry = {
            'task_id': task_id,
            'volunteer_id': volunteer_id,
            'success': success,
            'task_type': task_type,
            'completion_time': completion_time,
            'notes': notes,
            'timestamp': datetime.now().isoformat()
        }
        
        self.data['task_results'].append(entry)
        self.data['metadata']['total_tasks'] += 1
        
        # Update volunteer metrics
        if volunteer_id not in self.data['volunteer_metrics']:
            self.data['volunteer_metrics'][volunteer_id] = {
                'total_tasks': 0,
                'successful_tasks': 0,
                'failed_tasks': 0,
                'avg_response_time': 0,
                'response_times': [],
                'reliability_score': 0.5,
                'last_active': None
            }
        
        vol_metrics = self.data['volunteer_metrics'][volunteer_id]
        vol_metrics['total_tasks'] += 1
        
        if success:
            vol_metrics['successful_tasks'] += 1
        else:
            vol_metrics['failed_tasks'] += 1
        
        # Calculate reliability score (success rate)
        vol_metrics['reliability_score'] = (
            vol_metrics['successful_tasks'] / vol_metrics['total_tasks']
        )
        
        vol_metrics['last_active'] = datetime.now().isoformat()
        
        self._save_data()
        
        status = "✓ Success" if success else "✗ Failed"
        print(f"   {status}: Task {task_id} by {volunteer_id}")
    
    def get_success_rate(self, volunteer_id: str = None, 
                        task_type: str = None,
                        days: int = None) -> float:
        """
        Get success rate
        
        Args:
            volunteer_id: If specified, get for specific volunteer
            task_type: If specified, filter by task type
            days: If specified, only look at last N days
        
        Returns:
            Success rate (0.0 to 1.0)
        """
        if volunteer_id:
            vol_data = self.data['volunteer_metrics'].get(volunteer_id)
            if vol_data and vol_data['total_tasks'] > 0:
                return vol_data['reliability_score']
            return 0.5  # Default neutral
        
        # Get overall or filtered success rate
        results = self.data['task_results']
        
        # Filter by date if specified
        if days:
            cutoff = datetime.now() - timedelta(days=days)
            results = [
                r for r in results 
                if datetime.fromisoformat(r['timestamp']) > cutoff
            ]
        
        # Filter by task type
        if task_type:
            results = [r for r in results if r.get('task_type') == task_type]
        
        if not results:
            return 0.5  # Default neutral
        
        successful = sum(1 for r in results if r['success'])
        return successful / len(results)
    
    # ========== VOLUNTEER RELIABILITY ==========
    
    def get_volunteer_reliability(self, volunteer_id: str) -> Dict:
        """
        Get comprehensive reliability data for a volunteer
        
        Returns:
            Dictionary with reliability metrics
        """
        vol_data = self.data['volunteer_metrics'].get(volunteer_id)
        
        if not vol_data:
            return {
                'volunteer_id': volunteer_id,
                'reliability_score': 0.5,
                'total_tasks': 0,
                'success_rate': 0.0,
                'avg_response_time': 0.0,
                'status': 'new'
            }
        
        # Determine status
        if vol_data['total_tasks'] == 0:
            status = 'new'
        elif vol_data['reliability_score'] >= 0.9:
            status = 'excellent'
        elif vol_data['reliability_score'] >= 0.75:
            status = 'good'
        elif vol_data['reliability_score'] >= 0.5:
            status = 'average'
        else:
            status = 'poor'
        
        return {
            'volunteer_id': volunteer_id,
            'reliability_score': vol_data['reliability_score'],
            'total_tasks': vol_data['total_tasks'],
            'successful_tasks': vol_data['successful_tasks'],
            'failed_tasks': vol_data['failed_tasks'],
            'success_rate': vol_data['reliability_score'] * 100,
            'avg_response_time': vol_data['avg_response_time'],
            'last_active': vol_data['last_active'],
            'status': status
        }
    
    def get_top_volunteers(self, limit: int = 10, 
                          min_tasks: int = 5) -> List[Dict]:
        """
        Get top performing volunteers
        
        Args:
            limit: Maximum number to return
            min_tasks: Minimum tasks required to be considered
        
        Returns:
            List of top volunteers sorted by reliability
        """
        volunteers = []
        
        for vol_id, data in self.data['volunteer_metrics'].items():
            if data['total_tasks'] >= min_tasks:
                volunteers.append({
                    'volunteer_id': vol_id,
                    'reliability_score': data['reliability_score'],
                    'total_tasks': data['total_tasks'],
                    'avg_response_time': data['avg_response_time']
                })
        
        # Sort by reliability, then by task count
        volunteers.sort(
            key=lambda x: (x['reliability_score'], x['total_tasks']),
            reverse=True
        )
        
        return volunteers[:limit]
    
    # ========== CRISIS OUTCOME TRACKING ==========
    
    def record_crisis_outcome(self, crisis_id: str, crisis_type: str,
                             outcome: str, resources_used: List[str],
                             response_time: float, effectiveness_score: float,
                             notes: str = None):
        """
        Record the outcome of a crisis response
        
        Args:
            crisis_id: Crisis identifier
            crisis_type: Type of crisis
            outcome: 'resolved', 'partial', 'failed'
            resources_used: List of resource IDs used
            response_time: Total time to resolve (seconds)
            effectiveness_score: How effective the response was (0-1)
            notes: Additional notes
        """
        entry = {
            'crisis_id': crisis_id,
            'crisis_type': crisis_type,
            'outcome': outcome,
            'resources_used': resources_used,
            'response_time': response_time,
            'effectiveness_score': effectiveness_score,
            'notes': notes,
            'timestamp': datetime.now().isoformat()
        }
        
        self.data['crisis_outcomes'].append(entry)
        self._save_data()
        
        print(f"   ✓ Crisis outcome recorded: {crisis_id} - {outcome}")
    
    def get_crisis_statistics(self, crisis_type: str = None,
                             days: int = None) -> Dict:
        """
        Get statistics about crisis outcomes
        
        Returns:
            Dictionary with statistics
        """
        outcomes = self.data['crisis_outcomes']
        
        # Filter by date
        if days:
            cutoff = datetime.now() - timedelta(days=days)
            outcomes = [
                o for o in outcomes 
                if datetime.fromisoformat(o['timestamp']) > cutoff
            ]
        
        # Filter by type
        if crisis_type:
            outcomes = [o for o in outcomes if o['crisis_type'] == crisis_type]
        
        if not outcomes:
            return {
                'total': 0,
                'resolved': 0,
                'partial': 0,
                'failed': 0,
                'avg_response_time': 0,
                'avg_effectiveness': 0
            }
        
        return {
            'total': len(outcomes),
            'resolved': sum(1 for o in outcomes if o['outcome'] == 'resolved'),
            'partial': sum(1 for o in outcomes if o['outcome'] == 'partial'),
            'failed': sum(1 for o in outcomes if o['outcome'] == 'failed'),
            'avg_response_time': statistics.mean([o['response_time'] for o in outcomes]),
            'avg_effectiveness': statistics.mean([o['effectiveness_score'] for o in outcomes]),
            'crisis_type': crisis_type
        }
    
    # ========== RESOURCE PERFORMANCE ==========
    
    def record_resource_performance(self, resource_id: str, 
                                   task_id: str, 
                                   performance_score: float,
                                   utilization_rate: float = None):
        """
        Record performance of a resource (vehicle, equipment, etc.)
        
        Args:
            resource_id: Resource identifier
            task_id: Task where resource was used
            performance_score: How well it performed (0-1)
            utilization_rate: How much it was utilized (0-1)
        """
        if resource_id not in self.data['resource_performance']:
            self.data['resource_performance'][resource_id] = {
                'total_uses': 0,
                'performance_scores': [],
                'avg_performance': 0,
                'last_used': None
            }
        
        res_data = self.data['resource_performance'][resource_id]
        res_data['total_uses'] += 1
        res_data['performance_scores'].append(performance_score)
        res_data['avg_performance'] = statistics.mean(res_data['performance_scores'])
        res_data['last_used'] = datetime.now().isoformat()
        
        self._save_data()
    
    def get_resource_performance(self, resource_id: str) -> Dict:
        """Get performance data for a resource"""
        res_data = self.data['resource_performance'].get(resource_id)
        
        if not res_data:
            return {
                'resource_id': resource_id,
                'total_uses': 0,
                'avg_performance': 0,
                'status': 'unused'
            }
        
        return {
            'resource_id': resource_id,
            'total_uses': res_data['total_uses'],
            'avg_performance': res_data['avg_performance'],
            'last_used': res_data['last_used'],
            'status': 'active' if res_data['total_uses'] > 0 else 'unused'
        }
    
    # ========== STATISTICS AND REPORTING ==========
    
    def get_overall_statistics(self) -> Dict:
        """Get comprehensive statistics"""
        return {
            'total_volunteers': len(self.data['volunteer_metrics']),
            'total_tasks': self.data['metadata']['total_tasks'],
            'total_crises': len(self.data['crisis_outcomes']),
            'avg_volunteer_reliability': self._calculate_avg_reliability(),
            'avg_response_time': self.get_avg_response_time(),
            'overall_success_rate': self.get_success_rate() * 100,
            'active_volunteers': self._count_active_volunteers(),
            'last_updated': self.data['metadata']['last_updated']
        }
    
    def _calculate_avg_reliability(self) -> float:
        """Calculate average reliability across all volunteers"""
        volunteers = self.data['volunteer_metrics'].values()
        if not volunteers:
            return 0.0
        
        scores = [v['reliability_score'] for v in volunteers if v['total_tasks'] > 0]
        if not scores:
            return 0.0
        
        return statistics.mean(scores)
    
    def _count_active_volunteers(self, days: int = 30) -> int:
        """Count volunteers active in last N days"""
        cutoff = datetime.now() - timedelta(days=days)
        
        active = 0
        for vol_data in self.data['volunteer_metrics'].values():
            if vol_data['last_active']:
                last_active = datetime.fromisoformat(vol_data['last_active'])
                if last_active > cutoff:
                    active += 1
        
        return active
    
    def reset_metrics(self):
        """Reset all metrics (use with caution)"""
        self.data = {
            'volunteer_metrics': {},
            'crisis_outcomes': [],
            'resource_performance': {},
            'response_times': [],
            'task_results': [],
            'metadata': {
                'created_at': datetime.now().isoformat(),
                'last_updated': None,
                'total_tasks': 0,
                'total_volunteers': 0
            }
        }
        self._save_data()
        print("✓ Metrics reset")