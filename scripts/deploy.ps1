# Set UTF-8 encoding
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()

# Load environment variables from .env.production
Write-ColorOutput Green "Loading environment variables..."
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value)
        Set-Item -Path "env:$key" -Value $value
    }
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

# Build Docker image
Write-ColorOutput Green "Building Docker image..."
docker build -t tulparexpress .

# Set up Telegram webhook
Write-ColorOutput Green "Setting up Telegram webhook..."
$botToken = $env:TELEGRAM_BOT_TOKEN
Write-ColorOutput Yellow "Using bot token: $botToken"
$webhookUrl = "https://te.kg/api/telegram/webhook"
try {
    $response = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl" -Method Get
    if ($response.ok) {
        Write-ColorOutput Green "Webhook set successfully"
    } else {
        Write-ColorOutput Red "Error setting webhook: $($response.description)"
    }
} catch {
    Write-ColorOutput Red "Failed to set webhook: $_"
}

# Check Railway CLI
Write-ColorOutput Green "Checking Railway CLI..."
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "Railway CLI not found, installing..."
    npm i -g @railway/cli
}

# Deploy to Railway
Write-ColorOutput Green "Deploying to Railway..."
railway up

Write-ColorOutput Green "Deploy completed! App is available at: https://te.kg"
