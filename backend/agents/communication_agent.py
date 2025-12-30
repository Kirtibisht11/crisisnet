import requests
from datetime import datetime

# ======================================================
# 🔑 TELEGRAM CONFIG
# ======================================================

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk"
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

# ======================================================
# 👤 CURRENT CONNECTED USER (TEMP / SESSION)
# ======================================================
# This data comes from telegram_bot.py after /start

current_user = {
    "role": "citizen",        # citizen | volunteer | authority
    "chat_id": 987654321      # <-- TELEGRAM CHAT ID
}

# ======================================================
# 📤 LOW-LEVEL SENDER
# ======================================================

def send_message(chat_id, message):
    payload = {
        "chat_id": chat_id,
        "text": message
    }
    requests.post(TELEGRAM_API, json=payload)

# ======================================================
# 🧠 MESSAGE TEMPLATES
# ======================================================

def citizen_alert(disaster, zone):
    return (
        f"⚠️ {disaster.upper()} ALERT ⚠️\n\n"
        f"📍 Location: {zone}\n\n"
        "Please evacuate immediately.\n"
        "Avoid flooded or damaged areas.\n"
        "Follow official safety instructions.\n\n"
        "🛡️ Stay safe."
    )

def volunteer_alert(disaster, zone):
    return (
        f"🚨 VOLUNTEER ALERT 🚨\n\n"
        f"{disaster} reported in {zone}\n\n"
        "🦺 Report immediately for rescue operations.\n"
        "Coordinate with authorities.\n\n"
        "🙏 Thank you for your service."
    )

def authority_alert(disaster, zone):
    return (
        f"📢 AUTHORITY NOTICE 📢\n\n"
        f"{disaster} confirmed in {zone}\n\n"
        "You are authorized to issue public alerts\n"
        "and coordinate emergency response."
    )

# ======================================================
# 🚨 CORE COMMUNICATION LOGIC
# ======================================================

def send_alert(disaster, zone):
    role = current_user["role"]
    chat_id = current_user["chat_id"]

    print(f"\n📢 Sending alert at {datetime.now()}")
    print(f"👤 Role: {role} | 📍 Zone: {zone}")

    if role == "citizen":
        send_message(chat_id, citizen_alert(disaster, zone))

    elif role == "volunteer":
        send_message(chat_id, volunteer_alert(disaster, zone))

    elif role == "authority":
        send_message(chat_id, authority_alert(disaster, zone))

    else:
        print("❌ Unknown role")

    print("✅ Alert sent successfully")

# ======================================================
# ▶️ DEMO TRIGGER
# ======================================================

if __name__ == "__main__":
    send_alert(
        disaster="Flood",
        zone="Zone A"
    )
