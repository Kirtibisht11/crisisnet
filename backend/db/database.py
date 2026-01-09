from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crisisnet.db")

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
        pool_pre_ping=True
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def init_db():
    """
    Initialize database - create all tables
    Call this on app startup
    """
    from .models import User, Crisis, Task, PerformanceMetric
    
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