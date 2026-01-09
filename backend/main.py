from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

# =========================
# API Routers
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
# 🔥 NEW: WebSocket Manager
# =========================
from .ws.connection_manager import ConnectionManager

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrisisNet - Disaster Alert System",
    description="Real-time crisis alerts for citizens and volunteers",
    version="1.0.0",
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
# Register Routers
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
# 🔥 NEW: WebSocket Manager Instance
# =========================
manager = ConnectionManager()

# =========================
# 🔥 NEW: WebSocket Endpoint
# =========================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, role: str = "citizen"):
    """
    WebSocket endpoint for frontend real-time updates
    Example:
    ws://localhost:8000/ws?role=citizen
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
        "version": "1.0.0",
        "features": [
            "Role-based alerts",
            "Telegram + WebSocket notifications",
            "Real-time dashboards",
        ]
    }

# =========================
# Run Server
# =========================
if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 CrisisNet backend running")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
