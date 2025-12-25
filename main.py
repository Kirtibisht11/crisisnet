"""
CrisisNet - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.communication_routes import router as communication_router

# Create FastAPI app
app = FastAPI(
    title="CrisisNet API",
    description="AI-Agent Based Crisis Response Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(communication_router)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "CrisisNet API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting CrisisNet API...")
    print("📍 API Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)