@echo off
setlocal enabledelayedexpansion
title EMR System - Setup Script
color 0A

echo.
echo  ========================================
echo  EMR SYSTEM - SETUP SCRIPT
echo  ========================================
echo.
echo [INFO] This script will setup the EMR system for first-time use
echo [INFO] Make sure Docker Desktop is running before proceeding
echo.

:CHECK_REQUIREMENTS
echo [STEP 1/5] Checking system requirements...

echo [LOG] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [SOLUTION] Download Node.js from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is available
)

echo [LOG] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available!
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm is available
)

echo [LOG] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo [SOLUTION] Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker is available
)

echo [LOG] Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo [SOLUTION] Start Docker Desktop and wait for it to be ready
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker daemon is running
)

:CREATE_ENV_FILES
echo [STEP 2/5] Creating environment files...

echo [LOG] Creating backend .env file...
if not exist "backend\.env" (
    echo # Server Configuration > backend\.env
    echo NODE_ENV=development >> backend\.env
    echo PORT=3001 >> backend\.env
    echo. >> backend\.env
    echo # Database Configuration >> backend\.env
    echo DB_HOST=postgres >> backend\.env
    echo DB_PORT=5432 >> backend\.env
    echo DB_NAME=emr_development >> backend\.env
    echo DB_USER=postgres >> backend\.env
    echo DB_PASSWORD=12345 >> backend\.env
    echo DB_SSL=false >> backend\.env
    echo DB_MAX_CONNECTIONS=20 >> backend\.env
    echo DB_CONNECTION_TIMEOUT=10000 >> backend\.env
    echo DB_IDLE_TIMEOUT=30000 >> backend\.env
    echo DB_AUTO_CREATE=true >> backend\.env
    echo DB_AUTO_CREATE_USER=true >> backend\.env
    echo. >> backend\.env
    echo # JWT Configuration >> backend\.env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025 >> backend\.env
    echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2025 >> backend\.env
    echo. >> backend\.env
    echo # Security Configuration >> backend\.env
    echo SESSION_SECRET=your-super-secret-session-key-change-this-in-production >> backend\.env
    echo. >> backend\.env
    echo # Email Configuration >> backend\.env
    echo SMTP_HOST=smtp.gmail.com >> backend\.env
    echo SMTP_PORT=587 >> backend\.env
    echo SMTP_USER=your-email@gmail.com >> backend\.env
    echo SMTP_PASSWORD=your-app-password >> backend\.env
    echo EMAIL_FROM=your-email@gmail.com >> backend\.env
    echo. >> backend\.env
    echo # Frontend URL >> backend\.env
    echo FRONTEND_URL=http://localhost:3000 >> backend\.env
    echo [SUCCESS] Backend .env created
) else (
    echo [SUCCESS] Backend .env already exists
)

echo [LOG] Creating frontend .env.local file...
if not exist "frontend\.env.local" (
    echo # API Configuration > frontend\.env.local
    echo NEXT_PUBLIC_API_URL=http://localhost:3001/api >> frontend\.env.local
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # Application Settings >> frontend\.env.local
    echo NEXT_PUBLIC_APP_NAME=EMR System >> frontend\.env.local
    echo NEXT_PUBLIC_APP_VERSION=1.0.0 >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # Feature Flags >> frontend\.env.local
    echo NEXT_PUBLIC_ENABLE_AI_FEATURES=true >> frontend\.env.local
    echo NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true >> frontend\.env.local
    echo NEXT_PUBLIC_ENABLE_WEBSOCKET=true >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # Development Settings >> frontend\.env.local
    echo NEXT_PUBLIC_DEBUG_MODE=true >> frontend\.env.local
    echo NEXT_PUBLIC_LOG_LEVEL=info >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # Security >> frontend\.env.local
    echo NEXT_PUBLIC_ENABLE_HTTPS=false >> frontend\.env.local
    echo NEXT_PUBLIC_COOKIE_SECURE=false >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # WebSocket >> frontend\.env.local
    echo NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001 >> frontend\.env.local
    echo. >> frontend\.env.local
    echo # Theme >> frontend\.env.local
    echo NEXT_PUBLIC_THEME=light >> frontend\.env.local
    echo NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6 >> frontend\.env.local
    echo [SUCCESS] Frontend .env.local created
) else (
    echo [SUCCESS] Frontend .env.local already exists
)

:INSTALL_DEPENDENCIES
echo [STEP 3/5] Installing dependencies...

echo [LOG] Installing backend dependencies...
if not exist "backend\node_modules" (
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [SUCCESS] Backend dependencies already installed
)

echo [LOG] Installing frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [SUCCESS] Frontend dependencies already installed
)

:CLEAN_DOCKER
echo [STEP 4/5] Cleaning up existing Docker containers...

echo [LOG] Stopping any existing containers...
docker compose down >nul 2>&1

echo [LOG] Removing any existing containers...
docker stop emr_redis >nul 2>&1
docker rm emr_redis >nul 2>&1
docker stop emr_postgres >nul 2>&1
docker rm emr_postgres >nul 2>&1
docker stop emr_backend >nul 2>&1
docker rm emr_backend >nul 2>&1
docker stop emr_frontend >nul 2>&1
docker rm emr_frontend >nul 2>&1

echo [SUCCESS] Docker cleanup completed

:START_SYSTEM
echo [STEP 5/5] Starting EMR system...

echo [LOG] Building and starting containers...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    echo [SOLUTION] Check if Docker Desktop is running and has enough resources
    pause
    exit /b 1
)

echo [SUCCESS] EMR containers started

echo [LOG] Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo [LOG] Checking service health...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [WARNING] Some services may not be running properly
) else (
    echo [SUCCESS] All services are running
)

echo.
echo  ========================================
echo     EMR SYSTEM SETUP COMPLETED!
echo  ========================================
echo.
echo [INFO] Setup completed at: %date% %time%
echo.
echo  System URLs:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo     Health Check: http://localhost:3001/health
echo.
echo [INFO] Next Steps:
echo     1. Use start.bat option [4] CREATE ADMIN to create admin user
echo     2. Then access the system at http://localhost:3000
echo.
echo [INFO] To manage the system, use start.bat
echo.

pause
