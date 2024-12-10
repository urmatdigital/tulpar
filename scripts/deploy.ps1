# Устанавливаем кодировку UTF-8 без BOM
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

# Функция для вывода сообщений с цветом
function Write-ColorOutput {
    param([System.ConsoleColor]$ForegroundColor)
    
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    
    if ($args) {
        Write-Output $args
    }
    
    $host.UI.RawUI.ForegroundColor = $fc
}

# Проверяем наличие изменений в git
Write-ColorOutput Green "Проверка изменений в git..."
$status = git status --porcelain
if ($status) {
    Write-ColorOutput Yellow "Найдены изменения, выполняем commit..."
    git add .
    git commit -m "Автоматический деплой: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Пушим изменения в репозиторий
Write-ColorOutput Green "Отправка изменений в репозиторий..."
git push origin main

# Проверяем наличие Docker
Write-ColorOutput Green "Проверка Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "Docker не установлен!"
    exit 1
}

# Собираем Docker образ
Write-ColorOutput Green "Сборка Docker образа..."
docker build -t tulparexpress .

# Устанавливаем webhook для Telegram бота
Write-ColorOutput Green "Настройка webhook для Telegram бота..."
$botToken = $env:TELEGRAM_BOT_TOKEN
$webhookUrl = "https://te.kg/api/telegram/webhook"
$response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl" -Method Get

if ($response.ok) {
    Write-ColorOutput Green "Webhook успешно установлен"
} else {
    Write-ColorOutput Red "Ошибка установки webhook: $($response.description)"
}

# Проверяем наличие Railway CLI
Write-ColorOutput Green "Проверка Railway CLI..."
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Railway CLI не установлен, устанавливаем..."
    npm i -g @railway/cli
}

# Деплоим на Railway
Write-ColorOutput Green "Деплой на Railway..."
railway up

Write-ColorOutput Green "Деплой завершен! Приложение доступно по адресу: https://te.kg"
