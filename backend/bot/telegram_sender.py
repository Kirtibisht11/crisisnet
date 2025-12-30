import requests

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk" 
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"


def send_message(chat_id: int, text: str):
    requests.post(
        API_URL,
        json={
            "chat_id": chat_id,
            "text": text
        },
        timeout=5
    )


def send_intro(chat_id: int, role: str):
    intro = (
        "✅ Connection Successful\n\n"
        "👋 Welcome to CrisisNet Alert Bot\n\n"
        f"👤 Role: {role.capitalize()}\n\n"
        "You will receive verified emergency alerts.\n\n"
        "Stay alert. Stay safe."
    )
    send_message(chat_id, intro)


def notify(role: str, chat_id: int, disaster: str, zone: str):
    if role == "citizen":
        msg = f"⚠️ {disaster.upper()} ALERT\n📍 Zone: {zone}\nEvacuate immediately."
    elif role == "volunteer":
        msg = f"🚨 VOLUNTEER ALERT\n{disaster} in {zone}\nReport immediately."
    elif role == "authority":
        msg = f"📢 AUTHORITY NOTICE\n{disaster} confirmed in {zone}"
    else:
        return

    send_message(chat_id, msg)