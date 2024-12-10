import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, validateEnvVariables } from "@/lib/env";
import { verifyCode } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    // Проверяем наличие всех необходимых переменных окружения
    validateEnvVariables();

    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and code are required" },
        { status: 400 },
      );
    }

    const { supabaseUrl, supabaseKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Проверяем код верификации
    const isValid = await verifyCode(supabase, phone, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Обновляем статус верификации пользователя
    const { error: updateError } = await supabase
      .from("users")
      .update({ phone_verified: true })
      .eq("phone", phone);

    if (updateError) {
      console.error("Error updating user verification status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user verification status" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in verify-code route:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 },
    );
  }
}
