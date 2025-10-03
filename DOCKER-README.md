# 🐳 EMR Project - Docker Setup Guide

## 📋 Overview
This guide explains how to run the EMR (Electronic Medical Records) project using Docker containers.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Docker Compose installed
- PowerShell (for Windows) or Bash (for Linux/Mac)

### 1. Start All Services
```bash
# Using Docker Compose directly
docker-compose up -d

# Or using the management script (Windows PowerShell)
.\docker-scripts.ps1 -Action start
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Management Commands

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart services
docker-compose restart
```

### Using Management Script (Windows)
```powershell
# Start all containers
.\docker-scripts.ps1 -Action start

# Stop all containers
.\docker-scripts.ps1 -Action stop

# Restart all containers
.\docker-scripts.ps1 -Action restart

# View logs
.\docker-scripts.ps1 -Action logs

# Check status
.\docker-scripts.ps1 -Action status

# Clean up everything
.\docker-scripts.ps1 -Action clean

# Rebuild containers
.\docker-scripts.ps1 -Action build
```

## 🏗️ Architecture

### Services
1. **Frontend** (Next.js)
   - Port: 3000
   - Container: emr_frontend
   - Health check: http://localhost:3000

2. **Backend** (Node.js/Express)
   - Port: 3001
   - Container: emr_backend
   - Health check: http://localhost:3001/health

3. **Database** (PostgreSQL)
   - Port: 5432
   - Container: emr_postgres
   - Database: emr_development

4. **Cache** (Redis)
   - Port: 6379
   - Container: emr_redis

### Network
- All services communicate through `project_emr_network`
- Internal communication uses service names (e.g., `postgres`, `redis`)

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables:

#### Backend
- `NODE_ENV`: development
- `PORT`: 3001
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_NAME`: emr_development
- `DB_USER`: postgres
- `DB_PASSWORD`: 12345
- `REDIS_HOST`: redis
- `REDIS_PORT`: 6379
- `JWT_SECRET`: your-super-secret-jwt-key-change-this-in-production-2025
- `JWT_REFRESH_SECRET`: your-super-secret-refresh-key-change-this-in-production-2025

#### Frontend
- `NEXT_PUBLIC_API_URL`: http://localhost:3001/api
- `NEXT_PUBLIC_APP_URL`: http://localhost:3000
- `NEXT_PUBLIC_BACKEND_URL`: http://localhost:3001
- `BACKEND_URL`: http://backend:3001

## 📊 Monitoring

### Health Checks
All containers have health checks configured:
- **Backend**: Checks `/health` endpoint
- **Frontend**: Checks root endpoint

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 50 lines
docker-compose logs --tail=50
```

### Container Status
```bash
# Basic status
docker-compose ps

# Detailed status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🧹 Maintenance

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

### Rebuild
```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it emr_postgres psql -U postgres -d emr_development

# Backup database
docker exec emr_postgres pg_dump -U postgres emr_development > backup.sql

# Restore database
docker exec -i emr_postgres psql -U postgres emr_development < backup.sql
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F
```

#### 2. Container Won't Start
```bash
# Check logs
docker-compose logs <service_name>

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart <service_name>
```

#### 3. Database Connection Issues
```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec -it emr_postgres psql -U postgres -c "SELECT 1;"
```

#### 4. Permission Issues
```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Windows: Run PowerShell as Administrator
```

### Reset Everything
```bash
# Stop all containers
docker-compose down

# Remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove all images
docker rmi $(docker images -q)

# Clean up system
docker system prune -a

# Start fresh
docker-compose up -d
```

## 📝 Development

### Hot Reload
Both frontend and backend support hot reload:
- Frontend changes are reflected immediately
- Backend changes trigger automatic restart
- Database changes require container restart

### Adding New Services
1. Add service to `docker-compose.yml`
2. Create Dockerfile if needed
3. Add to network: `project_emr_network`
4. Update dependencies if needed

### Environment-Specific Configs
- Development: Uses `docker-compose.yml`
- Production: Create `docker-compose.prod.yml`
- Testing: Create `docker-compose.test.yml`

## 🔒 Security Notes

### Production Deployment
- Change default passwords
- Use environment-specific secrets
- Enable SSL/TLS
- Configure firewall rules
- Regular security updates

### Current Defaults (Development Only)
- Database password: `12345`
- JWT secrets: Default values (change in production)

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify container status: `docker-compose ps`
3. Check network connectivity
4. Review environment variables
5. Consult this documentation

---

**Happy Coding! 🚀**
