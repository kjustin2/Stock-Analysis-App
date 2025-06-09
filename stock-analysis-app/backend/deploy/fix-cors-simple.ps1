# Fix CORS Headers - Deploy Updated Lambda Function
# This script fixes the duplicate CORS headers issue

Write-Host "🔧 Fixing CORS Headers in Lambda Function..." -ForegroundColor Yellow

# Set variables
$FUNCTION_NAME = "stock-analysis-api"
$REGION = "us-east-1"

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue

# Clean up any existing build
if (Test-Path "build-cors-fix") {
    Remove-Item -Recurse -Force "build-cors-fix"
}

# Create build directory
New-Item -ItemType Directory -Name "build-cors-fix" | Out-Null
Set-Location "build-cors-fix"

# Copy the fixed lambda function
Copy-Item "../lambda_function.py" "."

# Install minimal dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
pip install --target . fastapi==0.68.0 mangum==0.12.3 pydantic==1.10.2 requests==2.28.1

# Create deployment zip
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
if (Test-Path "../lambda-cors-fix.zip") {
    Remove-Item "../lambda-cors-fix.zip"
}

# Create zip file
Compress-Archive -Path "." -DestinationPath "../lambda-cors-fix.zip"

# Get package size
$packageSize = (Get-Item "../lambda-cors-fix.zip").Length / 1MB
Write-Host "📊 Package size: $([math]::Round($packageSize, 2)) MB" -ForegroundColor Green

Set-Location ".."

# Deploy to AWS Lambda
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Blue

aws lambda update-function-code `
    --function-name $FUNCTION_NAME `
    --zip-file fileb://lambda-cors-fix.zip `
    --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function updated successfully!" -ForegroundColor Green
    
    # Wait a moment for deployment
    Start-Sleep -Seconds 3
    
    # Test the function
    Write-Host "🧪 Testing the updated function..." -ForegroundColor Blue
    aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' --region $REGION response.json
    
    if (Test-Path "response.json") {
        Write-Host "📄 Function response:" -ForegroundColor Blue
        Get-Content "response.json"
        Remove-Item "response.json"
    }
    
    Write-Host "🌐 Your Lambda Function URL should now work without CORS errors!" -ForegroundColor Green
    Write-Host "🔗 Test it at: https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws/health" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to update Lambda function" -ForegroundColor Red
}

# Clean up
Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
Remove-Item -Recurse -Force "build-cors-fix" -ErrorAction SilentlyContinue
Remove-Item "lambda-cors-fix.zip" -ErrorAction SilentlyContinue

Write-Host "✅ CORS fix deployment complete!" -ForegroundColor Green
Write-Host "💡 The function now uses only FastAPI's CORSMiddleware to avoid duplicate headers." -ForegroundColor Yellow 