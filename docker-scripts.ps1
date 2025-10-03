# Docker Management Scripts for EMR Project
# PowerShell script for managing Docker containers

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "clean", "build", "help")]
    [string]$Action = "help"
)

function Show-Help {
    Write-Host "=== EMR Project Docker Management Script ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\docker-scripts.ps1 -Action <action>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available Actions:" -ForegroundColor Cyan
    Write-Host "  start    - Start all containers" -ForegroundColor White
    Write-Host "  stop     - Stop all containers" -ForegroundColor White
    Write-Host "  restart  - Restart all containers" -ForegroundColor White
    Write-Host "  logs     - Show logs for all services" -ForegroundColor White
    Write-Host "  status   - Show container status" -ForegroundColor White
    Write-Host "  clean    - Clean up containers and volumes" -ForegroundColor White
    Write-Host "  build    - Rebuild all containers" -ForegroundColor White
    Write-Host "  help     - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\docker-scripts.ps1 -Action start" -ForegroundColor White
    Write-Host "  .\docker-scripts.ps1 -Action logs" -ForegroundColor White
    Write-Host "  .\docker-scripts.ps1 -Action restart" -ForegroundColor White
}

function Start-Containers {
    Write-Host "Starting EMR Project containers..." -ForegroundColor Green
    docker-compose up -d
    Write-Host "Containers started successfully!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "Database: localhost:5432" -ForegroundColor Cyan
    Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
}

function Stop-Containers {
    Write-Host "Stopping EMR Project containers..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "Containers stopped successfully!" -ForegroundColor Green
}

function Restart-Containers {
    Write-Host "Restarting EMR Project containers..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "Containers restarted successfully!" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "Showing logs for all services..." -ForegroundColor Green
    docker-compose logs -f --tail=50
}

function Show-Status {
    Write-Host "Container Status:" -ForegroundColor Green
    docker-compose ps
    Write-Host ""
    Write-Host "Health Check:" -ForegroundColor Green
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

function Clean-Containers {
    Write-Host "Cleaning up containers and volumes..." -ForegroundColor Yellow
    Write-Host "WARNING: This will remove all containers, networks, and volumes!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Host "Cleanup completed!" -ForegroundColor Green
    } else {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    }
}

function Build-Containers {
    Write-Host "Rebuilding all containers..." -ForegroundColor Green
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    Write-Host "Containers rebuilt successfully!" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "start" { Start-Containers }
    "stop" { Stop-Containers }
    "restart" { Restart-Containers }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Containers }
    "build" { Build-Containers }
    "help" { Show-Help }
    default { Show-Help }
}
