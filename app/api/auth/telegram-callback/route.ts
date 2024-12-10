import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const telegramData = requestUrl.searchParams.get("tgAuthResult");

  if (!telegramData) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=telegram_auth_failed`,
    );
  }

  try {
    // Декодируем и проверяем данные от Telegram
    const decodedData = JSON.parse(
      Buffer.from(telegramData, "base64").toString(),
    );

    // Здесь нужно добавить проверку hash от Telegram

    // Проверяем существование пользователя
    const { data: existingUser } = await supabase
      .from("users")
      .select()
      .eq("telegram_id", decodedData.id)
      .single();

    if (!existingUser) {
      // Создаем нового пользователя
      const { error: insertError } = await supabase.from("users").insert({
        telegram_id: decodedData.id,
        full_name:
          `${decodedData.first_name} ${decodedData.last_name || ""}`.trim(),
        role: "client",
      });

      if (insertError) throw insertError;
    }

    // Создаем сессию для пользователя
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${decodedData.id}@telegram.user`,
      password: process.env.TELEGRAM_USER_SECRET + decodedData.id,
    });

    if (signInError) throw signInError;

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error("Telegram authentication error:", error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=telegram_auth_failed`,
    );
  }
}
