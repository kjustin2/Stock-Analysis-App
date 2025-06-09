# Deploy Final Fix for Data Structure Issues
Write-Host "🔧 Deploying final fix for data structure compatibility..." -ForegroundColor Yellow

# Variables
$FUNCTION_NAME = "stock-analysis-api"
$REGION = "us-east-1"

# Clean up previous builds
if (Test-Path "final-deploy") { Remove-Item -Recurse -Force "final-deploy" }
if (Test-Path "lambda-final-fix.zip") { Remove-Item "lambda-final-fix.zip" }

# Create deployment directory
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
New-Item -ItemType Directory -Name "final-deploy" | Out-Null
Set-Location "final-deploy"

# Copy the updated lambda function
Copy-Item "../lambda_function.py" "."

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Blue
pip install --target . fastapi==0.68.0 mangum==0.12.3 pydantic==1.10.2 requests==2.28.1

# Create deployment package
Write-Host "📦 Creating zip package..." -ForegroundColor Blue
Compress-Archive -Path * -DestinationPath "../lambda-final-fix.zip"

Set-Location ".."

# Deploy to AWS
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Blue
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://lambda-final-fix.zip --region $REGION

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Test the API at: https://qjziberdp3cojzrebxnvzmxmne0xytky.lambda-url.us-east-1.on.aws/health" -ForegroundColor Cyan

# Clean up
Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
Remove-Item -Recurse -Force "final-deploy" -ErrorAction SilentlyContinue
Remove-Item "lambda-final-fix.zip" -ErrorAction SilentlyContinue

Write-Host "💡 The API now returns data in the format expected by the frontend:" -ForegroundColor Yellow
Write-Host "   - Stock data includes 'current_price', 'name', 'previous_close'" -ForegroundColor Yellow
Write-Host "   - Chart data uses OHLCV format with 'x', 'o', 'h', 'l', 'c', 'v'" -ForegroundColor Yellow
Write-Host "   - News data includes 'headline', 'published', 'source'" -ForegroundColor Yellow
Write-Host "   - Recommendations include 'action', 'stars', 'price_target', 'reasoning[]'" -ForegroundColor Yellow 