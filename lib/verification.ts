import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeVerificationCode(phoneNumber: string, code: string) {
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
  phoneNumber: string,
  code: string,
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
