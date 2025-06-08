@echo off
echo.
echo ========================================
echo   Outfit Score App - Starting Up...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the outfit-score-app directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🚀 Starting the development server...
echo.
echo The app will open automatically in your browser
echo If it doesn't, navigate to: http://localhost:3002
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the development server
npm run dev

REM If we get here, the server stopped
echo.
echo 🛑 Development server stopped
echo.
pause 