"""
Migration: Add social_signals table
Run with: python -m backend.migrations.add_social_signals
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.db.database import engine, Base
from backend.db.models import SocialSignal

def upgrade():
    """Create social_signals table"""
    print("Creating social_signals table...")
    Base.metadata.create_all(bind=engine, tables=[SocialSignal.__table__])
    print("✅ Migration complete: social_signals table created")

def downgrade():
    """Drop social_signals table"""
    print("Dropping social_signals table...")
    SocialSignal.__table__.drop(engine)
    print("✅ Rollback complete: social_signals table dropped")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "down":
        downgrade()
    else:
        upgrade()