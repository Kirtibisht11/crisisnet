import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import json
import os

class TrustDatabase:
    """SQLite database for Trust Agent"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'services', 'crisisnet.db')
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Create database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize all tables - Round 2 Enhanced"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # EXISTING TABLE: User reputation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_reputation (
                user_id TEXT PRIMARY KEY,
                reputation_score REAL DEFAULT 0.5,
                total_reports INTEGER DEFAULT 0,
                accurate_reports INTEGER DEFAULT 0,
                false_reports INTEGER DEFAULT 0,
                last_updated TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
 
        # EXISTING TABLE: Reputation history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reputation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                was_accurate BOOLEAN NOT NULL,
                old_score REAL NOT NULL,
                new_score REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # EXISTING TABLE: Alert history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                crisis_type TEXT NOT NULL,
                location TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                message TEXT,
                fingerprint TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified BOOLEAN DEFAULT FALSE,
                trust_score REAL
            )
        """)

        # EXISTING TABLE: Rate limits
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action_type TEXT DEFAULT 'report',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # EXISTING TABLE: Blocked users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blocked_users (
                user_id TEXT PRIMARY KEY,
                blocked_until TIMESTAMP NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # EXISTING TABLE: Verification results
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                alert_id INTEGER,
                trust_score REAL NOT NULL,
                decision TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ========== NEW ROUND 2 TABLES ==========
        
        # NEW: Agent performance history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_type TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                task_type TEXT NOT NULL,
                success BOOLEAN NOT NULL,
                response_time REAL,
                accuracy_score REAL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)

        # NEW: Source reputation tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS source_reputation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                source_name TEXT,
                reliability_score REAL DEFAULT 0.5,
                total_reports INTEGER DEFAULT 0,
                accurate_reports INTEGER DEFAULT 0,
                false_reports INTEGER DEFAULT 0,
                last_updated TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_type, source_id)
            )
        """)

        # NEW: Cross-verification logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cross_verification_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id INTEGER,
                primary_source TEXT,
                verified_sources TEXT,
                conflicting_sources TEXT,
                verification_score REAL,
                consensus_level TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # NEW: Trust threshold history (for dynamic thresholds)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS threshold_adjustments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crisis_type TEXT,
                severity_level TEXT,
                old_threshold REAL,
                new_threshold REAL,
                reason TEXT,
                adjusted_by TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # NEW: Trust decisions audit log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trust_decisions_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id INTEGER,
                user_id TEXT,
                decision TEXT NOT NULL,
                trust_score REAL,
                components TEXT,
                reasoning TEXT,
                human_review BOOLEAN DEFAULT FALSE,
                reviewed_by TEXT,
                review_timestamp TIMESTAMP,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alert_timestamp ON alert_history(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rate_user_time ON rate_limits(user_id, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_perf_type ON agent_performance(agent_type, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_rep_type ON source_reputation(source_type, source_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cross_verify_alert ON cross_verification_logs(alert_id)")
        
        conn.commit()
        conn.close()
        print("Database initialized")
 
    # ========== EXISTING METHODS ==========
    
    def get_user_reputation(self, user_id: str) -> Optional[Dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_reputation WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    
    def create_user_reputation(self, user_id: str, initial_score: float = 0.5):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO user_reputation (user_id, reputation_score, last_updated)
            VALUES (?, ?, ?)
        """, (user_id, initial_score, datetime.now()))
        conn.commit()
        conn.close()
    
    def update_user_reputation(self, user_id: str, new_score: float, was_accurate: bool, old_score: float):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if was_accurate:
            cursor.execute("""
                UPDATE user_reputation 
                SET reputation_score = ?, accurate_reports = accurate_reports + 1,
                    total_reports = total_reports + 1, last_updated = ?
                WHERE user_id = ?
            """, (new_score, datetime.now(), user_id))
        else:
            cursor.execute("""
                UPDATE user_reputation 
                SET reputation_score = ?, false_reports = false_reports + 1,
                    total_reports = total_reports + 1, last_updated = ?
                WHERE user_id = ?
            """, (new_score, datetime.now(), user_id))
        
        cursor.execute("""
            INSERT INTO reputation_history (user_id, was_accurate, old_score, new_score)
            VALUES (?, ?, ?, ?)
        """, (user_id, was_accurate, old_score, new_score))
        
        conn.commit()
        conn.close()

    def save_alert(self, alert_data: Dict) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO alert_history 
            (user_id, crisis_type, location, latitude, longitude, message, fingerprint, trust_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_data['user_id'], alert_data['crisis_type'], alert_data['location'],
            alert_data.get('lat'), alert_data.get('lon'),
            alert_data.get('message', ''), alert_data['fingerprint'],
            alert_data.get('trust_score', 0.0)
        ))
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return alert_id
    
    def find_similar_alerts(self, crisis_type: str, location: str, 
                           minutes: int = 30, exclude_user: str = None) -> List[Dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if exclude_user:
            cursor.execute("""
                SELECT * FROM alert_history 
                WHERE crisis_type = ? AND location = ? AND user_id != ?
                AND timestamp > datetime('now', '-' || ? || ' minutes')
            """, (crisis_type, location, exclude_user, minutes))
        else:
            cursor.execute("""
                SELECT * FROM alert_history 
                WHERE crisis_type = ? AND location = ?
                AND timestamp > datetime('now', '-' || ? || ' minutes')
            """, (crisis_type, location, minutes))
        
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
  
    def record_activity(self, user_id: str):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO rate_limits (user_id) VALUES (?)", (user_id,))
        conn.commit()
        conn.close()
    
    def get_user_activity(self, user_id: str, hours: int = 24) -> List[Dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM rate_limits 
            WHERE user_id = ? AND timestamp > datetime('now', '-' || ? || ' hours')
        """, (user_id, hours))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    
    def is_user_blocked(self, user_id: str) -> tuple:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT blocked_until, reason FROM blocked_users 
            WHERE user_id = ? AND blocked_until > datetime('now')
        """, (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return True, row['reason']
        return False, None
    
    def block_user(self, user_id: str, minutes: int, reason: str):
        conn = self.get_connection()
        cursor = conn.cursor()
        blocked_until = datetime.now() + timedelta(minutes=minutes)
        cursor.execute("""
            INSERT OR REPLACE INTO blocked_users (user_id, blocked_until, reason)
            VALUES (?, ?, ?)
        """, (user_id, blocked_until, reason))
        conn.commit()
        conn.close()

    def get_reputation_history(self, user_id: str, limit: int = 10) -> list:
        """Get user's reputation history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM reputation_history 
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    # ========== NEW ROUND 2 METHODS ==========

    def save_agent_performance(self, agent_type: str, agent_id: str, 
                               task_type: str, success: bool, 
                               response_time: float = None, 
                               accuracy_score: float = None,
                               metadata: Dict = None):
        """Record agent performance for historical tracking"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO agent_performance 
            (agent_type, agent_id, task_type, success, response_time, accuracy_score, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            agent_type, agent_id, task_type, success, 
            response_time, accuracy_score, 
            json.dumps(metadata) if metadata else None
        ))
        conn.commit()
        conn.close()

    def get_agent_performance_history(self, agent_type: str, days: int = 30) -> List[Dict]:
        """Get agent performance history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM agent_performance 
            WHERE agent_type = ? 
            AND timestamp > datetime('now', '-' || ? || ' days')
            ORDER BY timestamp DESC
        """, (agent_type, days))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def calculate_agent_success_rate(self, agent_type: str, days: int = 7) -> float:
        """Calculate agent success rate over time period"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
            FROM agent_performance 
            WHERE agent_type = ? 
            AND timestamp > datetime('now', '-' || ? || ' days')
        """, (agent_type, days))
        row = cursor.fetchone()
        conn.close()
        
        if row and row['total'] > 0:
            return row['successes'] / row['total']
        return 0.5  # Default neutral score

    def save_source_reputation(self, source_type: str, source_id: str, 
                               source_name: str = None):
        """Create or get source reputation entry"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO source_reputation 
            (source_type, source_id, source_name, last_updated)
            VALUES (?, ?, ?, ?)
        """, (source_type, source_id, source_name, datetime.now()))
        conn.commit()
        conn.close()

    def update_source_reputation(self, source_type: str, source_id: str, 
                                 was_accurate: bool):
        """Update source reputation based on accuracy"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get current reputation
        cursor.execute("""
            SELECT reliability_score, total_reports, accurate_reports 
            FROM source_reputation 
            WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id))
        row = cursor.fetchone()
        
        if row:
            old_score = row['reliability_score']
            total = row['total_reports']
            accurate = row['accurate_reports']
            
            # Calculate new score with decay factor
            decay = 0.9  # Weight recent reports more
            if was_accurate:
                new_score = old_score * decay + 0.1
                accurate += 1
            else:
                new_score = old_score * decay - 0.1
            
            new_score = max(0.0, min(1.0, new_score))
            
            cursor.execute("""
                UPDATE source_reputation 
                SET reliability_score = ?, 
                    total_reports = total_reports + 1,
                    accurate_reports = ?,
                    false_reports = total_reports + 1 - ?,
                    last_updated = ?
                WHERE source_type = ? AND source_id = ?
            """, (new_score, accurate, accurate, datetime.now(), source_type, source_id))
        
        conn.commit()
        conn.close()

    def get_source_reputation(self, source_type: str, source_id: str) -> Optional[Dict]:
        """Get source reputation data"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM source_reputation 
            WHERE source_type = ? AND source_id = ?
        """, (source_type, source_id))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def save_cross_verification_log(self, alert_id: int, primary_source: str,
                                    verified_sources: List[str],
                                    conflicting_sources: List[str],
                                    verification_score: float,
                                    consensus_level: str):
        """Log cross-verification results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cross_verification_logs 
            (alert_id, primary_source, verified_sources, conflicting_sources, 
             verification_score, consensus_level)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            alert_id, primary_source, 
            json.dumps(verified_sources),
            json.dumps(conflicting_sources),
            verification_score, consensus_level
        ))
        conn.commit()
        conn.close()

    def get_cross_verification_logs(self, alert_id: int) -> List[Dict]:
        """Get cross-verification logs for an alert"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM cross_verification_logs 
            WHERE alert_id = ?
            ORDER BY timestamp DESC
        """, (alert_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def save_trust_decision(self, alert_id: int, user_id: str, 
                           decision: str, trust_score: float,
                           components: Dict, reasoning: str):
        """Audit log for trust decisions"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO trust_decisions_audit 
            (alert_id, user_id, decision, trust_score, components, reasoning)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            alert_id, user_id, decision, trust_score,
            json.dumps(components), reasoning
        ))
        conn.commit()
        conn.close()

    def get_statistics(self) -> Dict:
        """Get database statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        stats = {}
        
        # User stats
        cursor.execute("SELECT COUNT(*) as count FROM user_reputation")
        stats['total_users'] = cursor.fetchone()['count']
        
        # Alert stats
        cursor.execute("SELECT COUNT(*) as count FROM alert_history")
        stats['total_alerts'] = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM alert_history WHERE verified = 1")
        stats['verified_alerts'] = cursor.fetchone()['count']
        
        # Source stats
        cursor.execute("SELECT COUNT(*) as count FROM source_reputation")
        stats['tracked_sources'] = cursor.fetchone()['count']
        
        # Agent performance
        cursor.execute("""
            SELECT agent_type, 
                   COUNT(*) as total,
                   AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
            FROM agent_performance
            GROUP BY agent_type
        """)
        stats['agent_performance'] = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return stats