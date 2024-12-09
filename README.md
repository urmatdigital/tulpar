# TULPAR EXPRESS

Система экспресс-доставки с аутентификацией через Telegram.

## Развертывание

### Предварительные требования

1. Аккаунт на GitHub
2. Проект на Railway.app
3. Домен на Cloudflare (te.kg)
4. Telegram Bot Token

### Настройка CI/CD

1. Создайте новый проект на Railway.app
2. Получите Railway Token:

   - Перейдите в настройки аккаунта Railway
   - В разделе "API Tokens" создайте новый токен
   - Скопируйте токен

3. Добавьте секреты в GitHub:
   - Перейдите в Settings > Secrets > Actions
   - Добавьте следующие секреты:
     - `RAILWAY_TOKEN`: ваш токен от Railway
     - `SUPABASE_URL`: URL вашей базы данных Supabase
     - `SUPABASE_ANON_KEY`: Публичный ключ Supabase
     - `SUPABASE_SECRET_KEY`: Секретный ключ Supabase
     - `TELEGRAM_BOT_TOKEN`: Токен вашего Telegram бота
     - `TELEGRAM_WEBHOOK_SECRET`: Секретный ключ для webhook

### Настройка домена

1. В Cloudflare:

   - Добавьте CNAME запись, указывающую на ваш Railway домен
   - Включите проксирование через Cloudflare
   - Настройте SSL/TLS на "Full"

2. В Railway:
   - Добавьте домен te.kg в настройках проекта
   - Подтвердите владение доменом через DNS записи

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
```

### Переменные окружения

Создайте файл `.env.local` на основе `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

# Telegram
TELEGRAM_BOT_USERNAME=
TELEGRAM_BOT_TOKEN=
TELEGRAM_USER_SECRET=
TELEGRAM_URL=
TELEGRAM_WEBHOOK_SECRET=

# Application
NEXT_PUBLIC_APP_URL=https://te.kg
```

## Структура проекта

```
tulparexpress/
├── app/                    # Next.js app директория
│   ├── api/               # API роуты
│   ├── auth/              # Страницы аутентификации
│   └── ...                # Другие страницы
├── lib/                   # Общие утилиты
├── components/            # React компоненты
└── public/               # Статические файлы
```

## Технологии

- Next.js 13+ (App Router)
- Supabase (База данных и аутентификация)
- NextUI (UI компоненты)
- Telegram Bot API
- TypeScript
