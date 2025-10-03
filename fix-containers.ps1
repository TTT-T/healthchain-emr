# EMR System Container Fix Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    EMR System Container Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Stopping all containers..." -ForegroundColor Yellow
docker-compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to stop containers" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Cleaning up Docker system..." -ForegroundColor Yellow
docker system prune -f
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Docker cleanup had issues, but continuing..." -ForegroundColor Yellow
}

Write-Host "[INFO] Starting containers with rebuild..." -ForegroundColor Yellow
docker-compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "[INFO] Checking container status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "[INFO] Checking backend logs for errors..." -ForegroundColor Yellow
docker-compose logs backend --tail=20

Write-Host ""
Write-Host "[INFO] Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Backend is responding" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Backend returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Backend may not be ready yet: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Fix Script Completed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] If issues persist:" -ForegroundColor Yellow
Write-Host "1. Check docker-compose logs backend" -ForegroundColor White
Write-Host "2. Ensure ports 3000, 3001, 5432, 6379 are free" -ForegroundColor White
Write-Host "3. Check available memory (need 4GB+)" -ForegroundColor White
Write-Host "4. Try restarting Docker Desktop" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Access URLs:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "- Health:   http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
