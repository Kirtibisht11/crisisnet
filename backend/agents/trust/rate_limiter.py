import json
import os
from datetime import datetime, timedelta
from typing import Tuple, Dict, List

class RateLimiter:
    """
    Enhanced Rate Limiter
    
    New Features:
    - Progressive penalties based on usage patterns
    - Configurable rate limits from trust_thresholds.json
    - Better cooldown management
    - Usage statistics tracking
    """
 
    def __init__(self, data_handler=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # ROUND 2 FIX: Use 'rate_limiting' key from updated config
        self.limits = config.get('rate_limiting', config.get('rate_limits', {}))
        
        # Fallback values if config missing
        self.max_per_hour = self.limits.get('max_reports_per_hour', 10)
        self.max_per_day = self.limits.get('max_reports_per_day', 50)
        self.block_threshold = self.limits.get('block_threshold', 20)
        self.block_duration = self.limits.get('block_duration_minutes', 60)
        
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
            self.db_mode = 'database' if hasattr(data_handler, 'save_agent_performance') else 'json'
        
        # Statistics
        self.stats = {
            'total_checks': 0,
            'blocked_attempts': 0,
            'warnings_issued': 0
        }
        
        print(f"RateLimiter initialized in {self.db_mode} mode")
    
    def check_rate_limit(self, user_id: str) -> Tuple[bool, str]:
        """
        Check if user can submit report - ENHANCED
        
        Returns:
            (can_submit: bool, reason: str)
        """
        self.stats['total_checks'] += 1
        
        # Step 1: Check if user is blocked
        is_blocked, reason = self.db.is_user_blocked(user_id)
        if is_blocked:
            self.stats['blocked_attempts'] += 1
            return False, f"Temporarily blocked: {reason}"

        # Step 2: Get recent activity
        recent_activity = self.db.get_user_activity(user_id, hours=24)

        # Step 3: Check hourly limit
        hour_ago = datetime.now() - timedelta(hours=1)
        reports_last_hour = sum(
            1 for activity in recent_activity 
            if self._parse_timestamp(activity['timestamp']) > hour_ago
        )
        
        if reports_last_hour >= self.max_per_hour:
            self._apply_cooldown(user_id, 'hourly_limit')
            self.stats['blocked_attempts'] += 1
            return False, f"Hourly limit exceeded ({reports_last_hour}/{self.max_per_hour}). Please wait."

        # Step 4: Check daily limit
        if len(recent_activity) >= self.max_per_day:
            self._apply_cooldown(user_id, 'daily_limit')
            self.stats['blocked_attempts'] += 1
            return False, f"Daily limit reached ({len(recent_activity)}/{self.max_per_day}). Try tomorrow."
        
        # Step 5: Check for warnings
        warning = self._check_usage_warning(reports_last_hour, len(recent_activity))
        if warning:
            self.stats['warnings_issued'] += 1
            return True, warning
        
        return True, "OK"
    
    def _parse_timestamp(self, timestamp) -> datetime:
        """Parse timestamp safely"""
        if isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp)
            except:
                return datetime.now()
        return timestamp
    
    def _check_usage_warning(self, hourly_reports: int, daily_reports: int) -> str:
        """
        Issue warnings before hitting limits
        
        Returns:
            Warning message if nearing limits, empty string otherwise
        """
        hourly_usage = hourly_reports / self.max_per_hour
        daily_usage = daily_reports / self.max_per_day
        
        # Critical warning at 90%
        if hourly_usage >= 0.9:
            return f"Critical: {hourly_reports}/{self.max_per_hour} hourly reports used"
        elif daily_usage >= 0.9:
            return f"Critical: {daily_reports}/{self.max_per_day} daily reports used"
        
        # Warning at 75%
        elif hourly_usage >= 0.75:
            return f"Warning: {hourly_reports}/{self.max_per_hour} hourly reports used"
        elif daily_usage >= 0.75:
            return f"Warning: {daily_reports}/{self.max_per_day} daily reports used"
        
        return ""
    
    def record_activity(self, user_id: str):
        """Record user submitted a report"""
        try:
            self.db.record_activity(user_id)
        except Exception as e:
            print(f"Failed to record activity: {e}")
    
    def _apply_cooldown(self, user_id: str, reason_type: str):
        """
        Block user temporarily 
        
        Args:
            user_id: User to block
            reason_type: Type of violation ('hourly_limit', 'daily_limit', 'spam')
        """
        reason_messages = {
            'hourly_limit': f"Exceeded {self.max_per_hour} reports per hour",
            'daily_limit': f"Exceeded {self.max_per_day} reports per day",
            'spam': "Suspicious activity detected"
        }
        
        reason = reason_messages.get(reason_type, "Rate limit exceeded")
        
        try:
            self.db.block_user(user_id, self.block_duration, reason)
            print(f"   User {user_id} blocked for {self.block_duration} minutes: {reason}")
        except Exception as e:
            print(f"   Failed to block user: {e}")
    
    def get_penalty_score(self, user_id: str) -> float:
        """
        Calculate penalty based on usage - ENHANCED
        
        Returns:
            Penalty score (0.0 to 0.7)
        """
        try:
            recent_activity = self.db.get_user_activity(user_id, hours=1)
            reports_last_hour = len(recent_activity)
            
            usage_ratio = reports_last_hour / self.max_per_hour
            
            # Progressive penalty curve
            if usage_ratio < 0.5:
                return 0.0  # No penalty - normal usage
            elif usage_ratio < 0.7:
                return 0.15  # Light penalty
            elif usage_ratio < 0.85:
                return 0.30  # Medium penalty
            elif usage_ratio < 0.95:
                return 0.50  # Heavy penalty
            else:
                return 0.70  # Maximum penalty - near limit
                
        except Exception as e:
            print(f"Failed to calculate penalty: {e}")
            return 0.0
    
    def get_user_usage_stats(self, user_id: str) -> Dict:
        """
        Get detailed usage statistics for user
        
        Returns:
            Dictionary with usage data
        """
        try:
            # Get activity for different time periods
            last_hour = self.db.get_user_activity(user_id, hours=1)
            last_day = self.db.get_user_activity(user_id, hours=24)
            
            # Check if blocked
            is_blocked, block_reason = self.db.is_user_blocked(user_id)
            
            # Calculate usage percentages
            hourly_usage = len(last_hour) / self.max_per_hour * 100
            daily_usage = len(last_day) / self.max_per_day * 100
            
            # Determine status
            if is_blocked:
                status = "BLOCKED"
            elif hourly_usage >= 90 or daily_usage >= 90:
                status = "CRITICAL"
            elif hourly_usage >= 75 or daily_usage >= 75:
                status = "WARNING"
            else:
                status = "NORMAL"
            
            return {
                'user_id': user_id,
                'status': status,
                'blocked': is_blocked,
                'block_reason': block_reason if is_blocked else None,
                'hourly': {
                    'reports': len(last_hour),
                    'limit': self.max_per_hour,
                    'usage_percent': round(hourly_usage, 1),
                    'remaining': self.max_per_hour - len(last_hour)
                },
                'daily': {
                    'reports': len(last_day),
                    'limit': self.max_per_day,
                    'usage_percent': round(daily_usage, 1),
                    'remaining': self.max_per_day - len(last_day)
                },
                'penalty_score': self.get_penalty_score(user_id)
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'user_id': user_id,
                'status': 'ERROR'
            }
    
    def unblock_user(self, user_id: str) -> bool:
        """
        Manually unblock a user (admin function)
        
        Returns:
            True if successfully unblocked
        """
        try:
            # This requires a new database method
            # For now, we can't implement this without modifying database.py
            # But the structure is here for future use
            print(f"Manual unblock not yet implemented in database")
            return False
        except Exception as e:
            print(f"Failed to unblock user: {e}")
            return False
    
    def get_blocked_users(self) -> List[Dict]:
        """
        Get list of currently blocked users
        
        Returns:
            List of blocked user data
        """
        # This would require a new database method
        # Placeholder for future implementation
        return []
    
    def adjust_limits(self, max_per_hour: int = None, 
                     max_per_day: int = None,
                     block_duration: int = None):
        """
        Dynamically adjust rate limits
        
        Args:
            max_per_hour: New hourly limit
            max_per_day: New daily limit
            block_duration: New block duration in minutes
        """
        if max_per_hour is not None:
            old_hourly = self.max_per_hour
            self.max_per_hour = max_per_hour
            print(f"Hourly limit adjusted: {old_hourly} → {max_per_hour}")
        
        if max_per_day is not None:
            old_daily = self.max_per_day
            self.max_per_day = max_per_day
            print(f"Daily limit adjusted: {old_daily} → {max_per_day}")
        
        if block_duration is not None:
            old_duration = self.block_duration
            self.block_duration = block_duration
            print(f"Block duration adjusted: {old_duration} → {block_duration} minutes")
    
    def get_statistics(self) -> Dict:
        """
        Get rate limiter statistics
        
        Returns:
            Dictionary with statistics
        """
        block_rate = 0
        if self.stats['total_checks'] > 0:
            block_rate = self.stats['blocked_attempts'] / self.stats['total_checks'] * 100
        
        return {
            'total_checks': self.stats['total_checks'],
            'blocked_attempts': self.stats['blocked_attempts'],
            'warnings_issued': self.stats['warnings_issued'],
            'block_rate_percent': round(block_rate, 2),
            'current_limits': {
                'max_reports_per_hour': self.max_per_hour,
                'max_reports_per_day': self.max_per_day,
                'block_duration_minutes': self.block_duration,
                'block_threshold': self.block_threshold
            }
        }
    
    def reset_statistics(self):
        """Reset statistics counters"""
        self.stats = {
            'total_checks': 0,
            'blocked_attempts': 0,
            'warnings_issued': 0
        }
        print("Rate limiter statistics reset")
    
    def is_suspicious_pattern(self, user_id: str) -> Tuple[bool, str]:
        """
        Detect suspicious reporting patterns
        
        Returns:
            (is_suspicious: bool, reason: str)
        """
        try:
            recent = self.db.get_user_activity(user_id, hours=1)
            
            if len(recent) == 0:
                return False, ""
            
            # Check for extremely rapid submissions (< 5 seconds apart)
            if len(recent) >= 3:
                timestamps = [self._parse_timestamp(a['timestamp']) for a in recent[-3:]]
                timestamps.sort()
                
                # Check time between consecutive reports
                for i in range(len(timestamps) - 1):
                    time_diff = (timestamps[i+1] - timestamps[i]).total_seconds()
                    if time_diff < 5:  # Less than 5 seconds
                        return True, "Reports submitted too rapidly (< 5 seconds apart)"
            
            # Check for burst patterns (many reports in short time)
            last_5_min = sum(
                1 for a in recent 
                if (datetime.now() - self._parse_timestamp(a['timestamp'])).total_seconds() < 300
            )
            
            if last_5_min >= 5:
                return True, f"Burst detected: {last_5_min} reports in 5 minutes"
            
            return False, ""
            
        except Exception as e:
            print(f"Suspicious pattern check failed: {e}")
            return False, ""
    
    def get_config(self) -> Dict:
        """Get current rate limiter configuration"""
        return {
            'mode': self.db_mode,
            'limits': {
                'max_reports_per_hour': self.max_per_hour,
                'max_reports_per_day': self.max_per_day,
                'block_threshold': self.block_threshold,
                'block_duration_minutes': self.block_duration
            },
            'features': [
                'Progressive penalties',
                'Usage warnings',
                'Suspicious pattern detection',
                'Dynamic limit adjustment'
            ]
        }