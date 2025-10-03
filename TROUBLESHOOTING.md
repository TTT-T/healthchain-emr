# 🔧 EMR System Troubleshooting Guide

## ปัญหา: Container Restarting

### อาการที่พบ:
```
Error response from daemon: Container 88e20654d49b511b522eb457cb1ae64e9f70b3540fabd65543cefdc33acdd94e is restarting, wait until the container is running
[WARNING] Auto-migration may have failed, but continuing...
[WARNING] Database health check failed
emr_backend    Restarting (1) Less than a second ago
```

### 🔍 วิธีแก้ไข:

#### 1. ตรวจสอบ Logs ของ Backend Container
```bash
docker-compose logs backend --tail=100
```

#### 1.1 แก้ไขปัญหา Migration "ON CONFLICT" Error
หากเจอ error: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**วิธีแก้ไขด่วน:**
```bash
# ใช้ script แก้ไข
.\fix-migration-issue.bat
# หรือ
.\fix-migration-issue.ps1
```

**วิธีแก้ไขด้วยตนเอง:**
```bash
# 1. หยุด containers
docker-compose down

# 2. ลบ migration record ที่ล้มเหลว
docker exec emr_postgres psql -U postgres -d emr_development -c "DELETE FROM migrations WHERE migration_name = '004_create_appointment_tables';"

# 3. เริ่ม containers ใหม่
docker-compose up -d

# 4. รอ 30 วินาที

# 5. รัน migration ใหม่
docker exec emr_backend npm run auto-migrate
```

#### 2. หยุดและลบ Containers ทั้งหมด
```bash
docker-compose down
docker system prune -f
```

#### 3. ลบ Volumes (ถ้าจำเป็น)
```bash
docker-compose down -v
docker volume prune -f
```

#### 4. เริ่มต้นใหม่
```bash
docker-compose up --build -d
```

#### 5. ตรวจสอบสถานะ
```bash
docker-compose ps
```

### 🚨 หากยังมีปัญหา:

#### ตรวจสอบ Port Conflicts
```bash
# ตรวจสอบว่า port 3001, 3000, 5432, 6379 ถูกใช้งานหรือไม่
netstat -an | findstr :3001
netstat -an | findstr :3000
netstat -an | findstr :5432
netstat -an | findstr :6379
```

#### ตรวจสอบ Docker Resources
```bash
docker system df
docker system events
```

#### ตรวจสอบ Environment Variables
```bash
# ตรวจสอบไฟล์ .env
cat backend/.env
cat frontend/.env.local
```

### 🔄 Alternative Solution:

#### ใช้ Docker Desktop Reset
1. เปิด Docker Desktop
2. ไปที่ Settings > Troubleshoot
3. คลิก "Reset to factory defaults"
4. รอให้ Docker restart
5. รัน `docker-compose up --build -d` ใหม่

### 📋 Manual Migration (ถ้าจำเป็น):

#### 1. เข้าไปใน Backend Container
```bash
docker exec -it emr_backend sh
```

#### 2. รัน Migration Manual
```bash
npm run auto-migrate
```

#### 3. รัน Health Check
```bash
npm run db:health-check
```

### 🎯 Quick Fix Script:

สร้างไฟล์ `fix-containers.bat`:
```batch
@echo off
echo Stopping all containers...
docker-compose down

echo Cleaning up...
docker system prune -f

echo Starting containers...
docker-compose up --build -d

echo Waiting for services...
timeout /t 30

echo Checking status...
docker-compose ps

echo Done!
pause
```

### 📞 หากยังแก้ไม่ได้:

1. **ตรวจสอบ Docker Version**: `docker --version`
2. **ตรวจสอบ Docker Compose Version**: `docker-compose --version`
3. **ตรวจสอบ Available Memory**: อย่างน้อย 4GB RAM
4. **ตรวจสอบ Disk Space**: อย่างน้อย 10GB free space

### 🔍 Common Issues:

#### Issue 1: Port Already in Use
**Solution**: เปลี่ยน ports ใน `docker-compose.yml`
```yaml
ports:
  - "3002:3001"  # เปลี่ยนจาก 3001 เป็น 3002
  - "3003:3000"  # เปลี่ยนจาก 3000 เป็น 3003
```

#### Issue 2: Database Connection Failed
**Solution**: รอให้ PostgreSQL container พร้อมก่อน
```bash
# รอให้ postgres healthy
docker-compose logs postgres
```

#### Issue 3: Node Modules Issues
**Solution**: ลบ node_modules และ rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### ✅ Success Indicators:

เมื่อระบบทำงานได้ปกติ คุณจะเห็น:
```
✅ Status: HEALTHY
📊 Migrations: 23/23 executed
emr_backend    Up X seconds (healthy)
emr_frontend   Up X seconds (healthy)
emr_postgres   Up X seconds (healthy)
```

### 🌐 Access URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health
