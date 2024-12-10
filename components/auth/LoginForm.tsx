"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getTelegramBotUrl } from "@/lib/env";

interface LoginFormProps {
  onSubmit: (phone: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
      
      if (!botUsername) {
        throw new Error("Ошибка конфигурации: имя бота не задано");
      }

      // Формируем URL для бота
      const startParam = encodeURIComponent(`register_${formattedPhone}`);
      const botUrl = `https://t.me/${botUsername}?start=${startParam}`;
      
      // Перенаправляем пользователя на бота
      window.location.href = botUrl;
      
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "Произошла ошибка";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, "");
    
    // Если первая цифра не 9, добавляем +996
    if (!numbers.startsWith("996")) {
      return numbers ? `+996${numbers}` : "";
    }
    
    // Добавляем +
    return numbers ? `+${numbers}` : "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <div className="text-danger">
          {errorMessage}
          {errorMessage.includes("зарегистрируйтесь") && (
            <div className="mt-2">
              <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark underline"
              >
                Открыть Telegram бота
              </a>
            </div>
          )}
        </div>
      )}
      <Input
        label="Номер телефона"
        placeholder="+996 XXX XXX XXX"
        value={phone}
        onChange={handlePhoneChange}
        required
        disabled={isLoading}
      />
      <Button
        type="submit"
        color="primary"
        isLoading={isLoading}
        disabled={isLoading || !phone.match(/^\+996\d{9}$/)}
      >
        Получить код в Telegram
      </Button>
    </form>
  );
}
