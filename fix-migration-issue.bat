@echo off
echo ========================================
echo    EMR Migration Fix Script
echo ========================================
echo.

echo [INFO] Stopping containers...
docker-compose down

echo [INFO] Removing failed migration record...
docker exec emr_postgres psql -U postgres -d emr_development -c "DELETE FROM migrations WHERE migration_name = '004_create_appointment_tables';" 2>nul

echo [INFO] Starting containers...
docker-compose up -d

echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak

echo [INFO] Running migration fix...
docker exec emr_backend npm run auto-migrate

echo [INFO] Checking health status...
docker exec emr_backend npm run db:health-check

echo.
echo [SUCCESS] Migration fix completed!
echo [INFO] Check the output above for any remaining issues.
pause
