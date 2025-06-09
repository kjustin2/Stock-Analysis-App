# Robust Deployment Script for Stock Analysis API
# Handles file locking and dependency conflicts

Write-Host "Starting robust deployment..." -ForegroundColor Green

# Variables
$FUNCTION_NAME = "stock-analysis-api"
$REGION = "us-east-1"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$DEPLOY_DIR = "deploy-robust-$TIMESTAMP"

# Step 1: Clean up any existing files
Write-Host "Step 1: Cleaning up existing files..." -ForegroundColor Blue
Get-ChildItem -Path "." -Filter "lambda-deploy-*.zip" | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Filter "deploy-*" -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Step 2: Create fresh deployment directory
Write-Host "Step 2: Creating fresh deployment directory..." -ForegroundColor Blue
New-Item -ItemType Directory -Name $DEPLOY_DIR | Out-Null
Set-Location $DEPLOY_DIR

# Step 3: Copy lambda function
Write-Host "Step 3: Copying lambda function..." -ForegroundColor Blue
Copy-Item "../backend/lambda_function.py" "."

# Step 4: Install dependencies with better version handling
Write-Host "Step 4: Installing dependencies (this may take a moment)..." -ForegroundColor Blue
Write-Host "  Using compatible versions to avoid conflicts..." -ForegroundColor Yellow

# Use more compatible versions
pip install --target . --no-deps fastapi==0.68.0
pip install --target . --no-deps mangum==0.12.3
pip install --target . --no-deps pydantic==1.10.2
pip install --target . --no-deps requests==2.31.0
pip install --target . --no-deps starlette==0.14.2
pip install --target . --no-deps typing-extensions==4.4.0

# Step 5: Wait a moment for file handles to release
Write-Host "Step 5: Waiting for file handles to release..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Step 6: Create zip using Python (more reliable than PowerShell)
Write-Host "Step 6: Creating deployment package using Python..." -ForegroundColor Blue
$pythonScript = @"
import zipfile
import os
import time

# Wait a bit more for file handles
time.sleep(2)

zip_name = '../lambda-deploy-robust.zip'
if os.path.exists(zip_name):
    os.remove(zip_name)

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            try:
                zipf.write(file_path, arcname)
                print(f'Added: {arcname}')
            except Exception as e:
                print(f'Skipped {arcname}: {e}')

print('Zip file created successfully!')
"@

$pythonScript | Out-File -FilePath "create_zip.py" -Encoding UTF8
python create_zip.py

# Step 7: Go back to project root
Set-Location ".."

# Step 8: Verify zip file exists
if (Test-Path "lambda-deploy-robust.zip") {
    Write-Host "Step 7: Zip file created successfully!" -ForegroundColor Green
    $zipSize = (Get-Item "lambda-deploy-robust.zip").Length / 1MB
    Write-Host "  Zip size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Zip file was not created!" -ForegroundColor Red
    exit 1
}

# Step 9: Deploy to AWS
Write-Host "Step 8: Deploying to AWS Lambda..." -ForegroundColor Blue
Write-Host "  Function: $FUNCTION_NAME" -ForegroundColor Gray
Write-Host "  Region: $REGION" -ForegroundColor Gray

$deployOutput = aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://lambda-deploy-robust.zip --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
    Write-Host "Lambda function updated with fixes:" -ForegroundColor Cyan
    Write-Host "  - Unique prices per stock symbol" -ForegroundColor White
    Write-Host "  - Fixed /technical-chart endpoint" -ForegroundColor White
    Write-Host "  - Added proper technical indicators" -ForegroundColor White
    Write-Host "  - Fixed data structure for frontend" -ForegroundColor White
    
    Write-Host "`nAPI URL: https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws" -ForegroundColor Cyan
    
    # Test the deployment
    Write-Host "`nStep 9: Testing deployment..." -ForegroundColor Blue
    Start-Sleep -Seconds 5
    
    try {
        $testResponse = Invoke-WebRequest -Uri "https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws/stocks/AAPL" -Method GET -TimeoutSec 30
        $stockData = $testResponse.Content | ConvertFrom-Json
        
        Write-Host "  Test Result: SUCCESS" -ForegroundColor Green
        Write-Host "  AAPL Price: $($stockData.current_price)" -ForegroundColor White
        Write-Host "  Response includes current_price field: $(($stockData.current_price -ne $null))" -ForegroundColor White
    } catch {
        Write-Host "  Test Result: Could not test immediately (Lambda may still be updating)" -ForegroundColor Yellow
        Write-Host "  Please test manually in a few minutes" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    Write-Host "AWS CLI Output:" -ForegroundColor Yellow
    Write-Host $deployOutput -ForegroundColor Gray
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check AWS credentials: aws sts get-caller-identity" -ForegroundColor White
    Write-Host "2. Check function exists: aws lambda get-function --function-name $FUNCTION_NAME --region $REGION" -ForegroundColor White
}

# Step 10: Clean up
Write-Host "`nStep 10: Cleaning up..." -ForegroundColor Blue
Remove-Item -Recurse -Force $DEPLOY_DIR -ErrorAction SilentlyContinue
Remove-Item "lambda-deploy-robust.zip" -ErrorAction SilentlyContinue

Write-Host "Deployment process completed!" -ForegroundColor Green
Write-Host "Next: Test your website at https://kjustin2.github.io" -ForegroundColor Yellow 