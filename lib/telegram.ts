import TelegramBot from "node-telegram-bot-api";
import { getEnvVariable } from "./env";
import { SupabaseClient } from "@supabase/supabase-js";

// Создаем экземпляр бота с токеном
const token = getEnvVariable("TELEGRAM_BOT_TOKEN");
const bot = new TelegramBot(token, { polling: false });

// Установка webhook URL
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
bot.setWebHook(webhookUrl, {
  certificate: undefined,
  max_connections: 40,
});

/**
 * Оптимизированная отправка сообщения
 */
export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  try {
    // Устанавливаем таймаут в 5 секунд
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await bot.sendMessage(chatId, message, { 
      parse_mode: "HTML",
      disable_web_page_preview: true, // Отключаем предпросмотр ссылок
      disable_notification: true // Отключаем уведомления
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error("Telegram error:", error);
    return false;
  }
}

/**
 * Оптимизированная отправка кода верификации
 */
export async function sendVerificationCode(telegramId: string, code: string): Promise<boolean> {
  const message = `<b>Код: ${code}</b>`;
  return sendTelegramMessage(telegramId, message);
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

/**
 * Обрабатывает команду /start с параметрами
 */
export async function handleStartCommand(
  supabase: SupabaseClient,
  chatId: number,
  startParam: string,
  firstName: string,
  lastName?: string,
  username?: string
): Promise<void> {
  try {
    // Парсим параметры старта (action_phone)
    const [action, phone] = startParam.split("_");
    
    if (!action || !phone) {
      await bot.sendMessage(
        chatId,
        "Добро пожаловать в TULPAR EXPRESS! Для начала работы, пожалуйста, перейдите на наш сайт."
      );
      return;
    }

    if (action === "register") {
      // Проверяем, не существует ли уже пользователь с таким телефоном
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .single();

      if (existingUser) {
        await bot.sendMessage(
          chatId,
          "Пользователь с таким номером телефона уже существует. Если это ваш номер, выберите опцию 'Подключить Telegram' на сайте."
        );
        return;
      }

      // Создаем нового пользователя
      const { error: createError } = await supabase.from("users").insert({
        telegram_id: chatId,
        phone,
        first_name: firstName,
        last_name: lastName || "",
        username: username || "",
        role: "user",
        created_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("Error creating user:", createError);
        await bot.sendMessage(
          chatId,
          "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже или обратитесь в поддержку."
        );
        return;
      }

      await bot.sendMessage(
        chatId,
        `Спасибо за регистрацию! Теперь вы можете вернуться на сайт и войти в систему, используя ваш номер телефона: ${phone}`
      );
    } else if (action === "connect") {
      // Проверяем существование пользователя
      const { data: existingUser } = await supabase
        .from("users")
        .select("telegram_id")
        .eq("phone", phone)
        .single();

      if (!existingUser) {
        await bot.sendMessage(
          chatId,
          "Пользователь с таким номером телефона не найден. Пожалуйста, сначала зарегистрируйтесь на сайте."
        );
        return;
      }

      if (existingUser.telegram_id === chatId) {
        await bot.sendMessage(
          chatId,
          "Этот Telegram аккаунт уже подключен к вашему профилю. Вы можете вернуться на сайт и войти в систему."
        );
        return;
      }

      // Обновляем существующего пользователя
      const { error: updateError } = await supabase
        .from("users")
        .update({
          telegram_id: chatId,
          first_name: firstName,
          last_name: lastName || "",
          username: username || "",
          updated_at: new Date().toISOString(),
        })
        .eq("phone", phone);

      if (updateError) {
        console.error("Error updating user:", updateError);
        await bot.sendMessage(
          chatId,
          "Произошла ошибка при подключении Telegram. Пожалуйста, попробуйте позже или обратитесь в поддержку."
        );
        return;
      }

      await bot.sendMessage(
        chatId,
        `Telegram успешно подключен к вашему аккаунту! Теперь вы можете вернуться на сайт и войти в систему.`
      );
    }
  } catch (error) {
    console.error("Error handling start command:", error);
    await bot.sendMessage(
      chatId,
      "Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку."
    );
  }
}

/**
 * Обрабатывает обновления от Telegram
 */
export async function handleTelegramUpdate(update: any, supabase: SupabaseClient): Promise<void> {
  try {
    if (!update?.message) return;

    const chatId = update.message.chat.id;
    if (!chatId) return;

    // Обработка команды /start
    if (update.message.text?.startsWith("/start")) {
      const startParam = update.message.text.split(" ")[1];
      const firstName = update.message.from.first_name;
      const lastName = update.message.from.last_name;
      const username = update.message.from.username;

      await handleStartCommand(
        supabase,
        chatId,
        startParam,
        firstName,
        lastName,
        username
      );
      return;
    }

    // Если это не команда /start, отправляем общее сообщение
    await bot.sendMessage(
      chatId,
      "Для взаимодействия с ботом, пожалуйста, используйте наш сайт: " + 
      process.env.NEXT_PUBLIC_APP_URL
    );
  } catch (error) {
    console.error("Error handling Telegram update:", error);
    // Не отправляем сообщение об ошибке пользователю, чтобы избежать спама
  }
}
