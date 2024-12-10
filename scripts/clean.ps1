# Очистка кэша npm
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Удаление папок
$foldersToDelete = @(".next", "node_modules")

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "Deleting $folder..." -ForegroundColor Yellow
        Remove-Item -Path $folder -Recurse -Force
    }
}

Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "Now you can run 'npm install' to install dependencies" -ForegroundColor Cyan
