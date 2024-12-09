"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { VerificationForm } from "@/components/auth/VerificationForm";
import { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "verification">("phone");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (phoneNumber: string) => {
    setIsLoading(true);
    try {
      setPhone(phoneNumber);
      setStep("verification");
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend code");
      }

      // Перенаправляем в Telegram
      window.location.href =
        process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/tekg_bot";
    } catch (error) {
      console.error("Error resending code:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 p-6">
          <h1 className="text-2xl font-bold">Вход в систему</h1>
          <p className="text-default-500">
            {step === "phone"
              ? "Введите номер телефона для получения кода"
              : "Введите код, отправленный на ваш телефон"}
          </p>
        </CardHeader>
        <CardBody className="p-6">
          {step === "phone" ? (
            <LoginForm onSubmit={handlePhoneSubmit} />
          ) : (
            <VerificationForm
              phone={phone}
              onResendCode={handleResendCode}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
