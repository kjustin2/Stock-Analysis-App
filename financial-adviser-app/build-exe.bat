@echo off
title Financial Adviser - Build Process
echo ===================================
echo Financial Adviser Build Process
echo ===================================
echo.

REM Enable command output
@echo on

REM Check if Java is installed and print version
echo Checking Java installation...
java -version
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH. Please install Java 21 or later.
    pause
    exit /b 1
)

REM Check if Maven is installed and print version
echo.
echo Checking Maven installation...
call mvn -v
if errorlevel 1 (
    echo ERROR: Maven is not installed or not in PATH. Please install Maven 3.9.5 or later.
    pause
    exit /b 1
)

REM Set the working directory to the application directory
echo.
echo Setting working directory...
cd /d "%~dp0"
echo Current directory: %CD%

REM Clean any previous builds
echo.
echo Cleaning previous builds...
if exist "target" rd /s /q "target"
if exist "dist" rd /s /q "dist"

REM Create dist directory
mkdir dist

REM Build the executable
echo.
echo Building the application...
echo This may take a few minutes...
call mvn clean package -e

if errorlevel 1 (
    echo.
    echo ERROR: Build failed. See the error messages above.
    pause
    exit /b 1
)

REM Check if the executable was created
echo.
echo Checking build output...
if not exist "target\FinancialAdviser.exe" (
    echo ERROR: FinancialAdviser.exe was not created.
    echo Please check the build logs for errors.
    pause
    exit /b 1
)

REM Copy the executable to dist folder
echo.
echo Copying executable to dist folder...
copy /Y "target\FinancialAdviser.exe" "dist\"
if errorlevel 1 (
    echo ERROR: Failed to copy executable to dist folder.
    pause
    exit /b 1
)

REM Copy dependencies and resources
echo.
echo Copying additional resources...
xcopy /Y /E "target\lib" "dist\lib\"
if exist "target\resources" xcopy /Y /E "target\resources" "dist\resources\"

echo.
echo ===================================
echo Build completed successfully!
echo ===================================
echo.
echo The executable is available at: dist\FinancialAdviser.exe
echo.
echo You can now:
echo 1. Run the application directly from dist\FinancialAdviser.exe
echo 2. Create a shortcut to the executable on your desktop
echo.
pause 