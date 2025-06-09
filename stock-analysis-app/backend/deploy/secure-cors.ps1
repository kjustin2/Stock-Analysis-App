#!/usr/bin/env pwsh

# Simple script to secure Lambda Function URL CORS settings
# Usage: .\secure-cors-simple.ps1 -GitHubUsername "your-username"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername
)

Write-Host "Securing CORS settings for your GitHub Pages site..." -ForegroundColor Green
Write-Host "GitHub Username: $GitHubUsername" -ForegroundColor Yellow

# Delete current Function URL
Write-Host "Removing current Function URL..." -ForegroundColor Yellow
aws lambda delete-function-url-config --function-name stock-analysis-api --region us-east-1

# Create new Function URL with restricted CORS
Write-Host "Creating new Function URL with restricted CORS..." -ForegroundColor Yellow
$result = aws lambda create-function-url-config `
    --function-name stock-analysis-api `
    --auth-type NONE `
    --cors "AllowOrigins=https://$GitHubUsername.github.io,AllowMethods=GET,AllowHeaders=*" `
    --region us-east-1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! CORS is now restricted to your GitHub Pages site." -ForegroundColor Green
    Write-Host "Allowed origin: https://$GitHubUsername.github.io" -ForegroundColor White
    
    # Extract and display the new Function URL
    $functionUrl = ($result | ConvertFrom-Json).FunctionUrl
    Write-Host "`nNew Function URL: $functionUrl" -ForegroundColor Cyan
    Write-Host "Update your frontend to use this URL." -ForegroundColor Yellow
} else {
    Write-Host "Error occurred. Please check the output above." -ForegroundColor Red
} 