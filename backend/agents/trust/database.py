import sqlite3
from datetime import datetime
from typing import Optional, List, Dict
import json
import os

class TrustDatabase:
    """SQLite database for Trust Agent"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'crisisnet.db')
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Create database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize all tables"""
        conn = self.get_connection()
        cursor = conn.cursor()

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

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action_type TEXT DEFAULT 'report',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blocked_users (
                user_id TEXT PRIMARY KEY,
                blocked_until TIMESTAMP NOT NULL,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
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

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alert_timestamp ON alert_history(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rate_user_time ON rate_limits(user_id, timestamp)")
        
        conn.commit()
        conn.close()
        print("Database initialized")
 
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
            (user_id, crisis_type, location, latitude, longitude, message, fingerprint)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_data['user_id'], alert_data['crisis_type'], alert_data['location'],
            alert_data.get('lat'), alert_data.get('lon'),
            alert_data.get('message', ''), alert_data['fingerprint']
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
        from datetime import timedelta
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