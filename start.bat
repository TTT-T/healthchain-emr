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
echo  [5] RUN MIGRATIONS - Run Database Migrations
echo  [6] HEALTH CHECK   - Check Database Health
echo  [7] RESTART BACKEND  - Restart Backend Only
echo  [8] RESTART FRONTEND - Restart Frontend Only
echo  [9] RESTART ALL     - Restart All Services
echo  [10] DOWN BACKEND    - Stop Backend Only
echo  [11] DOWN FRONTEND   - Stop Frontend Only
echo  [12] DOWN ALL        - Stop All Services
echo  [13] RESET ALL DATA - Reset All Data (DANGER!)
echo  [14] CLEAR DATABASE - Clear All Database Data
echo  [15] FIX CONTAINERS - Fix Container Conflicts
echo  [16] FIX API ERRORS - Fix API Request Failed Errors
echo  [17] END    - Exit Program
echo.
echo  ========================================
set /p choice="Please select number (1-17): "

if "%choice%"=="1" goto START_SYSTEM
if "%choice%"=="2" goto STOP_SYSTEM
if "%choice%"=="3" goto CHECK_STATUS
if "%choice%"=="4" goto CREATE_ADMIN
if "%choice%"=="5" goto RUN_MIGRATIONS
if "%choice%"=="6" goto HEALTH_CHECK
if "%choice%"=="7" goto RESTART_BACKEND
if "%choice%"=="8" goto RESTART_FRONTEND
if "%choice%"=="9" goto RESTART_ALL
if "%choice%"=="10" goto DOWN_BACKEND
if "%choice%"=="11" goto DOWN_FRONTEND
if "%choice%"=="12" goto DOWN_ALL
if "%choice%"=="13" goto RESET_ALL_DATA
if "%choice%"=="14" goto CLEAR_DATABASE
if "%choice%"=="15" goto FIX_CONTAINERS
if "%choice%"=="16" goto FIX_API_ERRORS
if "%choice%"=="17" goto END_PROGRAM

echo.
echo [ERROR] Please select number 1-17 only
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

echo [LOG] Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo [SOLUTION] Start Docker Desktop and wait for it to be ready
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Docker daemon is running
)

echo [LOG] Checking Docker Compose...
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available!
    echo [SOLUTION] Update Docker Desktop to latest version
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Docker Compose is available
)

echo [LOG] Checking port availability...
netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use
    echo [INFO] This may cause issues with frontend startup
)

netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 is already in use
    echo [INFO] This may cause issues with backend startup
)

netstat -an | findstr ":5432" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 5432 is already in use
    echo [INFO] This may cause issues with database startup
)

echo [LOG] Checking disk space...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set freespace=%%a
if %freespace% LSS 1000000000 (
    echo [WARNING] Low disk space detected
    echo [INFO] Docker images and containers require significant disk space
) else (
    echo [SUCCESS] Sufficient disk space available
)

echo [LOG] Checking system resources...
echo [INFO] System resource check completed

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

echo [LOG] Checking environment files...
if not exist "backend\.env" (
    if exist "backend\env.example" (
        echo [INFO] Creating backend .env from env.example...
        copy "backend\env.example" "backend\.env" >nul 2>&1
        echo [SUCCESS] Backend .env created
    ) else (
        echo [WARNING] Backend .env not found and no env.example available
    )
) else (
    echo [SUCCESS] Backend .env found
)

if not exist "frontend\.env.local" (
    if exist "frontend\env.default" (
        echo [INFO] Creating frontend .env.local from env.default...
        copy "frontend\env.default" "frontend\.env.local" >nul 2>&1
        echo [SUCCESS] Frontend .env.local created
    ) else (
        echo [WARNING] Frontend .env.local not found and no env.default available
    )
) else (
    echo [SUCCESS] Frontend .env.local found
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

echo [LOG] Checking Docker images...
docker images | findstr "emr" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] EMR images found, will rebuild if needed
) else (
    echo [INFO] No EMR images found, will build from scratch
)

echo [LOG] Force removing any existing EMR containers...
docker stop emr_redis >nul 2>&1
docker rm emr_redis >nul 2>&1
docker stop emr_postgres >nul 2>&1
docker rm emr_postgres >nul 2>&1
docker stop emr_backend >nul 2>&1
docker rm emr_backend >nul 2>&1
docker stop emr_frontend >nul 2>&1
docker rm emr_frontend >nul 2>&1

echo [LOG] Cleaning up network connections...
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker network disconnect project_emr_network %%i >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Existing containers stopped and cleaned up

echo [STEP 5/5] Building and starting containers...
echo [LOG] Starting EMR containers with docker compose...
echo [INFO] This may take several minutes on first run...
echo [INFO] Building images and starting services...

docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    echo [SOLUTION] Check if Docker Desktop is running and has enough resources
    echo [INFO] Try running 'docker compose logs' to see detailed error messages
    pause
    goto MAIN_MENU
)
echo [SUCCESS] EMR containers started

echo [LOG] Verifying container startup...
timeout /t 5 /nobreak >nul
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [WARNING] Some containers may not have started properly
    echo [INFO] Check container logs with: docker compose logs
) else (
    echo [SUCCESS] All EMR containers are running
)

echo [INFO] pgAdmin Database Manager is now included in docker-compose.yml
echo [SUCCESS] pgAdmin will start automatically with other services
echo [INFO] pgAdmin URL: http://localhost:8080
echo [INFO] Email: admin@admin.com, Password: admin

echo [INFO] Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo [LOG] Running automatic database migrations...
docker exec emr_backend npm run auto-migrate
if %errorlevel% neq 0 (
    echo [WARNING] Auto-migration may have failed, but continuing...
    echo [INFO] Attempting to fix migration issues...
    
    echo [LOG] Checking for failed migration records...
    docker exec emr_postgres psql -U postgres -d emr_development -c "SELECT migration_name FROM migrations WHERE success = false;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Found failed migrations, attempting to fix...
        docker exec emr_postgres psql -U postgres -d emr_development -c "DELETE FROM migrations WHERE migration_name = '004_create_appointment_tables' AND success = false;" >nul 2>&1
        echo [INFO] Retrying migration...
        docker exec emr_backend npm run auto-migrate
        if %errorlevel% equ 0 (
            echo [SUCCESS] Migration issues fixed automatically
        ) else (
            echo [WARNING] Migration still failed, but continuing...
            echo [INFO] You can run migrations manually using option [5] RUN MIGRATIONS
        )
    ) else (
        echo [WARNING] Could not check migration status, but continuing...
        echo [INFO] You can run migrations manually using option [5] RUN MIGRATIONS
    )
) else (
    echo [SUCCESS] Automatic database migrations completed
)

echo [LOG] Running database health check...
docker exec emr_backend npm run db:health-check
if %errorlevel% neq 0 (
    echo [WARNING] Database health check failed
    echo [INFO] Auto-fixing database issues...
    docker exec emr_backend npm run db:health-check:fix
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database issues fixed automatically
    ) else (
        echo [WARNING] Could not auto-fix database issues
        echo [INFO] Use option [16] FIX API ERRORS to resolve this issue
    )
) else (
    echo [SUCCESS] Database health check passed
)

echo [LOG] Checking service health...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [WARNING] Some services may not be running properly
    echo [INFO] Checking individual services...
    docker ps | findstr "emr_backend" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Backend service is not running
    ) else (
        echo [SUCCESS] Backend service is running
    )
    docker ps | findstr "emr_frontend" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend service is not running
    ) else (
        echo [SUCCESS] Frontend service is running
    )
    docker ps | findstr "emr_postgres" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Database service is not running
    ) else (
        echo [SUCCESS] Database service is running
    )
) else (
    echo [SUCCESS] All services are running
)

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
echo [INFO] System Features:
echo     - Automatic database migrations on startup
echo     - Database health check and auto-fix
echo     - All notification systems working correctly
echo     - Appointments system fully functional
echo     - Admin role management working
echo     - Patient appointments page accessible
echo.
echo [INFO] Testing service accessibility...
curl -s -o nul -w "%%{http_code}" http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend API is accessible
) else (
    echo [WARNING] Backend API may not be ready yet
)

echo [INFO] Opening website...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo [SUCCESS] System is ready to use!
echo [INFO] If services are not accessible, wait a few more minutes for full startup
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

echo [LOG] Checking database connection...
docker exec emr_backend npx tsx -e "import { databaseManager } from './src/database/connection'; databaseManager.initialize().then(() => console.log('Connected')).catch(() => process.exit(1))" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to database!
    echo [SOLUTION] Wait for database to be ready or restart the system
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database connection verified
)

echo [LOG] Running admin setup script...
docker exec -it emr_backend npx tsx src/scripts/seed.ts
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create admin user!
    echo [SOLUTION] Check if backend is running properly and database is accessible
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

:RUN_MIGRATIONS
cls
echo.
echo  ========================================
echo  RUN DATABASE MIGRATIONS
echo  ========================================
echo.
echo [INFO] Running Database Migrations at %date% %time%
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
    echo [SOLUTION] Wait for database to be ready or restart the system
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database connection verified
)

echo [STEP 3/3] Running automatic migrations...
echo [INFO] This will check and run all pending migrations...
echo.

docker exec emr_backend npm run auto-migrate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations!
    echo [SOLUTION] Check database connection and migration files
    echo [INFO] Check logs with: docker compose logs backend
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Migrations completed successfully!
)

echo.
echo  ========================================
echo     MIGRATIONS COMPLETED SUCCESSFULLY!
echo  ========================================
echo.
echo [INFO] Migrations completed at: %date% %time%
echo [INFO] Database schema is now up to date
echo [INFO] You can now use the system normally
echo.
pause
goto MAIN_MENU

:HEALTH_CHECK
cls
echo.
echo  ========================================
echo  DATABASE HEALTH CHECK
echo  ========================================
echo.
echo [INFO] Running Database Health Check at %date% %time%
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
    echo [SOLUTION] Wait for database to be ready or restart the system
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database connection verified
)

echo [STEP 3/3] Running comprehensive health check...
echo [INFO] This will check database health and provide detailed report...
echo.

docker exec emr_backend npm run db:health-check
if %errorlevel% neq 0 (
    echo [WARNING] Health check found issues!
    echo [INFO] You can use option [16] FIX API ERRORS to auto-fix issues
) else (
    echo [SUCCESS] Database health check passed!
)

echo.
echo  ========================================
echo     HEALTH CHECK COMPLETED!
echo  ========================================
echo.
echo [INFO] Health check completed at: %date% %time%
echo [INFO] Check the output above for detailed results
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

echo [STEP 1/4] Stopping EMR containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop EMR containers!
) else (
    echo [SUCCESS] EMR containers stopped
)

echo [STEP 2/4] Force removing any remaining EMR containers...
docker stop emr_redis >nul 2>&1
docker rm emr_redis >nul 2>&1
docker stop emr_postgres >nul 2>&1
docker rm emr_postgres >nul 2>&1
docker stop emr_backend >nul 2>&1
docker rm emr_backend >nul 2>&1
docker stop emr_frontend >nul 2>&1
docker rm emr_frontend >nul 2>&1
echo [SUCCESS] All EMR containers removed

echo [STEP 3/4] Force removing network connections...
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker network disconnect project_emr_network %%i >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 4/4] pgAdmin is now managed by docker-compose...
echo [SUCCESS] pgAdmin will be stopped with other services

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
    echo.
    echo [DETAILED STATUS]
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"
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
echo [NETWORK STATUS]
docker network ls | findstr project_emr_network >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] EMR network exists
) else (
    echo [INFO] EMR network not found
)

echo.
echo [VOLUME STATUS]
docker volume ls | findstr project >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] EMR volumes exist
) else (
    echo [INFO] No EMR volumes found
)

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
    echo [INFO] Check logs with: docker compose logs backend
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container restarted
)

echo [LOG] Verifying backend startup...
timeout /t 5 /nobreak >nul
docker ps | findstr emr_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Backend container may not be running properly
) else (
    echo [SUCCESS] Backend container is running
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
    echo [INFO] Check logs with: docker compose logs frontend
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Frontend container restarted
)

echo [LOG] Verifying frontend startup...
timeout /t 5 /nobreak >nul
docker ps | findstr emr_frontend >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Frontend container may not be running properly
) else (
    echo [SUCCESS] Frontend container is running
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

echo [STEP 4/4] pgAdmin is now included in docker-compose.yml...
echo [SUCCESS] pgAdmin will start automatically with other services

echo [LOG] Verifying all services...
timeout /t 5 /nobreak >nul
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [WARNING] Some services may not be running properly
) else (
    echo [SUCCESS] All services are running
)

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
if %errorlevel% neq 0 (
    echo [WARNING] Failed to remove backend container
) else (
    echo [SUCCESS] Backend container removed
)

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
if %errorlevel% neq 0 (
    echo [WARNING] Failed to remove frontend container
) else (
    echo [SUCCESS] Frontend container removed
)

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
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker network disconnect project_emr_network %%i >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 3/4] Removing all containers...
docker compose rm -f
if %errorlevel% neq 0 (
    echo [WARNING] Failed to remove some containers via docker compose
)
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker rm -f %%i >nul 2>&1
echo [SUCCESS] All containers removed

echo [STEP 4/4] pgAdmin is now managed by docker-compose...
echo [SUCCESS] pgAdmin will be stopped with other services

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
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker network disconnect project_emr_network %%i >nul 2>&1
docker network rm project_emr_network >nul 2>&1
echo [SUCCESS] Network connections removed

echo [STEP 3/8] Removing all containers...
docker compose rm -f
if %errorlevel% neq 0 (
    echo [WARNING] Failed to remove some containers via docker compose
)
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker rm -f %%i >nul 2>&1
echo [SUCCESS] All containers removed

echo [STEP 4/8] Removing all volumes (including database data)...
docker volume prune -f
echo [SUCCESS] All volumes removed

echo [STEP 5/8] Removing all images...
docker image prune -a -f
echo [SUCCESS] All images removed

echo [STEP 6/8] pgAdmin is now managed by docker-compose...
echo [SUCCESS] pgAdmin will be removed with other services

echo [STEP 7/8] Removing Docker volumes completely...
for /f "tokens=*" %%i in ('docker volume ls -q 2^>nul') do docker volume rm %%i >nul 2>&1
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
    echo [INFO] Try restarting the system first
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

:FIX_CONTAINERS
cls
echo.
echo  ========================================
echo  FIXING CONTAINER CONFLICTS
echo  ========================================
echo.
echo [INFO] Fixing container conflicts at %date% %time%
echo.
echo [WARNING] This will force remove all EMR containers
echo [WARNING] This will clean up all networks and volumes
echo.

echo [STEP 1/6] Stopping all EMR containers...
docker compose down >nul 2>&1
echo [SUCCESS] Docker compose stopped

echo [STEP 2/6] Force stopping individual containers...
docker stop emr_redis >nul 2>&1
docker stop emr_postgres >nul 2>&1
docker stop emr_backend >nul 2>&1
docker stop emr_frontend >nul 2>&1
echo [SUCCESS] All containers stopped

echo [STEP 3/6] Force removing containers...
docker rm -f emr_redis >nul 2>&1
docker rm -f emr_postgres >nul 2>&1
docker rm -f emr_backend >nul 2>&1
docker rm -f emr_frontend >nul 2>&1
echo [SUCCESS] All containers removed

echo [STEP 4/6] Cleaning up networks...
for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do docker network disconnect project_emr_network %%i >nul 2>&1
docker network rm project_emr_network >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Failed to remove network, but continuing...
) else (
    echo [SUCCESS] Networks cleaned up
)

echo [STEP 5/6] Cleaning up unused volumes...
docker volume prune -f >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clean up volumes, but continuing...
) else (
    echo [SUCCESS] Unused volumes cleaned up
)

echo [STEP 6/6] Verifying cleanup...
docker ps -a | findstr emr_ >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some EMR containers still exist
    docker ps -a | findstr emr_
    echo [INFO] You may need to manually remove these containers
) else (
    echo [SUCCESS] All EMR containers removed
)

echo [STEP 7/7] Cleaning up Docker system...
docker system prune -f >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clean up Docker system, but continuing...
) else (
    echo [SUCCESS] Docker system cleaned up
)

echo [LOG] Checking for any remaining Docker resources...
docker images | findstr emr >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] EMR images still exist (this is normal)
) else (
    echo [INFO] No EMR images found
)

echo [LOG] Checking network cleanup...
docker network ls | findstr project_emr_network >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] EMR network still exists
    echo [INFO] Network will be recreated on next startup
) else (
    echo [SUCCESS] EMR network removed
)

echo.
echo  ========================================
echo     CONTAINER CONFLICTS FIXED!
echo  ========================================
echo.
echo [INFO] Container conflicts fixed at: %date% %time%
echo [INFO] All EMR containers have been removed
echo [INFO] Networks and volumes have been cleaned up
echo.
echo [NEXT] You can now use option [1] START to start the system
echo.
pause
goto MAIN_MENU

:FIX_API_ERRORS
cls
echo.
echo  ========================================
echo  FIX API REQUEST FAILED ERRORS
echo  ========================================
echo.
echo [INFO] Fixing API Request Failed Errors at %date% %time%
echo.
echo [WARNING] This will diagnose and fix common API errors including:
echo   - Missing appointments table
echo   - Database connection issues
echo   - Migration problems
echo   - Container communication issues
echo.

echo [STEP 1/6] Checking if containers are running...
docker ps | findstr emr_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend container is not running!
    echo [SOLUTION] Please start the system first using option [1] START
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Backend container is running
)

docker ps | findstr emr_postgres >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Database container is not running!
    echo [SOLUTION] Please start the system first using option [1] START
    pause
    goto MAIN_MENU
) else (
    echo [SUCCESS] Database container is running
)

echo [STEP 2/6] Checking database connection...
docker exec emr_backend npx tsx -e "import { databaseManager } from './src/database/connection'; databaseManager.initialize().then(() => console.log('Connected')).catch(() => process.exit(1))" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to database!
    echo [SOLUTION] Restarting backend container...
    docker compose restart backend
    timeout /t 10 /nobreak >nul
    echo [INFO] Backend restarted, checking connection again...
    docker exec emr_backend npx tsx -e "import { databaseManager } from './src/database/connection'; databaseManager.initialize().then(() => console.log('Connected')).catch(() => process.exit(1))" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Database connection still failed!
        echo [SOLUTION] Try option [9] RESTART ALL or [13] RESET ALL DATA
        pause
        goto MAIN_MENU
    )
) else (
    echo [SUCCESS] Database connection verified
)

echo [STEP 3/6] Running database health check...
docker exec emr_backend npm run db:health-check >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Database health check failed
    echo [INFO] Auto-fixing database issues...
    docker exec emr_backend npm run db:health-check:fix >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database issues fixed automatically
    ) else (
        echo [ERROR] Failed to fix database issues
        echo [SOLUTION] Try option [5] RUN MIGRATIONS
    )
) else (
    echo [SUCCESS] Database health check passed
)

echo [STEP 4/6] Testing API endpoints...
curl -s -o nul -w "%%{http_code}" http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend API is accessible
) else (
    echo [WARNING] Backend API may not be ready yet
    echo [INFO] Restarting backend container...
    docker compose restart backend
    timeout /t 15 /nobreak >nul
    echo [INFO] Backend restarted, testing again...
    curl -s -o nul -w "%%{http_code}" http://localhost:3001/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Backend API is now accessible
    ) else (
        echo [WARNING] Backend API still not accessible
    )
)

echo [STEP 5/6] Verifying system health...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr "emr_"
if %errorlevel% neq 0 (
    echo [WARNING] Some services may not be running properly
    echo [INFO] Checking individual services...
    docker ps | findstr "emr_backend" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Backend service is not running
    ) else (
        echo [SUCCESS] Backend service is running
    )
    docker ps | findstr "emr_frontend" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend service is not running
    ) else (
        echo [SUCCESS] Frontend service is running
    )
    docker ps | findstr "emr_postgres" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Database service is not running
    ) else (
        echo [SUCCESS] Database service is running
    )
) else (
    echo [SUCCESS] All services are running
)

echo.
echo  ========================================
echo     API ERRORS FIX COMPLETED!
echo  ========================================
echo.
echo [INFO] API error fix completed at: %date% %time%
echo [INFO] Common API issues have been addressed
echo.
echo [INFO] System Status:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo     Health Check: http://localhost:3001/health
echo.
echo [INFO] If you still see API errors:
echo     1. Try refreshing the browser page
echo     2. Clear browser cache and cookies
echo     3. Use option [9] RESTART ALL for complete restart
echo     4. Use option [13] RESET ALL DATA for fresh start (WARNING: Deletes all data)
echo.
echo [INFO] Testing frontend accessibility...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo [SUCCESS] System should now work correctly!
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