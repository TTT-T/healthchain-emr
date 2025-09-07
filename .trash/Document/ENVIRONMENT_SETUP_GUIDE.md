# 🔧 Environment Setup Guide - EMR System

## 📋 สรุปปัญหา

ระบบ EMR ของคุณขาดไฟล์ `.env` ที่จำเป็นสำหรับการทำงาน ซึ่งทำให้ระบบไม่สามารถโหลด configuration ได้อย่างถูกต้อง

## 🚨 ปัญหาที่พบ

1. **ไม่มีไฟล์ `backend/.env`** - ระบบ backend ไม่สามารถโหลด environment variables ได้
2. **ไม่มีไฟล์ `frontend/.env.local`** - ระบบ frontend ไม่สามารถเชื่อมต่อกับ API ได้
3. **Configuration ไม่ถูกต้อง** - ระบบใช้ default values แทนค่าจริง

## ✅ วิธีแก้ไข

### 1. สร้างไฟล์ Backend Environment

สร้างไฟล์ `backend/.env` ด้วยเนื้อหาดังนี้:

```env
# =============================================================================
# EMR System - Backend Environment Configuration
# =============================================================================

# Environment
NODE_ENV=development

# Server Configuration
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=password
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_AUTO_CREATE=true
DB_AUTO_CREATE_USER=true

# JWT Configuration (MUST be at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-must-be-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Application Configuration
FRONTEND_URL=http://localhost:3000

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-must-be-at-least-32-characters-long
```

### 2. สร้างไฟล์ Frontend Environment

สร้างไฟล์ `frontend/.env.local` ด้วยเนื้อหาดังนี้:

```env
# =============================================================================
# EMR System - Frontend Environment Configuration
# =============================================================================

# Environment
NODE_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Application Configuration
NEXT_PUBLIC_APP_NAME=EMR System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=true
NEXT_PUBLIC_ENABLE_CONSENT_ENGINE=true
NEXT_PUBLIC_ENABLE_EXTERNAL_REQUESTERS=true

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_SHOW_DEV_TOOLS=true
```

## 🔧 การตั้งค่าสำคัญ

### Database Configuration
```env
DB_HOST=localhost          # ที่อยู่ของ PostgreSQL
DB_PORT=5432              # พอร์ตของ PostgreSQL
DB_NAME=emr_development   # ชื่อฐานข้อมูล
DB_USER=postgres          # ชื่อผู้ใช้ฐานข้อมูล
DB_PASSWORD=password      # รหัสผ่านฐานข้อมูล
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-must-be-at-least-32-characters-long
```

**⚠️ สำคัญ:** JWT secrets ต้องมีความยาวอย่างน้อย 32 ตัวอักษร

### Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## 🚀 การทดสอบ

### 1. ทดสอบ Backend
```bash
cd backend
npm run dev
```

ควรเห็นข้อความ:
```
🔧 Configuration Summary:
  - Environment: development
  - Port: 3001
  - Database: localhost:5432/emr_development
  - CORS Origins: http://localhost:3000, http://127.0.0.1:3000
  - Frontend URL: http://localhost:3000
```

### 2. ทดสอบ Frontend
```bash
cd frontend
npm run dev
```

ควรเห็นข้อความ:
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

### 3. ทดสอบ API Connection
```bash
curl http://localhost:3001/health
```

ควรได้ response:
```json
{
  "data": {
    "status": "ok",
    "time": "2025-01-27T...",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

## 🔍 การตรวจสอบ Environment Variables

### Backend
```bash
cd backend
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');"
```

### Frontend
```bash
cd frontend
node -e "console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL);"
```

## 🛠️ การแก้ไขปัญหา

### ปัญหา: "Environment validation failed"
**สาเหตุ:** JWT secrets สั้นเกินไป
**วิธีแก้:** เปลี่ยน JWT_SECRET และ JWT_REFRESH_SECRET ให้มีความยาวอย่างน้อย 32 ตัวอักษร

### ปัญหา: "Database connection failed"
**สาเหตุ:** ตั้งค่า database ไม่ถูกต้อง
**วิธีแก้:** ตรวจสอบ DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

### ปัญหา: "CORS error"
**สาเหตุ:** Frontend URL ไม่ตรงกับ CORS_ORIGINS
**วิธีแก้:** ตรวจสอบ CORS_ORIGINS ใน backend/.env

### ปัญหา: "API not found"
**สาเหตุ:** NEXT_PUBLIC_API_URL ไม่ถูกต้อง
**วิธีแก้:** ตรวจสอบ NEXT_PUBLIC_API_URL ใน frontend/.env.local

## 📝 หมายเหตุ

1. **ไฟล์ .env ต้องอยู่ใน .gitignore** เพื่อความปลอดภัย
2. **JWT secrets ต้องเปลี่ยนใน production**
3. **Database password ต้องเปลี่ยนใน production**
4. **Email configuration ต้องตั้งค่าจริงเพื่อส่ง email**

## ✅ Checklist

- [ ] สร้างไฟล์ `backend/.env`
- [ ] สร้างไฟล์ `frontend/.env.local`
- [ ] ตั้งค่า database configuration
- [ ] ตั้งค่า JWT secrets (อย่างน้อย 32 ตัวอักษร)
- [ ] ตั้งค่า email configuration (ถ้าต้องการ)
- [ ] ทดสอบ backend server
- [ ] ทดสอบ frontend server
- [ ] ทดสอบ API connection
- [ ] ตรวจสอบ environment variables

---

**🎯 หลังจากทำตามขั้นตอนนี้ ระบบ EMR จะสามารถทำงานได้อย่างถูกต้อง!**
