#!/bin/bash

echo "========================================"
echo "    EMR System - Quick Start"
echo "========================================"
echo

echo "This script will help you get started quickly."
echo

echo "[1/3] Checking if Docker is installed..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo
    echo "Please install Docker first:"
    echo "1. Download from: https://docs.docker.com/get-docker/"
    echo "2. Install Docker"
    echo "3. Start Docker service"
    echo "4. Run this script again"
    echo
    echo "The download page will open in your browser..."
    sleep 3
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "https://docs.docker.com/get-docker/"
    else
        xdg-open "https://docs.docker.com/get-docker/"
    fi
    exit 1
fi

echo "✓ Docker is installed"
echo

echo "[2/3] Checking if Docker is running..."
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo
    echo "Please start Docker service:"
    echo "For Linux:"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    echo
    echo "For macOS:"
    echo "  Start Docker Desktop from Applications"
    echo
    exit 1
fi

echo "✓ Docker is running"
echo

echo "[3/3] Starting EMR System..."
echo "This may take a few minutes on first run..."
echo

docker-compose -f docker-compose.simple.yml up --build

echo
echo "========================================"
echo "    EMR System Started Successfully!"
echo "========================================"
echo
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api-docs"
echo
echo "Test Accounts:"
echo "👨‍💼 Admin: admin@example.com / admin123"
echo "👨‍⚕️ Doctor: doctor@example.com / doctor123"
echo "👩‍⚕️ Nurse: nurse@example.com / nurse123"
echo "🏥 Patient: patient@example.com / patient123"
echo
echo "Press Ctrl+C to stop the system..."

# Wait for user to stop
trap 'echo -e "\nStopping EMR System..."; docker-compose -f docker-compose.simple.yml down; echo "System stopped."; exit 0' INT

# Keep script running
while true; do
    sleep 1
done
