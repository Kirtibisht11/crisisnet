"""
Migration: Import existing JSON data to database
Run with: python -m backend.migrations.migrate_json_to_db
"""

import sys
import os
import json
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.db.database import SessionLocal
from backend.db.crud import create_user, create_crisis

def migrate_users():
    
    users_file = os.path.join("backend", "data", "users.json")
    
    if not os.path.exists(users_file):
        print("❌ users.json not found")
        return
    
    with open(users_file, 'r') as f:
        data = json.load(f)
    
    users = data.get('users', [])
    db = SessionLocal()
    
    migrated = 0
    for user_data in users:
        try:
            from backend.db.crud import get_user_by_phone
            existing = get_user_by_phone(db, user_data['phone'])
            
            if existing:
                print(f"⚠️  User {user_data['phone']} already exists, skipping")
                continue
            
            user = create_user(
                db=db,
                phone=user_data['phone'],
                password=user_data.get('password_hash', 'migrated'),
                role=user_data['role'],
                name=user_data.get('name'),
                latitude=user_data.get('latitude'),
                longitude=user_data.get('longitude')
            )
            migrated += 1
            print(f"✅ Migrated user: {user.phone}")
            
        except Exception as e:
            print(f"❌ Failed to migrate user {user_data.get('phone')}: {e}")
    
    db.close()
    print(f"\n✅ Migration complete: {migrated}/{len(users)} users migrated")


def migrate_alerts():
    """Migrate alerts_log.json to database as Crisis records"""
    
    alerts_file = os.path.join("backend", "data", "alerts_log.json")
    
    if not os.path.exists(alerts_file):
        print("❌ alerts_log.json not found")
        return
    
    with open(alerts_file, 'r') as f:
        data = json.load(f)
    
    alerts = data.get('alerts', [])
    db = SessionLocal()
    
    migrated = 0
    for alert_data in alerts:
        try:
            from backend.db.crud import get_user_by_id
            creator = db.query(User).first()
            creator_id = creator.id if creator else 1
            
            crisis = create_crisis(
                db=db,
                title=f"{alert_data.get('crisis_type', 'Unknown')} - {alert_data.get('location', 'Unknown')}",
                crisis_type=alert_data.get('crisis_type', 'other'),
                severity=alert_data.get('severity', 'medium'),
                latitude=alert_data.get('lat', 0.0) or 0.0,
                longitude=alert_data.get('lon', 0.0) or 0.0,
                location=alert_data.get('location', 'Unknown'),
                creator_id=creator_id,
                trust_score=alert_data.get('trust_score', 0.5),
                confidence=alert_data.get('trust_score', 0.5),
                description=alert_data.get('message', '')
            )
            migrated += 1
            print(f"✅ Migrated alert: {crisis.title}")
            
        except Exception as e:
            print(f"❌ Failed to migrate alert: {e}")
    
    db.close()
    print(f"\n✅ Migration complete: {migrated}/{len(alerts)} alerts migrated")


def run_all_migrations():
    print("=" * 60)
    print("STARTING DATA MIGRATION FROM JSON TO DATABASE")
    print("=" * 60)
    
    print("\n[1/2] Migrating Users...")
    migrate_users()
    
    print("\n[2/2] Migrating Alerts...")
    migrate_alerts()
    
    print("\n" + "=" * 60)
    print("ALL MIGRATIONS COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    from backend.db.models import User
    run_all_migrations()