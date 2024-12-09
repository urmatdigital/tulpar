import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Сохраняем код и телефон в Supabase
    const { error: dbError } = await supabase
      .from("verification_codes")
      .insert([
        {
          phone,
          code,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 минут
        },
      ]);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save verification code" },
        { status: 500 },
      );
    }

    // Отправляем код через Telegram
    await sendTelegramMessage(
      `Ваш код подтверждения: ${code}\nДействителен 15 минут.`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-code route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
