# คู่มือการติดตั้ง EMR System

## ปัญหาที่พบเมื่อรันในเครื่องอื่น

เมื่อแพ็คไฟล์เป็น .rar และไปรันในเครื่องอื่น อาจพบปัญหาดังนี้:

### 1. ไฟล์ที่ขาดหายไป
- ไฟล์ `.env` และ `.env.local` ไม่ได้รวมใน .rar (เพราะอยู่ใน .gitignore)
- `node_modules` ไม่ได้รวม (เพราะมีขนาดใหญ่)

### 2. การตั้งค่าที่จำเป็น

## ขั้นตอนการติดตั้งในเครื่องใหม่

### ข้อกำหนดเบื้องต้น
- Docker Desktop
- Node.js 18+ 
- npm หรือ yarn

### ขั้นตอนที่ 1: สร้างไฟล์ Environment

#### Backend Environment (backend/.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=12345
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_AUTO_CREATE=true
DB_AUTO_CREATE_USER=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2025

# Security Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (frontend/.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Application Settings
NEXT_PUBLIC_APP_NAME=EMR System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_WEBSOCKET=true

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=info

# Security
NEXT_PUBLIC_ENABLE_HTTPS=false
NEXT_PUBLIC_COOKIE_SECURE=false

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Theme
NEXT_PUBLIC_THEME=light
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
# ติดตั้ง backend dependencies
cd backend
npm install

# ติดตั้ง frontend dependencies
cd ../frontend
npm install
```

### ขั้นตอนที่ 3: เริ่มระบบ

#### วิธีที่ 1: ใช้ start.bat (แนะนำ)
```bash
# รันไฟล์ start.bat
start.bat
# เลือก option [1] START
```

#### วิธีที่ 2: ใช้ Docker Compose
```bash
# เริ่มระบบทั้งหมด
docker compose up -d --build

# ตรวจสอบสถานะ
docker ps
```

### ขั้นตอนที่ 4: สร้าง Admin User

```bash
# ใช้ start.bat เลือก option [4] CREATE ADMIN
# หรือรันคำสั่งนี้
docker exec -it emr_backend npx tsx src/scripts/seed.ts
```

## การแก้ไขปัญหาที่พบบ่อย

### 1. Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -an | findstr ":3000"
netstat -an | findstr ":3001"
netstat -an | findstr ":5432"

# หยุด services ที่ใช้ port
docker compose down
```

### 2. Database connection error
```bash
# ตรวจสอบ database container
docker ps | findstr postgres

# รีสตาร์ท database
docker compose restart postgres
```

### 3. Frontend ไม่สามารถเชื่อมต่อ Backend
- ตรวจสอบไฟล์ `frontend/.env.local`
- ตรวจสอบว่า `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- ตรวจสอบว่า backend ทำงานที่ port 3001

### 4. API request failed errors
- ปัญหานี้แก้ไขแล้วในโค้ด
- 404 errors สำหรับ appointments เป็นเรื่องปกติ

## การตรวจสอบระบบ

### ตรวจสอบ Health Check
```bash
# Backend health
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000
```

### ตรวจสอบ Logs
```bash
# Backend logs
docker compose logs backend

# Frontend logs
docker compose logs frontend

# Database logs
docker compose logs postgres
```

## URLs ที่สำคัญ

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/health
- **Database Manager:** http://localhost:8080 (pgAdmin)

## หมายเหตุ

1. **Email Configuration:** ต้องตั้งค่า Gmail App Password สำหรับการส่งอีเมล
2. **JWT Secrets:** ควรเปลี่ยนใน production
3. **Database Password:** ควรเปลี่ยนใน production
4. **Ports:** สามารถเปลี่ยนได้ใน docker-compose.yml และ environment files

## การ Backup และ Restore

### Backup
```bash
# Backup database
docker exec emr_postgres pg_dump -U postgres emr_development > backup.sql

# Backup volumes
docker run --rm -v project_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Restore
```bash
# Restore database
docker exec -i emr_postgres psql -U postgres emr_development < backup.sql
```
