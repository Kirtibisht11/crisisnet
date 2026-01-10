from fastapi import APIRouter
# from backend.agents.communication_agent import send_flood_alert

router = APIRouter(prefix="/simulate", tags=["simulate"])

def send_flood_alert(location):
    print(f"SIMULATION: Flood alert sent to {location}")

@router.post("/crisis")
def simulate():
    send_flood_alert("Demo Zone")
    return {"status": "simulated"}
