import requests

BOT_TOKEN = "8EGW7WFCGERWXER952927HFV"
API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send(chat_id, text):
    requests.post(f"{API}/sendMessage", json={
        "chat_id": chat_id,
        "text": text
    })

def handle_start(message):
    chat_id = message["chat"]["id"]
    text = message.get("text", "")

    if text.startswith("/start"):
        parts = text.split()

        if len(parts) == 2:
            payload = parts[1]              # userId_role
            user_id, role = payload.split("_", 1)

            # 🔐 CONNECTION CONFIRMATION + INTRO
            intro_message = (
                "✅ *Connection Successful*\n\n"
                "👋 Welcome to *CrisisNet Alert Bot*\n\n"
                "This bot delivers *verified disaster alerts* in real time.\n\n"
                f"👤 *Your role:* {role.capitalize()}\n\n"
            )

            if role == "citizen":
                intro_message += (
                    "You will receive:\n"
                    "• ⚠️ Emergency warnings\n"
                    "• 🧭 Evacuation & safety instructions\n\n"
                )

            elif role == "volunteer":
                intro_message += (
                    "You will receive:\n"
                    "• 🚨 Deployment alerts\n"
                    "• 🦺 Rescue & response instructions\n\n"
                )

            elif role == "authority":
                intro_message += (
                    "You will receive:\n"
                    "• 📢 Incident confirmations\n"
                    "• 🛡️ Authority-level notifications\n\n"
                )

            intro_message += (
                "🔔 Alerts are sent *only during emergencies*.\n"
                "🛡️ No spam. No false alarms.\n\n"
                "You are now connected. Stay alert. Stay safe 🤝"
            )

            send(chat_id, intro_message)

            # Optional: log for backend use
            print({
                "user_id": user_id,
                "role": role,
                "chat_id": chat_id
            })

def listen():
    offset = 0
    while True:
        res = requests.get(f"{API}/getUpdates", params={"offset": offset}).json()
        for update in res.get("result", []):
            offset = update["update_id"] + 1
            if "message" in update:
                handle_start(update["message"])

if __name__ == "__main__":
    listen()