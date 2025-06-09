# Cleanup Temporary Files Script
Write-Host "🧹 Cleaning up temporary files and directories..." -ForegroundColor Yellow

# Navigate to project root
$projectRoot = "E:\Code-Side-Projects\stock-analysis-app"
Set-Location $projectRoot

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Blue

# Remove temporary deployment directories
$tempDirs = @(
    "backend\temp-deploy",
    "backend\temp-deploy2", 
    "backend\build-working",
    "backend\final-deploy",
    "backend\deploy\build-cors-fix",
    "backend\deploy\temp-deploy",
    "backend\deploy\final-deploy"
)

foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        Write-Host "🗑️  Removing directory: $dir" -ForegroundColor Red
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Remove temporary files
$tempFiles = @(
    "backend\deploy\test-response.json",
    "backend\deploy\test-http-response.json", 
    "backend\deploy\response.json",
    "backend\test-event.json",
    "backend\test-http-event.json",
    "backend\lambda-*.zip",
    "backend\deploy\lambda-*.zip",
    "*.zip"
)

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Write-Host "🗑️  Removing file: $file" -ForegroundColor Red
        Remove-Item $file -Force -ErrorAction SilentlyContinue
    }
}

# Remove any zip files in the project
Get-ChildItem -Path . -Name "*.zip" -Recurse | ForEach-Object {
    $fullPath = $_.FullName
    Write-Host "🗑️  Removing zip file: $fullPath" -ForegroundColor Red
    Remove-Item $fullPath -Force -ErrorAction SilentlyContinue
}

# Remove Python cache files
Get-ChildItem -Path . -Name "__pycache__" -Recurse -Directory | ForEach-Object {
    Write-Host "🗑️  Removing Python cache: $($_.FullName)" -ForegroundColor Red
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove .pyc files
Get-ChildItem -Path . -Name "*.pyc" -Recurse | ForEach-Object {
    Write-Host "🗑️  Removing .pyc file: $($_.FullName)" -ForegroundColor Red
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "📊 Remaining directories in backend:" -ForegroundColor Blue
Get-ChildItem -Path "backend" -Directory | Select-Object Name | Format-Table -AutoSize 