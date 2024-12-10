# Set UTF-8 encoding
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()
[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Restarting with elevated permissions..."
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Wait
    exit
}

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

# Function to check Docker installation
function Test-DockerInstallation {
    try {
        $null = Get-Command docker -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if Docker image exists
function Test-DockerImage {
    param([string]$ImageName)
    try {
        $null = docker image inspect $ImageName 2>$null
        return $true
    }
    catch {
        return $false
    }
}

# Load environment variables from .env.production
Write-ColorOutput Green "Loading environment variables..."
$envFile = Join-Path $PSScriptRoot "../.env.production"

if (Test-Path $envFile) {
    $envVars = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envVars[$key] = $value
            [Environment]::SetEnvironmentVariable($key, $value)
            Set-Item -Path "env:$key" -Value $value
        }
    }
} else {
    Write-ColorOutput Yellow "Warning: .env.production file not found at $envFile"
    Write-ColorOutput Yellow "Continuing with deployment using existing environment variables..."
}

# Initialize Git if not already initialized
Write-ColorOutput Green "Checking Git repository..."
$projectRoot = Join-Path $PSScriptRoot ".."
Set-Location $projectRoot

if (-not (Test-Path ".git")) {
    Write-ColorOutput Yellow "Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit"
    
    # Ask for remote repository
    $remoteExists = git remote -v
    if (-not $remoteExists) {
        Write-ColorOutput Yellow "No remote repository found."
        Write-ColorOutput Yellow "Please add a remote repository manually using:"
        Write-ColorOutput Yellow "git remote add origin <your-repository-url>"
    }
} else {
    # Check for git changes
    Write-ColorOutput Green "Checking git changes..."
    $changes = git status --porcelain
    if ($changes) {
        git add .
        git commit -m "Automatic deployment commit"
        
        # Try to push changes
        Write-ColorOutput Green "Pushing changes to repository..."
        $pushResult = git push origin main 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput Yellow "Warning: Could not push changes: $pushResult"
            Write-ColorOutput Yellow "Continuing with deployment..."
        }
    } else {
        Write-ColorOutput Green "No changes detected in the project. Skipping build..."
    }
}

# Function to get project hash
function Get-ProjectHash {
    try {
        $files = Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.css,*.scss,Dockerfile -ErrorAction Stop | 
            Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.git' }
        
        if ($null -eq $files) {
            Write-ColorOutput Red "No source files found!"
            return ""
        }
        
        $hashSource = $files | Get-FileHash | Select-Object -ExpandProperty Hash
        return ($hashSource | Sort-Object) -join ''
    }
    catch {
        Write-ColorOutput Red "Error accessing files: $_"
        Write-ColorOutput Yellow "Continuing with deployment..."
        return ""
    }
}

# Function to reset Docker container
function Reset-DockerContainer {
    Write-ColorOutput Yellow "Пересоздаем Docker контейнер..."
    try {
        # Останавливаем и удаляем существующие контейнеры
        docker ps -aq | ForEach-Object { docker stop $_; docker rm $_ }
        # Удаляем все образы
        docker images -q | ForEach-Object { docker rmi $_ -f }
        # Сбрасываем Docker daemon
        net stop com.docker.service
        Start-Sleep -Seconds 2
        net start com.docker.service
        Start-Sleep -Seconds 5
        Write-ColorOutput Green "Docker контейнер успешно пересоздан!"
        return $true
    }
    catch {
        Write-ColorOutput Red "Ошибка при пересоздании контейнера: $_"
        return $false
    }
}

# Check project state and caching
$cacheFile = ".deploy-cache"
$currentHash = Get-ProjectHash
$skipDeploy = $false

if (Test-Path $cacheFile) {
    $cachedHash = Get-Content $cacheFile
    if ($cachedHash -eq $currentHash) {
        Write-ColorOutput Yellow "Изменений в проекте не обнаружено. Пропускаем сборку."
        $skipDeploy = $true
    }
}

# Check Docker installation and start if needed
Write-ColorOutput Green "Checking Docker..."
try {
    # Проверяем, установлен ли Docker
    if (-not (Test-DockerInstallation)) {
        Write-ColorOutput Yellow "Docker not installed. Installing Docker Desktop..."
        $dockerInstaller = "DockerDesktopInstaller.exe"
        Invoke-WebRequest "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe" -OutFile $dockerInstaller
        Start-Process $dockerInstaller -Wait -ArgumentList "install --quiet"
        Remove-Item $dockerInstaller
        Write-ColorOutput Green "Docker Desktop installed successfully!"
        Start-Sleep -Seconds 10
    }

    # Проверяем статус Docker
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Yellow "Docker is not running. Starting Docker..."
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 10
    }

    # Финальная проверка
    docker info >$null 2>&1
    if (-not $?) {
        if (-not (Reset-DockerContainer)) {
            throw "Не удалось восстановить работу Docker"
        }
    }
    Write-ColorOutput Green "Docker is running and ready!"
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

if (-not $skipDeploy) {
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

    # Сохраняем хэш текущего состояния
    $currentHash | Set-Content $cacheFile
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
    if (-not $skipDeploy) {
        # Deploy the application
        Write-ColorOutput Green "Deploying application..."
        railway up --detach
    }

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
