"use client"

import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { PhoneInput } from "@/components/auth/PhoneInput"
import { OTPInput } from "@/components/auth/OTPInput"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handlePhoneSubmit = async (phoneNumber: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      })

      if (error) throw error

      setPhone(phoneNumber)
      setStep('otp')
    } catch (error) {
      console.error('Error sending OTP:', error)
      // Здесь можно добавить обработку ошибок
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (otp: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error verifying OTP:', error)
      // Здесь можно добавить обработку ошибок
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      await handlePhoneSubmit(phone)
    } catch (error) {
      console.error('Error resending OTP:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 p-6">
          <h1 className="text-2xl font-bold">Вход в систему</h1>
          <p className="text-default-500">
            {step === 'phone' 
              ? 'Введите номер телефона для получения кода' 
              : 'Введите код, отправленный на ваш телефон'}
          </p>
        </CardHeader>
        <CardBody className="p-6">
          {step === 'phone' ? (
            <PhoneInput 
              onSubmit={handlePhoneSubmit}
              isLoading={isLoading}
            />
          ) : (
            <OTPInput
              onSubmit={handleOTPSubmit}
              onResend={handleResendOTP}
              isLoading={isLoading}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
