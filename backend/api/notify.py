from fastapi import APIRouter
from backend.agents.communication_agent import send_telegram_message


router = APIRouter(prefix="/api/notify", tags=["notify"])

@router.post("/telegram")
def notify(payload: dict):
    send_telegram_message(payload["chat_id"], payload["message"])

    return {"success": True}
