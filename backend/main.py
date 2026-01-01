from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routers
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
from .api.auth import router as auth_router


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CrisisNet - Disaster Alert System",
    description="Real-time crisis alerts for citizens and volunteers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(crisis_router)
app.include_router(alert_router)      # /api/alerts, /api/mock-scenarios
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
app.include_router(auth_router)
@app.get("/")
def root():
    return {
        "system": "CrisisNet Disaster Alert System",
        "version": "1.0.0",
        "description": "Real-time alerts for citizens and volunteers during disasters",
        "endpoints": {
            "register": "POST /users/register",
            "detect_crisis": "POST /crisis/detect",
            "user_stats": "GET /users/stats",
            "active_crises": "GET /crisis/active"
        },
        "features": [
            "User registration (citizens/volunteers/authorities)",
            "Location-based crisis detection",
            "Role-based alert messaging",
            "Bulk WhatsApp notifications",
            "Real-time coordination"
        ]
    }

@app.get("/demo-setup")
def demo_setup():
    """Setup demo data"""
    import json
    import os
    
    users_file = "users.json"
    
    demo_users = [
        {
            'user_id': 'demo_citizen_1',
            'phone': '+917500900626',  # Your number
            'name': 'Demo Citizen',
            'role': 'citizen',
            'latitude': 28.6139,
            'longitude': 77.2090,
            'is_active': True
        },
        {
            'user_id': 'demo_volunteer_1',
            'phone': '+917500900626',
            'name': 'Demo Volunteer',
            'role': 'volunteer',
            'latitude': 28.6140,
            'longitude': 77.2091,
            'is_active': True
        },
        {
            'user_id': 'demo_authority_1',
            'phone': '+917500900626',
            'name': 'Demo Authority',
            'role': 'authority',
            'latitude': 28.6150,
            'longitude': 77.2100,
            'is_active': True
        }
    ]
    
    data = {"users": demo_users}
    with open(users_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    
    return {
        "message": "Demo data created",
        "users_added": len(demo_users),
        "test_phone": "+917500900626",
        "note": "All demo users use your phone number for testing"
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 60)
    logger.info("CRISISNET - DISASTER ALERT SYSTEM")
    logger.info("=" * 60)
    logger.info("Messaging: WhatsApp via pywhatkit")
    logger.info("Features: Location-based alerts")
    logger.info("Roles: Citizens, Volunteers, Authorities")
    logger.info("API: http://localhost:8000/docs")
    logger.info("Demo: http://localhost:8000/demo-setup")
    logger.info("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)