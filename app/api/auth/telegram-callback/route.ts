import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, validateEnvVariables } from "@/lib/env";

export async function GET(request: Request) {
  try {
    // Проверяем наличие всех необходимых переменных окружения
    validateEnvVariables();

    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    
    // Получаем данные от Telegram
    const telegramData = {
      id: params.get("id"),
      first_name: params.get("first_name"),
      username: params.get("username"),
      auth_date: params.get("auth_date"),
      hash: params.get("hash")
    };

    // Проверяем наличие всех необходимых параметров
    if (!telegramData.id || !telegramData.auth_date || !telegramData.hash) {
      return NextResponse.json(
        { error: "Missing required Telegram parameters" },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select()
      .eq("telegram_id", telegramData.id)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking existing user:", userError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (!existingUser) {
      // Создаем нового пользователя
      const { error: createError } = await supabase
        .from("users")
        .insert([{
          telegram_id: telegramData.id,
          first_name: telegramData.first_name || "",
          username: telegramData.username || "",
          auth_date: new Date(parseInt(telegramData.auth_date) * 1000).toISOString(),
          role: "user"
        }]);

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    } else {
      // Обновляем данные существующего пользователя
      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: telegramData.first_name || existingUser.first_name,
          username: telegramData.username || existingUser.username,
          auth_date: new Date(parseInt(telegramData.auth_date) * 1000).toISOString()
        })
        .eq("telegram_id", telegramData.id);

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }
    }

    // Получаем URL для редиректа из переменных окружения
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing APP_URL configuration" },
        { status: 500 }
      );
    }

    // Перенаправляем на главную страницу
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error("Error in telegram-callback route:", error);
    return NextResponse.json(
      { error: "Failed to process Telegram callback" },
      { status: 500 }
    );
  }
}
