from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    """User model - supports all roles (Citizen, Volunteer, NGO, Authority)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed password
    role = Column(String(20), nullable=False)  # citizen, volunteer, ngo, authority
    name = Column(String(100))
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(200))
    
    # Volunteer-specific fields
    skills = Column(JSON)  # List of skills: ["first_aid", "rescue"]
    availability = Column(Boolean, default=True)
    reliability_score = Column(Float, default=1.0)  # 0.0 to 1.0
    
    # NGO-specific fields
    organization_name = Column(String(200))
    capacity = Column(Integer)  # How many crises can handle simultaneously
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_crises = relationship("Crisis", back_populates="creator", foreign_keys="Crisis.creator_id")
    assigned_tasks = relationship("Task", back_populates="volunteer")
    managed_crises = relationship("Crisis", back_populates="managing_ngo", foreign_keys="Crisis.accepted_by_ngo_id")


class Crisis(Base):
    """Crisis/Emergency event"""
    __tablename__ = "crises"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    crisis_type = Column(String(50), nullable=False)  # fire, flood, accident, medical, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(200))
    affected_radius = Column(Float, default=0.5)  # km
    
    # Status
    status = Column(String(20), default="pending")  # pending, accepted, in_progress, resolved, rejected
    
    # Trust & verification
    trust_score = Column(Float, default=0.5)  # 0.0 to 1.0
    confidence = Column(Float, default=0.5)  # AI confidence
    verified = Column(Boolean, default=False)
    verification_sources = Column(JSON)  # List of sources
    
    # Ownership
    creator_id = Column(Integer, ForeignKey("users.id"))
    accepted_by_ngo_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_crises", foreign_keys=[creator_id])
    managing_ngo = relationship("User", back_populates="managed_crises", foreign_keys=[accepted_by_ngo_id])
    tasks = relationship("Task", back_populates="crisis")


class Task(Base):
    """Task assigned to volunteers"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text)
    task_type = Column(String(50))  # rescue, medical, supply, evacuation
    required_skill = Column(String(50))
    
    # Status
    status = Column(String(20), default="pending")  # pending, assigned, in_progress, completed, failed
    priority = Column(Integer, default=5)  # 1-10, higher = more urgent
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Performance tracking
    estimated_duration = Column(Integer)  # minutes
    actual_duration = Column(Integer, nullable=True)
    distance_to_volunteer = Column(Float, nullable=True)  # km
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crisis = relationship("Crisis", back_populates="tasks")
    volunteer = relationship("User", back_populates="assigned_tasks")


class PerformanceMetric(Base):
    """Track volunteer & system performance for Learning Agent"""
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # What
    entity_type = Column(String(20), nullable=False)  # volunteer, ngo, crisis, task
    entity_id = Column(Integer, nullable=False)
    
    # Metrics
    metric_type = Column(String(50), nullable=False)  # response_time, success_rate, reliability
    metric_value = Column(Float, nullable=False)
    
    # Context
    crisis_id = Column(Integer, ForeignKey("crises.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    # Metadata
    metadata = Column(JSON)  # Additional context
    
    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for fast queries
    __table_args__ = (
        {'extend_existing': True}
    )