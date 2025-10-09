@echo off
REM EMR System Management Script - Simplified Version
REM Only essential functions: start, stop, restart, clean, admin

setlocal enabledelayedexpansion
title EMR System - Electronic Medical Records
color 0A

REM ========================================
REM CONFIGURATION
REM ========================================
set "PROJECT_NAME=EMR System"
set "FRONTEND_URL=http://localhost:3000"
set "BACKEND_URL=http://localhost:3001"

REM ========================================
REM COMMAND ROUTING
REM ========================================
if "%1"=="" goto SHOW_HELP
if /i "%1"=="start" goto START_SYSTEM
if /i "%1"=="stop" goto STOP_SYSTEM
if /i "%1"=="restart" goto RESTART_SYSTEM
if /i "%1"=="clean" goto CLEAN_SYSTEM
if /i "%1"=="admin" goto CREATE_ADMIN
if /i "%1"=="help" goto SHOW_HELP

echo [ERROR] Unknown command: %1
echo.
goto SHOW_HELP

REM ========================================
REM UTILITY FUNCTIONS
REM ========================================

:SHOW_HEADER
cls
echo.
echo  ========================================
echo  %PROJECT_NAME%
echo  ========================================
echo.
exit /b 0

:CHECK_DOCKER
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo [INFO] Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo [INFO] Please start Docker Desktop
    pause
    exit /b 1
)
exit /b 0

:CHECK_BACKEND_RUNNING
docker ps | findstr emr_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend container is not running!
    echo [INFO] Please start the system first: start.bat start
    pause
    exit /b 1
)
exit /b 0

REM ========================================
REM MAIN FUNCTIONS
REM ========================================

:START_SYSTEM
call :SHOW_HEADER
echo [INFO] Starting EMR System...
echo [INFO] Time: %date% %time%
echo.

call :CHECK_DOCKER
if %errorlevel% neq 0 exit /b 1

echo [STEP 1/3] Starting Docker containers...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)
echo [SUCCESS] Containers started successfully

echo.
echo [STEP 2/3] Waiting for services to be ready...
timeout /t 10 /nobreak >nul
echo [SUCCESS] Services are ready

echo.
echo [STEP 3/3] Checking container status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] System started successfully!
    echo [INFO] Frontend: %FRONTEND_URL%
    echo [INFO] Backend: %BACKEND_URL%
    echo.
    echo [INFO] Opening frontend in browser...
    start %FRONTEND_URL%
) else (
    echo [WARNING] Some containers may not be running properly
)

echo.
pause
exit /b 0

:STOP_SYSTEM
call :SHOW_HEADER
echo [INFO] Stopping EMR System...
echo [INFO] Time: %date% %time%
echo.

echo [STEP 1/2] Stopping all containers...
docker compose stop
if %errorlevel% equ 0 (
    echo [SUCCESS] All containers stopped
) else (
    echo [ERROR] Failed to stop some containers
)

echo.
echo [STEP 2/2] Verifying shutdown...
docker ps | findstr emr_ >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Some containers may still be running
) else (
    echo [SUCCESS] All EMR containers stopped
)

echo.
echo [INFO] System shutdown completed
pause
exit /b 0

:RESTART_SYSTEM
call :SHOW_HEADER
echo [INFO] Restarting EMR System...
echo [INFO] Time: %date% %time%
echo.

echo [STEP 1/3] Stopping all containers...
docker compose down
echo [SUCCESS] Containers stopped

echo.
echo [STEP 2/3] Removing old containers...
docker compose rm -f
echo [SUCCESS] Old containers removed

echo.
echo [STEP 3/3] Starting fresh containers...
docker compose up -d --build
if %errorlevel% equ 0 (
    echo [SUCCESS] System restarted successfully
    timeout /t 5 /nobreak >nul
    echo.
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "emr_"
) else (
    echo [ERROR] Failed to restart system!
    pause
    exit /b 1
)

echo.
echo [INFO] Restart completed
pause
exit /b 0

:CLEAN_SYSTEM
call :SHOW_HEADER
echo [INFO] Cleaning Docker Resources...
echo [INFO] Time: %date% %time%
echo.

echo [WARNING] This will remove:
echo  - All stopped containers
echo  - All unused images
echo  - All unused volumes
echo  - All unused networks
echo.
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%" neq "yes" (
    echo [CANCELLED] Clean operation cancelled
    pause
    exit /b 0
)

echo.
echo [STEP 1/5] Stopping all containers...
docker compose down
echo [SUCCESS] Containers stopped

echo.
echo [STEP 2/5] Removing containers...
docker compose rm -f
echo [SUCCESS] Containers removed

echo.
echo [STEP 3/5] Removing volumes...
docker compose down --volumes --remove-orphans
docker volume prune -f
echo [SUCCESS] Volumes removed

echo.
echo [STEP 4/5] Removing images...
docker image prune -a -f
echo [SUCCESS] Images removed

echo.
echo [STEP 5/5] Removing networks...
docker network prune -f
echo [SUCCESS] Networks removed

echo.
echo [SUCCESS] Cleanup completed successfully!
echo [INFO] Run 'start.bat start' to start fresh system
pause
exit /b 0

:CREATE_ADMIN
call :SHOW_HEADER
echo [INFO] Creating Admin User...
echo [INFO] Time: %date% %time%
echo.

call :CHECK_DOCKER
if %errorlevel% neq 0 exit /b 1

call :CHECK_BACKEND_RUNNING
if %errorlevel% neq 0 exit /b 1

echo [LOG] Creating admin user with complete information...
echo.
docker exec emr_backend node -e "const { Pool } = require('pg'); const bcrypt = require('bcryptjs'); async function createAdmin() { const pool = new Pool({host: 'postgres', port: 5432, database: 'emr_development', user: 'postgres', password: '12345'}); try { const hash = await bcrypt.hash('admin123', 12); await pool.query('DELETE FROM users WHERE username = \$1', ['admin']); const result = await pool.query('INSERT INTO users (username, email, password_hash, first_name, last_name, gender, blood_type, role, is_active, email_verified, profile_completed, phone, address) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12, \$13) RETURNING id, username, email, first_name, last_name, phone, address, gender, blood_type, role', ['admin', 'admin@admin.com', hash, 'System', 'Administrator', 'male', 'O+', 'admin', true, true, true, '0812345678', '123 Admin Street, Bangkok, Thailand 10110']); console.log('Admin user created successfully:'); console.log('===================================='); console.log('ID:', result.rows[0].id); console.log('Username:', result.rows[0].username); console.log('Email:', result.rows[0].email); console.log('Name:', result.rows[0].first_name, result.rows[0].last_name); console.log('Gender:', result.rows[0].gender); console.log('Blood Type:', result.rows[0].blood_type); console.log('Role:', result.rows[0].role); console.log('Phone:', result.rows[0].phone); console.log('Address:', result.rows[0].address); console.log('===================================='); } catch (error) { console.error('Error:', error.message); } finally { await pool.end(); } } createAdmin();"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Admin user created successfully!
    echo.
echo [INFO] ============================================
echo [INFO] 📋 Admin Account Details
echo [INFO] ============================================
echo [INFO] 🔐 Login URL: %FRONTEND_URL%/admin/login
echo [INFO] 👤 Username: admin
echo [INFO] 🔑 Password: admin123
echo [INFO] 📧 Email: admin@admin.com
echo [INFO] 👨 Name: System Administrator
echo [INFO] ⚤  Gender: Male
echo [INFO] 🩸 Blood Type: O+
echo [INFO] 📞 Phone: 0812345678
echo [INFO] 📍 Address: 123 Admin Street, Bangkok, Thailand 10110
echo [INFO] 👔 Role: Admin
echo [INFO] ============================================
echo [INFO] 📋 System Features Available:
echo [INFO] ============================================
echo [INFO] 🏥 EMR Dashboard: %FRONTEND_URL%/emr/dashboard
echo [INFO] 📝 Patient Check-in: %FRONTEND_URL%/emr/checkin
echo [INFO] 💊 Vital Signs: %FRONTEND_URL%/emr/vital-signs
echo [INFO] 📋 History Taking: %FRONTEND_URL%/emr/history-taking
echo [INFO] 🧪 Lab Results: %FRONTEND_URL%/emr/lab-result
echo [INFO] 📅 Appointments: %FRONTEND_URL%/emr/appointments
echo [INFO] 📄 Documents: %FRONTEND_URL%/emr/documents
echo [INFO] 👤 Patient Portal: %FRONTEND_URL%/accounts/patient
echo [INFO] 🔧 Admin Panel: %FRONTEND_URL%/admin
echo [INFO] 🤖 AI Diabetes Prediction: %FRONTEND_URL%/admin/ai-diabetes
echo [INFO] ============================================
) else (
    echo [ERROR] Failed to create admin user!
)

echo.
pause
exit /b 0

:SHOW_HELP
call :SHOW_HEADER
echo  USAGE: start.bat [COMMAND]
echo.
echo  AVAILABLE COMMANDS:
echo.
echo    start      Start EMR system (Docker containers)
echo    stop       Stop EMR system gracefully
echo    restart    Restart EMR system (stop + start)
echo    clean      Remove all Docker images, volumes, and containers
echo    admin      Create admin user (admin@admin.com / admin123)
echo    help       Show this help message
echo.
echo  EXAMPLES:
echo    start.bat start
echo    start.bat stop
echo    start.bat restart
echo    start.bat clean
echo    start.bat admin
echo.
echo  SYSTEM URLS:
echo    Frontend: %FRONTEND_URL%
echo    Backend:  %BACKEND_URL%
echo.
echo  ========================================
echo.
pause
exit /b 0
