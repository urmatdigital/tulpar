import { SupabaseClient } from "@supabase/supabase-js";

export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    // В процессе сборки просто возвращаем пустую строку
    if (process.env.NODE_ENV === "production") {
      return "";
    }
    // В процессе разработки выбрасываем ошибку
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getSupabaseConfig() {
  const supabaseUrl = getEnvVariable("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = getEnvVariable("SUPABASE_SECRET_KEY");

  return {
    supabaseUrl,
    supabaseKey,
  };
}

/**
 * Генерирует URL для Telegram бота с параметрами автостарта
 */
export function getTelegramBotUrl(phone: string, action: "register" | "connect" = "register"): string {
  const botUsername = getEnvVariable("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME");
  const baseUrl = `https://t.me/${botUsername}`;
  
  // Кодируем параметры для безопасной передачи
  const startParam = encodeURIComponent(`${action}_${phone}`);
  
  return `${baseUrl}?start=${startParam}`;
}

// Функция для проверки наличия всех необходимых переменных окружения
export function validateEnvVariables() {
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "TELEGRAM_BOT_TOKEN",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
  ];

  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}
