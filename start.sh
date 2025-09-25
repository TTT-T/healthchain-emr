#!/bin/bash

echo "========================================"
echo "    EMR System - One Click Start"
echo "========================================"
echo

echo "[1/4] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✓ Docker is installed"

echo
echo "[2/4] Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not available!"
    exit 1
fi
echo "✓ Docker Compose is available"

echo
echo "[3/4] Starting EMR System..."
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
