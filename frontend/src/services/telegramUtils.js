/**
 * Telegram Integration Utils
 * Connects users to Telegram bot for receiving crisis alerts
 */

export function connectTelegram(userId, role) {
  const BOT_USERNAME = "crisisnet_alert_bot";
  const telegramUrl = `https://t.me/${BOT_USERNAME}?start=${userId}_${role}`;
  window.open(telegramUrl, "_blank");
}

export function promptTelegramConnection(user) {
  const shouldConnect = window.confirm(
    `Enable Telegram notifications for alerts?\n\nYou (${user.username || user.user_id}) will receive real-time crisis alerts via Telegram.`
  );
  if (shouldConnect) {
    connectTelegram(user.user_id || user.username, user.role || "citizen");
  }
}
