@echo off
echo ========================================
echo    EMR System Container Fix Script
echo ========================================
echo.

echo [INFO] Stopping all containers...
docker-compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop containers
    pause
    exit /b 1
)

echo [INFO] Cleaning up Docker system...
docker system prune -f
if %errorlevel% neq 0 (
    echo [WARNING] Docker cleanup had issues, but continuing...
)

echo [INFO] Starting containers with rebuild...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)

echo [INFO] Waiting for services to initialize...
timeout /t 30 /nobreak

echo [INFO] Checking container status...
docker-compose ps

echo.
echo [INFO] Checking backend logs for errors...
docker-compose logs backend --tail=20

echo.
echo [INFO] Testing backend health...
curl -s http://localhost:3001/health > nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is responding
) else (
    echo [WARNING] Backend may not be ready yet
)

echo.
echo ========================================
echo    Fix Script Completed
echo ========================================
echo.
echo [INFO] If issues persist:
echo 1. Check docker-compose logs backend
echo 2. Ensure ports 3000, 3001, 5432, 6379 are free
echo 3. Check available memory (need 4GB+)
echo 4. Try restarting Docker Desktop
echo.
echo [INFO] Access URLs:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:3001
echo - Health:   http://localhost:3001/health
echo.
pause
