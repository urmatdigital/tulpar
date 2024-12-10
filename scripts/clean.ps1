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

# Stop all running containers
Write-ColorOutput Green "Stopping all running containers..."
docker ps -q | ForEach-Object { docker stop $_ }

# Remove all containers
Write-ColorOutput Yellow "Removing all containers..."
docker container prune -f

# Remove unused images
Write-ColorOutput Yellow "Removing unused images..."
docker image prune -af

# Remove unused volumes
Write-ColorOutput Yellow "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
Write-ColorOutput Yellow "Removing unused networks..."
docker network prune -f

# Clean npm cache
Write-ColorOutput Green "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and .next
Write-ColorOutput Green "Removing node_modules and .next directories..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path .next) { Remove-Item -Recurse -Force .next }

Write-ColorOutput Green "Cleanup completed successfully!"
