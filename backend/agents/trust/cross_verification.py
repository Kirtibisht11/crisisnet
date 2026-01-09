import json
import os
import math
import hashlib
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta

class CrossVerifier:
    """
    Enhanced Cross-Verification System
    
    New Features:
    - Multi-source verification with conflict detection
    - Consensus level calculation
    - Geographic clustering for better matching
    - Time-based verification windows
    - Detailed verification logging
    """
 
    def __init__(self, data_handler=None):
        config_path = os.path.join(os.path.dirname(__file__), 'trust_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        self.config = config.get('cross_verification', {})
        
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
            self.db_mode = 'database' if hasattr(data_handler, 'save_cross_verification_log') else 'json'
        
        # Verification statistics
        self.stats = {
            'total_verifications': 0,
            'high_confidence': 0,
            'medium_confidence': 0,
            'low_confidence': 0,
            'conflicts_detected': 0
        }
        
        print(f"CrossVerifier initialized in {self.db_mode} mode")
    
    def verify_alert(self, new_alert: dict) -> tuple:
        """
        Verify alert against existing reports - ENHANCED
        
        Returns:
            (verification_score, num_sources, details_string)
        """
        self.stats['total_verifications'] += 1
        
        # Find similar alerts
        matching_alerts = self.db.find_similar_alerts(
            crisis_type=new_alert.get('crisis_type'),
            location=new_alert.get('location'),
            minutes=self.config.get('time_window_minutes', 60),
            exclude_user=new_alert.get('user_id')
        )
        
        if not matching_alerts:
            return 0.5, 0, "First report - no cross-verification available"
   
        # ROUND 2 ENHANCEMENT: Geographic filtering with clustering
        if new_alert.get('lat') and new_alert.get('lon'):
            matching_alerts, geo_details = self._filter_by_location(
                new_alert, matching_alerts
            )
        else:
            geo_details = "No GPS coordinates provided"
        
        # ROUND 2 ENHANCEMENT: Analyze source diversity
        source_analysis = self._analyze_sources(matching_alerts)
        num_sources = source_analysis['unique_users']
        
        # ROUND 2 ENHANCEMENT: Detect conflicts
        conflicts = self._detect_conflicts(new_alert, matching_alerts)
        
        # Calculate verification score
        verification_score = self._calculate_verification_score(
            source_analysis, conflicts, len(matching_alerts)
        )
        
        # Determine consensus level
        consensus_level = self._get_consensus_level(verification_score, num_sources)
        
        # Update statistics
        if consensus_level == 'HIGH':
            self.stats['high_confidence'] += 1
        elif consensus_level == 'MEDIUM':
            self.stats['medium_confidence'] += 1
        else:
            self.stats['low_confidence'] += 1
        
        if conflicts['has_conflicts']:
            self.stats['conflicts_detected'] += 1
        
        # Build detailed explanation
        details = self._build_verification_details(
            source_analysis, conflicts, consensus_level, geo_details
        )
        
        # ROUND 2: Log verification if in database mode
        if self.db_mode == 'database' and new_alert.get('alert_id'):
            try:
                self.db.save_cross_verification_log(
                    alert_id=new_alert['alert_id'],
                    primary_source=new_alert.get('user_id', 'unknown'),
                    verified_sources=source_analysis['user_list'],
                    conflicting_sources=conflicts.get('conflicting_users', []),
                    verification_score=verification_score,
                    consensus_level=consensus_level
                )
            except Exception as e:
                print(f"Failed to log cross-verification: {e}")
        
        return verification_score, num_sources, details
    
    def _filter_by_location(self, new_alert: dict, 
                           alerts: List[dict]) -> Tuple[List[dict], str]:
        """
        Filter alerts by geographic proximity with clustering
        
        Returns:
            (filtered_alerts, details_string)
        """
        lat1 = new_alert['lat']
        lon1 = new_alert['lon']
        radius_km = self.config.get('location_radius_km', 10)
        
        nearby_alerts = []
        distances = []
        
        for alert in alerts:
            if alert.get('latitude') and alert.get('longitude'):
                distance = self._haversine_distance(
                    lat1, lon1, alert['latitude'], alert['longitude']
                )
                if distance <= radius_km:
                    nearby_alerts.append(alert)
                    distances.append(distance)
        
        if not nearby_alerts:
            return [], f"No alerts within {radius_km}km radius"
        
        avg_distance = sum(distances) / len(distances)
        details = f"{len(nearby_alerts)} alerts within {radius_km}km (avg: {avg_distance:.1f}km)"
        
        return nearby_alerts, details
    
    def _analyze_sources(self, alerts: List[dict]) -> Dict:
        """
        Analyze source diversity and patterns
        
        Returns:
            Dictionary with source analysis data
        """
        if not alerts:
            return {
                'unique_users': 0,
                'total_reports': 0,
                'user_list': [],
                'temporal_spread': 0,
                'geographic_spread': 0
            }
        
        user_list = [alert['user_id'] for alert in alerts if 'user_id' in alert]
        unique_users = len(set(user_list))
        
        # Analyze temporal spread
        timestamps = []
        for alert in alerts:
            if 'timestamp' in alert:
                if isinstance(alert['timestamp'], str):
                    try:
                        ts = datetime.fromisoformat(alert['timestamp'])
                        timestamps.append(ts)
                    except:
                        pass
                else:
                    timestamps.append(alert['timestamp'])
        
        temporal_spread = 0
        if len(timestamps) >= 2:
            time_diff = max(timestamps) - min(timestamps)
            temporal_spread = time_diff.total_seconds() / 60  # minutes
        
        # Analyze geographic spread
        locations = [(a.get('latitude'), a.get('longitude')) for a in alerts 
                    if a.get('latitude') and a.get('longitude')]
        geographic_spread = self._calculate_geographic_spread(locations)
        
        return {
            'unique_users': unique_users,
            'total_reports': len(alerts),
            'user_list': list(set(user_list)),
            'temporal_spread': round(temporal_spread, 1),
            'geographic_spread': round(geographic_spread, 2),
            'diversity_score': self._calculate_diversity_score(
                unique_users, len(alerts), temporal_spread
            )
        }
    
    def _calculate_diversity_score(self, unique_users: int, 
                                   total_reports: int, 
                                   temporal_spread: float) -> float:
        """Calculate source diversity score (0-1)"""
        # User diversity (0-0.5)
        user_ratio = unique_users / max(total_reports, 1)
        user_score = min(0.5, user_ratio * 0.5)
        
        # Temporal diversity (0-0.3)
        temporal_score = min(0.3, temporal_spread / 100 * 0.3)  # Normalize by 100 minutes
        
        # Volume bonus (0-0.2)
        volume_score = min(0.2, total_reports / 10 * 0.2)  # Normalize by 10 reports
        
        return user_score + temporal_score + volume_score
    
    def _calculate_geographic_spread(self, locations: List[tuple]) -> float:
        """Calculate geographic spread in kilometers"""
        if len(locations) < 2:
            return 0.0
        
        max_distance = 0.0
        for i in range(len(locations)):
            for j in range(i + 1, len(locations)):
                lat1, lon1 = locations[i]
                lat2, lon2 = locations[j]
                if all([lat1, lon1, lat2, lon2]):
                    distance = self._haversine_distance(lat1, lon1, lat2, lon2)
                    max_distance = max(max_distance, distance)
        
        return max_distance
    
    def _detect_conflicts(self, new_alert: dict, 
                         matching_alerts: List[dict]) -> Dict:
        """
        Detect conflicting information
        
        Returns:
            Dictionary with conflict analysis
        """
        conflicts = {
            'has_conflicts': False,
            'conflict_types': [],
            'conflicting_users': [],
            'severity_conflicts': 0,
            'type_conflicts': 0
        }
        
        if not matching_alerts:
            return conflicts
        
        new_crisis_type = new_alert.get('crisis_type', '').lower()
        new_severity = new_alert.get('severity', 'medium').lower()
        
        for alert in matching_alerts:
            alert_crisis_type = alert.get('crisis_type', '').lower()
            alert_severity = alert.get('severity', 'medium').lower()
            
            # Check for crisis type conflicts
            if alert_crisis_type and new_crisis_type:
                if alert_crisis_type != new_crisis_type:
                    conflicts['has_conflicts'] = True
                    conflicts['type_conflicts'] += 1
                    conflicts['conflict_types'].append('crisis_type')
                    conflicts['conflicting_users'].append(alert.get('user_id'))
            
            # Check for severity conflicts
            severity_order = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            new_sev_val = severity_order.get(new_severity, 2)
            alert_sev_val = severity_order.get(alert_severity, 2)
            
            if abs(new_sev_val - alert_sev_val) >= 2:  # 2+ levels apart
                conflicts['has_conflicts'] = True
                conflicts['severity_conflicts'] += 1
                conflicts['conflict_types'].append('severity')
        
        conflicts['conflict_types'] = list(set(conflicts['conflict_types']))
        conflicts['conflicting_users'] = list(set(conflicts['conflicting_users']))
        
        return conflicts
    
    def _calculate_verification_score(self, source_analysis: Dict, 
                                     conflicts: Dict, 
                                     total_matches: int) -> float:
        """
        Calculate verification score with conflict consideration
        
        Algorithm:
        - Base score from source diversity
        - Bonus for multiple independent sources
        - Penalty for conflicts
        - Cap at 0.95 (never 100% certain)
        """
        unique_users = source_analysis['unique_users']
        diversity_score = source_analysis.get('diversity_score', 0)
        
        min_sources = self.config.get('min_sources_for_high_confidence', 
                                     self.config.get('min_sources', 3))
        
        # Base score from source count
        if unique_users >= min_sources:
            base_score = 0.7
            bonus = min(0.20, (unique_users - min_sources) * 0.05)
            score = base_score + bonus
        elif unique_users >= 2:
            score = 0.5 + (unique_users - 1) * 0.15
        elif unique_users == 1:
            score = 0.45
        else:
            score = 0.30
        
        # Add diversity bonus
        score += diversity_score * 0.15
        
        # Apply conflict penalty
        if conflicts['has_conflicts']:
            conflict_penalty = 0.10 * len(conflicts['conflict_types'])
            score -= conflict_penalty
        
        # Apply volume bonus for many reports
        if total_matches >= 5:
            volume_bonus = min(0.10, (total_matches - 5) * 0.02)
            score += volume_bonus
        
        # Cap score
        return max(0.0, min(0.95, score))
    
    def _get_consensus_level(self, score: float, num_sources: int) -> str:
        """Determine consensus level from score and source count"""
        min_high = self.config.get('min_sources_for_high_confidence', 3)
        min_med = self.config.get('min_sources_for_medium_confidence', 2)
        
        if score >= 0.75 and num_sources >= min_high:
            return 'HIGH'
        elif score >= 0.55 and num_sources >= min_med:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _build_verification_details(self, source_analysis: Dict, 
                                    conflicts: Dict, 
                                    consensus: str,
                                    geo_details: str) -> str:
        """Build human-readable verification details"""
        unique = source_analysis['unique_users']
        total = source_analysis['total_reports']
        
        details = f"{consensus} consensus from {unique} source(s)"
        
        if total > unique:
            details += f" ({total} reports)"
        
        if conflicts['has_conflicts']:
            details += f"{len(conflicts['conflict_types'])} conflict(s) detected"
        
        if source_analysis.get('temporal_spread', 0) > 0:
            details += f", {source_analysis['temporal_spread']:.0f}min spread"
        
        return details
    
    def add_alert(self, alert: dict) -> int:
        """Add alert to database with fingerprinting"""
        # Generate fingerprint
        content = f"{alert.get('crisis_type', '')}|{alert.get('location', '')}|{alert.get('message', '')}"
        fingerprint = hashlib.md5(content.encode()).hexdigest()
        
        alert_data = {
            'user_id': alert.get('user_id'),
            'crisis_type': alert.get('crisis_type'),
            'location': alert.get('location'),
            'lat': alert.get('lat'),
            'lon': alert.get('lon'),
            'message': alert.get('message', ''),
            'fingerprint': fingerprint,
            'trust_score': alert.get('trust_score', 0.0)
        }
        
        return self.db.save_alert(alert_data)
    
    def _is_nearby(self, lat1: float, lon1: float, lat2: float, lon2: float) -> bool:
        """Check if two locations are within configured radius"""
        if None in (lat1, lon1, lat2, lon2):
            return True
        
        distance = self._haversine_distance(lat1, lon1, lat2, lon2)
        return distance <= self.config.get('location_radius_km', 10)
    
    def _haversine_distance(self, lat1: float, lon1: float, 
                           lat2: float, lon2: float) -> float:
        """Calculate distance between two GPS coordinates in kilometers"""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def get_verification_stats(self) -> dict:
        """Get verification statistics"""
        stats = {
            **self.config,
            'statistics': self.stats.copy()
        }
        
        # Calculate percentages
        total = self.stats['total_verifications']
        if total > 0:
            stats['statistics']['high_confidence_rate'] = round(
                self.stats['high_confidence'] / total * 100, 1
            )
            stats['statistics']['conflict_rate'] = round(
                self.stats['conflicts_detected'] / total * 100, 1
            )
        
        return stats
    
    def get_alert_verification_history(self, alert_id: int) -> Optional[Dict]:
        """
        Get verification history for specific alert
        """
        if self.db_mode != 'database':
            return None
        
        try:
            logs = self.db.get_cross_verification_logs(alert_id)
            return {
                'alert_id': alert_id,
                'verification_count': len(logs),
                'logs': logs
            }
        except Exception as e:
            print(f"Failed to get verification history: {e}")
            return None
    
    def reset_statistics(self):
        """Reset verification statistics"""
        self.stats = {
            'total_verifications': 0,
            'high_confidence': 0,
            'medium_confidence': 0,
            'low_confidence': 0,
            'conflicts_detected': 0
        }
        print("Verification statistics reset")