import { SupabaseClient } from "@supabase/supabase-js";

export function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function storeVerificationCode(
  supabase: SupabaseClient,
  phoneNumber: string,
  code: string
) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Код действителен 5 минут

  const { error } = await supabase.from("verification_codes").upsert({
    phone_number: phoneNumber,
    code: code,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function verifyCode(
  supabase: SupabaseClient,
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("verification_codes")
    .select()
    .eq("phone_number", phoneNumber)
    .eq("code", code)
    .single();

  if (error || !data) return false;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) return false;

  // Удаляем использованный код
  await supabase
    .from("verification_codes")
    .delete()
    .eq("phone_number", phoneNumber);

  return true;
}
