from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import ONLY your routers
from api.trust_routes import router as trust_router
from api.alert_routes import router as alert_router

app = FastAPI(title="CrisisNet – Dev Test")

# CORS (for frontend testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include ONLY your routes
app.include_router(trust_router)
app.include_router(alert_router)

@app.get("/")
def root():
    return {"status": "dev server running"}
