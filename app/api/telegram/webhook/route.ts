import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getTelegramBinding } from '@/lib/verification'
import { sendWelcomeMessage } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const update = await request.json()
    const chatId = update.message?.chat?.id

    if (!chatId) {
      return NextResponse.json({ ok: true })
    }

    // Обработка команды /start
    if (update.message?.text === '/start') {
      await sendWelcomeMessage(chatId)
      return NextResponse.json({ ok: true })
    }

    // Проверяем привязку к номеру телефона
    const phoneNumber = await getTelegramBinding(chatId)
    if (phoneNumber) {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Обновляем telegram_chat_id в таблице users
      await supabase
        .from('users')
        .update({ telegram_chat_id: chatId })
        .eq('phone_number', phoneNumber)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// Верификация webhook от Telegram
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
