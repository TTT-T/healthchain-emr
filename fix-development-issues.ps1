# PowerShell script to fix common development issues
# Run this script when encountering build or authentication issues

Write-Host "🔧 Fixing Development Issues..." -ForegroundColor Green

# Stop all Node.js processes
Write-Host "🛑 Stopping Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Clean frontend caches
Write-Host "🧹 Cleaning frontend caches..." -ForegroundColor Yellow
Set-Location "frontend"
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Reinstall frontend dependencies
Write-Host "📦 Reinstalling frontend dependencies..." -ForegroundColor Yellow
npm install

# Clean backend caches
Write-Host "🧹 Cleaning backend caches..." -ForegroundColor Yellow
Set-Location "../backend"
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Reinstall backend dependencies
Write-Host "📦 Reinstalling backend dependencies..." -ForegroundColor Yellow
npm install

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd backend; npm run dev" -WindowStyle Minimized

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🚀 Starting frontend server..." -ForegroundColor Green
Set-Location "../frontend"
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev" -WindowStyle Minimized

Write-Host "✅ Development servers started!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Cyan
