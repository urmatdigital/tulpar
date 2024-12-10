# Остановка всех процессов node.exe
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        $processId = $process.Id
        Write-Host "Stopping Node.js process (PID: $processId)..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
    }
    Write-Host "All Node.js processes stopped!" -ForegroundColor Green
} else {
    Write-Host "No active Node.js processes found." -ForegroundColor Cyan
}

# Освобождение портов
Write-Host "Checking used ports..." -ForegroundColor Yellow

$ports = @(3000, 3001)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Write-Host "Releasing port $port..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force
        Write-Host "Port $port released!" -ForegroundColor Green
    } else {
        Write-Host "Port $port is free." -ForegroundColor Cyan
    }
}

Write-Host "All processes stopped and ports released!" -ForegroundColor Green
