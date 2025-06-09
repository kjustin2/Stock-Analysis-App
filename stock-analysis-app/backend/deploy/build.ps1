# AWS Lambda Build Script for Stock Analysis API (PowerShell)

Write-Host "Building Lambda deployment package..." -ForegroundColor Green

# Clean previous builds
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "lambda-deployment.zip") { Remove-Item -Force "lambda-deployment.zip" }

# Create build directory
New-Item -ItemType Directory -Path "build" -Force | Out-Null

# Copy application code
Write-Host "Copying application code..." -ForegroundColor Yellow
Copy-Item -Recurse "app" "build/"
Copy-Item "lambda_function.py" "build/"
Copy-Item "lambda_requirements.txt" "build/requirements.txt"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location "build"
pip install -r requirements.txt -t .

# Remove unnecessary files to reduce package size
Write-Host "Optimizing package size..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Directory -Name "__pycache__" | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -Directory -Name "*.dist-info" | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -Directory -Name "tests" | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -File -Name "*.pyc" | ForEach-Object { Remove-Item -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -File -Name "*.pyo" | ForEach-Object { Remove-Item -Force $_ -ErrorAction SilentlyContinue }

# Remove large unnecessary packages
if (Test-Path "pandas/tests") { Remove-Item -Recurse -Force "pandas/tests" -ErrorAction SilentlyContinue }
if (Test-Path "numpy/tests") { Remove-Item -Recurse -Force "numpy/tests" -ErrorAction SilentlyContinue }
if (Test-Path "scipy/tests") { Remove-Item -Recurse -Force "scipy/tests" -ErrorAction SilentlyContinue }

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path ".\*" -DestinationPath "..\lambda-deployment.zip" -Force

Set-Location ".."
$fileSize = (Get-Item "lambda-deployment.zip").Length / 1MB
Write-Host "Build complete! Package size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green

Write-Host "Build completed successfully!" -ForegroundColor Green 