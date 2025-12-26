import requests
import json

BOT_TOKEN = "PASTE_YOUR_BOT_TOKEN"
USERS_FILE = "backend/data/users.json"

def load_users():
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def handle_updates():
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
    data = requests.get(url).json()

    users = load_users()

    for update in data["result"]:
        if "message" in update:
            chat_id = update["message"]["chat"]["id"]
            name = update["message"]["chat"]["first_name"]

            for user in users:
                if user["name"] == name and user["chat_id"] == 0:
                    user["chat_id"] = chat_id

    save_users(users)
    print("✅ Users updated")

if __name__ == "__main__":
    handle_updates()