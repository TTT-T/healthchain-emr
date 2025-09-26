@echo off
title EMR System - Electronic Medical Records Management
color 0A

:MAIN_MENU
cls
echo.
echo  ========================================
echo  EMR SYSTEM - Electronic Medical Records
echo  ========================================
echo.
echo  ========================================
echo     Electronic Medical Records System
echo  ========================================
echo.
echo  Select Action:
echo.
echo  [1] Start EMR System
echo  [2] Stop EMR System
echo  [3] Restart EMR System
echo  [4] Check System Status
echo  [5] View System Logs
echo  [6] Reset System (Clear Data)
echo  [7] Open Website
echo  [8] Start pgAdmin (Database Manager)
echo  [9] Check Dependencies & Libraries
echo  [10] Exit Program
echo.
echo  ========================================
set /p choice="Please select number (1-10): "

if "%choice%"=="1" goto START_SYSTEM
if "%choice%"=="2" goto STOP_SYSTEM
if "%choice%"=="3" goto RESTART_SYSTEM
if "%choice%"=="4" goto CHECK_STATUS
if "%choice%"=="5" goto VIEW_LOGS
if "%choice%"=="6" goto RESET_SYSTEM
if "%choice%"=="7" goto OPEN_WEBSITE
if "%choice%"=="8" goto START_PGADMIN
if "%choice%"=="9" goto CHECK_DEPENDENCIES
if "%choice%"=="10" goto EXIT_PROGRAM

echo.
echo [ERROR] Please select number 1-10 only
timeout /t 2 /nobreak >nul
goto MAIN_MENU

:START_SYSTEM
cls
echo.
echo  Starting EMR System...
echo  ========================================
echo.

echo [1/10] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo How to fix:
    echo    1. Download Node.js from: https://nodejs.org/
    echo    2. Install Node.js (version 18 or higher)
    echo    3. Restart your computer
    echo    4. Try again
    echo.
    pause
    goto MAIN_MENU
)
echo [SUCCESS] Node.js is available

echo [2/10] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available!
    echo [TIP] npm should come with Node.js installation
    echo.
    pause
    goto MAIN_MENU
)
echo [SUCCESS] npm is available

echo [3/10] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo.
    echo How to fix:
    echo    1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo    2. Install Docker Desktop
    echo    3. Start Docker Desktop and wait for it to initialize
    echo    4. Try again
    echo.
    pause
    goto MAIN_MENU
)
echo [SUCCESS] Docker is available

echo [4/10] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available!
    echo [TIP] Make sure Docker Desktop is properly installed
    echo.
    pause
    goto MAIN_MENU
)
echo [SUCCESS] Docker Compose is available

echo [5/10] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo [WARNING] Frontend dependencies not found!
    echo [INFO] Installing frontend dependencies...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies!
        echo [TIP] Check your internet connection and try again
        cd ..
        pause
        goto MAIN_MENU
    )
    cd ..
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [SUCCESS] Frontend dependencies found
)

echo [6/10] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo [WARNING] Backend dependencies not found!
    echo [INFO] Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies!
        echo [TIP] Check your internet connection and try again
        cd ..
        pause
        goto MAIN_MENU
    )
    cd ..
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [SUCCESS] Backend dependencies found
)

echo [7/10] Checking critical libraries...
cd frontend
if not exist "node_modules\react-hot-toast" (
    echo [WARNING] react-hot-toast library not found!
    echo [INFO] Installing react-hot-toast...
    npm install react-hot-toast
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install react-hot-toast!
        cd ..
        pause
        goto MAIN_MENU
    )
    echo [SUCCESS] react-hot-toast installed
) else (
    echo [SUCCESS] react-hot-toast library found
)
cd ..

echo [8/10] Checking port availability...
netstat -an | find "3000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is in use. Stopping existing containers...
    docker-compose down >nul 2>&1
    timeout /t 3 /nobreak >nul
)

netstat -an | find "3001" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3001 is in use. Stopping existing containers...
    docker-compose down >nul 2>&1
    timeout /t 3 /nobreak >nul
)
echo [SUCCESS] Ports are available

echo [9/10] Creating and starting containers...
echo [INFO] Please wait... This may take several minutes on first run
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    echo.
    echo How to fix:
    echo    1. Check if Docker Desktop is running
    echo    2. Check docker-compose.yml file
    echo    3. Try running: docker-compose down then try again
    echo.
    pause
    goto MAIN_MENU
)

echo [10/10] Waiting for services to start...
echo [INFO] Waiting for services to initialize...
timeout /t 15 /nobreak >nul

echo [INFO] Checking service status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "project_"

echo [INFO] Setting up pgAdmin Database Manager...
echo [INFO] Checking if pgAdmin is available...
docker ps -a | findstr pgadmin >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] pgAdmin container found, starting...
    docker start pgadmin >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] pgAdmin started successfully
    ) else (
        echo [INFO] Creating new pgAdmin container...
        docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
        if %errorlevel% equ 0 (
            echo [SUCCESS] pgAdmin container created and started
        ) else (
            echo [WARNING] Failed to create pgAdmin container
        )
    )
) else (
    echo [INFO] pgAdmin container not found, creating new one...
    docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] pgAdmin container created and started
    ) else (
        echo [WARNING] Failed to create pgAdmin container
    )
)

echo [INFO] Opening website...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo  ========================================
echo     EMR System Started Successfully!
echo  ========================================
echo.
echo  System URLs:
echo     Frontend: http://localhost:3000
echo     Backend:  http://localhost:3001
echo     Database Manager: http://localhost:8080
echo.
echo  Database Services:
echo     PostgreSQL: localhost:5432
echo     Redis:      localhost:6379
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
echo  Database Connection Info:
echo     Host: emr_postgres
echo     Port: 5432
echo     Database: emr_development
echo     Username: postgres
echo     Password: 12345
echo.
echo  ========================================
echo.
echo [SUCCESS] System is ready to use!
echo.
pause
goto MAIN_MENU

:STOP_SYSTEM
cls
echo.
echo  Stopping EMR System...
echo  ========================================
echo.
echo [1/2] Stopping EMR containers...
docker-compose down
if %errorlevel% equ 0 (
    echo [SUCCESS] EMR System stopped
) else (
    echo [ERROR] Failed to stop EMR system
)

echo [2/2] Stopping pgAdmin...
docker stop pgadmin >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] pgAdmin stopped
) else (
    echo [INFO] pgAdmin was not running
)
echo.
pause
goto MAIN_MENU

:RESTART_SYSTEM
cls
echo.
echo  Restarting EMR System...
echo  ========================================
echo.
echo [1/4] Stopping current system...
docker-compose down
docker stop pgadmin >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/4] Starting EMR system...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to restart EMR system
    echo.
    pause
    goto MAIN_MENU
)

echo [3/4] Starting pgAdmin...
docker start pgadmin >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Creating new pgAdmin container...
    docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
)

echo [4/4] Waiting for system to start...
timeout /t 10 /nobreak >nul

echo [SUCCESS] System restart completed
echo.
pause
goto MAIN_MENU

:CHECK_STATUS
cls
echo.
echo  EMR System Status
echo  ========================================
echo.
echo [Running Containers:]
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "project_"
echo.
echo [pgAdmin Status:]
docker ps | findstr pgadmin >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] pgAdmin - Running
) else (
    echo [NO] pgAdmin - Not Running
)
echo.
echo [Port Connections:]
netstat -an | find "3000" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 3000 (Frontend) - Active
) else (
    echo [NO] Port 3000 (Frontend) - Not Active
)

netstat -an | find "3001" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 3001 (Backend) - Active
) else (
    echo [NO] Port 3001 (Backend) - Not Active
)

netstat -an | find "8080" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 8080 (pgAdmin) - Active
) else (
    echo [NO] Port 8080 (pgAdmin) - Not Active
)
echo.
pause
goto MAIN_MENU

:VIEW_LOGS
cls
echo.
echo  EMR System Logs
echo  ========================================
echo.
echo [TIP] Press Ctrl+C to return to main menu
echo.
docker-compose logs -f

:RESET_SYSTEM
cls
echo.
echo  Reset EMR System
echo  ========================================
echo.
echo [WARNING] This will delete all data including pgAdmin!
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" (
    echo [INFO] Reset cancelled
    timeout /t 2 /nobreak >nul
    goto MAIN_MENU
)

echo [1/4] Stopping and removing EMR containers...
docker-compose down -v

echo [2/4] Stopping and removing pgAdmin...
docker stop pgadmin >nul 2>&1
docker rm pgadmin >nul 2>&1

echo [3/4] Removing images...
docker-compose down --rmi all

echo [4/4] Cleaning Docker data...
docker system prune -f

echo [SUCCESS] System reset completed
echo.
pause
goto MAIN_MENU

:OPEN_WEBSITE
cls
echo.
echo  Opening EMR Website...
echo  ========================================
echo.
start http://localhost:3000
echo [SUCCESS] Website opened
echo.
pause
goto MAIN_MENU

:START_PGADMIN
cls
echo.
echo  Starting pgAdmin Database Manager...
echo  ========================================
echo.

echo [1/3] Checking if pgAdmin container exists...
docker ps -a | findstr pgadmin >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] pgAdmin container found
    echo [2/3] Starting pgAdmin...
    docker start pgadmin >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] pgAdmin started successfully
    ) else (
        echo [ERROR] Failed to start pgAdmin
        echo [INFO] Creating new pgAdmin container...
        docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
        if %errorlevel% equ 0 (
            echo [SUCCESS] New pgAdmin container created and started
        ) else (
            echo [ERROR] Failed to create pgAdmin container
            pause
            goto MAIN_MENU
        )
    )
) else (
    echo [INFO] pgAdmin container not found
    echo [2/3] Creating new pgAdmin container...
    docker run --name pgadmin -p 8080:80 -e PGADMIN_DEFAULT_EMAIL=admin@admin.com -e PGADMIN_DEFAULT_PASSWORD=admin --network project_emr_network -d dpage/pgadmin4 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] pgAdmin container created and started
    ) else (
        echo [ERROR] Failed to create pgAdmin container
        pause
        goto MAIN_MENU
    )
)

echo [3/3] Opening pgAdmin...
timeout /t 3 /nobreak >nul
start http://localhost:8080

echo.
echo  ========================================
echo     pgAdmin Database Manager Started!
echo  ========================================
echo.
echo  Database Manager URL: http://localhost:8080
echo  Email: admin@admin.com
echo  Password: admin
echo.
echo  Database Connection Info:
echo  Host: emr_postgres
echo  Port: 5432
echo  Database: emr_development
echo  Username: postgres
echo  Password: 12345
echo.
echo  ========================================
echo.
echo [SUCCESS] pgAdmin is ready to use!
echo.
pause
goto MAIN_MENU

:CHECK_DEPENDENCIES
cls
echo.
echo  Checking Dependencies & Libraries
echo  ========================================
echo.

echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [SOLUTION] Download from: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js version: %NODE_VERSION%
)

echo [2/8] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available!
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm version: %NPM_VERSION%
)

echo [3/8] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo [SOLUTION] Download Docker Desktop from: https://www.docker.com/products/docker-desktop
) else (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo [OK] Docker: %DOCKER_VERSION%
)

echo [4/8] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not available!
) else (
    for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo [OK] Docker Compose: %COMPOSE_VERSION%
)

echo [5/8] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo [WARNING] Frontend node_modules not found!
    echo [SOLUTION] Run: cd frontend && npm install
) else (
    echo [OK] Frontend dependencies found
)

echo [6/8] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo [WARNING] Backend node_modules not found!
    echo [SOLUTION] Run: cd backend && npm install
) else (
    echo [OK] Backend dependencies found
)

echo [7/8] Checking critical frontend libraries...
cd frontend
if not exist "node_modules\react-hot-toast" (
    echo [WARNING] react-hot-toast not found!
    echo [SOLUTION] Run: npm install react-hot-toast
) else (
    echo [OK] react-hot-toast found
)

if not exist "node_modules\next" (
    echo [WARNING] Next.js not found!
    echo [SOLUTION] Run: npm install
) else (
    echo [OK] Next.js found
)

if not exist "node_modules\react" (
    echo [WARNING] React not found!
    echo [SOLUTION] Run: npm install
) else (
    echo [OK] React found
)

if not exist "node_modules\axios" (
    echo [WARNING] Axios not found!
    echo [SOLUTION] Run: npm install axios
) else (
    echo [OK] Axios found
)
cd ..

echo [8/8] Checking critical backend libraries...
cd backend
if not exist "node_modules\express" (
    echo [WARNING] Express not found!
    echo [SOLUTION] Run: npm install
) else (
    echo [OK] Express found
)

if not exist "node_modules\pg" (
    echo [WARNING] PostgreSQL driver not found!
    echo [SOLUTION] Run: npm install
) else (
    echo [OK] PostgreSQL driver found
)

if not exist "node_modules\redis" (
    echo [WARNING] Redis client not found!
    echo [SOLUTION] Run: npm install
) else (
    echo [OK] Redis client found
)
cd ..

echo.
echo  ========================================
echo     Dependency Check Complete
echo  ========================================
echo.
echo [TIP] If you see any warnings or errors above,
echo      use the solutions provided to fix them.
echo.
echo [TIP] You can also select option 1 to automatically
echo      install missing dependencies.
echo.
pause
goto MAIN_MENU

:EXIT_PROGRAM
cls
echo.
echo  Thank you for using EMR System
echo  ========================================
echo.
echo [NOTE] To stop the system, select option 2 in main menu
echo.
timeout /t 3 /nobreak >nul
exit /b 0
