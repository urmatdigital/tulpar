'use client'

import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Input } from "@nextui-org/input"
import { Button } from "@nextui-org/button"
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginForm() {
  const [isRegistration, setIsRegistration] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+996\d{9}$/
    return phoneRegex.test(phone)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${phone}@te.kg`, // Используем телефон как часть email
        password,
      })

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error logging in:', error)
      // Добавить обработку ошибок
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!validatePhone(phone)) {
        throw new Error('Неверный формат номера телефона')
      }

      // Здесь нужно отправить запрос к вашему API для отправки кода через Telegram бот
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      if (!response.ok) {
        throw new Error('Ошибка отправки кода')
      }

      // Перенаправляем на страницу подтверждения кода
      router.push(`/auth/verify?phone=${encodeURIComponent(phone)}`)
    } catch (error) {
      console.error('Error starting registration:', error)
      // Добавить обработку ошибок
    } finally {
      setIsLoading(false)
    }
  }

  const handleTelegramAuth = (user: any) => {
    console.log('Telegram auth:', user)
    // Здесь будет логика для аутентификации через Telegram
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 p-6">
        <h1 className="text-2xl font-bold">
          {isRegistration ? 'Регистрация' : 'Вход в систему'}
        </h1>
        <p className="text-default-500">
          {isRegistration 
            ? 'Введите номер телефона для регистрации' 
            : 'Войдите, используя номер телефона и пароль'}
        </p>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={isRegistration ? handleRegistrationStart : handleLogin} className="space-y-4">
          <Input
            type="tel"
            label="Номер телефона"
            placeholder="+996XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {!isRegistration && (
            <Input
              type="password"
              label="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <Button
            type="submit"
            color="primary"
            isLoading={isLoading}
            className="w-full"
          >
            {isRegistration ? 'Получить код' : 'Войти'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            variant="light"
            onPress={() => setIsRegistration(!isRegistration)}
          >
            {isRegistration 
              ? 'Уже есть аккаунт? Войти' 
              : 'Нет аккаунта? Зарегистрироваться'}
          </Button>
        </div>

        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">или</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <TelegramLoginButton
          botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '@tekg_bot'}
          onAuth={handleTelegramAuth}
        />
      </CardBody>
    </Card>
  )
}
