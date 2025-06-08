# Financial Adviser Application Startup Script
# This script will automatically build and start the application

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Financial Adviser Web Application" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Stop any existing Java processes to free up port 8080
Write-Host "Checking for existing application instances..." -ForegroundColor Yellow
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    Write-Host "Stopping existing Java processes..." -ForegroundColor Yellow
    Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ Previous instances stopped." -ForegroundColor Green
}

# Check if Java is installed
Write-Host "Checking Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Java not found"
    }
    Write-Host "✓ Java is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Java is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Java 21 or later and try again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Download Java from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if the JAR file exists
$jarPath = "target\financial-adviser-app-1.0-SNAPSHOT.jar"
if (-not (Test-Path $jarPath)) {
    Write-Host "JAR file not found. Building the application..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if Maven is installed
    try {
        $mavenVersion = mvn -version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Maven not found"
        }
        Write-Host "✓ Maven is installed" -ForegroundColor Green
    } catch {
        Write-Host "✗ ERROR: Maven is not installed or not in PATH." -ForegroundColor Red
        Write-Host "Please install Maven 3.9.5 or later and try again." -ForegroundColor Red
        Write-Host ""
        Write-Host "Download Maven from: https://maven.apache.org/download.cgi" -ForegroundColor Blue
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Build the application
    Write-Host "Building application..." -ForegroundColor Yellow
    try {
        mvn clean package -q
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Host "✓ Build completed successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "✗ ERROR: Build failed. Please check the error messages above." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the application
Write-Host "Starting Financial Adviser Web Application..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 The web application will be available at: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Blue
Write-Host ""
Write-Host "✨ Features:" -ForegroundColor White
Write-Host "   • Simple 8-field financial input form" -ForegroundColor Gray
Write-Host "   • Real-time financial health scoring (0-100)" -ForegroundColor Gray
Write-Host "   • 10-year wealth projection charts" -ForegroundColor Gray
Write-Host "   • Personalized financial recommendations" -ForegroundColor Gray
Write-Host "   • Complete privacy - all data stays local" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 API Endpoints (for developers):" -ForegroundColor White
Write-Host "   • Main App: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080/" -ForegroundColor Blue
Write-Host "   • Health Check: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080/api/health" -ForegroundColor Blue
Write-Host "   • Quick Analysis: " -NoNewline -ForegroundColor White  
Write-Host "POST http://localhost:8080/api/quick-score" -ForegroundColor Blue
Write-Host "   • Full Analysis: " -NoNewline -ForegroundColor White
Write-Host "POST http://localhost:8080/api/analyze" -ForegroundColor Blue
Write-Host ""
Write-Host "Starting server... Please wait for 'Started FinancialAdviserApplication' message" -ForegroundColor Yellow
Write-Host "Then open your browser to: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Run the application
try {
    java -jar $jarPath
} catch {
    Write-Host ""
    Write-Host "Application encountered an error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "Application has stopped." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
} 