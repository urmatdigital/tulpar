import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyCode } from '@/lib/verification'

export async function POST(request: Request) {
  try {
    const { phoneNumber, code, password } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Проверяем код
    const isValid = await verifyCode(phoneNumber, code)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Создаем или обновляем пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        phone_number: phoneNumber,
        password_hash: password, // В реальном приложении нужно хешировать пароль
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
