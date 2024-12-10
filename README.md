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

# Запуск клиентской части (порт 3000)
npm run dev

# Запуск серверной части (порт 3001)
npm run dev:api
```

### Развертывание на Railway

1. Подключите ваш GitHub репозиторий к Railway:
   - Создайте новый проект в Railway
   - Выберите "Deploy from GitHub repo"
   - Выберите ваш репозиторий

2. Настройте переменные окружения в Railway:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=ваш_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_ключ
   SUPABASE_SECRET_KEY=ваш_секретный_ключ
   
   # Telegram
   TELEGRAM_BOT_TOKEN=токен_бота
   TELEGRAM_WEBHOOK_SECRET=секрет_вебхука
   TELEGRAM_USER_SECRET=секрет_пользователя
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=имя_бота
   
   # URLs
   NEXT_PUBLIC_APP_URL=https://api.te.kg
   FRONTEND_URL=https://te.kg
   
   # Порты для разных сервисов
   PORT=3001  # для API
   ```

3. Настройте домены в Railway:
   - Для клиентской части: te.kg
   - Для API: api.te.kg

4. Проверьте статус развертывания:
   - Откройте вкладку Deployments в Railway
   - Убедитесь, что оба сервиса (клиент и API) успешно запущены
   - Проверьте логи на наличие ошибок

5. Настройте Telegram webhook:
   ```bash
   curl -F "url=https://api.te.kg/api/telegram/webhook" \
        -F "secret_token=ваш_секрет_вебхука" \
        https://api.telegram.org/bot<токен_бота>/setWebhook
   ```

### Мониторинг и поддержка

- Логи доступны в разделе Deployments > Logs
- Метрики использования в разделе Metrics
- Настройки масштабирования в разделе Settings > Scaling

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
