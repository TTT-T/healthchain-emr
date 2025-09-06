#!/bin/bash

# HealthChain EMR System - Production Build Script
# This script builds both frontend and backend for production deployment

set -e  # Exit on any error

echo "🚀 Starting HealthChain EMR Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create build directory
print_status "Creating build directory..."
mkdir -p build
rm -rf build/*

# Build Backend
print_status "Building backend..."
cd backend

# Install dependencies
print_status "Installing backend dependencies..."
npm ci --only=production

# Run TypeScript compilation
print_status "Compiling TypeScript..."
npm run build

# Copy necessary files
print_status "Copying backend files..."
cp -r dist ../build/backend
cp package.json ../build/backend/
cp package-lock.json ../build/backend/
cp -r node_modules ../build/backend/

# Copy environment example
cp env.production.example ../build/backend/.env.example

print_success "Backend build completed"

# Build Frontend
print_status "Building frontend..."
cd ../frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm ci

# Build Next.js application
print_status "Building Next.js application..."
npm run build

# Copy build files
print_status "Copying frontend files..."
cp -r .next ../build/frontend/
cp -r public ../build/frontend/
cp package.json ../build/frontend/
cp package-lock.json ../build/frontend/
cp -r node_modules ../build/frontend/

# Copy environment example
cp env.production.example ../build/frontend/.env.example

print_success "Frontend build completed"

# Create deployment package
print_status "Creating deployment package..."
cd ../build

# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

# HealthChain EMR Production Deployment Script

echo "🚀 Deploying HealthChain EMR System..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "❌ Frontend .env.local file not found. Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Start backend
echo "🔧 Starting backend..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🔧 Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ HealthChain EMR System deployed successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend URL: http://localhost:3001"
echo "Frontend URL: http://localhost:3000"

# Keep script running
wait
EOF

chmod +x deploy.sh

# Create Docker files
print_status "Creating Docker configuration..."

# Backend Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

# Frontend Dockerfile
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
EOF

# Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: healthchain_emr
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@database:5432/healthchain_emr
    ports:
      - "3001:3001"
    depends_on:
      database:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

  frontend:
    build: ./frontend
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
EOF

print_success "Docker configuration created"

# Create README for deployment
cat > README.md << 'EOF'
# HealthChain EMR System - Production Deployment

## Quick Start

1. **Configure Environment Variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your production values
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your production values
   ```

2. **Deploy with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

3. **Deploy Manually**
   ```bash
   ./deploy.sh
   ```

## System Requirements

- Node.js 18+
- PostgreSQL 15+
- 4GB RAM minimum
- 10GB disk space

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Default Users

- Admin: admin / admin123
- Doctor: doctor / doctor123
- Patient: patient / patient123

## Monitoring

- Health Check: `/health`
- System Status: `/health/detailed`
- Database Status: `/admin/database/status`

## Backup

The system includes automated backup functionality accessible through the admin panel.

## Security

- Change default passwords immediately
- Configure proper CORS origins
- Use HTTPS in production
- Regular security updates
EOF

print_success "Deployment documentation created"

# Create systemd service files
print_status "Creating systemd service files..."

cat > healthchain-backend.service << 'EOF'
[Unit]
Description=HealthChain EMR Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/healthchain/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

cat > healthchain-frontend.service << 'EOF'
[Unit]
Description=HealthChain EMR Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/healthchain/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service files created"

# Final summary
print_success "🎉 Production build completed successfully!"
print_status "Build location: ./build/"
print_status "Deployment script: ./build/deploy.sh"
print_status "Docker compose: ./build/docker-compose.yml"
print_warning "Remember to:"
print_warning "1. Configure environment variables"
print_warning "2. Set up PostgreSQL database"
print_warning "3. Change default passwords"
print_warning "4. Configure SSL certificates for production"

echo ""
print_success "Ready for production deployment! 🚀"
