# 🗄️ Database Setup Guide - HealthChain EMR System

## 📋 สารบัญ
1. [การติดตั้ง PostgreSQL](#การติดตั้ง-postgresql)
2. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
3. [การใช้งาน Database CLI](#การใช้งาน-database-cli)
4. [การเริ่มต้นระบบ](#การเริ่มต้นระบบ)
5. [การทดสอบระบบ](#การทดสอบระบบ)
6. [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## 🐘 การติดตั้ง PostgreSQL

### 1. ติดตั้ง PostgreSQL

#### Ubuntu/Debian:
```bash
# อัปเดต package list
sudo apt update

# ติดตั้ง PostgreSQL
sudo apt install postgresql postgresql-contrib

# เริ่มต้น PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# ตรวจสอบสถานะ
sudo systemctl status postgresql
```

#### CentOS/RHEL:
```bash
# ติดตั้ง PostgreSQL repository
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# ติดตั้ง PostgreSQL
sudo yum install -y postgresql14-server postgresql14

# เริ่มต้น database
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14
```

#### macOS (Homebrew):
```bash
# ติดตั้ง PostgreSQL
brew install postgresql@14

# เริ่มต้น service
brew services start postgresql@14

# สร้าง database
createdb emr_development
```

#### Windows:
1. ดาวน์โหลด PostgreSQL จาก [postgresql.org](https://www.postgresql.org/download/windows/)
2. ติดตั้งด้วย installer
3. ตั้งค่า password สำหรับ postgres user
4. เปิด pgAdmin หรือใช้ command line

### 2. ตั้งค่า PostgreSQL

```bash
# เข้าสู่ PostgreSQL shell
sudo -u postgres psql

# สร้าง database
CREATE DATABASE emr_development;

# สร้าง user (ถ้าต้องการ)
CREATE USER emr_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE emr_development TO emr_user;

# ออกจาก PostgreSQL shell
\q
```

---

## ⚙️ การตั้งค่า Environment Variables

### 1. สร้างไฟล์ .env

```bash
# ไปที่ backend directory
cd backend

# สร้างไฟล์ .env
cp .env.example .env
```

### 2. แก้ไขไฟล์ .env

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=your_password_here

# Database Advanced Settings
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_AUTO_CREATE=true
DB_AUTO_CREATE_USER=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM="HealthChain EMR <no-reply@healthchain.com>"

# Application URLs
FRONTEND_URL=http://localhost:3000
```

### 3. Environment Variables สำหรับ Production

```env
# Production Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=emr_production
DB_USER=emr_prod_user
DB_PASSWORD=secure_production_password
DB_SSL=true
DB_AUTO_CREATE=false
DB_AUTO_CREATE_USER=false

# Production Security
JWT_SECRET=very-secure-jwt-secret-for-production
JWT_REFRESH_SECRET=very-secure-refresh-secret-for-production
NODE_ENV=production
```

---

## 🛠️ การใช้งาน Database CLI

### 1. Database CLI Commands

```bash
# ดู help
npm run db:cli -- --help

# ดู configuration
npm run db:config

# ทดสอบการเชื่อมต่อ
npm run db:test-connection

# ดูสถานะระบบ
npm run db:status

# ดู health check
npm run db:health

# ดู migration status
npm run db:migrations
```

### 2. Database Management Commands

```bash
# สร้าง database (ถ้าไม่มี)
npm run db:create-db

# สร้าง user (ถ้าไม่มี)
npm run db:create-user

# เริ่มต้นระบบ database
npm run db:init

# รีเซ็ต database (development only)
npm run db:reset

# เพิ่มข้อมูลตัวอย่าง
npm run db:seed
```

### 3. การทดสอบระบบ

```bash
# ทดสอบการเชื่อมต่อแบบง่าย
npm run db:test-connection

# ทดสอบระบบแบบครบถ้วน
npm run db:test-full
```

---

## 🚀 การเริ่มต้นระบบ

### 1. เริ่มต้นแบบอัตโนมัติ (แนะนำ)

```bash
# ติดตั้ง dependencies
npm install

# เริ่มต้นระบบ (จะสร้าง database และ tables อัตโนมัติ)
npm run dev
```

ระบบจะทำงานดังนี้:
1. ✅ เชื่อมต่อ PostgreSQL
2. ✅ สร้าง database ถ้าไม่มี
3. ✅ สร้าง user ถ้าไม่มี
4. ✅ รัน migrations
5. ✅ เริ่มต้น server

### 2. เริ่มต้นแบบแยกขั้นตอน

```bash
# ขั้นตอนที่ 1: สร้าง database
npm run db:create-db

# ขั้นตอนที่ 2: สร้าง user
npm run db:create-user

# ขั้นตอนที่ 3: เริ่มต้นระบบ
npm run db:init

# ขั้นตอนที่ 4: เพิ่มข้อมูลตัวอย่าง
npm run db:seed

# ขั้นตอนที่ 5: เริ่มต้น server
npm run dev
```

### 3. เริ่มต้นแบบ Production

```bash
# Build application
npm run build

# เริ่มต้น production server
npm run start:prod
```

---

## 🧪 การทดสอบระบบ

### 1. ทดสอบการเชื่อมต่อ

```bash
# ทดสอบการเชื่อมต่อแบบง่าย
npm run db:test-connection

# ผลลัพธ์ที่คาดหวัง:
# 🔍 Testing database connection...
# ✅ Database connection test successful!
```

### 2. ทดสอบระบบแบบครบถ้วน

```bash
# ทดสอบระบบแบบครบถ้วน
npm run db:test-full

# ผลลัพธ์ที่คาดหวัง:
# 🧪 Starting database tests...
# 🔌 Test 1: Database Connection ✅
# 🚀 Test 2: Database Initialization ✅
# 🔄 Test 3: Migration System ✅
# 📝 Test 4: Basic Queries ✅
# 🔄 Test 5: Transaction Support ✅
# ⚡ Test 6: Performance Test ✅
# 🏥 Test 7: Health Check ✅
# ✅ All database tests passed successfully!
```

### 3. ตรวจสอบสถานะระบบ

```bash
# ดูสถานะระบบ
npm run db:status

# ผลลัพธ์ที่คาดหวัง:
# 📊 Database System Status
# ========================
# 🔌 Database Connection:
#   Status: ✅ Connected
#   Name: emr_development
#   Version: PostgreSQL 14.x
#   Size: 15 MB
#   Connections: 2
#   Uptime: 1d 2h 30m
# 
# 🔄 Migrations:
#   Total: 5
#   Executed: 5
#   Failed: 0
# 
# 📋 Tables: 15 tables
# 📊 Data Counts:
#   Users: 6
#   Patients: 3
#   Departments: 8
```

---

## 🔧 การแก้ไขปัญหา

### 1. ปัญหาการเชื่อมต่อ Database

#### Error: "connection refused"
```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
sudo systemctl status postgresql

# เริ่มต้น PostgreSQL
sudo systemctl start postgresql

# ตรวจสอบ port
sudo netstat -tulpn | grep :5432
```

#### Error: "database does not exist"
```bash
# สร้าง database
npm run db:create-db

# หรือสร้างด้วย SQL
sudo -u postgres psql -c "CREATE DATABASE emr_development;"
```

#### Error: "authentication failed"
```bash
# ตรวจสอบ username/password ใน .env
cat backend/.env | grep DB_

# ทดสอบการเชื่อมต่อด้วย psql
psql -h localhost -U postgres -d emr_development
```

### 2. ปัญหา Migration

#### Error: "migration failed"
```bash
# ดู migration status
npm run db:migrations

# รีเซ็ต migrations (development only)
npm run db:reset

# หรือรัน migration ใหม่
npm run db:init
```

### 3. ปัญหา Performance

#### Database ช้า
```bash
# ตรวจสอบ connections
npm run db:status

# ตรวจสอบ performance
npm run db:test-full

# ปรับแต่ง max connections ใน .env
DB_MAX_CONNECTIONS=10
```

### 4. ปัญหา Memory

#### Out of memory
```bash
# ตรวจสอบ memory usage
free -h

# ปรับแต่ง connection pool
DB_MAX_CONNECTIONS=5
DB_IDLE_TIMEOUT=10000
```

---

## 📊 Database Schema Overview

### Core Tables:
- **users** - ผู้ใช้ระบบ (admin, doctor, nurse, patient)
- **patients** - ข้อมูลผู้ป่วย
- **departments** - แผนกต่างๆ
- **visits** - การเยี่ยมผู้ป่วย
- **vital_signs** - สัญญาณชีพ
- **lab_orders** - การสั่งตรวจแล็บ
- **lab_results** - ผลการตรวจแล็บ
- **prescriptions** - ใบสั่งยา
- **prescription_items** - รายการยา
- **appointments** - การนัดหมาย

### AI & Consent Tables:
- **risk_assessments** - การประเมินความเสี่ยง
- **ai_model_performance** - ประสิทธิภาพ AI
- **consent_contracts** - สัญญาความยินยอม
- **consent_access_logs** - บันทึกการเข้าถึงข้อมูล
- **consent_audit_trail** - Audit trail

### System Tables:
- **user_sessions** - เซสชันผู้ใช้
- **password_reset_tokens** - Token รีเซ็ตรหัสผ่าน
- **email_verification_tokens** - Token ยืนยันอีเมล
- **audit_logs** - บันทึกการใช้งาน
- **migrations** - Migration history

---

## 🔒 Security Best Practices

### 1. Database Security
```env
# ใช้ strong passwords
DB_PASSWORD=very_secure_password_123!

# เปิด SSL ใน production
DB_SSL=true

# จำกัด connections
DB_MAX_CONNECTIONS=20
```

### 2. Environment Security
```bash
# ตั้งค่า file permissions
chmod 600 backend/.env

# อย่า commit .env ไป git
echo ".env" >> .gitignore
```

### 3. Production Security
```env
# ใช้ environment variables
NODE_ENV=production
DB_AUTO_CREATE=false
DB_AUTO_CREATE_USER=false

# ใช้ connection pooling
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=5000
```

---

## 📞 การสนับสนุน

### ช่องทางการติดต่อ:
- 📧 Email: support@healthchain.co.th
- 📱 Phone: 02-123-4567
- 💬 Chat: ผ่านระบบในแอป

### เอกสารเพิ่มเติม:
- 📖 [USER_GUIDE.md](USER_GUIDE.md) - คู่มือการใช้งาน
- 🎬 [DEMO_SCRIPTS.md](DEMO_SCRIPTS.md) - Scripts สำหรับ demo
- 📊 [SAMPLE_DATA.md](SAMPLE_DATA.md) - ข้อมูลตัวอย่าง
- 🚀 [SETUP_GUIDE.md](SETUP_GUIDE.md) - คู่มือการติดตั้ง

---

**🎉 ระบบ Database พร้อมใช้งาน! ขอให้ใช้งานอย่างมีความสุข!**
