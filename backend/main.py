from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
<<<<<<< HEAD
from backend.api import learning
from .db.database import init_db, close_db
=======
from .db.database import ensure_db_initialized
>>>>>>> 081013c4b297c7d47595fa443d899e4c2dde6ea1
from .api.users import router as users_router
from .api.crisis import router as crisis_router
from .api.trust_routes import router as trust_router
from .api.alert_routes import router as alert_router
from .api.auth import router as auth_router
from .api.geo import router as geo_router
from .api.volunteer import router as volunteer_router
from .api.assignments import router as assignments_router
from .api.notify import router as notify_router
from .api.system import router as system_router
from .api.simulate import router as simulate_router
from .api.orchestrator import router as orchestrator_router
from .api.resource_routes import router as resource_api_router
from .api.ngo_routes import router as ngo_router
from .api.analytics_routes import router as analytics_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrisisNet - Disaster Alert System",
    description="Real-time crisis alerts for citizens and volunteers",
    version="2.0.0",  
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to ensure database is initialized on first request
@app.middleware("http")
async def initialize_db_middleware(request: Request, call_next):
    ensure_db_initialized()
    response = await call_next(request)
    return response

app.include_router(users_router)
app.include_router(crisis_router)
app.include_router(alert_router)
app.include_router(trust_router)
app.include_router(auth_router)
app.include_router(geo_router)
app.include_router(volunteer_router)
app.include_router(assignments_router)
app.include_router(notify_router)
app.include_router(system_router)
app.include_router(simulate_router)
app.include_router(orchestrator_router)
app.include_router(resource_api_router)
app.include_router(ngo_router)
app.include_router(analytics_router)
<<<<<<< HEAD
app.include_router(learning.router)
logger.info("✅ NGO and Analytics routes registered")
=======
>>>>>>> 081013c4b297c7d47595fa443d899e4c2dde6ea1

logger.info("✅ All routes registered")

@app.get("/")
def root():
    return {
        "system": "CrisisNet Disaster Alert System",
        "version": "2.0.0",  
        "features": [
            "Role-based alerts",
            "Telegram notifications",
            "Database-backed storage (PostgreSQL)",
            "AI-driven insights",
            "NGO crisis management",
            "System-wide analytics",
        ],
        "database": "Connected",
        "endpoints": {
            "docs": "/docs",
            "ngo": "/ngo",
            "analytics": "/analytics",
        }
    }

@app.get("/health")
async def health_check():
    """Database and system health check"""
    from .db.database import SessionLocal
    
    try:
        db = SessionLocal()
        # Test database connection
        db.execute("SELECT 1")
        db.close()
        
        return {
            "status": "healthy",
            "database": "connected ✅",
            "version": "2.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": f"error: {str(e)}",
            "version": "2.0.0"
        }

# For local development only
if __name__ == "__main__":
    import uvicorn
<<<<<<< HEAD
    logger.info(" CrisisNet Round 2 backend starting...")
    logger.info("Database: SQLite/PostgreSQL")
    logger.info("WebSocket: Enabled")
    logger.info(" Learning Agent: Active")
=======
    logger.info("🚀 CrisisNet backend starting...")
    logger.info("📊 Database: SQLite/PostgreSQL")
    logger.info("🤖 Learning Agent: Active")
>>>>>>> 081013c4b297c7d47595fa443d899e4c2dde6ea1
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)