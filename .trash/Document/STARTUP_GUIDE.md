# 🚀 EMR System - คู่มือการเริ่มต้นระบบ

**วันที่อัปเดต:** 5 กันยายน 2025  
**สถานะ:** ✅ พร้อมใช้งาน

---

## 📋 ข้อกำหนดเบื้องต้น

### **Software Requirements:**
- ✅ **Node.js** - เวอร์ชัน 18.0.0 หรือสูงกว่า
- ✅ **PostgreSQL** - เวอร์ชัน 12 หรือสูงกว่า
- ✅ **npm** - เวอร์ชัน 8.0.0 หรือสูงกว่า
- ✅ **Git** - สำหรับ clone repository

### **System Requirements:**
- ✅ **RAM** - อย่างน้อย 4GB
- ✅ **Storage** - อย่างน้อย 2GB ว่าง
- ✅ **OS** - Windows 10/11, macOS, หรือ Linux

---

## 🛠️ การติดตั้งและตั้งค่า

### **1. Clone Repository**
```bash
git clone <repository-url>
cd Project
```

### **2. ติดตั้ง Dependencies**

#### **Backend Dependencies:**
```bash
cd backend
npm install
```

#### **Frontend Dependencies:**
```bash
cd frontend
npm install
```

### **3. ตั้งค่า Database**

#### **ติดตั้ง PostgreSQL:**
- ดาวน์โหลดและติดตั้ง PostgreSQL จาก [postgresql.org](https://www.postgresql.org/download/)
- สร้าง database ชื่อ `postgres` (default)
- ตั้งค่า username: `postgres` และ password: `password`

#### **สร้าง Environment File:**
```bash
# ใน backend directory
cp .env.example .env
```

#### **แก้ไข .env file:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=password
DB_AUTO_CREATE=true
DB_AUTO_CREATE_USER=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

---

## 🚀 การเริ่มต้นระบบ

### **1. เริ่มต้น Database**
```bash
cd backend
npm run db:init
```

### **2. รัน Database Migrations**
```bash
npm run db:migrate
```

### **3. สร้าง Sample Data (Optional)**
```bash
npm run db:seed
```

### **4. เริ่มต้น Backend Server**
```bash
npm run dev
```
**Backend จะรันที่:** `http://localhost:3001`

### **5. เริ่มต้น Frontend Server**
```bash
cd frontend
npm run dev
```
**Frontend จะรันที่:** `http://localhost:3000`

---

## 🔍 การทดสอบระบบ

### **1. ทดสอบ Backend APIs**
```bash
cd backend
npm run test:api
```

### **2. ทดสอบ Database Connection**
```bash
npm run db:test-connection
```

### **3. ทดสอบ Frontend**
```bash
cd frontend
npm run test
```

### **4. ทดสอบ Performance**
```bash
# Backend Performance
npm run perf:all

# Frontend Performance
npm run perf:all
```

---

## 📱 การใช้งานระบบ

### **1. เข้าสู่ระบบ**
- เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
- คลิก "เข้าสู่ระบบ" หรือ "สมัครสมาชิก"

### **2. สมัครสมาชิก**
- คลิก "สมัครสมาชิก"
- กรอกข้อมูลและเลือกบทบาท (Patient, Doctor, Nurse, Admin)
- ยืนยันอีเมล (ถ้าเปิดใช้งาน)

### **3. เข้าสู่ระบบ**
- ใช้ email และ password ที่สมัครไว้
- ระบบจะ redirect ไปยัง dashboard ตามบทบาท

---

## 🎯 User Roles และ Access

### **Patient Portal:**
- **URL:** `http://localhost:3000/accounts/patient`
- **Features:** Dashboard, Appointments, Medical Records, Lab Results, Medications, Documents, AI Insights, Consent Requests, Notifications, Profile

### **Doctor Portal:**
- **URL:** `http://localhost:3000/accounts/doctor`
- **Features:** Dashboard, Patient Management, Medical Records, Prescriptions, Lab Orders, Visits

### **Nurse Portal:**
- **URL:** `http://localhost:3000/accounts/nurse`
- **Features:** Dashboard, Patient Care, Vital Signs, Medication Administration

### **Admin Portal:**
- **URL:** `http://localhost:3000/admin`
- **Features:** User Management, Role Management, System Monitoring, Audit Logs, Database Management

### **EMR System:**
- **URL:** `http://localhost:3000/emr`
- **Features:** Patient Registration, Medical Records, Lab Results, Prescriptions, Pharmacy

### **External Requesters:**
- **URL:** `http://localhost:3000/external-requesters`
- **Features:** Data Requests, Consent Management, Reports

---

## 🔧 API Documentation

### **Swagger UI:**
- **URL:** `http://localhost:3001/api-docs`
- **Features:** Interactive API documentation, Test endpoints, Schema definitions

### **Postman Collection:**
- **File:** `backend/postman/EMR-System-API.postman_collection.json`
- **Import:** Import ไฟล์นี้ใน Postman เพื่อทดสอบ APIs

---

## 🛠️ Development Commands

### **Backend Commands:**
```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm start                  # Start production server

# Database
npm run db:init            # Initialize database
npm run db:migrate         # Run migrations
npm run db:seed            # Seed sample data
npm run db:status          # Check database status
npm run db:health          # Check database health

# Testing
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:api           # Test API endpoints

# Performance
npm run perf:api           # API performance test
npm run perf:db            # Database performance test
npm run perf:concurrent    # Concurrent users test
npm run perf:all           # Run all performance tests

# Validation
npm run validate           # Type check and lint
npm run validate:system    # System validation
npm run validate:all       # All validations
```

### **Frontend Commands:**
```bash
# Development
npm run dev                # Start development server
npm run build              # Build for production
npm start                  # Start production server

# Testing
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Performance
npm run perf:lighthouse    # Lighthouse performance test
npm run perf:bundle        # Bundle size analysis
npm run perf:all           # Run all performance tests

# Linting
npm run lint               # Run ESLint
```

---

## 🔍 Troubleshooting

### **Common Issues:**

#### **1. Database Connection Error:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database connection
npm run db:test-connection
```

#### **2. Port Already in Use:**
```bash
# Kill process on port 3001
npx kill-port 3001

# Kill process on port 3000
npx kill-port 3000
```

#### **3. Dependencies Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **4. Environment Variables:**
```bash
# Check if .env file exists
ls -la backend/.env

# Verify environment variables
npm run db:config
```

---

## 📊 System Status Check

### **Health Check Endpoints:**
- **Backend Health:** `http://localhost:3001/api/health`
- **Frontend Health:** `http://localhost:3000/health`

### **Database Status:**
```bash
cd backend
npm run db:status
npm run db:health
```

### **System Validation:**
```bash
npm run validate:system
```

---

## 🚀 Production Deployment

### **Backend Production:**
```bash
# Build
npm run build

# Start production server
npm run start:prod
```

### **Frontend Production:**
```bash
# Build
npm run build

# Start production server
npm start
```

### **Environment Variables for Production:**
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

---

## 📞 Support

### **Documentation:**
- **API Documentation:** `http://localhost:3001/api-docs`
- **User Manual:** `USER_MANUAL.md`
- **Admin Guide:** `ADMIN_GUIDE.md`
- **Developer Guide:** `DEVELOPER_GUIDE.md`

### **Test Scripts:**
- **Authentication Test:** `backend/src/scripts/test-auth-api.ts`
- **Database Test:** `backend/src/scripts/test-database.ts`
- **API Test:** `backend/src/scripts/test-api.ts`

### **Logs:**
- **Backend Logs:** Check console output
- **Database Logs:** PostgreSQL logs
- **Frontend Logs:** Browser console

---

## ✅ Checklist การเริ่มต้น

- [ ] ติดตั้ง Node.js (v18+)
- [ ] ติดตั้ง PostgreSQL
- [ ] Clone repository
- [ ] ติดตั้ง backend dependencies (`npm install`)
- [ ] ติดตั้ง frontend dependencies (`npm install`)
- [ ] สร้าง .env file
- [ ] ตั้งค่า database configuration
- [ ] รัน database migrations (`npm run db:migrate`)
- [ ] เริ่มต้น backend server (`npm run dev`)
- [ ] เริ่มต้น frontend server (`npm run dev`)
- [ ] ทดสอบระบบ (`npm run test:api`)
- [ ] เข้าสู่ระบบและทดสอบ features

---

**📝 หมายเหตุ:** ระบบ EMR พร้อมใช้งานแล้ว! หากมีปัญหาหรือข้อสงสัย กรุณาตรวจสอบ troubleshooting section หรือดู documentation เพิ่มเติม
