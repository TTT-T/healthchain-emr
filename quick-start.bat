@echo off
echo ========================================
echo    EMR System - Quick Start
echo ========================================
echo.

echo This script will help you get started quickly.
echo.

echo [1/3] Checking if Docker is installed...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed.
    echo.
    echo Please install Docker Desktop first:
    echo 1. Download from: https://www.docker.com/products/docker-desktop
    echo 2. Install Docker Desktop
    echo 3. Start Docker Desktop
    echo 4. Run this script again
    echo.
    echo The download page will open in your browser...
    timeout /t 3 /nobreak >nul
    start https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ Docker is installed
echo.

echo [2/3] Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running.
    echo.
    echo Please start Docker Desktop:
    echo 1. Look for Docker Desktop icon in system tray
    echo 2. Right-click and select "Start Docker Desktop"
    echo 3. Wait for Docker to start (whale icon should be stable)
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✓ Docker is running
echo.

echo [3/3] Starting EMR System...
echo This may take a few minutes on first run...
echo.

docker-compose -f docker-compose.simple.yml up --build

echo.
echo ========================================
echo    EMR System Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📚 API Docs: http://localhost:3001/api-docs
echo.
echo Test Accounts:
echo 👨‍💼 Admin: admin@example.com / admin123
echo 👨‍⚕️ Doctor: doctor@example.com / doctor123
echo 👩‍⚕️ Nurse: nurse@example.com / nurse123
echo 🏥 Patient: patient@example.com / patient123
echo.
echo Press any key to stop the system...
pause >nul

echo.
echo Stopping EMR System...
docker-compose -f docker-compose.simple.yml down
echo System stopped.
pause
