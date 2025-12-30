import requests
from datetime import datetime
from typing import Dict

# ============================================================
# 🔑 TELEGRAM BOT CONFIG
# ============================================================
BOT_TOKEN = "8EGW7WFCGERWXER952927HFV"
API = f"https://api.telegram.org/bot{BOT_TOKEN}"

# ============================================================
# 👥 IN-MEMORY USER REGISTRY
# ============================================================
VOLUNTEER_IDS = set()
CITIZEN_IDS = set()
AUTHORITY_IDS = set()

# ============================================================
# 📤 LOW LEVEL SENDER
# ============================================================
def send_telegram_message(chat_id: int, message: str):
    url = f"{API}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}
    res = requests.post(url, json=payload)
    if res.status_code != 200:
        print(f"❌ Failed to send to {chat_id}: {res.text}")
    else:
        print(f"✅ Message sent to {chat_id}")

# ============================================================
# 🧠 LOGIN / REGISTRATION HANDLER
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
    user_id, role = payload.split("_", 1)
    role = role.lower()

    if role == "citizen":
        CITIZEN_IDS.add(chat_id)
    elif role == "volunteer":
        VOLUNTEER_IDS.add(chat_id)
    elif role == "authority":
        AUTHORITY_IDS.add(chat_id)

    intro_message = (
        "✅ Connection Successful\n\n"
        "👋 Welcome to CrisisNet Alert Bot\n\n"
        f"👤 Your role: {role.capitalize()}\n\n"
        "You are now connected and will receive alerts when needed."
    )

    send_telegram_message(chat_id, intro_message)

    print({
        "user_id": user_id,
        "role": role,
        "chat_id": chat_id
    })

# ============================================================
# 🚨 MESSAGE BUILDERS
# ============================================================
def build_citizen_flood_message(zone: str):
    return (
        "⚠️ FLOOD EMERGENCY ALERT ⚠️\n\n"
        f"📍 Affected Zone: {zone}\n\n"
        "Evacuate to higher ground and avoid flooded roads.\n"
        "Follow official instructions."
    )

def build_volunteer_flood_message(zone: str):
    return (
        "🚨 VOLUNTEER DEPLOYMENT ALERT 🚨\n\n"
        f"📍 Deployment Zone: {zone}\n\n"
        "Report immediately and assist with evacuation."
    )

# ============================================================
# 🚨 ALERT SENDER
# ============================================================
def send_flood_alert(zone: str):
    print("\n📢 Sending FLOOD alerts...")
    print(f"🕒 {datetime.now()}  Zone: {zone}")

    for cid in CITIZEN_IDS:
        send_telegram_message(cid, build_citizen_flood_message(zone))

    for vid in VOLUNTEER_IDS:
        send_telegram_message(vid, build_volunteer_flood_message(zone))

    for aid in AUTHORITY_IDS:
        send_telegram_message(aid, f"📢 Flood reported in {zone}. Monitoring in progress.")

# ============================================================
# 🔔 BACKEND ENTRYPOINT (used by Resource Agent)
# ============================================================
def notify(allocation: Dict):
    try:
        crisis = allocation.get("crisis", {})
        zone = crisis.get("location", "Unknown Zone")
        ctype = crisis.get("type", "other").lower()

        print(f"[Communication] Crisis detected: {ctype} @ {zone}")

        if ctype == "flood":
            send_flood_alert(zone)
        else:
            for cid in CITIZEN_IDS:
                send_telegram_message(cid, f"⚠️ Crisis detected in {zone}. Please stay alert.")
            for vid in VOLUNTEER_IDS:
                send_telegram_message(vid, f"🚨 Crisis response needed in {zone}.")

    except Exception as e:
        print(f"[Communication] Failed to notify: {e}")

# ============================================================
# 👂 LONG POLLING LISTENER (for Telegram login)
# ============================================================
def listen():
    offset = 0
    print("🤖 Telegram bot listening...")
    while True:
        res = requests.get(f"{API}/getUpdates", params={"offset": offset}).json()
        for update in res.get("result", []):
            offset = update["update_id"] + 1
            if "message" in update:
                handle_start(update["message"])

# ============================================================
# ▶️ RUN BOT
# ============================================================
if __name__ == "__main__":
    listen()