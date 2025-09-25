@echo off
title EMR System - Electronic Medical Records
color 0A

echo.
echo  ███████╗███╗   ███╗██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
echo  ██╔════╝████╗ ████║██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
echo  █████╗  ██╔████╔██║██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
echo  ██╔══╝  ██║╚██╔╝██║██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
echo  ███████╗██║ ╚═╝ ██║██║  ██║    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
echo  ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
echo.
echo  ========================================
echo     Electronic Medical Records System
echo  ========================================
echo.

echo [INFO] Checking system requirements...

:: Check if Docker is installed and running
echo [1/6] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo [INFO] Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo [INFO] After installation, start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker is available

:: Check if Docker Compose is available
echo [2/6] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available!
    echo [INFO] Please ensure Docker Desktop is properly installed.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Compose is available

:: Check if ports are available
echo [3/6] Checking port availability...
netstat -an | find "3000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use. Stopping existing containers...
    docker-compose down >nul 2>&1
    timeout /t 3 /nobreak >nul
)

netstat -an | find "3001" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 is already in use. Stopping existing containers...
    docker-compose down >nul 2>&1
    timeout /t 3 /nobreak >nul
)
echo [OK] Ports are available

:: Start the EMR system
echo [4/6] Starting EMR System containers...
echo [INFO] This may take a few minutes on first run...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start EMR System containers!
    echo [INFO] Please check Docker Desktop is running and try again.
    echo.
    pause
    exit /b 1
)

:: Wait for services to start
echo [5/6] Waiting for services to initialize...
echo [INFO] Please wait while services are starting up...
timeout /t 15 /nobreak >nul

:: Check if services are running
echo [6/6] Verifying services...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"

echo.
echo  ========================================
echo     EMR System Started Successfully!
echo  ========================================
echo.
echo  🌐 Application URLs:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo.
echo  🗄️  Database Services:
echo     PostgreSQL: localhost:5432
echo     Redis:      localhost:6379
echo.
echo  👤 Default Admin Login:
echo     Username: admin
echo     Password: password123
echo.
echo  📋 Available User Accounts:
echo     Admin:  admin / password123
echo     Doctor: doctor / password123
echo     Patient: patient / password123
echo.
echo  ========================================
echo.
echo [INFO] Opening EMR System in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo [INFO] EMR System is now running!
echo [INFO] Press Ctrl+C to stop the system, or close this window.
echo [INFO] To stop the system later, run: docker-compose down
echo.

:: Keep the window open and show live logs
echo [INFO] Showing live system logs (Press Ctrl+C to exit)...
echo.
docker-compose logs -f
