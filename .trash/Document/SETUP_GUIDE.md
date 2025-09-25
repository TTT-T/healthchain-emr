# 🏥 EMR System - คู่มือการติดตั้งและใช้งาน

## 📋 ข้อกำหนดระบบ

### ซอฟต์แวร์ที่จำเป็น
- **Node.js** >= 18.0.0
- **npm** หรือ **yarn**
- **PostgreSQL** >= 13
- **Redis** >= 6
- **Git**
- **Docker** และ **Docker Compose** (ตัวเลือก)

### ระบบปฏิบัติการที่รองรับ
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+
- CentOS 7+

---

## 🚀 วิธีการติดตั้ง

### วิธีที่ 1: ติดตั้งด้วย Docker (แนะนำ)

#### 1. โคลนโปรเจก
```bash
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr
```

#### 2. สร้างไฟล์ Environment
```bash
# คัดลอกไฟล์ตัวอย่าง
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

#### 3. แก้ไขการตั้งค่าในไฟล์ `.env`
```bash
# backend/.env
NODE_ENV=development
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=12345
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

#### 4. เริ่มต้นระบบด้วย Docker
```bash
# เริ่มต้นฐานข้อมูลและ Redis
docker-compose up postgres redis -d

# รอให้ฐานข้อมูลพร้อม (ประมาณ 30 วินาที)
sleep 30

# เริ่มต้น Backend และ Frontend
docker-compose up backend frontend
```

---

### วิธีที่ 2: ติดตั้งแบบ Manual

#### 1. โคลนโปรเจก
```bash
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr
```

#### 2. ติดตั้งฐานข้อมูล PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (ด้วย Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# ดาวน์โหลดและติดตั้งจาก https://www.postgresql.org/download/windows/
```

#### 3. สร้างฐานข้อมูล
```sql
-- เข้าสู่ PostgreSQL
sudo -u postgres psql

-- สร้างฐานข้อมูลและผู้ใช้
CREATE DATABASE emr_development;
CREATE USER emr_user WITH PASSWORD '12345';
GRANT ALL PRIVILEGES ON DATABASE emr_development TO emr_user;
\q
```

#### 4. ติดตั้ง Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS (ด้วย Homebrew)
brew install redis
brew services start redis

# Windows
# ดาวน์โหลดและติดตั้งจาก https://redis.io/download
```

#### 5. ติดตั้ง Backend
```bash
cd backend
npm install
cp env.example .env
# แก้ไขไฟล์ .env ตามการตั้งค่าของคุณ
npm run build
npm run migrate
npm run dev
```

#### 6. ติดตั้ง Frontend (Terminal ใหม่)
```bash
cd frontend
npm install
cp .env.example .env.local
# แก้ไขไฟล์ .env.local ตามการตั้งค่าของคุณ
npm run dev
```

---

## 🔧 การตั้งค่าเพิ่มเติม

### การตั้งค่า Email (Gmail)
1. เปิดใช้งาน 2-Factor Authentication ใน Gmail
2. สร้าง App Password:
   - ไปที่ Google Account Settings
   - Security → 2-Step Verification → App passwords
   - สร้าง App Password สำหรับ "Mail"
3. ใช้ App Password ในไฟล์ `.env`

### การตั้งค่า Admin User
```bash
cd backend
npm run db:cli
# เลือก "Create Admin User" และทำตามคำแนะนำ
```

---

## 🌐 การเข้าถึงระบบ

หลังจากติดตั้งเสร็จแล้ว:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

### บัญชีเริ่มต้น
- **Admin**: admin@example.com / admin123
- **Doctor**: doctor@example.com / doctor123
- **Nurse**: nurse@example.com / nurse123
- **Patient**: patient@example.com / patient123

---

## 🛠️ คำสั่งที่มีประโยชน์

### Backend Commands
```bash
# Development
npm run dev              # เริ่มต้น development server
npm run build           # Build โปรเจก
npm run test            # รัน tests
npm run migrate         # รัน database migrations

# Database
npm run db:status       # ตรวจสอบสถานะฐานข้อมูล
npm run db:health       # ตรวจสอบสุขภาพฐานข้อมูล
npm run db:migrate      # รัน migrations
npm run db:seed         # เพิ่มข้อมูลตัวอย่าง

# Performance Testing
npm run perf:api        # ทดสอบ API performance
npm run perf:db         # ทดสอบ database performance
npm run perf:all        # ทดสอบทั้งหมด
```

### Frontend Commands
```bash
# Development
npm run dev             # เริ่มต้น development server
npm run build           # Build โปรเจก
npm run start           # เริ่มต้น production server
npm run test            # รัน tests

# Performance
npm run perf:lighthouse # ทดสอบ Lighthouse
npm run perf:bundle     # วิเคราะห์ bundle size
```

### Docker Commands
```bash
# เริ่มต้นระบบทั้งหมด
docker-compose up

# เริ่มต้นเฉพาะฐานข้อมูล
docker-compose up postgres redis

# เริ่มต้นในโหมด background
docker-compose up -d

# หยุดระบบ
docker-compose down

# ดู logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild containers
docker-compose build --no-cache
```

---

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. ฐานข้อมูลเชื่อมต่อไม่ได้
```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
sudo systemctl status postgresql

# ตรวจสอบการเชื่อมต่อ
npm run db:test-connection
```

#### 2. Redis เชื่อมต่อไม่ได้
```bash
# ตรวจสอบว่า Redis ทำงานอยู่
redis-cli ping
# ควรได้ผลลัพธ์: PONG
```

#### 3. Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# ฆ่า process ที่ใช้ port
sudo kill -9 <PID>
```

#### 4. Node modules มีปัญหา
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
```

#### 5. Docker มีปัญหา
```bash
# ลบ containers และ volumes
docker-compose down -v
docker system prune -a

# สร้างใหม่
docker-compose up --build
```

---

## 📁 โครงสร้างโปรเจก

```
healthchain-emr/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # API Controllers
│   │   ├── database/        # Database migrations & schemas
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── scripts/             # Database & admin scripts
│   └── tests/               # Backend tests
├── frontend/                # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── docker-compose.yml       # Docker configuration
└── README.md               # Project documentation
```

---

## 🔒 การตั้งค่าสำหรับ Production

### 1. Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
DB_PASSWORD=<strong-database-password>
SMTP_PASSWORD=<email-app-password>
```

### 2. Security Headers
- เปิดใช้งาน HTTPS
- ตั้งค่า CORS ให้เหมาะสม
- ใช้ environment variables สำหรับ secrets

### 3. Database
- ใช้ connection pooling
- ตั้งค่า backup strategy
- เปิดใช้งาน SSL

### 4. Monitoring
- ตั้งค่า logging
- ใช้ monitoring tools (เช่น PM2)
- ตั้งค่า health checks

---

## 📞 การขอความช่วยเหลือ

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ logs ใน `backend/logs/`
2. ดู API documentation ที่ http://localhost:3001/api-docs
3. ตรวจสอบ GitHub Issues
4. ติดต่อทีมพัฒนา

---

## 🎯 ขั้นตอนถัดไป

หลังจากติดตั้งเสร็จแล้ว:

1. **สร้าง Admin User** - ใช้ script ใน `backend/scripts/`
2. **ทดสอบระบบ** - ลองใช้งานฟีเจอร์ต่างๆ
3. **ตั้งค่า Email** - กำหนดค่า SMTP สำหรับการส่งอีเมล
4. **ปรับแต่ง UI** - แก้ไขสี, logo, และ branding
5. **เพิ่มข้อมูลตัวอย่าง** - ใช้ `npm run db:seed`

---

**หมายเหตุ**: คู่มือนี้ครอบคลุมการติดตั้งพื้นฐาน หากต้องการการตั้งค่าเฉพาะหรือมีคำถามเพิ่มเติม กรุณาติดต่อทีมพัฒนา
