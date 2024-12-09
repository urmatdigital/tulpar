"use client";

import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { OTPInput } from "@/components/auth/OTPInput";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyPageContent() {
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!phone) {
      router.push("/auth/login");
    }
  }, [phone, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Пароли не совпадают");
      }

      if (password.length < 6) {
        throw new Error("Пароль должен быть не менее 6 символов");
      }

      // Проверяем код через API
      const verifyResponse = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code: verificationCode,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Неверный код подтверждения");
      }

      if (!phone) {
        throw new Error("Номер телефона не найден");
      }

      // Регистрируем пользователя в Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email: `${phone}@te.kg`,
        password,
        phone: phone,
      });

      if (signUpError) throw signUpError;

      // Создаем запись в таблице users
      const { error: insertError } = await supabase.from("users").insert([
        {
          phone: phone,
          role: "client",
        },
      ]);

      if (insertError) throw insertError;

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError("");
      setIsLoading(true);
      
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Не удалось отправить код");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 p-6">
          <h1 className="text-2xl font-bold">Подтверждение регистрации</h1>
          <p className="text-default-500">
            Введите код, отправленный в Telegram, и создайте пароль
          </p>
        </CardHeader>
        <CardBody className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <OTPInput
              onSubmit={(code) => setVerificationCode(code)}
              onResend={handleResendCode}
              isLoading={isLoading}
            />
            <Input
              type="password"
              label="Придумайте пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Завершить регистрацию
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
