# EMR System Setup Instructions

## Prerequisites
- Docker Desktop (must be running)
- Git
- Node.js (version 18 or higher)

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr
```

### 2. Install Dependencies
**Important:** You must install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
cd frontend
npm install
# or
yarn install

# Install backend dependencies
cd ../backend
npm install
# or
yarn install

# Go back to root directory
cd ..
```

### 3. Start the System
```bash
# On Windows
start.bat

# On Linux/Mac
chmod +x start.sh
./start.sh
```

## Common Issues and Solutions

### Issue 1: "Module not found: Can't resolve 'react-hot-toast'"
**Solution:** Make sure you've installed frontend dependencies:
```bash
cd frontend
npm install
```

### Issue 2: "Docker is not running"
**Solution:** Start Docker Desktop application first, then run the start script.

### Issue 3: "Port already in use"
**Solution:** Stop any existing containers:
```bash
docker-compose down
```

### Issue 4: "Permission denied" on Linux/Mac
**Solution:** Make the start script executable:
```bash
chmod +x start.sh
```

## System Access
- **EMR System:** http://localhost:3000
- **pgAdmin (Database):** http://localhost:8080
  - Email: admin@admin.com
  - Password: admin

## Troubleshooting
If you encounter any issues:
1. Make sure Docker Desktop is running
2. Check if all dependencies are installed
3. Try restarting the system using the start script
4. Check Docker logs for detailed error messages

## Support
If you continue to have issues, please check the Docker logs and share the error messages.
