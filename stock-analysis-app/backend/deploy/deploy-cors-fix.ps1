# Deploy CORS Fix for Lambda Function
Write-Host "🔧 Deploying CORS fix..." -ForegroundColor Yellow

# Variables
$FUNCTION_NAME = "stock-analysis-api"
$REGION = "us-east-1"

# Clean up
if (Test-Path "build-cors-fix") { Remove-Item -Recurse -Force "build-cors-fix" }
if (Test-Path "lambda-cors-fix.zip") { Remove-Item "lambda-cors-fix.zip" }

# Create build directory
Write-Host "📦 Creating package..." -ForegroundColor Blue
New-Item -ItemType Directory -Name "build-cors-fix" | Out-Null
Set-Location "build-cors-fix"

# Copy lambda function
Copy-Item "../lambda_function.py" "."

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
pip install --target . fastapi==0.68.0 mangum==0.12.3 pydantic==1.10.2 requests==2.28.1

# Create zip
Write-Host "📦 Creating zip..." -ForegroundColor Blue
Compress-Archive -Path "." -DestinationPath "../lambda-cors-fix.zip"

Set-Location ".."

# Deploy
Write-Host "🚀 Deploying..." -ForegroundColor Blue
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://lambda-cors-fix.zip --region $REGION

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Test: https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws/health" -ForegroundColor Cyan

# Clean up
Remove-Item -Recurse -Force "build-cors-fix" -ErrorAction SilentlyContinue
Remove-Item "lambda-cors-fix.zip" -ErrorAction SilentlyContinue