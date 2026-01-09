"""
Communication Agent
-------------------
Responsible for sending alerts via:
1. Telegram (existing)
2. WebSockets (NEW - for frontend dashboards)
"""

import requests
from datetime import datetime
from typing import Dict

# 🔥 NEW
from backend.ws.events import EventType, build_event
from backend.main import manager   # shared WebSocket manager


# ============================================================
# 🔑 TELEGRAM BOT CONFIG
# ============================================================
BOT_TOKEN = "8EGW7WFCGERWXER952927HFV"
API = f"https://api.telegram.org/bot{BOT_TOKEN}"


# ============================================================
# 👥 IN-MEMORY USER REGISTRY (Telegram)
# ============================================================
VOLUNTEER_IDS = set()
CITIZEN_IDS = set()
AUTHORITY_IDS = set()


# ============================================================
# 📤 TELEGRAM SENDER
# ============================================================
def send_telegram_message(chat_id: int, message: str):
    url = f"{API}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"❌ Telegram send failed: {e}")


# ============================================================
# 🧠 TELEGRAM LOGIN HANDLER
# ============================================================
def handle_start(message: Dict):
    chat_id = message["chat"]["id"]
    text = message.get("text", "")

    if not text.startswith("/start"):
        return

    parts = text.split()
    if len(parts) != 2:
        send_telegram_message(chat_id, "Usage: /start <userId_role>")
        return

    payload = parts[1]
    _, role = payload.split("_", 1)
    role = role.lower()

    if role == "citizen":
        CITIZEN_IDS.add(chat_id)
    elif role == "volunteer":
        VOLUNTEER_IDS.add(chat_id)
    elif role == "authority":
        AUTHORITY_IDS.add(chat_id)

    send_telegram_message(
        chat_id,
        f"✅ CrisisNet connected\nRole: {role.capitalize()}\nYou will receive alerts."
    )


# ============================================================
# 🧱 MESSAGE BUILDERS
# ============================================================
def build_flood_message(role: str, zone: str):
    if role == "citizen":
        return (
            "⚠️ FLOOD ALERT\n\n"
            f"📍 Area: {zone}\n\n"
            "Move to higher ground and follow instructions."
        )

    if role == "volunteer":
        return (
            "🚨 VOLUNTEER ALERT\n\n"
            f"📍 Deployment Zone: {zone}\n\n"
            "Report immediately."
        )

    return f"📢 Flood reported in {zone}. Monitoring ongoing."


# ============================================================
# 🔔 MAIN ENTRYPOINT (USED BY OTHER AGENTS)
# ============================================================
async def notify(allocation: Dict):
    """
    Called when a crisis is verified / assigned.
    Sends alerts via:
    - Telegram
    - WebSocket (NEW)
    """

    crisis = allocation.get("crisis", {})
    zone = crisis.get("location", "Unknown Zone")
    ctype = crisis.get("type", "other").lower()

    print(f"[CommunicationAgent] Crisis: {ctype} @ {zone}")

    # =====================
    # 1️⃣ TELEGRAM ALERTS
    # =====================
    for cid in CITIZEN_IDS:
        send_telegram_message(cid, build_flood_message("citizen", zone))

    for vid in VOLUNTEER_IDS:
        send_telegram_message(vid, build_flood_message("volunteer", zone))

    for aid in AUTHORITY_IDS:
        send_telegram_message(aid, f"📢 Crisis detected in {zone}")

    # =====================
    # 2️⃣ 🔥 WEBSOCKET EVENT
    # =====================
    event = build_event(
        event_type=EventType.NEW_CRISIS,
        payload={
            "type": ctype,
            "location": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "CommunicationAgent"
        },
        target="all"
    )

    # Broadcast to dashboards
    await manager.broadcast(event)


# ============================================================
# 👂 TELEGRAM LONG POLLING (UNCHANGED)
# ============================================================
def listen():
    offset = 0
    print("🤖 Telegram bot listening...")

    while True:
        try:
            res = requests.get(f"{API}/getUpdates", params={"offset": offset}).json()
            for update in res.get("result", []):
                offset = update["update_id"] + 1
                if "message" in update:
                    handle_start(update["message"])
        except Exception as e:
            print("Telegram polling error:", e)
