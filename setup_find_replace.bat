@echo off
REM Firebase Find and Replace Setup Script for Windows

echo Setting up Firebase Find and Replace Script...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install firebase-admin

REM Create backup directory
if not exist "firebase_backups" mkdir firebase_backups

echo.
echo Setup complete! 🎉
echo.
echo Next steps:
echo 1. Set up your Firebase credentials:
echo    set GOOGLE_APPLICATION_CREDENTIALS=your-service-account-key.json
echo.
echo 2. Test the script:
echo    node firebase_find_replace.js --help
echo.
echo 3. Run a dry-run test:
echo    node firebase_find_replace.js -c people -f name --find "test" --replace "updated" --dry-run
echo.
echo For more information, see README_find_replace.md
pause
