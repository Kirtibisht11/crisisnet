from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Database URL
DATABASE_URL = settings.DATABASE_URL

# Fix postgres scheme for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def init_db():
    from .models import User, Crisis, Task, PerformanceMetric, SocialSignal
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

_db_initialized = False

def ensure_db_initialized():
    global _db_initialized
    if not _db_initialized:
        init_db()
        _db_initialized = True
