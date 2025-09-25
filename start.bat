@echo off
echo ========================================
echo    EMR System - One Click Start
echo ========================================
echo.

echo [1/4] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✓ Docker is installed

echo.
echo [2/4] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not available!
    pause
    exit /b 1
)
echo ✓ Docker Compose is available

echo.
echo [3/4] Starting EMR System...
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
