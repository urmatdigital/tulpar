"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface LoginFormProps {
  onSubmit: (phone: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка отправки кода");
      }

      await onSubmit(phone);

      // Перенаправляем в Telegram
      window.location.href =
        process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/tekg_bot";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Вход в систему</p>
          <p className="text-small text-default-500">
            Введите номер телефона для получения кода
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Номер телефона"
            placeholder="+996 XXX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            pattern="^\+?[0-9]{10,15}$"
            required
          />
          {error && <p className="text-danger text-small">{error}</p>}
          <Button color="primary" type="submit" isLoading={isLoading}>
            Получить код в Telegram
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
