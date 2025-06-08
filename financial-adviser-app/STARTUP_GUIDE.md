# 🚀 Financial Adviser - Quick Start Guide

## 1-Click Startup

Choose your platform and start the application:

### Windows
- **`start.bat`** - Double-click to start (Recommended)
- **`start.ps1`** - Right-click → "Run with PowerShell"
- **PowerShell**: Run `.\start.bat` or `powershell -ExecutionPolicy Bypass -File start.ps1`

### Linux/Mac
- **`start.sh`** - Run `./start.sh` in terminal

## What the Scripts Do

1. ✅ Stop any existing application instances (prevents port conflicts)
2. ✅ Check if Java 21+ is installed
3. ✅ Check if Maven is installed  
4. ✅ Build the application (first run only)
5. ✅ Start the web server
6. ✅ Display access information

## Access the Application

Once you see "Started FinancialAdviserApplication" message:

- **🌐 Main Web App**: http://localhost:8080
- **📊 Start Financial Planning**: Open your browser to http://localhost:8080
- **🔧 Health Check**: http://localhost:8080/api/health

## How to Use

1. **Open your browser** to http://localhost:8080
2. **Fill out the simple form** (just 8 fields!)
3. **Get instant analysis** with your financial health score
4. **View projections** and personalized recommendations
5. **All data stays local** - complete privacy

## Features

- ✨ **Financial Health Score** (0-100) with color-coded rating
- 📈 **10-Year Wealth Projections** with interactive charts
- 💡 **Personalized Recommendations** based on your profile
- 🔒 **Complete Privacy** - no data leaves your computer
- 📱 **Mobile-Friendly** responsive design

## Requirements

- **Java 21 or later** - [Download here](https://www.oracle.com/java/technologies/downloads/)
- **Maven 3.9.5+** - [Download here](https://maven.apache.org/download.cgi)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### Windows Issues
- If script won't run: Right-click → "Run as Administrator"
- For PowerShell: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Try `.\start.bat` instead of just `start.bat`

### Linux/Mac Issues  
- If permission denied: Run `chmod +x start.sh`
- Make sure Java and Maven are in your PATH

### Application Issues
- **Wait for startup**: Look for "Started FinancialAdviserApplication" message
- **Port busy**: If port 8080 is in use, stop other applications
- **Browser won't open**: Manually navigate to http://localhost:8080

## Stop the Application

Press **Ctrl+C** in the terminal window to stop the application.

---

For detailed documentation, see [README.md](README.md) 