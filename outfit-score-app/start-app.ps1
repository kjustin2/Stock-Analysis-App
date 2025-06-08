# Outfit Score App - PowerShell Startup Script
# Run this with: powershell -ExecutionPolicy Bypass -File start-app.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Outfit Score App - Starting Up..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press any key to exit"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the outfit-score-app directory" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press any key to exit"
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press any key to exit"
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting the development server..." -ForegroundColor Blue
Write-Host ""
Write-Host "The app will open automatically in your browser" -ForegroundColor Yellow
Write-Host "If it doesn't, navigate to: http://localhost:3002" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start browser opener in background
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3002"
} | Out-Null

# Start the development server
npm run dev

# If we get here, the server stopped
Write-Host ""
Write-Host "🛑 Development server stopped" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press any key to exit" 