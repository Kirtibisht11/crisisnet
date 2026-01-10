from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

# =========================
# 🆕 DATABASE IMPORTS (Round 2)
# =========================
from .db.database import init_db, close_db

# =========================
# API Routers (Existing)
# =========================
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

# =========================
# 🆕 NEW API ROUTERS (Round 2)
# =========================
from .api.ngo_routes import router as ngo_router
from .api.analytics_routes import router as analytics_router

# =========================
# WebSocket Manager
# =========================
from .ws.connection_manager import ConnectionManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrisisNet - Disaster Alert System",
    description="Real-time crisis alerts for citizens and volunteers",
    version="2.0.0",  # 🆕 Updated to v2.0.0 for Round 2
)

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 🆕 DATABASE LIFECYCLE (Round 2)
# =========================
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
        logger.info("📊 Tables created: users, crises, tasks, volunteer_performance, system_metrics")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    try:
        close_db()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Database shutdown error: {e}")

# =========================
# Register Routers (Existing)
# =========================
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

# =========================
# 🆕 Register NEW Routers (Round 2)
# =========================
app.include_router(ngo_router)
app.include_router(analytics_router)
logger.info("✅ NGO and Analytics routes registered")

# =========================
# WebSocket Manager Instance
# =========================
manager = ConnectionManager()

# =========================
# WebSocket Endpoint
# =========================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, role: str = "citizen"):
    """
    WebSocket endpoint for frontend real-time updates
    Example: ws://localhost:8000/ws?role=citizen
    """
    await manager.connect(websocket, role)
    logger.info(f"🔌 WebSocket connected | Role: {role}")

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, role)
        logger.info(f"❌ WebSocket disconnected | Role: {role}")

# =========================
# Root Endpoint
# =========================
@app.get("/")
def root():
    return {
        "system": "CrisisNet Disaster Alert System",
        "version": "2.0.0",  # 🆕 Round 2
        "features": [
            "Role-based alerts",
            "Telegram + WebSocket notifications",
            "Real-time dashboards",
            "🆕 Database-backed storage (PostgreSQL/SQLite)",
            "🆕 Learning Agent (AI-driven insights)",
            "🆕 NGO crisis management",
            "🆕 System-wide analytics",
        ],
        "database": "Connected ✅",
        "endpoints": {
            "docs": "/docs",
            "ngo": "/ngo",
            "analytics": "/analytics",
            "websocket": "ws://localhost:8000/ws"
        }
    }

# =========================
# 🆕 Health Check Endpoint (Round 2)
# =========================
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

# =========================
# Run Server
# =========================
if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 CrisisNet Round 2 backend starting...")
    logger.info("📊 Database: SQLite/PostgreSQL")
    logger.info("🔌 WebSocket: Enabled")
    logger.info("🤖 Learning Agent: Active")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)