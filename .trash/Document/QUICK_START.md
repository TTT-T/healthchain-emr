# 🚀 HealthChain EMR System - Quick Start Guide

## ⚡ เริ่มต้นใช้งานใน 5 นาที

### 1. 📥 ติดตั้งระบบ
```bash
# Clone repository
git clone <repository-url>
cd emr-system

# ติดตั้ง dependencies
cd backend && npm install
cd ../frontend && npm install

# ตั้งค่า database
createdb emr_development

# รัน migrations
cd backend && npm run migrate

# สร้าง sample data
./seed_database.sh
```

### 2. 🔧 ตั้งค่า Environment
```bash
# Backend
echo "NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=12345
JWT_SECRET=your-secret-key-2025" > backend/.env

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000" > frontend/.env.local
```

### 3. 🚀 เริ่มระบบ
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4. 🌐 เข้าสู่ระบบ
เปิดเบราว์เซอร์ไปที่: **http://localhost:3000**

#### บัญชีทดสอบ:
| Role | Username | Password | การใช้งาน |
|------|----------|----------|-----------|
| **Admin** | admin | admin123 | จัดการระบบทั้งหมด |
| **Doctor** | dr_smith | doctor123 | จัดการผู้ป่วยและบันทึกข้อมูล |
| **Nurse** | nurse_wilson | nurse123 | บันทึกข้อมูลพื้นฐาน |
| **Patient** | patient_doe | patient123 | ดูข้อมูลส่วนตัว |

---

## 🎯 การใช้งานพื้นฐาน

### 👨‍💼 Admin Dashboard
```
1. เข้าสู่ระบบด้วย admin/admin123
2. ดู System Overview
3. จัดการ Users
4. ตรวจสอบ System Health
```

### 👨‍⚕️ Doctor Workflow
```
1. เข้าสู่ระบบด้วย dr_smith/doctor123
2. ดู Today's Schedule
3. สร้างผู้ป่วยใหม่
4. บันทึก Visit Record
5. เขียนใบสั่งยา
6. ใช้ AI Risk Assessment
```

### 👩‍⚕️ Nurse Workflow
```
1. เข้าสู่ระบบด้วย nurse_wilson/nurse123
2. ดู Patient Check-in Queue
3. บันทึก Vital Signs
4. สั่ง Lab Tests
5. จัดการ Medications
```

### 👤 Patient Portal
```
1. เข้าสู่ระบบด้วย patient_doe/patient123
2. ดู Upcoming Appointments
3. ดู Recent Records
4. ตรวจสอบ Health Alerts
5. จัดการ Consent Requests
```

---

## 🔧 API Testing

### ทดสอบ Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Get Profile
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ทดสอบ Patient Management
```bash
# Search Patients
curl -X GET "http://localhost:3001/api/patients/search?query=สมชาย" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create Patient
curl -X POST http://localhost:3001/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890123",
    "thaiName": "สมชาย ใจดี",
    "gender": "male",
    "birthDate": "1985-05-15"
  }'
```

### ทดสอบ Medical Records
```bash
# Create Visit
curl -X POST http://localhost:3001/api/visits \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "visitType": "consultation",
    "chiefComplaint": "ปวดหัว"
  }'

# Add Vital Signs
curl -X POST http://localhost:3001/api/vital-signs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "visit-uuid",
    "patientId": "patient-uuid",
    "systolicBp": 140,
    "diastolicBp": 90,
    "heartRate": 80
  }'
```

---

## 🤖 AI Risk Assessment

### ประเมินความเสี่ยงโรคเบาหวาน
```bash
curl -X POST http://localhost:3001/api/ai/risk-assessment/diabetes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "factors": {
      "age": 45,
      "bmi": 28.5,
      "familyHistory": true,
      "bloodPressure": 140,
      "bloodSugar": 110
    }
  }'
```

### ประเมินความเสี่ยงโรคความดันโลหิตสูง
```bash
curl -X POST http://localhost:3001/api/ai/risk-assessment/hypertension \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "factors": {
      "age": 45,
      "bmi": 28.5,
      "familyHistory": true,
      "smoking": false,
      "physicalActivity": "low"
    }
  }'
```

---

## 🔒 Consent Management

### สร้างสัญญาความยินยอม
```bash
curl -X POST http://localhost:3001/api/consent/contracts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "requesterId": "requester-uuid",
    "dataTypes": ["medical_records", "lab_results"],
    "purpose": "Medical Research",
    "duration": "1 year"
  }'
```

### อนุมัติความยินยอม
```bash
curl -X PATCH http://localhost:3001/api/consent/contracts/contract-uuid/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reason": "Patient approved"
  }'
```

---

## 📊 Sample Data

### ข้อมูลตัวอย่างที่มี:
- **Users**: 6 บัญชี (admin, doctor, nurse, pharmacist, 2 patients)
- **Patients**: 3 ผู้ป่วย (John Doe, สมชาย ใจดี, Jane Smith)
- **Visits**: 2 การเยี่ยม
- **Vital Signs**: 2 บันทึก
- **Lab Orders**: 1 การสั่งตรวจ
- **Prescriptions**: 1 ใบสั่งยา
- **Appointments**: 2 การนัดหมาย
- **Risk Assessments**: 2 การประเมินความเสี่ยง
- **Consent Contracts**: 2 สัญญาความยินยอม

### ดูข้อมูลตัวอย่าง:
```bash
# ดู users
psql -U postgres -d emr_development -c "SELECT username, role FROM users;"

# ดู patients
psql -U postgres -d emr_development -c "SELECT hospital_number, thai_name FROM patients;"

# ดู visits
psql -U postgres -d emr_development -c "SELECT visit_number, diagnosis FROM visits;"
```

---

## 🛠️ Troubleshooting

### ปัญหาที่พบบ่อย:

#### 1. ไม่สามารถเข้าสู่ระบบได้
```bash
# ตรวจสอบ database
psql -U postgres -d emr_development -c "SELECT username FROM users;"

# รีเซ็ตรหัสผ่าน
psql -U postgres -d emr_development -c "UPDATE users SET password_hash = '\$2a\$12\$hash' WHERE username = 'admin';"
```

#### 2. Database connection error
```bash
# ตรวจสอบ PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# ตรวจสอบ connection
psql -U postgres -h localhost -p 5432
```

#### 3. Frontend ไม่เชื่อมต่อ Backend
```bash
# ตรวจสอบ Backend
curl http://localhost:3001/health

# ตรวจสอบ environment
cat frontend/.env.local
```

#### 4. Port already in use
```bash
# หา process ที่ใช้ port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

---

## 📚 เอกสารเพิ่มเติม

### คู่มือการใช้งาน:
- 📖 **[USER_GUIDE.md](USER_GUIDE.md)** - คู่มือการใช้งานแบบละเอียด
- 🎬 **[DEMO_SCRIPTS.md](DEMO_SCRIPTS.md)** - Scripts สำหรับ demo
- 📊 **[SAMPLE_DATA.md](SAMPLE_DATA.md)** - ข้อมูลตัวอย่าง
- 🚀 **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - คู่มือการติดตั้ง

### API Documentation:
- 🔗 **Backend API**: http://localhost:3001/api/docs
- 🔗 **Health Check**: http://localhost:3001/health
- 🔗 **Frontend**: http://localhost:3000

### Development:
```bash
# Backend development
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint

# Frontend development
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

---

## 🎉 พร้อมใช้งาน!

### ✅ ระบบพร้อมสำหรับ:
- **Development และ Testing**
- **Production Deployment**
- **Docker Containerization**
- **CI/CD Integration**
- **Monitoring และ Health Checks**

### 🚀 เริ่มต้นใช้งาน:
1. **ติดตั้งระบบ** (5 นาที)
2. **เข้าสู่ระบบ** ด้วยบัญชีทดสอบ
3. **ทดสอบฟีเจอร์** ต่างๆ
4. **ดูข้อมูลตัวอย่าง**
5. **สร้างข้อมูลใหม่**

### 📞 การสนับสนุน:
- 📧 Email: support@healthchain.co.th
- 📱 Phone: 02-123-4567
- 💬 Chat: ผ่านระบบในแอป

---

**🎊 ขอให้ใช้งานระบบ EMR อย่างมีความสุข!**
