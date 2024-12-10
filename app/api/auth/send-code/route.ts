import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, validateEnvVariables } from "@/lib/env";
import { generateVerificationCode, storeVerificationCode } from "@/lib/verification";
import { sendVerificationCode } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    // Проверяем наличие всех необходимых переменных окружения
    validateEnvVariables();

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Проверяем существование пользователя
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("phone", phone)
      .single();

    if (userError || !user?.telegram_id) {
      return NextResponse.json(
        { error: "User not found or Telegram not connected" },
        { status: 404 },
      );
    }

    // Генерируем код верификации
    const code = generateVerificationCode();

    // Сохраняем код в базе данных
    await storeVerificationCode(supabase, phone, code);

    // Отправляем код через Telegram
    const sent = await sendVerificationCode(user.telegram_id.toString(), code);
    
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-code route:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 },
    );
  }
}
