import requests
from datetime import datetime

# ============================================================
# 🔑 TELEGRAM BOT CONFIG
# ============================================================

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk"

# ============================================================
# 👥 DEMO USERS (HARDCODED FOR HACKATHON)
# ============================================================

# 👉 (VOLUNTEER)
VOLUNTEER_IDS = [
    7526773581   # <-- voul id 
]

# 👉 (Citizen ids)
CITIZEN_IDS = [
   6381863134
]

# ============================================================
# 📤 LOW-LEVEL SENDER
# ============================================================

def send_telegram_message(chat_id: int, message: str):
    """
    Sends a Telegram message to a single user.
    """
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    payload = {
        "chat_id": chat_id,
        "text": message
    }

    response = requests.post(url, json=payload)

    if response.status_code != 200:
        print(f"❌ Failed to send to {chat_id}")
    else:
        print(f"✅ Message sent to {chat_id}")

# ============================================================
# 🧠 MESSAGE BUILDERS
# ============================================================

def build_citizen_flood_message(zone: str):
    return (
        "⚠️ FLOOD EMERGENCY ALERT ⚠️\n\n"
        f"📍 Affected Zone: {zone}\n\n"
        "🚨 A flood has been detected in your area.\n\n"
        "🛑 IMMEDIATE ACTION REQUIRED:\n"
        "• Evacuate to higher ground\n"
        "• Avoid flooded roads\n"
        "• Carry essentials only\n"
        "• Follow official instructions\n\n"
        "📞 Emergency services are active.\n"
        "Stay calm. Stay safe."
    )

def build_volunteer_flood_message(zone: str):
    return (
        "🚨 VOLUNTEER DEPLOYMENT ALERT 🚨\n\n"
        f"📍 Deployment Zone: {zone}\n\n"
        "⚠️ Flood emergency reported.\n\n"
        "🦺 YOUR TASKS:\n"
        "• Report to assigned zone immediately\n"
        "• Assist with evacuation\n"
        "• Coordinate with authorities\n"
        "• Ensure citizen safety\n\n"
        "🙏 Thank you for your service."
    )

# ============================================================
# 🚨 MAIN COMMUNICATION AGENT
# ============================================================

def send_flood_alert(zone: str):
    """
    Sends flood alerts to all citizens and volunteers.
    """
    print("\n📢 Sending FLOOD alerts...")
    print(f"🕒 Time: {datetime.now()}")
    print(f"📍 Zone: {zone}\n")

    # Send to Citizens
    for citizen_id in CITIZEN_IDS:
        message = build_citizen_flood_message(zone)
        send_telegram_message(citizen_id, message)

    # Send to Volunteers
    for volunteer_id in VOLUNTEER_IDS:
        message = build_volunteer_flood_message(zone)
        send_telegram_message(volunteer_id, message)

    print("\n✅ Flood alert process completed.")

# ============================================================
# ▶️ SCRIPT ENTRY POINT (DEMO TRIGGER)
# ============================================================

if __name__ == "__main__":
    send_flood_alert(
        zone="Zone A"
    )