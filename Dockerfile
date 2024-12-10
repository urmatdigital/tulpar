# syntax=docker/dockerfile:1.4
FROM node:18-alpine AS base

# Устанавливаем зависимости для улучшения производительности
RUN apk add --no-cache libc6-compat
RUN npm install -g npm@latest

# Включаем Turbo для ускорения сборки
ENV TURBO_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем все зависимости
RUN npm ci

FROM base AS builder
WORKDIR /app

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Аргументы сборки для публичных переменных окружения
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG PORT

# Устанавливаем публичные переменные окружения
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}
ENV PORT=${PORT}

# Создаем postcss.config.js если его нет
RUN echo "module.exports={plugins:{tailwindcss:{},autoprefixer:{}}}" > postcss.config.js

# Оптимизируем сборку
RUN npm run build

FROM base AS runner
WORKDIR /app

# Устанавливаем переменные окружения для production
ENV NODE_ENV=production
ENV PORT=${PORT}

# Создаем непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Устанавливаем правильные разрешения для кэша Next.js
RUN mkdir .next && \
    chown nextjs:nodejs .next

# Копируем необходимые файлы из builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на непривилегированного пользователя
USER nextjs

# Открываем порт
EXPOSE ${PORT}

# Оптимизируем для production
ENV NODE_OPTIONS='--max-old-space-size=4096'

# Запускаем приложение
CMD ["node", "server.js"]
