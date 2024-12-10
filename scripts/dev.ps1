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

# Check Docker installation
Write-ColorOutput Green "Checking Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "Docker is not installed!"
    exit 1
}

# Stop existing container if running
Write-ColorOutput Yellow "Stopping existing containers..."
docker stop tulparexpress-dev 2>$null
docker rm tulparexpress-dev 2>$null

# Build Docker image with public environment variables
Write-ColorOutput Green "Building development Docker image..."
$buildArgs = @(
    "--build-arg", "NEXT_PUBLIC_APP_URL=$($envVars['NEXT_PUBLIC_APP_URL'])",
    "--build-arg", "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$($envVars['NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'])",
    "--build-arg", "PORT=3000"
)

$buildCommand = "docker build $buildArgs -t tulparexpress-dev -f Dockerfile.dev ."
Write-ColorOutput Yellow "Running build command: $buildCommand"
Invoke-Expression $buildCommand

# Run container with mounted volumes for hot reload
Write-ColorOutput Green "Starting development container..."
docker run -d `
    --name tulparexpress-dev `
    -p 3000:3000 `
    -v ${PWD}:/app `
    -v /app/node_modules `
    -v /app/.next `
    --env-file .env.production `
    tulparexpress-dev

Write-ColorOutput Green "Development server started! App is available at: http://localhost:3000"
Write-ColorOutput Yellow "Watching for changes in the code..."

# Show container logs
docker logs -f tulparexpress-dev
