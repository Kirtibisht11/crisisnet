from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/learning", tags=["learning"])

@router.get("/status")
async def get_learning_status():
    return {
        "status": "active",
        "model_version": "v2.1.0",
        "last_training": datetime.utcnow().isoformat(),
        "accuracy": 0.94,
        "active_models": ["severity_estimator", "event_classifier", "trust_scorer"]
    }

@router.get("/performance")
async def get_learning_performance():
    return {
        "accuracy": 0.94,
        "precision": 0.92,
        "recall": 0.96,
        "f1_score": 0.94,
        "training_samples": 15420,
        "validation_samples": 3200,
        "history": [
            {"date": "2023-10-23", "accuracy": 0.91},
            {"date": "2023-10-24", "accuracy": 0.92},
            {"date": "2023-10-25", "accuracy": 0.93},
            {"date": "2023-10-26", "accuracy": 0.94}
        ]
    }