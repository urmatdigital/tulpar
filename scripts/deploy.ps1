# Set UTF-8 encoding
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

# Function to write colored output
function Write-ColorOutput {
    param([System.ConsoleColor]$ForegroundColor)
    
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    
    if ($args) {
        Write-Output $args
    }
    
    $host.UI.RawUI.ForegroundColor = $fc
}

# Function to check if Docker image exists
function Test-DockerImage {
    param([string]$ImageName)
    $image = docker images -q $ImageName
    return ![string]::IsNullOrEmpty($image)
}

# Function to check if container exists
function Test-DockerContainer {
    param([string]$ContainerName)
    $container = docker ps -a -q -f name=$ContainerName
    return ![string]::IsNullOrEmpty($container)
}

# Load environment variables from .env.production
Write-ColorOutput Green "Loading environment variables..."
$envVars = @{}
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        $envVars[$key] = $value
        [Environment]::SetEnvironmentVariable($key, $value)
        Set-Item -Path "env:$key" -Value $value
    }
}

# Check for git changes
Write-ColorOutput Green "Checking git changes..."
$status = git status --porcelain
if ($status) {
    Write-ColorOutput Yellow "Changes found, committing..."
    git add .
    git commit -m "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Push changes to repository
Write-ColorOutput Green "Pushing changes to repository..."
git push origin main

# Check Docker installation
Write-ColorOutput Green "Checking Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "Docker is not installed!"
    exit 1
}

# Check if we need to rebuild the image
$needRebuild = $true
if (Test-DockerImage "tulparexpress:latest") {
    $lastBuildTime = docker inspect -f '{{.Created}}' tulparexpress:latest
    $lastCommitTime = git log -1 --format=%cd --date=iso
    if ([DateTime]::Parse($lastBuildTime) -gt [DateTime]::Parse($lastCommitTime)) {
        Write-ColorOutput Yellow "Docker image is up to date, skipping build..."
        $needRebuild = $false
    }
}

if ($needRebuild) {
    # Build Docker image with public environment variables
    Write-ColorOutput Green "Building Docker image..."
    $buildArgs = @(
        "--build-arg", "NEXT_PUBLIC_APP_URL=$($envVars['NEXT_PUBLIC_APP_URL'])",
        "--build-arg", "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$($envVars['NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'])",
        "--build-arg", "PORT=$($envVars['PORT'])"
    )

    # Используем Docker BuildKit для ускорения сборки
    $env:DOCKER_BUILDKIT = 1
    $buildCommand = "docker build --no-cache $buildArgs -t tulparexpress ."
    Write-ColorOutput Yellow "Running build command: $buildCommand"
    Invoke-Expression $buildCommand
}

# Check Railway CLI and login status
Write-ColorOutput Green "Checking Railway CLI..."
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Railway CLI not found, installing..."
    npm i -g @railway/cli
}

# Deploy to Railway with progress tracking
Write-ColorOutput Green "Deploying to Railway..."
$deploymentStart = Get-Date
$env:RAILWAY_TOKEN = $envVars['RAILWAY_TOKEN']

try {
    # Используем параллельное выполнение где возможно
    $jobs = @()

    # Устанавливаем переменные окружения параллельно
    Write-ColorOutput Green "Setting up Railway variables..."
    $secretVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SECRET_KEY",
        "SUPABASE_JWT_SECRET",
        "DATABASE_URL",
        "TELEGRAM_BOT_TOKEN",
        "TELEGRAM_WEBHOOK_SECRET",
        "TELEGRAM_USER_SECRET"
    )

    foreach ($key in $secretVars) {
        if ($envVars.ContainsKey($key)) {
            $jobs += Start-Job -ScriptBlock {
                param($key, $value)
                railway variables set "$key=$value"
            } -ArgumentList $key, $envVars[$key]
        }
    }

    # Ждем завершения всех задач
    $jobs | Wait-Job | Receive-Job

    # Деплоим приложение
    railway up --detach

    # Настраиваем webhook для Telegram
    Write-ColorOutput Green "Setting up Telegram webhook..."
    $botToken = $envVars['TELEGRAM_BOT_TOKEN']
    $webhookUrl = "https://te.kg/api/telegram/webhook"
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl" -Method Get

    if ($response.ok) {
        Write-ColorOutput Green "Webhook set successfully"
    } else {
        Write-ColorOutput Red "Error setting webhook: $($response.description)"
    }

    $deploymentDuration = (Get-Date) - $deploymentStart
    Write-ColorOutput Green "Deploy completed in $($deploymentDuration.TotalSeconds) seconds!"
    Write-ColorOutput Green "App is available at: https://te.kg"
} catch {
    Write-ColorOutput Red "Deployment failed: $_"
    exit 1
}
