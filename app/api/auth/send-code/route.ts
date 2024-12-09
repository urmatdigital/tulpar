import { NextResponse } from 'next/server'
import { sendVerificationCode } from '@/lib/telegram'
import { storeVerificationCode } from '@/lib/verification'

// Генерация случайного 6-значного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Генерируем код
    const code = generateVerificationCode()

    // Сохраняем код в Supabase
    await storeVerificationCode(phoneNumber, code)

    // Отправляем код через Telegram
    await sendVerificationCode(phoneNumber, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
