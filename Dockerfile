# Используем Node.js как базовый образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем .env файл из переменных окружения
RUN echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" >> .env && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" >> .env && \
    echo "SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY" >> .env && \
    echo "DATABASE_URL=$DATABASE_URL" >> .env && \
    echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN" >> .env && \
    echo "TELEGRAM_WEBHOOK_SECRET=$TELEGRAM_WEBHOOK_SECRET" >> .env && \
    echo "TELEGRAM_USER_SECRET=$TELEGRAM_USER_SECRET" >> .env && \
    echo "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME" >> .env && \
    echo "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL" >> .env && \
    echo "FRONTEND_URL=$FRONTEND_URL" >> .env && \
    echo "PORT=$PORT" >> .env

# Собираем приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
