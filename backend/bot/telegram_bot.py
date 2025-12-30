import requests

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk"
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
            payload = parts[1]           # userId_role
            user_id, role = payload.split("_", 1)

            # 🔥 THIS IS THE KEY OUTPUT
            print({
                "user_id": user_id,
                "role": role,
                "chat_id": chat_id
            })

            send(
                chat_id,
                "✅ Telegram connected successfully.\n"
                "You will now receive emergency alerts."
            )

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
