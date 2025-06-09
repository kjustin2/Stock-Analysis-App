# Build Working Lambda Function (No Heavy Dependencies)

Write-Host "Building Lambda function..." -ForegroundColor Green

# Clean previous builds
if (Test-Path "build-working") { Remove-Item -Recurse -Force "build-working" }
if (Test-Path "lambda-working.zip") { Remove-Item -Force "lambda-working.zip" }

# Create build directory
New-Item -ItemType Directory -Path "build-working" -Force | Out-Null

# Copy working lambda function
Write-Host "Copying lambda function..." -ForegroundColor Yellow
Copy-Item "lambda_function.py" "build-working/lambda_function.py"
Copy-Item "requirements.txt" "build-working/requirements.txt"

# Install minimal dependencies
Write-Host "Installing minimal dependencies..." -ForegroundColor Yellow
Set-Location "build-working"
pip install -r requirements.txt -t . --upgrade

# Remove unnecessary files
Write-Host "Optimizing package..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Directory -Name "__pycache__" | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -Directory -Name "*.dist-info" | ForEach-Object { Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue }
Get-ChildItem -Recurse -File -Name "*.pyc" | ForEach-Object { Remove-Item -Force $_ -ErrorAction SilentlyContinue }

# Create deployment package
Write-Host "Creating working deployment package..." -ForegroundColor Yellow
Compress-Archive -Path ".\*" -DestinationPath "..\lambda-working.zip" -Force

Set-Location ".."
Write-Host "Build complete! Package size:" -ForegroundColor Green
if (Test-Path "lambda-working.zip") {
    $size = (Get-Item "lambda-working.zip").Length / 1MB
    Write-Host "$([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "Package not found" -ForegroundColor Red
}

Write-Host "Build completed successfully!" -ForegroundColor Green 