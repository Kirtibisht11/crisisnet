import requests
import os

# =====================================================
# 🔑 TELEGRAM CONFIG
# =====================================================

BOT_TOKEN = "8EGW7WFCGERWXER952927HFV"

if not BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN environment variable not set")

API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

# =====================================================
# 📤 LOW-LEVEL TELEGRAM SENDER
# =====================================================

def send_message(chat_id: int, text: str):
    """
    Sends a Telegram message to a specific chat_id.
    Safe to be called from any backend agent.
    """
    requests.post(
        API_URL,
        json={
            "chat_id": chat_id,
            "text": text
        },
        timeout=5
    )

# =====================================================
# 👋 INTRO / CONNECTION CONFIRMATION
# =====================================================

def send_intro(chat_id: int, role: str):
    """
    Called ONCE when user connects Telegram after login/signup.
    Confirms setup and explains bot purpose.
    """

    intro = (
        "✅ Connection Successful\n\n"
        "👋 Welcome to CrisisNet Alert Bot\n\n"
        "This bot delivers verified disaster alerts in real time.\n\n"
        f"👤 Your role: {role.capitalize()}\n\n"
    )

    if role == "citizen":
        intro += (
            "You will receive:\n"
            "• ⚠️ Emergency warnings\n"
            "• 🧭 Evacuation & safety instructions\n\n"
        )

    elif role == "volunteer":
        intro += (
            "You will receive:\n"
            "• 🚨 Deployment alerts\n"
            "• 🦺 Rescue & response instructions\n\n"
        )

    elif role == "authority":
        intro += (
            "You will receive:\n"
            "• 📢 Incident confirmations\n"
            "• 🛡️ Authority-level notifications\n\n"
        )

    intro += (
        "🔔 Alerts are sent only during emergencies.\n"
        "🛡️ No spam. No false alarms.\n\n"
        "Setup is complete. Stay alert. Stay safe 🤝"
    )

    send_message(chat_id, intro)

# =====================================================
# 🧠 ALERT MESSAGE TEMPLATES
# =====================================================

def citizen_alert(disaster: str, zone: str) -> str:
    return (
        f"⚠️ {disaster.upper()} ALERT ⚠️\n\n"
        f"📍 Location: {zone}\n\n"
        "Please evacuate immediately.\n"
        "Avoid dangerous areas.\n"
        "Follow official instructions.\n\n"
        "🛡️ Stay safe."
    )

def volunteer_alert(disaster: str, zone: str) -> str:
    return (
        f"🚨 VOLUNTEER ALERT 🚨\n\n"
        f"{disaster} reported in {zone}.\n\n"
        "🦺 Report immediately for rescue operations.\n"
        "Coordinate with authorities.\n\n"
        "🙏 Thank you for your service."
    )

def authority_alert(disaster: str, zone: str) -> str:
    return (
        f"📢 AUTHORITY NOTICE 📢\n\n"
        f"{disaster} confirmed in {zone}.\n\n"
        "You are authorized to issue public alerts\n"
        "and coordinate emergency response."
    )

# =====================================================
# 🔔 PUBLIC ALERT FUNCTION (USED BY OTHER AGENTS)
# =====================================================

def notify(role: str, chat_id: int, disaster: str, zone: str):
    """
    Called by other agents (resource, trust, detection, etc.)
    to send emergency alerts.
    """

    if role == "citizen":
        message = citizen_alert(disaster, zone)

    elif role == "volunteer":
        message = volunteer_alert(disaster, zone)

    elif role == "authority":
        message = authority_alert(disaster, zone)

    else:
        return  # unknown role, fail safely

    send_message(chat_id, message)