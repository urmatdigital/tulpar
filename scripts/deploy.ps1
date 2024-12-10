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
    $image = docker images -q $ImageName 2>$null
    return ![string]::IsNullOrEmpty($image)
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

# Check Docker installation and start if needed
Write-ColorOutput Green "Checking Docker..."
try {
    # Проверяем, установлен ли Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-ColorOutput Yellow "Docker not installed. Installing Docker Desktop..."
        # Скачиваем и устанавливаем Docker Desktop
        $dockerInstaller = "DockerDesktopInstaller.exe"
        Invoke-WebRequest "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe" -OutFile $dockerInstaller
        Start-Process $dockerInstaller -Wait -ArgumentList "install --quiet"
        Remove-Item $dockerInstaller
        Write-ColorOutput Green "Docker Desktop installed successfully!"
        
        # Даем время на инициализацию сервиса
        Start-Sleep -Seconds 10
    }

    # Проверяем статус Docker
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Yellow "Docker is not running. Starting Docker..."
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        # Ждем 10 секунд для запуска
        Start-Sleep -Seconds 10
    }

    # Финальная проверка
    docker info >$null 2>&1
    if ($?) {
        Write-ColorOutput Green "Docker is running and ready!"
    } else {
        throw "Docker is not responding"
    }
} catch {
    Write-ColorOutput Red "Error with Docker: $_"
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

# Check Railway CLI
Write-ColorOutput Green "Checking Railway CLI..."
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Railway CLI not found, installing..."
    npm i -g @railway/cli
}

# Deploy to Railway
Write-ColorOutput Green "Deploying to Railway..."
$env:RAILWAY_TOKEN = $envVars['RAILWAY_TOKEN']

try {
    # Deploy the application
    Write-ColorOutput Green "Deploying application..."
    railway up --detach

    # Configure Telegram webhook
    Write-ColorOutput Green "Setting up Telegram webhook..."
    $botToken = $envVars['TELEGRAM_BOT_TOKEN']
    $webhookUrl = "https://te.kg/api/telegram/webhook"
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl" -Method Get

    if ($response.ok) {
        Write-ColorOutput Green "Webhook set successfully"
    } else {
        Write-ColorOutput Red "Error setting webhook: $($response.description)"
    }

    Write-ColorOutput Green "Deploy completed! App is available at: https://te.kg"
} catch {
    Write-ColorOutput Red "Deployment failed: $_"
    exit 1
}
