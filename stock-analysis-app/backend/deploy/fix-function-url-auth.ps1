# Fix Lambda Function URL Authentication
# This script updates the Function URL to use NONE authentication instead of AWS_IAM

$ErrorActionPreference = "Stop"

$FUNCTION_NAME = "stock-analysis-api"
$REGION = "us-east-1"

Write-Host "Fixing Lambda Function URL authentication..." -ForegroundColor Yellow

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "Error: AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check if function exists
try {
    aws lambda get-function --function-name $FUNCTION_NAME | Out-Null
} catch {
    Write-Host "Error: Lambda function $FUNCTION_NAME not found." -ForegroundColor Red
    exit 1
}

# Get current Function URL config
Write-Host "Checking current Function URL configuration..."
try {
    $CURRENT_AUTH = aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'AuthType' --output text
} catch {
    Write-Host "Error: Could not get Function URL configuration." -ForegroundColor Red
    exit 1
}

if ($CURRENT_AUTH -eq "AWS_IAM") {
    Write-Host "Current auth type is AWS_IAM, updating to NONE..." -ForegroundColor Yellow
    
    # Update Function URL to use NONE authentication
    $corsConfig = @{
        AllowCredentials = $false
        AllowHeaders = @("content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent")
        AllowMethods = @("*")
        AllowOrigins = @("*")
        ExposeHeaders = @("date", "keep-alive")
        MaxAge = 86400
    } | ConvertTo-Json -Compress
    
    aws lambda update-function-url-config --function-name $FUNCTION_NAME --auth-type NONE --cors $corsConfig
    
    Write-Host "✅ Function URL authentication updated to NONE" -ForegroundColor Green
} elseif ($CURRENT_AUTH -eq "NONE") {
    Write-Host "✅ Function URL is already configured with NONE authentication" -ForegroundColor Green
} else {
    Write-Host "❌ Could not determine current authentication type: $CURRENT_AUTH" -ForegroundColor Red
    exit 1
}

# Get the Function URL
$FUNCTION_URL = aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text

Write-Host ""
Write-Host "Function URL: $FUNCTION_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing the API..."
Write-Host "curl ${FUNCTION_URL}health"

# Test the health endpoint
try {
    $response = Invoke-WebRequest -Uri "${FUNCTION_URL}health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API is accessible!" -ForegroundColor Green
    } else {
        Write-Host "❌ API test failed. Status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API test failed. Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Your Function URL is now publicly accessible!" -ForegroundColor Green
Write-Host "Make sure to update your frontend environment variable:" -ForegroundColor Yellow
$cleanUrl = $FUNCTION_URL.TrimEnd('/')
Write-Host "VITE_API_URL=$cleanUrl" -ForegroundColor Cyan 