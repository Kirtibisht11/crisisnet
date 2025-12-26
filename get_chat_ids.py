import requests

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk"

url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
data = requests.get(url).json()

for update in data["result"]:
    if "message" in update:
        chat = update["message"]["chat"]
        print("Name:", chat.get("first_name"))
        print("Chat ID:", chat.get("id"))
        print("------")
