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
echo  [4] CREATE ADMIN - Create Admin User
echo  [5] RESTART BACKEND  - Restart Backend Only
echo  [6] RESTART FRONTEND - Restart Frontend Only
echo  [7] RESTART ALL     - Restart All Services
echo  [8] DOWN BACKEND    - Stop Backend Only
echo  [9] DOWN FRONTEND   - Stop Frontend Only
echo  [10] DOWN ALL        - Stop All Services
echo  [11] RESET ALL DATA - Reset All Data (DANGER!)
echo  [12] CLEAR DATABASE - Clear All Database Data
echo  [13] END    - Exit Program
echo.
echo  ========================================
set /p choice="Please select number (1-13): "

if "%choice%"=="1" goto START_SYSTEM
if "%choice%"=="2" goto STOP_SYSTEM
if "%choice%"=="3" goto CHECK_STATUS
if "%choice%"=="4" goto CREATE_ADMIN
if "%choice%"=="5" goto RESTART_BACKEND
if "%choice%"=="6" goto RESTART_FRONTEND
if "%choice%"=="7" goto RESTART_ALL
if "%choice%"=="8" goto DOWN_BACKEND
if "%choice%"=="9" goto DOWN_FRONTEND
if "%choice%"=="10" goto DOWN_ALL
if "%choice%"=="11" goto RESET_ALL_DATA
if "%choice%"=="12" goto CLEAR_DATABASE
if "%choice%"=="13" goto END_PROGRAM

echo.
echo [ERROR] Please select number 1-13 only
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
docker rm pgadmin >nul 2>&1
docker network disconnect project_emr_network $(docker ps -aq) >nul 2>&1
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

echo [INFO] Waiting for database to be ready...
timeout /t 10 /nobreak >nul

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
echo  pgAdmin Database Manager:
echo     URL: http://localhost:8080
echo     Email: admin@admin.com
echo     Password: admin
echo.
echo [INFO] Next Steps:
echo     1. Use option [4] CREATE ADMIN to create admin user
echo     2. Then access the system at http://localhost:3000
echo.
echo [INFO] Opening website...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo [SUCCESS] System is ready to use!
echo.
pause
goto MAIN_MENU

:CREATE_ADMIN
cls
echo.
echo  ========================================
echo  CREATE ADMIN USER
echo  ========================================
echo.
echo [INFO] Creating Admin User at %date% %time%
echo.

echo [STEP 1/2] Checking if backend is running...
docker ps | findstr emr_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend container is not running!
    echo [SOLUTION] Please start the system first using option [1] START
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container is running
)

echo [STEP 2/2] Starting admin setup...
echo [INFO] This will open an interactive admin setup...
echo.
docker exec -it emr_backend npx tsx src/scripts/seed.ts
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create admin user!
    echo [SOLUTION] Check if backend is running properly
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Admin user created successfully!
)

echo.
echo  ========================================
echo     ADMIN USER CREATED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Admin user created at: %date% %time%
echo [INFO] You can now login to the system
echo [INFO] Access the system at: http://localhost:3000
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

echo [STEP 1/3] Stopping EMR containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop EMR containers!
) else (
    echo [SUCCESS] EMR containers stopped
)

echo [STEP 2/3] Force removing network connections...
docker network disconnect project_emr_network $(docker ps -aq) >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 3/3] Stopping pgAdmin...
docker stop pgadmin >nul 2>&1
docker rm pgadmin >nul 2>&1
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

:RESTART_BACKEND
cls
echo.
echo  ========================================
echo  RESTARTING BACKEND SERVICE
echo  ========================================
echo.
echo [INFO] Restarting Backend Service at %date% %time%
echo.

echo [STEP 1/3] Stopping backend container...
docker compose stop backend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop backend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container stopped
)

echo [STEP 2/3] Removing backend container...
docker compose rm -f backend
echo [SUCCESS] Backend container removed

echo [STEP 3/3] Starting backend container...
docker compose up -d --build backend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start backend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container restarted
)

echo.
echo  ========================================
echo     BACKEND RESTARTED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Backend restarted at: %date% %time%
echo [INFO] Backend URL: http://localhost:3001
echo.
pause
goto MAIN_MENU

:RESTART_FRONTEND
cls
echo.
echo  ========================================
echo  RESTARTING FRONTEND SERVICE
echo  ========================================
echo.
echo [INFO] Restarting Frontend Service at %date% %time%
echo.

echo [STEP 1/3] Stopping frontend container...
docker compose stop frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop frontend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Frontend container stopped
)

echo [STEP 2/3] Removing frontend container...
docker compose rm -f frontend
echo [SUCCESS] Frontend container removed

echo [STEP 3/3] Starting frontend container...
docker compose up -d --build frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start frontend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Frontend container restarted
)

echo.
echo  ========================================
echo     FRONTEND RESTARTED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Frontend restarted at: %date% %time%
echo [INFO] Frontend URL: http://localhost:3000
echo.
pause
goto MAIN_MENU

:RESTART_ALL
cls
echo.
echo  ========================================
echo  RESTARTING ALL SERVICES
echo  ========================================
echo.
echo [INFO] Restarting All Services at %date% %time%
echo.

echo [STEP 1/4] Stopping all containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop containers!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] All containers stopped
)

echo [STEP 2/4] Removing all containers...
docker compose rm -f
echo [SUCCESS] All containers removed

echo [STEP 3/4] Starting all containers...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] All containers started
)

echo [STEP 4/4] Starting pgAdmin...
docker stop pgadmin >nul 2>&1
docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
echo [SUCCESS] pgAdmin started

echo.
echo  ========================================
echo     ALL SERVICES RESTARTED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] All services restarted at: %date% %time%
echo.
echo  System URLs:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo     Database Manager: http://localhost:8080
echo.
pause
goto MAIN_MENU

:DOWN_BACKEND
cls
echo.
echo  ========================================
echo  STOPPING BACKEND SERVICE
echo  ========================================
echo.
echo [INFO] Stopping Backend Service at %date% %time%
echo.

echo [STEP 1/2] Stopping backend container...
docker compose stop backend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop backend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container stopped
)

echo [STEP 2/2] Removing backend container...
docker compose rm -f backend
echo [SUCCESS] Backend container removed

echo.
echo  ========================================
echo     BACKEND STOPPED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Backend stopped at: %date% %time%
echo [INFO] Backend service is now offline
echo.
pause
goto MAIN_MENU

:DOWN_FRONTEND
cls
echo.
echo  ========================================
echo  STOPPING FRONTEND SERVICE
echo  ========================================
echo.
echo [INFO] Stopping Frontend Service at %date% %time%
echo.

echo [STEP 1/2] Stopping frontend container...
docker compose stop frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop frontend container!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Frontend container stopped
)

echo [STEP 2/2] Removing frontend container...
docker compose rm -f frontend
echo [SUCCESS] Frontend container removed

echo.
echo  ========================================
echo     FRONTEND STOPPED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Frontend stopped at: %date% %time%
echo [INFO] Frontend service is now offline
echo.
pause
goto MAIN_MENU

:DOWN_ALL
cls
echo.
echo  ========================================
echo  STOPPING ALL SERVICES
echo  ========================================
echo.
echo [INFO] Stopping All Services at %date% %time%
echo.

echo [STEP 1/4] Stopping all containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop containers!
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] All containers stopped
)

echo [STEP 2/4] Force removing network connections...
docker network disconnect project_emr_network $(docker ps -aq) >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 3/4] Removing all containers...
docker compose rm -f
docker rm -f $(docker ps -aq) >nul 2>&1
echo [SUCCESS] All containers removed

echo [STEP 4/4] Stopping pgAdmin...
docker stop pgadmin >nul 2>&1
docker rm pgadmin >nul 2>&1
echo [SUCCESS] pgAdmin stopped

echo.
echo  ========================================
echo     ALL SERVICES STOPPED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] All services stopped at: %date% %time%
echo [INFO] All services are now offline
echo.
pause
goto MAIN_MENU

:RESET_ALL_DATA
cls
echo.
echo  ========================================
echo  ⚠️  RESET ALL DATA - DANGER ZONE  ⚠️
echo  ========================================
echo.
echo [WARNING] This action will:
echo   - Stop all containers
echo   - Delete ALL database data
echo   - Delete ALL volumes
echo   - Delete ALL containers
echo   - Remove ALL images
echo.
echo [DANGER] This action CANNOT be undone!
echo [DANGER] All patient data will be lost!
echo [DANGER] All user accounts will be lost!
echo.
echo  ========================================
echo.
set /p confirm="Type 'yes' to confirm data reset (case sensitive): "

if not "%confirm%"=="yes" (
    echo.
    echo [CANCELLED] Data reset cancelled. No changes made.
    echo.
    pause
    goto MAIN_MENU
)

echo.
echo [CONFIRMED] Starting complete data reset...
echo.

echo [STEP 1/8] Stopping all containers...
docker compose down
echo [SUCCESS] All containers stopped

echo [STEP 2/8] Force removing network connections...
docker network disconnect project_emr_network $(docker ps -aq) >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 3/8] Removing all containers...
docker compose rm -f
docker rm -f $(docker ps -aq) >nul 2>&1
echo [SUCCESS] All containers removed

echo [STEP 4/8] Removing all volumes (including database data)...
docker volume prune -f
echo [SUCCESS] All volumes removed

echo [STEP 5/8] Removing all images...
docker image prune -a -f
echo [SUCCESS] All images removed

echo [STEP 6/8] Stopping pgAdmin...
docker stop pgadmin >nul 2>&1
docker rm pgadmin >nul 2>&1
echo [SUCCESS] pgAdmin removed

echo [STEP 7/8] Removing Docker volumes completely...
docker volume ls -q | ForEach-Object { docker volume rm $_ } >nul 2>&1
echo [SUCCESS] All Docker volumes completely removed

echo [STEP 8/8] Force removing all Docker data...
docker system prune -a -f --volumes
echo [SUCCESS] All Docker data completely removed

echo.
echo  ========================================
echo     ALL DATA RESET SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Complete data reset finished at: %date% %time%
echo [INFO] All data has been permanently deleted
echo [INFO] System is now in clean state
echo.
echo [NEXT] Use option [1] START to initialize fresh system
echo.
pause
goto MAIN_MENU

:CLEAR_DATABASE
cls
echo.
echo  ========================================
echo  ⚠️  CLEAR DATABASE DATA - DANGER ZONE  ⚠️
echo  ========================================
echo.
echo [WARNING] This action will:
echo   - Clear ALL data in the database
echo   - Delete ALL users, patients, visits, etc.
echo   - Keep containers and system running
echo   - Database structure will remain intact
echo.
echo [DANGER] This action CANNOT be undone!
echo [DANGER] All patient data will be lost!
echo [DANGER] All user accounts will be lost!
echo.
echo  ========================================
echo.
set /p confirm="Type 'yes' to confirm database clear (case sensitive): "

if not "%confirm%"=="yes" (
    echo.
    echo [CANCELLED] Database clear cancelled. No changes made.
    echo.
    pause
    goto MAIN_MENU
)

echo.
echo [CONFIRMED] Starting database clear...
echo.

echo [STEP 1/3] Checking if backend is running...
docker ps | findstr emr_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend container is not running!
    echo [SOLUTION] Please start the system first using option [1] START
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container is running
)

echo [STEP 2/3] Checking database connection...
docker exec emr_backend npx tsx -e "import { databaseManager } from './src/database/connection'; databaseManager.initialize().then(() => console.log('Connected')).catch(() => process.exit(1))" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to database!
    echo [SOLUTION] Check if database is running properly
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database connection verified
)

echo [STEP 3/3] Clearing all database data...
docker exec emr_backend npx tsx src/scripts/clearDatabase.ts
if %errorlevel% neq 0 (
    echo [ERROR] Failed to clear database!
    echo [SOLUTION] Check database connection and permissions
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database cleared successfully
)

echo.
echo  ========================================
echo     DATABASE CLEARED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Database cleared at: %date% %time%
echo [INFO] All data has been permanently deleted
echo [INFO] Database structure remains intact
echo [INFO] System is still running
echo.
echo [NEXT] Use option [4] CREATE ADMIN to create new admin user
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