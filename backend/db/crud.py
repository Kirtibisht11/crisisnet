from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import bcrypt
from typing import List, Optional
from .models import User, Crisis, Task, PerformanceMetric


# ============= USER OPERATIONS =============

def create_user(
    db: Session,
    phone: str,
    password: str,
    role: str,
    name: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    skills: Optional[List[str]] = None,
    availability: bool = True,
    organization_name: Optional[str] = None,
    capacity: Optional[int] = None
) -> User:
    """Create a new user"""
    # Hash password if not already hashed
    if not password.startswith("$2b$"):
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        password = hashed.decode('utf-8')
    
    user = User(
        phone=phone,
        password=password,
        role=role,
        name=name,
        latitude=latitude,
        longitude=longitude,
        skills=skills,
        availability=availability,
        organization_name=organization_name,
        capacity=capacity
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    """Get user by phone number"""
    return db.query(User).filter(User.phone == phone).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_available_volunteers(
    db: Session,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    required_skill: Optional[str] = None,
    max_distance_km: float = 50.0
) -> List[User]:
    """
    Get available volunteers, optionally filtered by location and skill
    """
    query = db.query(User).filter(
        User.role == "volunteer",
        User.availability == True
    )
    
    # Filter by skill if specified
    if required_skill:
        query = query.filter(User.skills.contains([required_skill]))
    
    volunteers = query.all()
    
    # Filter by distance if location provided
    if latitude and longitude:
        from math import radians, sin, cos, sqrt, atan2
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Calculate distance in km"""
            R = 6371  # Earth radius in km
            
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            
            return R * c
        
        volunteers = [
            v for v in volunteers
            if v.latitude and v.longitude and
            haversine_distance(latitude, longitude, v.latitude, v.longitude) <= max_distance_km
        ]
    
    return volunteers


def update_volunteer_reliability(db: Session, volunteer_id: int, new_score: float):
    """Update volunteer reliability score"""
    volunteer = get_user_by_id(db, volunteer_id)
    if volunteer:
        volunteer.reliability_score = max(0.0, min(1.0, new_score))
        db.commit()


# ============= CRISIS OPERATIONS =============

def create_crisis(
    db: Session,
    title: str,
    crisis_type: str,
    severity: str,
    latitude: float,
    longitude: float,
    creator_id: int,
    description: Optional[str] = None,
    location: Optional[str] = None,
    trust_score: float = 0.5,
    confidence: float = 0.5
) -> Crisis:
    """Create new crisis"""
    crisis = Crisis(
        title=title,
        description=description,
        crisis_type=crisis_type,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        location=location,
        creator_id=creator_id,
        trust_score=trust_score,
        confidence=confidence,
        status="pending"
    )
    
    db.add(crisis)
    db.commit()
    db.refresh(crisis)
    return crisis


def get_crisis_by_id(db: Session, crisis_id: int) -> Optional[Crisis]:
    """Get crisis by ID"""
    return db.query(Crisis).filter(Crisis.id == crisis_id).first()


def get_available_crises(db: Session) -> List[Crisis]:
    """Get crises that are pending (not yet accepted by NGO)"""
    return db.query(Crisis).filter(
        Crisis.status == "pending",
        Crisis.accepted_by_ngo_id == None
    ).all()


def get_crises_by_ngo(db: Session, ngo_id: int) -> List[Crisis]:
    """Get all crises managed by specific NGO"""
    return db.query(Crisis).filter(
        Crisis.accepted_by_ngo_id == ngo_id
    ).all()


def accept_crisis(db: Session, crisis_id: int, ngo_id: int) -> Optional[Crisis]:
    """NGO accepts crisis"""
    crisis = get_crisis_by_id(db, crisis_id)
    if crisis and crisis.status == "pending":
        crisis.accepted_by_ngo_id = ngo_id
        crisis.status = "accepted"
        crisis.accepted_at = datetime.utcnow()
        db.commit()
        db.refresh(crisis)
        return crisis
    return None


def update_crisis_status(db: Session, crisis_id: int, new_status: str) -> Optional[Crisis]:
    """Update crisis status"""
    crisis = get_crisis_by_id(db, crisis_id)
    if crisis:
        crisis.status = new_status
        if new_status == "resolved":
            crisis.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(crisis)
        return crisis
    return None


# ============= TASK OPERATIONS =============

def create_task(
    db: Session,
    crisis_id: int,
    title: str,
    task_type: str,
    required_skill: Optional[str] = None,
    description: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    priority: int = 5
) -> Task:
    """Create new task"""
    task = Task(
        crisis_id=crisis_id,
        title=title,
        description=description,
        task_type=task_type,
        required_skill=required_skill,
        latitude=latitude,
        longitude=longitude,
        priority=priority,
        status="pending"
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    """Get task by ID"""
    return db.query(Task).filter(Task.id == task_id).first()


def assign_task(db: Session, task_id: int, volunteer_id: int) -> Optional[Task]:
    """Assign task to volunteer"""
    task = get_task_by_id(db, task_id)
    if task and task.status == "pending":
        task.volunteer_id = volunteer_id
        task.status = "assigned"
        task.assigned_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task
    return None


def update_task_status(
    db: Session,
    task_id: int,
    new_status: str,
    actual_duration: Optional[int] = None
) -> Optional[Task]:
    """Update task status"""
    task = get_task_by_id(db, task_id)
    if task:
        task.status = new_status
        
        if new_status == "in_progress":
            task.started_at = datetime.utcnow()
        elif new_status == "completed":
            task.completed_at = datetime.utcnow()
            if actual_duration:
                task.actual_duration = actual_duration
        
        db.commit()
        db.refresh(task)
        return task
    return None


def get_tasks_by_volunteer(db: Session, volunteer_id: int) -> List[Task]:
    """Get all tasks assigned to volunteer"""
    return db.query(Task).filter(
        Task.volunteer_id == volunteer_id
    ).all()


def get_tasks_by_crisis(db: Session, crisis_id: int) -> List[Task]:
    """Get all tasks for a crisis"""
    return db.query(Task).filter(Task.crisis_id == crisis_id).all()


# ============= PERFORMANCE METRICS =============

def record_metric(
    db: Session,
    entity_type: str,
    entity_id: int,
    metric_type: str,
    metric_value: float,
    crisis_id: Optional[int] = None,
    task_id: Optional[int] = None,
    metadata: Optional[dict] = None
) -> PerformanceMetric:
    """Record performance metric"""
    metric = PerformanceMetric(
        entity_type=entity_type,
        entity_id=entity_id,
        metric_type=metric_type,
        metric_value=metric_value,
        crisis_id=crisis_id,
        task_id=task_id,
        metadata=metadata
    )
    
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


def get_metrics_by_entity(
    db: Session,
    entity_type: str,
    entity_id: int,
    metric_type: Optional[str] = None
) -> List[PerformanceMetric]:
    """Get metrics for specific entity"""
    query = db.query(PerformanceMetric).filter(
        PerformanceMetric.entity_type == entity_type,
        PerformanceMetric.entity_id == entity_id
    )
    
    if metric_type:
        query = query.filter(PerformanceMetric.metric_type == metric_type)
    
    return query.all()


def get_system_metrics(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> dict:
    """Get aggregated system metrics"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Total crises
    total_crises = db.query(func.count(Crisis.id)).filter(
        Crisis.created_at >= start_date,
        Crisis.created_at <= end_date
    ).scalar()
    
    # Resolved crises
    resolved_crises = db.query(func.count(Crisis.id)).filter(
        Crisis.status == "resolved",
        Crisis.created_at >= start_date,
        Crisis.created_at <= end_date
    ).scalar()
    
    # Average response time
    avg_response = db.query(func.avg(Task.actual_duration)).filter(
        Task.status == "completed",
        Task.created_at >= start_date,
        Task.created_at <= end_date
    ).scalar()
    
    return {
        "total_crises": total_crises or 0,
        "resolved_crises": resolved_crises or 0,
        "resolution_rate": (resolved_crises / total_crises * 100) if total_crises else 0,
        "avg_response_time_minutes": float(avg_response) if avg_response else 0,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat()
    }