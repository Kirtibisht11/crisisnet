from fastapi import APIRouter, HTTPException
from backend.agents.learning.learning_agent import agent as learning_agent

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.get("/status")
def get_learning_status():
    """Returns the current status of the learning module."""
    return learning_agent.get_status()


@router.get("/performance")
def get_learning_performance():
    """Returns performance metrics for the learning system."""
    return learning_agent.get_system_performance()


@router.get("/report")
def get_learning_report(days: int = 30):
    """Generates a comprehensive learning report."""
    return learning_agent.generate_learning_report(days=days)