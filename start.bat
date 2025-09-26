@echo off
setlocal enabledelayedexpansion
title EMR System - Electronic Medical Records Management
color 0A

:MAIN_MENU
cls
echo.
echo  ========================================
echo  EMR SYSTEM - Electronic Medical Records
echo  ========================================
echo.
echo  Select Action:
echo.
echo  [1] START  - Start EMR System
echo  [2] STOP   - Stop EMR System  
echo  [3] STATUS - Check System Status
echo  [4] END    - Exit Program
echo.
echo  ========================================
set /p choice="Please select number (1-4): "

if "%choice%"=="1" goto START_SYSTEM
if "%choice%"=="2" goto STOP_SYSTEM
if "%choice%"=="3" goto CHECK_STATUS
if "%choice%"=="4" goto END_PROGRAM

echo.
echo [ERROR] Please select number 1-4 only
timeout /t 2 /nobreak >nul
goto MAIN_MENU

:START_SYSTEM
cls
echo.
echo  ========================================
echo  STARTING EMR SYSTEM
echo  ========================================
echo.
echo [INFO] Starting EMR System at %date% %time%
echo.

echo [STEP 1/5] Checking system requirements...
echo [LOG] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [SOLUTION] Download Node.js from: https://nodejs.org/
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Node.js is available
)

echo [LOG] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] npm is available
)

echo [LOG] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo [SOLUTION] Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Docker is available
)

echo [STEP 2/5] Checking project structure...
if not exist "frontend" (
    echo [ERROR] Frontend directory not found!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Frontend directory found
)

if not exist "backend" (
    echo [ERROR] Backend directory not found!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend directory found
)

if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] docker-compose.yml found
)

echo [STEP 3/5] Installing dependencies...
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies!
        cd ..
        pause
        goto MAIN_MENU
    )
    cd ..
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [SUCCESS] Frontend dependencies already installed
)

if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies!
        cd ..
        pause
        goto MAIN_MENU
    )
    cd ..
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [SUCCESS] Backend dependencies already installed
)

echo [STEP 4/5] Stopping existing containers...
echo [LOG] Stopping any running EMR containers...
docker compose down >nul 2>&1
docker stop pgadmin >nul 2>&1
echo [SUCCESS] Existing containers stopped

echo [STEP 5/5] Building and starting containers...
echo [LOG] Starting EMR containers with docker compose...
echo [INFO] This may take several minutes on first run...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    echo [SOLUTION] Check if Docker Desktop is running
    pause
    goto MAIN_MENU
)
echo [SUCCESS] EMR containers started

echo [INFO] Setting up pgAdmin Database Manager...
docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
echo [SUCCESS] pgAdmin Database Manager started

echo.
echo  ========================================
echo     EMR SYSTEM STARTED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] System started at: %date% %time%
echo.
echo  System URLs:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo     Database Manager: http://localhost:8080
echo.
echo  Default User Accounts:
echo     Admin:  admin / password123
echo     Doctor: doctor / password123
echo     Patient: patient / password123
echo.
echo  pgAdmin Database Manager:
echo     URL: http://localhost:8080
echo     Email: admin@admin.com
echo     Password: admin
echo.
echo [INFO] Opening website...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo [SUCCESS] System is ready to use!
echo.
pause
goto MAIN_MENU

:STOP_SYSTEM
cls
echo.
echo  ========================================
echo  STOPPING EMR SYSTEM
echo  ========================================
echo.
echo [INFO] Stopping EMR System at %date% %time%
echo.

echo [STEP 1/2] Stopping EMR containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop EMR containers!
) else (
    echo [SUCCESS] EMR containers stopped
)

echo [STEP 2/2] Stopping pgAdmin...
docker stop pgadmin >nul 2>&1
echo [SUCCESS] pgAdmin stopped

echo.
echo  ========================================
echo     EMR SYSTEM STOPPED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] System stopped at: %date% %time%
echo.
pause
goto MAIN_MENU

:CHECK_STATUS
cls
echo.
echo  ========================================
echo  EMR SYSTEM STATUS
echo  ========================================
echo.
echo [INFO] Status check performed at: %date% %time%
echo.

echo [CONTAINER STATUS]
echo [LOG] Checking running containers...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [INFO] No EMR containers currently running
) else (
    echo [SUCCESS] EMR containers are running
)

echo.
echo [PGADMIN STATUS]
docker ps | findstr pgadmin >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] pgAdmin - Running
) else (
    echo [INFO] pgAdmin - Not Running
)

echo.
echo [PORT STATUS]
echo [INFO] Ports should be available at:
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend: http://localhost:3001
echo [INFO] pgAdmin: http://localhost:8080

echo.
pause
goto MAIN_MENU

:END_PROGRAM
cls
echo.
echo  ========================================
echo  EXITING EMR SYSTEM MANAGER
echo  ========================================
echo.
echo [INFO] Program exit requested at: %date% %time%
echo.
echo [INFO] Thank you for using EMR System Manager
echo.
timeout /t 3 /nobreak >nul
exit /b 0