import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required" },
        { status: 400 },
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Проверяем код верификации
    const { data: verificationData, error: verificationError } = await supabase
      .from("verification_codes")
      .select()
      .eq("phone", phone)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verificationData) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    // Помечаем код как использованный
    await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", verificationData.id);

    // Получаем данные пользователя
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select()
      .eq("phone", phone)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Создаем сессию пользователя
    const { data: sessionData, error: sessionError } =
      await supabase.auth.signUp({
        email: `${userData.telegram_id}@te.kg`,
        password: process.env.SUPABASE_USER_PASSWORD + userData.telegram_id,
        phone: phone,
        options: {
          data: {
            telegram_id: userData.telegram_id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: userData.username,
            phone: phone,
          },
        },
      });

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      session: sessionData.session,
    });
  } catch (error) {
    console.error("Error in verify-code route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
