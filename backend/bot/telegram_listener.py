from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

BOT_TOKEN = "8559367774:AAGGQdAD1NfZnMV61olD_lvt2nFtQX47lmk"  


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "✅ CrisisNet Bot is LIVE.\n\n"
        "You are now connected to emergency alerts."
    )


def main():
    print("🤖 Telegram listener started")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()  # 🔴 THIS LINE IS CRITICAL


if __name__ == "__main__":
    main()