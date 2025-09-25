@echo off
echo ========================================
echo    Docker Desktop Installation Helper
echo ========================================
echo.

echo [1/3] Checking if Docker is already installed...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is already installed!
    echo.
    echo Testing Docker...
    docker run hello-world >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ Docker is working correctly!
        echo.
        echo You can now run the EMR System:
        echo   start.bat
        pause
        exit /b 0
    ) else (
        echo ⚠ Docker is installed but not running properly.
        echo Please start Docker Desktop and try again.
        pause
        exit /b 1
    )
)

echo ❌ Docker is not installed.
echo.

echo [2/3] Opening Docker Desktop download page...
echo Please download and install Docker Desktop from:
echo https://www.docker.com/products/docker-desktop
echo.
echo The download page will open in your browser...
timeout /t 3 /nobreak >nul
start https://www.docker.com/products/docker-desktop

echo.
echo [3/3] Installation Instructions:
echo ========================================
echo.
echo 1. Click "Download for Windows" on the webpage
echo 2. Run the downloaded installer (Docker Desktop Installer.exe)
echo 3. Follow the installation wizard:
echo    - Check "Use WSL 2 instead of Hyper-V"
echo    - Check "Add shortcut to desktop"
echo    - Click "Install"
echo 4. Restart your computer when prompted
echo 5. Start Docker Desktop from desktop or start menu
echo 6. Wait for Docker to start (you'll see a whale icon in system tray)
echo 7. Run this script again to verify installation
echo.
echo After installation, you can run:
echo   start.bat
echo.
echo Press any key to continue...
pause >nul

echo.
echo Checking Docker installation again...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker is now installed!
    echo.
    echo You can now run the EMR System:
    echo   start.bat
) else (
    echo ❌ Docker is still not installed or not running.
    echo Please make sure Docker Desktop is installed and running.
    echo.
    echo Troubleshooting:
    echo - Make sure Docker Desktop is started
    echo - Check if WSL 2 is enabled
    echo - Restart your computer if needed
)

echo.
echo Press any key to exit...
pause >nul
