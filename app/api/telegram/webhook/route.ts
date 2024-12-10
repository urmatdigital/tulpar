import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, validateEnvVariables } from "@/lib/env";
import { handleTelegramUpdate } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    // Проверяем наличие всех необходимых переменных окружения
    validateEnvVariables();

    const update = await request.json();

    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Обрабатываем обновление от Telegram
    await handleTelegramUpdate(update, supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json(
      { error: "Failed to process Telegram update" },
      { status: 500 }
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
