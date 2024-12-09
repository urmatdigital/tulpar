"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { useRouter } from "next/navigation";

interface VerificationFormProps {
  phone: string;
  onResendCode: () => void;
}

export function VerificationForm({
  phone,
  onResendCode,
}: VerificationFormProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка верификации");
      }

      // После успешной верификации перенаправляем на главную страницу
      router.push("/dashboard");
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
          <p className="text-md">Подтверждение номера</p>
          <p className="text-small text-default-500">
            Введите код, отправленный в Telegram
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Код подтверждения"
            placeholder="0000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
          {error && <p className="text-danger text-small">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button color="primary" type="submit" isLoading={isLoading}>
              Подтвердить
            </Button>
            <Button
              variant="light"
              onPress={onResendCode}
              isDisabled={isLoading}
            >
              Отправить код повторно
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
