import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { runBrainText } from "@/lib/chatbot/brain";
import { getOrCreateSession } from "@/lib/chatbot/memory";

let bot: Bot | null = null;

function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
    bot = new Bot(token);
  }
  return bot;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: {
    message?: {
      text?: string;
      chat?: { id?: number };
      from?: { first_name?: string };
    };
  };
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = update?.message?.text?.trim();
  const chatId = update?.message?.chat?.id;

  if (!text || !chatId) {
    return NextResponse.json({ ok: true });
  }

  // Respond with 200 immediately so Telegram doesn't retry
  (async () => {
    try {
      const sessionId = await getOrCreateSession({
        channel: "telegram",
        telegramChatId: chatId,
      });

      const reply = await runBrainText({
        sessionId,
        userMessage: text,
        channel: "telegram",
      });

      await getBot().api.sendMessage(chatId, reply, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("[telegram webhook] error:", err);
      try {
        await getBot().api.sendMessage(
          chatId,
          "Sorry, I encountered an issue. Please try again or contact us at hello@nexmed.com.",
        );
      } catch {
        // ignore secondary error
      }
    }
  })();

  return NextResponse.json({ ok: true });
}
