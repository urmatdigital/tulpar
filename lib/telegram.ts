import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  webHook: {
    port: 443,
  },
});

// Установка webhook URL
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
bot.setWebHook(webhookUrl, {
  certificate: undefined,
  max_connections: 40,
});

export async function sendTelegramMessage(text: string, chatId?: number) {
  try {
    await bot.sendMessage(chatId || process.env.TELEGRAM_CHAT_ID!, text);
    return true;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
}

export async function requestContact(chatId: number) {
  const keyboard = {
    keyboard: [
      [
        {
          text: "📱 Отправить номер телефона",
          request_contact: true,
        },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };

  await bot.sendMessage(
    chatId,
    "Для продолжения регистрации, пожалуйста, поделитесь своим номером телефона",
    { reply_markup: keyboard },
  );
}

export async function handleTelegramUpdate(update: any) {
  try {
    const message = update.message;

    if (!message) {
      return { error: "No message in update" };
    }

    const chatId = message.chat.id;

    // Если получен контакт
    if (message.contact) {
      const { phone_number, user_id, first_name, last_name } = message.contact;

      // Проверяем, что user_id совпадает с отправителем
      if (user_id !== message.from.id) {
        await sendTelegramMessage(
          "Пожалуйста, отправьте свой собственный контакт",
          chatId,
        );
        return { error: "Invalid contact" };
      }

      // Сохраняем данные пользователя
      const { error: userError } = await supabase.from("users").upsert({
        phone: phone_number,
        telegram_id: user_id,
        first_name,
        last_name,
        username: message.from.username,
        auth_date: Math.floor(Date.now() / 1000),
      });

      if (userError) {
        console.error("Error saving user:", userError);
        await sendTelegramMessage(
          "Произошла ошибка при сохранении данных",
          chatId,
        );
        return { error: userError };
      }

      // Получаем код верификации для этого номера
      const { data: verificationData } = await supabase
        .from("verification_codes")
        .select()
        .eq("phone", phone_number)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (verificationData) {
        // Отправляем код подтверждения
        await sendTelegramMessage(
          `Ваш код подтверждения: ${verificationData.code}`,
          chatId,
        );
        return { success: true };
      } else {
        await sendTelegramMessage(
          "Код подтверждения не найден или истек. Пожалуйста, запросите новый код на сайте.",
          chatId,
        );
        return { error: "No valid verification code found" };
      }
    }

    // Если это первое сообщение /start
    if (message.text === "/start") {
      await sendTelegramMessage(
        "Добро пожаловать в TULPAR EXPRESS! 🚀\n\nДля продолжения регистрации, пожалуйста, нажмите на кнопку ниже, чтобы поделиться своим номером телефона.",
        chatId,
      );
      await requestContact(chatId);
      return { success: true };
    }

    // Для всех остальных сообщений
    await sendTelegramMessage(
      "Пожалуйста, используйте кнопку 'Отправить номер телефона' для регистрации",
      chatId,
    );
    await requestContact(chatId);
    return { success: true };
  } catch (error) {
    console.error("Error handling Telegram update:", error);
    return { error: "Internal server error" };
  }
}
