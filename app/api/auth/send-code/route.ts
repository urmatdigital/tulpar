import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";
import { generateVerificationCode } from "@/lib/verification";
import { sendVerificationCode } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Быстрая проверка пользователя
    const { data: user } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("phone", phone)
      .single();

    if (!user?.telegram_id) {
      return NextResponse.json(
        { error: "Telegram not connected" },
        { status: 404 },
      );
    }

    // Генерируем и отправляем код
    const code = generateVerificationCode();
    
    // Параллельно выполняем сохранение кода и отправку сообщения
    const [sent] = await Promise.all([
      sendVerificationCode(user.telegram_id.toString(), code),
      supabase.from("verification_codes").upsert({
        phone_number: phone,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error("Error storing code:", error);
      })
    ]);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send code" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 },
    );
  }
}
