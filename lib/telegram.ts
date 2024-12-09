import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN!
const bot = new TelegramBot(token, { polling: false })

export const sendVerificationCode = async (
  chatId: string | number,
  code: string,
  phone: string
) => {
  const message = `
Ваш код подтверждения: ${code}

Для завершения регистрации перейдите по ссылке ниже и введите этот код.
`

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: 'Завершить регистрацию',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?phone=${encodeURIComponent(phone)}`
        }
      ]
    ]
  }

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: inlineKeyboard
  })
}

export const sendWelcomeMessage = async (chatId: string | number) => {
  const message = `
Добро пожаловать в TULPAR EXPRESS! 🚀

Я помогу вам отслеживать ваши посылки и получать уведомления об их статусе.

Для начала работы, пожалуйста, зарегистрируйтесь на нашем сайте:
${process.env.NEXT_PUBLIC_APP_URL}/auth/login
`

  return await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Зарегистрироваться',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
          }
        ]
      ]
    }
  })
}

export default bot
