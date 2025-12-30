from fastapi import APIRouter
from backend.agents.communication_agent import send_flood_alert

router = APIRouter(prefix="/simulate", tags=["simulate"])

@router.post("/crisis")
def simulate():
    send_flood_alert("Demo Zone")
    return {"status": "simulated"}
