from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from core.config import settings


# Load environment variables
load_dotenv()

# Database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crisisnet.db")

# Vercel Postgres uses postgres:// but SQLAlchemy 2.0 requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
# For SQLite: connect_args needed for thread safety
# For PostgreSQL: pool settings for production
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
        pool_recycle=3600  # Recycle connections after 1 hour
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def init_db():
    """
    Initialize database - create all tables
    Call this on app startup or lazily on first request
    """
    from .models import User, Crisis, Task, PerformanceMetric, SocialSignal  
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def close_db():
    """
    Close database connections
    Call this on app shutdown
    """
    engine.dispose()
    print("✅ Database connections closed")


def get_db():
    """
    Dependency for FastAPI routes
    Yields database session and ensures cleanup
    
    Usage in routes:
        @router.get("/")
        def endpoint(db: Session = Depends(get_db)):
            # use db here
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Lazy initialization for serverless environments (Vercel)
_db_initialized = False

def ensure_db_initialized():
    """
    Ensures database is initialized on first request
    Call this in endpoints that need the database
    """
    global _db_initialized
    if not _db_initialized:
        init_db()
        _db_initialized = True