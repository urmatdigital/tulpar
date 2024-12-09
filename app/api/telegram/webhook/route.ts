import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    // Проверяем секрет webhook
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 },
      );
    }

    const update = await request.json();
    const result = await handleTelegramUpdate(update);

    if (result.error) {
      console.error("Error handling Telegram update:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in webhook route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Верификация webhook от Telegram
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
