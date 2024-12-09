import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function storeVerificationCode(
  phoneNumber: string,
  code: string,
  telegramChatId?: number
) {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10) // Код действителен 10 минут

  const { data, error } = await supabase
    .from('verification_codes')
    .insert({
      phone_number: phoneNumber,
      code: code,
      telegram_chat_id: telegramChatId,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function verifyCode(phoneNumber: string, code: string) {
  const { data, error } = await supabase
    .from('verification_codes')
    .select()
    .eq('phone_number', phoneNumber)
    .eq('code', code)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) return false

  if (data) {
    // Помечаем код как использованный
    await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', data.id)

    return true
  }

  return false
}

export async function getTelegramBinding(chatId: number) {
  const { data, error } = await supabase
    .from('verification_codes')
    .select('phone_number')
    .eq('telegram_chat_id', chatId)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) return null
  return data?.phone_number
}
