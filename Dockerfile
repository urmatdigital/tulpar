# Используем Node.js как базовый образ
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Аргументы сборки для публичных переменных окружения
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG PORT

# Устанавливаем публичные переменные окружения
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
ENV PORT=${PORT}

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем приложение
RUN npm run build

# Создаем отдельный образ для production
FROM node:18-alpine AS runner

WORKDIR /app

# Копируем необходимые файлы из builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Устанавливаем переменные окружения
ENV PORT=${PORT}
ENV NODE_ENV=production

# Открываем порт
EXPOSE ${PORT}

# Запускаем приложение
CMD ["node", "server.js"]
