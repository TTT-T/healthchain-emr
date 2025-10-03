# EMR Migration Fix Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    EMR Migration Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "[INFO] Removing failed migration record..." -ForegroundColor Yellow
try {
    docker exec emr_postgres psql -U postgres -d emr_development -c "DELETE FROM migrations WHERE migration_name = '004_create_appointment_tables';" 2>$null
    Write-Host "[SUCCESS] Failed migration record removed" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not remove migration record (container may not exist)" -ForegroundColor Yellow
}

Write-Host "[INFO] Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "[INFO] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "[INFO] Running migration fix..." -ForegroundColor Yellow
docker exec emr_backend npm run auto-migrate

Write-Host "[INFO] Checking health status..." -ForegroundColor Yellow
docker exec emr_backend npm run db:health-check

Write-Host ""
Write-Host "[SUCCESS] Migration fix completed!" -ForegroundColor Green
Write-Host "[INFO] Check the output above for any remaining issues." -ForegroundColor Yellow
Read-Host "Press Enter to continue"
