#!/bin/bash

echo "========================================"
echo "    Docker Installation Helper"
echo "========================================"
echo

echo "[1/4] Checking if Docker is already installed..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is already installed!"
    echo
    
    echo "Testing Docker..."
    if docker run hello-world &> /dev/null; then
        echo "✓ Docker is working correctly!"
        echo
        echo "You can now run the EMR System:"
        echo "  ./start.sh"
        exit 0
    else
        echo "⚠ Docker is installed but not running properly."
        echo "Please start Docker service and try again."
        exit 1
    fi
fi

echo "❌ Docker is not installed."
echo

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "[2/4] Detected macOS"
    echo "Opening Docker Desktop download page..."
    echo "Please download and install Docker Desktop from:"
    echo "https://www.docker.com/products/docker-desktop"
    echo
    echo "The download page will open in your browser..."
    sleep 3
    open "https://www.docker.com/products/docker-desktop"
    
    echo
    echo "[3/4] Installation Instructions for macOS:"
    echo "========================================"
    echo
    echo "1. Click 'Download for Mac' on the webpage"
    echo "2. Choose the correct version:"
    echo "   - Apple Silicon (M1/M2): Docker Desktop for Mac with Apple silicon"
    echo "   - Intel: Docker Desktop for Mac with Intel chip"
    echo "3. Open the downloaded .dmg file"
    echo "4. Drag Docker.app to Applications folder"
    echo "5. Start Docker Desktop from Applications"
    echo "6. Accept license agreement and enter password when prompted"
    echo "7. Wait for Docker to start (whale icon in menu bar)"
    echo "8. Run this script again to verify installation"
    echo
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "[2/4] Detected Linux"
    echo "Installing Docker automatically..."
    echo
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        echo "❌ Please don't run this script as root (sudo)."
        echo "The script will ask for sudo when needed."
        exit 1
    fi
    
    # Update package index
    echo "Updating package index..."
    sudo apt update
    
    # Install required packages
    echo "Installing required packages..."
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    echo "Adding Docker's GPG key..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "Adding Docker repository..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    echo "Updating package index..."
    sudo apt update
    
    # Install Docker Engine
    echo "Installing Docker Engine..."
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    echo "Adding user to docker group..."
    sudo usermod -aG docker $USER
    
    # Start Docker service
    echo "Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Install Docker Compose
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo
    echo "[3/4] Docker installation completed!"
    echo "========================================"
    echo
    echo "IMPORTANT: You need to log out and log back in for the"
    echo "docker group changes to take effect."
    echo
    echo "After logging back in, you can run:"
    echo "  ./start.sh"
    echo
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install Docker manually from:"
    echo "https://docs.docker.com/get-docker/"
    exit 1
fi

echo "[4/4] Testing Docker installation..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is now installed!"
    echo
    
    if docker run hello-world &> /dev/null; then
        echo "✓ Docker is working correctly!"
        echo
        echo "You can now run the EMR System:"
        echo "  ./start.sh"
    else
        echo "⚠ Docker is installed but not running properly."
        echo "Please start Docker service and try again."
    fi
else
    echo "❌ Docker installation failed."
    echo "Please install Docker manually from:"
    echo "https://docs.docker.com/get-docker/"
fi

echo
echo "Press Enter to exit..."
read
