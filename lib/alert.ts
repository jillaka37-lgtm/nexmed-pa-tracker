/**
 * Sends a server-error alert to a Telegram chat via bot API.
 * No-ops silently if TELEGRAM_BOT_TOKEN / TELEGRAM_ALERT_CHAT_ID aren't set,
 * so this never becomes a second point of failure.
 */
export async function alertError(input: {
  route: string;
  message: string;
  userId?: string | null;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    "🚨 NexMed server error",
    `Route: ${input.route}`,
    `User: ${input.userId ?? "unauthenticated"}`,
    `Error: ${input.message}`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // Alerting must never throw into the caller's error path.
  }
}
