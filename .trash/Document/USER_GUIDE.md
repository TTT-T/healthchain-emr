# 🏥 HealthChain EMR System - คู่มือการใช้งาน

## 📋 สารบัญ
1. [การติดตั้งระบบ](#การติดตั้งระบบ)
2. [การเริ่มต้นใช้งาน](#การเริ่มต้นใช้งาน)
3. [การจัดการผู้ใช้](#การจัดการผู้ใช้)
4. [การจัดการผู้ป่วย](#การจัดการผู้ป่วย)
5. [การบันทึกข้อมูลทางการแพทย์](#การบันทึกข้อมูลทางการแพทย์)
6. [การนัดหมาย](#การนัดหมาย)
7. [การประเมินความเสี่ยงด้วย AI](#การประเมินความเสี่ยงด้วย-ai)
8. [การจัดการความยินยอม](#การจัดการความยินยอม)
9. [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)

---

## 🚀 การติดตั้งระบบ

### ขั้นตอนที่ 1: เตรียมสภาพแวดล้อม

```bash
# ตรวจสอบ Node.js version (ต้องเป็น 18+)
node --version

# ตรวจสอบ PostgreSQL
psql --version

# ตรวจสอบ Git
git --version
```

### ขั้นตอนที่ 2: Clone โปรเจกต์

```bash
# Clone repository
git clone <repository-url>
cd emr-system

# ดูโครงสร้างโปรเจกต์
tree -L 2
```

### ขั้นตอนที่ 3: ติดตั้ง Database

```bash
# เข้าสู่ PostgreSQL
sudo -u postgres psql

# สร้าง database และ user
CREATE DATABASE emr_development;
CREATE USER emr_user WITH PASSWORD 'emr_password_2025';
GRANT ALL PRIVILEGES ON DATABASE emr_development TO emr_user;
\q
```

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables

#### Backend (.env)
```bash
# สร้างไฟล์ environment
cd backend
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=emr_user
DB_PASSWORD=emr_password_2025

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-2025
JWT_REFRESH_SECRET=your-super-secret-refresh-key-2025

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```bash
# สร้างไฟล์ environment
cd frontend
cp .env.local.example .env.local

# แก้ไขไฟล์ .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### ขั้นตอนที่ 5: ติดตั้ง Dependencies

```bash
# ติดตั้ง Backend dependencies
cd backend
npm install

# ติดตั้ง Frontend dependencies
cd ../frontend
npm install
```

### ขั้นตอนที่ 6: รัน Database Migration

```bash
# กลับไปที่ backend directory
cd ../backend

# รัน migrations
npm run migrate

# สร้าง default users
npm run create-default-users
```

### ขั้นตอนที่ 7: เริ่มระบบ

```bash
# Terminal 1 - เริ่ม Backend
cd backend
npm run dev

# Terminal 2 - เริ่ม Frontend
cd frontend
npm run dev
```

### ขั้นตอนที่ 8: ตรวจสอบการทำงาน

```bash
# ตรวจสอบ Backend
curl http://localhost:3001/health

# ตรวจสอบ Frontend
curl http://localhost:3000/health

# เปิดเบราว์เซอร์
open http://localhost:3000
```

---

## 🎯 การเริ่มต้นใช้งาน

### 1. เข้าสู่ระบบ

#### เปิดเบราว์เซอร์ไปที่: http://localhost:3000

#### ใช้บัญชี Default:
| Role | Username | Password | การใช้งาน |
|------|----------|----------|-----------|
| **Admin** | admin | admin123 | จัดการระบบทั้งหมด |
| **Doctor** | doctor | doctor123 | จัดการผู้ป่วยและบันทึกข้อมูล |
| **Nurse** | nurse | nurse123 | บันทึกข้อมูลพื้นฐาน |
| **Patient** | patient | patient123 | ดูข้อมูลส่วนตัว |

### 2. หน้าจอหลักของแต่ละ Role

#### 👨‍💼 Admin Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 HealthChain EMR - Admin Dashboard                    │
├─────────────────────────────────────────────────────────┤
│ 📊 System Overview                                      │
│ ├─ Total Users: 150                                     │
│ ├─ Active Patients: 1,250                               │
│ ├─ Today's Appointments: 45                             │
│ └─ System Health: ✅ Healthy                            │
│                                                         │
│ 🔧 Quick Actions                                        │
│ ├─ 👥 Manage Users                                      │
│ ├─ 🏥 Patient Management                                │
│ ├─ 📅 Appointment Overview                              │
│ ├─ 🔍 System Logs                                       │
│ └─ ⚙️ System Settings                                   │
└─────────────────────────────────────────────────────────┘
```

#### 👨‍⚕️ Doctor Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 HealthChain EMR - Doctor Dashboard                   │
├─────────────────────────────────────────────────────────┤
│ 📋 Today's Schedule                                     │
│ ├─ 09:00 - John Doe (Follow-up)                        │
│ ├─ 10:30 - Jane Smith (New Patient)                    │
│ ├─ 14:00 - Bob Johnson (Consultation)                  │
│ └─ 16:00 - Alice Brown (Procedure)                     │
│                                                         │
│ 🚨 Urgent Cases                                         │
│ ├─ High Blood Pressure: 3 patients                     │
│ ├─ Diabetes Risk: 2 patients                           │
│ └─ Follow-up Required: 5 patients                      │
│                                                         │
│ 📊 Quick Stats                                          │
│ ├─ Patients Today: 8                                   │
│ ├─ Prescriptions: 12                                   │
│ └─ Lab Orders: 5                                       │
└─────────────────────────────────────────────────────────┘
```

#### 👩‍⚕️ Nurse Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 HealthChain EMR - Nurse Dashboard                    │
├─────────────────────────────────────────────────────────┤
│ 📋 Patient Check-in Queue                               │
│ ├─ 08:30 - Sarah Wilson (Vital Signs)                  │
│ ├─ 09:15 - Mike Davis (Blood Test)                     │
│ ├─ 10:00 - Lisa Chen (Vaccination)                     │
│ └─ 10:45 - Tom Brown (Check-up)                        │
│                                                         │
│ 🔄 Pending Tasks                                        │
│ ├─ Vital Signs: 4 patients                             │
│ ├─ Lab Collection: 3 patients                          │
│ ├─ Medication Admin: 2 patients                        │
│ └─ Documentation: 6 patients                           │
└─────────────────────────────────────────────────────────┘
```

#### 👤 Patient Portal
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 HealthChain EMR - Patient Portal                     │
├─────────────────────────────────────────────────────────┤
│ 👋 Welcome, John Doe                                    │
│                                                         │
│ 📅 Upcoming Appointments                                │
│ ├─ Tomorrow 10:00 - Dr. Smith (Cardiology)             │
│ └─ Next Week - Dr. Johnson (Follow-up)                 │
│                                                         │
│ 📋 Recent Records                                       │
│ ├─ Last Visit: 2025-01-15 (Blood Pressure Check)      │
│ ├─ Lab Results: 2025-01-10 (Complete Blood Count)     │
│ └─ Prescription: 2025-01-15 (Blood Pressure Meds)     │
│                                                         │
│ 🚨 Health Alerts                                        │
│ ├─ Blood Pressure: Slightly High                       │
│ └─ Next Check-up: Due in 2 weeks                       │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 การจัดการผู้ใช้

### 1. สร้างผู้ใช้ใหม่ (Admin Only)

#### ผ่าน Web Interface:
```
1. เข้าสู่ระบบด้วยบัญชี Admin
2. ไปที่ "User Management" → "Add New User"
3. กรอกข้อมูล:
   ├─ Username: new_doctor
   ├─ Email: doctor@hospital.com
   ├─ Password: secure_password_123
   ├─ First Name: Dr. Sarah
   ├─ Last Name: Wilson
   ├─ Role: doctor
   └─ Department: Cardiology
4. คลิก "Create User"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_doctor",
    "email": "doctor@hospital.com",
    "password": "secure_password_123",
    "firstName": "Dr. Sarah",
    "lastName": "Wilson",
    "role": "doctor",
    "departmentId": "cardiology"
  }'
```

### 2. จัดการสิทธิ์ผู้ใช้

#### เปลี่ยน Role:
```
1. ไปที่ User Management
2. คลิกที่ผู้ใช้ที่ต้องการแก้ไข
3. เปลี่ยน Role จาก "nurse" เป็น "doctor"
4. บันทึกการเปลี่ยนแปลง
```

#### ระงับบัญชี:
```
1. ไปที่ User Management
2. คลิกที่ผู้ใช้ที่ต้องการระงับ
3. คลิก "Deactivate Account"
4. ยืนยันการระงับ
```

---

## 🏥 การจัดการผู้ป่วย

### 1. สร้างผู้ป่วยใหม่

#### ผ่าน Web Interface:
```
1. เข้าสู่ระบบด้วยบัญชี Doctor/Nurse/Admin
2. ไปที่ "Patient Management" → "Add New Patient"
3. กรอกข้อมูลส่วนตัว:
   ├─ Thai Name: สมชาย ใจดี
   ├─ English Name: Somchai Jaidee
   ├─ National ID: 1234567890123
   ├─ Gender: Male
   ├─ Birth Date: 1985-05-15
   ├─ Phone: 081-234-5678
   ├─ Email: somchai@email.com
   └─ Address: 123 ถนนสุขุมวิท กรุงเทพฯ 10110
4. กรอกข้อมูลฉุกเฉิน:
   ├─ Emergency Contact: นางสมใจ ใจดี
   ├─ Phone: 082-345-6789
   └─ Relationship: ภรรยา
5. คลิก "Create Patient"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/patients \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "1234567890123",
    "thaiName": "สมชาย ใจดี",
    "englishName": "Somchai Jaidee",
    "gender": "male",
    "birthDate": "1985-05-15",
    "phone": "081-234-5678",
    "email": "somchai@email.com",
    "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
    "emergencyContact": {
      "name": "นางสมใจ ใจดี",
      "phone": "082-345-6789",
      "relationship": "ภรรยา"
    }
  }'
```

### 2. ค้นหาผู้ป่วย

#### ค้นหาด้วยชื่อ:
```
1. ไปที่ Patient Management
2. ใส่ชื่อในช่องค้นหา: "สมชาย"
3. คลิก "Search"
4. ระบบจะแสดงรายการผู้ป่วยที่ตรงกัน
```

#### ค้นหาด้วย HN:
```
1. ใส่ Hospital Number: "68-123456"
2. คลิก "Search"
3. ระบบจะแสดงข้อมูลผู้ป่วยคนนั้น
```

#### ค้นหาด้วย National ID:
```
1. ใส่เลขบัตรประชาชน: "1234567890123"
2. คลิก "Search"
3. ระบบจะแสดงข้อมูลผู้ป่วย
```

### 3. ดูข้อมูลผู้ป่วย

#### ข้อมูลส่วนตัว:
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Patient Information - HN: 68-123456                 │
├─────────────────────────────────────────────────────────┤
│ Personal Details                                        │
│ ├─ Name: สมชาย ใจดี (Somchai Jaidee)                   │
│ ├─ Age: 39 years old                                   │
│ ├─ Gender: Male                                        │
│ ├─ Birth Date: 1985-05-15                             │
│ ├─ National ID: 1234567890123                         │
│ ├─ Phone: 081-234-5678                                │
│ ├─ Email: somchai@email.com                           │
│ └─ Address: 123 ถนนสุขุมวิท กรุงเทพฯ 10110            │
│                                                         │
│ Emergency Contact                                       │
│ ├─ Name: นางสมใจ ใจดี                                  │
│ ├─ Phone: 082-345-6789                                │
│ └─ Relationship: ภรรยา                                │
│                                                         │
│ Medical Information                                     │
│ ├─ Blood Type: O+                                      │
│ ├─ Allergies: Penicillin                               │
│ ├─ Chronic Conditions: Hypertension                    │
│ └─ Current Medications: Amlodipine 5mg                │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 การบันทึกข้อมูลทางการแพทย์

### 1. สร้างการเยี่ยมผู้ป่วย (Visit)

#### ผ่าน Web Interface:
```
1. ไปที่ Patient Management
2. คลิกที่ผู้ป่วยที่ต้องการ
3. คลิก "New Visit"
4. กรอกข้อมูลการเยี่ยม:
   ├─ Visit Type: Walk-in
   ├─ Chief Complaint: ปวดหัว
   ├─ Present Illness: ปวดหัวมา 2 วัน
   ├─ Priority: Normal
   └─ Attending Doctor: Dr. Smith
5. คลิก "Create Visit"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/visits \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "visitType": "walk_in",
    "chiefComplaint": "ปวดหัว",
    "presentIllness": "ปวดหัวมา 2 วัน",
    "priority": "normal",
    "attendingDoctorId": "doctor-uuid"
  }'
```

### 2. บันทึก Vital Signs

#### ผ่าน Web Interface:
```
1. ไปที่ Visit Record
2. คลิก "Add Vital Signs"
3. กรอกข้อมูล:
   ├─ Weight: 70 kg
   ├─ Height: 170 cm
   ├─ BMI: 24.2 (auto-calculated)
   ├─ Blood Pressure: 140/90 mmHg
   ├─ Heart Rate: 80 bpm
   ├─ Temperature: 36.5°C
   ├─ Respiratory Rate: 16/min
   └─ Oxygen Saturation: 98%
4. คลิก "Save Vital Signs"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/vital-signs \
  -H "Authorization: Bearer YOUR_NURSE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "visit-uuid",
    "patientId": "patient-uuid",
    "weight": 70,
    "height": 170,
    "systolicBp": 140,
    "diastolicBp": 90,
    "heartRate": 80,
    "bodyTemperature": 36.5,
    "respiratoryRate": 16,
    "oxygenSaturation": 98
  }'
```

### 3. สั่ง Lab Tests

#### ผ่าน Web Interface:
```
1. ไปที่ Visit Record
2. คลิก "Order Lab Tests"
3. เลือกประเภทการตรวจ:
   ├─ Blood Tests
   │  ├─ Complete Blood Count (CBC)
   │  ├─ Blood Sugar (FBS)
   │  └─ Lipid Profile
   ├─ Urine Tests
   │  └─ Urinalysis
   └─ Other Tests
4. ระบุความเร่งด่วน: Routine
5. เพิ่มหมายเหตุ: "Fasting required for FBS"
6. คลิก "Submit Order"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/lab-orders \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "visitId": "visit-uuid",
    "testCategory": "blood",
    "testName": "Complete Blood Count",
    "testCode": "CBC",
    "clinicalIndication": "Routine check-up",
    "priority": "routine",
    "notes": "Fasting required"
  }'
```

### 4. เขียนใบสั่งยา

#### ผ่าน Web Interface:
```
1. ไปที่ Visit Record
2. คลิก "Write Prescription"
3. กรอกข้อมูล:
   ├─ Diagnosis: Hypertension
   ├─ Medications:
   │  ├─ Amlodipine 5mg
   │  │  ├─ Dosage: 1 tablet
   │  │  ├─ Frequency: Once daily
   │  │  ├─ Duration: 30 days
   │  │  └─ Instructions: Take with food
   │  └─ Lisinopril 10mg
   │     ├─ Dosage: 1 tablet
   │     ├─ Frequency: Once daily
   │     ├─ Duration: 30 days
   │     └─ Instructions: Take in morning
4. คลิก "Save Prescription"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/prescriptions \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "visitId": "visit-uuid",
    "diagnosisForPrescription": "Hypertension",
    "medications": [
      {
        "medicationName": "Amlodipine",
        "dosage": "5mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "Take with food",
        "quantity": 30
      },
      {
        "medicationName": "Lisinopril",
        "dosage": "10mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "Take in morning",
        "quantity": 30
      }
    ]
  }'
```

---

## 📅 การนัดหมาย

### 1. สร้างการนัดหมาย

#### ผ่าน Web Interface:
```
1. ไปที่ "Appointments" → "Schedule New"
2. เลือกผู้ป่วย: สมชาย ใจดี
3. เลือกแพทย์: Dr. Smith
4. เลือกวันที่: 2025-01-20
5. เลือกเวลา: 10:00 AM
6. เลือกประเภท: Follow-up
7. ระบุหมายเหตุ: "Blood pressure check"
8. คลิก "Schedule Appointment"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "title": "Follow-up Visit",
    "type": "follow-up",
    "date": "2025-01-20",
    "time": "10:00",
    "duration": 30,
    "physicianId": "doctor-uuid",
    "notes": "Blood pressure check"
  }'
```

### 2. ดูตารางนัดหมาย

#### ตารางของแพทย์:
```
┌─────────────────────────────────────────────────────────┐
│ 📅 Dr. Smith's Schedule - January 20, 2025             │
├─────────────────────────────────────────────────────────┤
│ 09:00 - 09:30 │ John Doe        │ Consultation         │
│ 09:30 - 10:00 │ Jane Smith      │ Follow-up            │
│ 10:00 - 10:30 │ สมชาย ใจดี      │ Follow-up            │
│ 10:30 - 11:00 │ Bob Johnson     │ New Patient          │
│ 11:00 - 11:30 │ Alice Brown     │ Procedure            │
│ 14:00 - 14:30 │ Mike Davis      │ Consultation         │
│ 14:30 - 15:00 │ Sarah Wilson    │ Follow-up            │
│ 15:00 - 15:30 │ Tom Brown       │ Check-up             │
└─────────────────────────────────────────────────────────┘
```

### 3. จัดการการนัดหมาย

#### ยกเลิกการนัดหมาย:
```
1. ไปที่ Appointments
2. คลิกที่การนัดหมายที่ต้องการยกเลิก
3. คลิก "Cancel Appointment"
4. ระบุเหตุผล: "Patient requested"
5. ยืนยันการยกเลิก
```

#### เปลี่ยนเวลานัดหมาย:
```
1. คลิกที่การนัดหมาย
2. คลิก "Reschedule"
3. เลือกวันที่และเวลาใหม่
4. บันทึกการเปลี่ยนแปลง
```

---

## 🤖 การประเมินความเสี่ยงด้วย AI

### 1. ประเมินความเสี่ยงโรคเบาหวาน

#### ผ่าน Web Interface:
```
1. ไปที่ Patient Record
2. คลิก "AI Risk Assessment" → "Diabetes Risk"
3. กรอกข้อมูล:
   ├─ Age: 45
   ├─ BMI: 28.5
   ├─ Family History: Yes (Mother)
   ├─ Physical Activity: Low
   ├─ Blood Pressure: 140/90
   ├─ Blood Sugar: 110 mg/dL
   └─ Waist Circumference: 95 cm
4. คลิก "Assess Risk"
```

#### ผลลัพธ์:
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI Diabetes Risk Assessment                         │
├─────────────────────────────────────────────────────────┤
│ Patient: สมชาย ใจดี (HN: 68-123456)                    │
│ Assessment Date: 2025-01-15                            │
│                                                         │
│ 🚨 Risk Level: HIGH (75%)                              │
│                                                         │
│ Risk Factors:                                           │
│ ├─ ⚠️ High BMI (28.5) - Risk: High                     │
│ ├─ ⚠️ Family History - Risk: High                      │
│ ├─ ⚠️ High Blood Pressure - Risk: High                 │
│ ├─ ⚠️ Low Physical Activity - Risk: Moderate           │
│ └─ ⚠️ Elevated Blood Sugar - Risk: High                │
│                                                         │
│ Recommendations:                                        │
│ ├─ 🏃‍♂️ Increase physical activity (30 min/day)        │
│ ├─ 🥗 Adopt healthy diet (low sugar, low carb)         │
│ ├─ ⚖️ Weight reduction (target BMI < 25)               │
│ ├─ 💊 Blood pressure management                        │
│ └─ 🔬 Regular blood sugar monitoring                   │
│                                                         │
│ Next Assessment: 3 months                               │
└─────────────────────────────────────────────────────────┘
```

### 2. ประเมินความเสี่ยงโรคความดันโลหิตสูง

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/ai/risk-assessment/hypertension \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "factors": {
      "age": 45,
      "bmi": 28.5,
      "familyHistory": true,
      "smoking": false,
      "alcohol": "moderate",
      "physicalActivity": "low",
      "stress": "high",
      "systolicBp": 140,
      "diastolicBp": 90
    }
  }'
```

### 3. ดูประวัติการประเมินความเสี่ยง

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Risk Assessment History - สมชาย ใจดี                 │
├─────────────────────────────────────────────────────────┤
│ 2025-01-15 │ Diabetes      │ HIGH (75%)  │ Dr. Smith   │
│ 2025-01-10 │ Hypertension  │ MODERATE (45%) │ Dr. Smith │
│ 2024-12-20 │ Heart Disease │ LOW (25%)   │ Dr. Johnson │
│ 2024-11-15 │ Diabetes      │ MODERATE (50%) │ Dr. Smith │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 การจัดการความยินยอม

### 1. สร้างสัญญาความยินยอม

#### ผ่าน Web Interface:
```
1. ไปที่ "Consent Management" → "New Contract"
2. เลือกผู้ป่วย: สมชาย ใจดี
3. เลือกผู้ขอข้อมูล: Research Institute
4. เลือกประเภทข้อมูล:
   ├─ Medical Records
   ├─ Lab Results
   └─ Prescription History
5. ระบุวัตถุประสงค์: "Medical Research"
6. กำหนดระยะเวลา: 1 year
7. ตั้งเงื่อนไข:
   ├─ Access Level: Read-only
   ├─ Time Restrictions: Business hours only
   └─ Purpose Restrictions: Research only
8. คลิก "Create Contract"
```

#### ผ่าน API:
```bash
curl -X POST http://localhost:3001/api/consent/contracts \
  -H "Authorization: Bearer YOUR_CONSENT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "requesterId": "requester-uuid",
    "dataTypes": ["medical_records", "lab_results", "prescriptions"],
    "purpose": "Medical Research",
    "duration": "1 year",
    "accessLevel": "read_only",
    "timeRestrictions": "business_hours",
    "purposeRestrictions": ["research"]
  }'
```

### 2. อนุมัติความยินยอม

#### ผู้ป่วยอนุมัติ:
```
1. ผู้ป่วยเข้าสู่ระบบ
2. ไปที่ "Consent Requests"
3. ดูรายละเอียดสัญญา
4. อ่านเงื่อนไขและข้อตกลง
5. คลิก "Approve" หรือ "Reject"
6. ระบุเหตุผล (ถ้าต้องการ)
```

### 3. ติดตามสถานะความยินยอม

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Consent Contract Status                              │
├─────────────────────────────────────────────────────────┤
│ Contract ID: CON-2025-001                              │
│ Patient: สมชาย ใจดี                                     │
│ Requester: Research Institute                          │
│ Status: ✅ APPROVED                                     │
│ Created: 2025-01-15                                    │
│ Approved: 2025-01-16                                   │
│ Expires: 2026-01-16                                    │
│                                                         │
│ Data Access Log:                                        │
│ ├─ 2025-01-20 10:30 - Medical Records accessed         │
│ ├─ 2025-01-20 10:31 - Lab Results accessed             │
│ └─ 2025-01-20 10:32 - Prescriptions accessed           │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: ผู้ป่วยใหม่เข้ามาตรวจ

#### ขั้นตอนการทำงาน:
```
1. 📝 Registration
   ├─ สร้างผู้ป่วยใหม่
   ├─ บันทึกข้อมูลส่วนตัว
   └─ สร้าง HN: 68-123456

2. 📅 Check-in
   ├─ สร้าง Visit Record
   ├─ บันทึก Chief Complaint
   └─ กำหนด Priority

3. 🔍 Initial Assessment
   ├─ บันทึก Vital Signs
   ├─ ประวัติการเจ็บป่วย
   └─ การตรวจร่างกาย

4. 🧪 Lab Orders
   ├─ สั่งตรวจเลือด
   ├─ สั่งตรวจปัสสาวะ
   └─ กำหนดความเร่งด่วน

5. 💊 Treatment
   ├─ การวินิจฉัย
   ├─ เขียนใบสั่งยา
   └─ คำแนะนำการรักษา

6. 📅 Follow-up
   ├─ นัดหมายครั้งต่อไป
   ├─ การติดตามผล
   └─ การประเมินความเสี่ยง
```

### ตัวอย่างที่ 2: การใช้ AI Risk Assessment

#### สถานการณ์: ผู้ป่วยอายุ 50 ปี มีประวัติครอบครัวเป็นเบาหวาน

```
1. 📊 Data Collection
   ├─ ข้อมูลส่วนตัว: อายุ, เพศ, น้ำหนัก, ส่วนสูง
   ├─ ประวัติครอบครัว: แม่เป็นเบาหวาน
   ├─ ข้อมูลสุขภาพ: ความดัน, น้ำตาลในเลือด
   └─ ไลฟ์สไตล์: การออกกำลังกาย, การสูบบุหรี่

2. 🤖 AI Analysis
   ├─ คำนวณความเสี่ยง: 78%
   ├─ ระบุปัจจัยเสี่ยง: BMI สูง, ประวัติครอบครัว
   ├─ ประเมินความน่าจะเป็น: High Risk
   └─ สร้างคำแนะนำ: ควบคุมอาหาร, ออกกำลังกาย

3. 📋 Recommendations
   ├─ การปรับเปลี่ยนไลฟ์สไตล์
   ├─ การตรวจติดตาม
   ├─ การใช้ยา (ถ้าจำเป็น)
   └─ การนัดหมายครั้งต่อไป

4. 📅 Follow-up Plan
   ├─ นัดตรวจเลือด 3 เดือน
   ├─ นัดตรวจน้ำหนัก 1 เดือน
   ├─ การให้คำปรึกษาโภชนาการ
   └─ การติดตามผลการรักษา
```

### ตัวอย่างที่ 3: การจัดการข้อมูลความยินยอม

#### สถานการณ์: สถาบันวิจัยขอข้อมูลผู้ป่วย

```
1. 📝 Contract Creation
   ├─ ระบุผู้ป่วย: สมชาย ใจดี
   ├─ ระบุผู้ขอ: สถาบันวิจัยโรคเบาหวาน
   ├─ ระบุข้อมูล: ประวัติการรักษา, ผลแล็บ
   └─ กำหนดเงื่อนไข: อ่านอย่างเดียว, 1 ปี

2. 📧 Patient Notification
   ├─ ส่งอีเมลแจ้งผู้ป่วย
   ├─ อธิบายวัตถุประสงค์
   ├─ แสดงเงื่อนไขการใช้งาน
   └─ ลิงก์สำหรับอนุมัติ

3. ✅ Patient Approval
   ├─ ผู้ป่วยเข้าสู่ระบบ
   ├─ อ่านรายละเอียดสัญญา
   ├─ อนุมัติหรือปฏิเสธ
   └─ บันทึกการตัดสินใจ

4. 🔍 Access Monitoring
   ├─ บันทึกการเข้าถึงข้อมูล
   ├─ ติดตามการใช้งาน
   ├─ ตรวจสอบการปฏิบัติตามเงื่อนไข
   └─ สร้างรายงานการตรวจสอบ

5. 📊 Audit Trail
   ├─ บันทึกทุกการเข้าถึง
   ├─ ระบุผู้ใช้และเวลา
   ├─ บันทึกการเปลี่ยนแปลง
   └─ สร้างรายงานการตรวจสอบ
```

---

## 🛠️ การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. ไม่สามารถเข้าสู่ระบบได้
```
สาเหตุ: Username/Password ผิด
วิธีแก้:
1. ตรวจสอบ Username และ Password
2. ใช้บัญชี Default:
   - Admin: admin/admin123
   - Doctor: doctor/doctor123
3. รีเซ็ตรหัสผ่าน (Admin only)
```

#### 2. ไม่สามารถเชื่อมต่อ Database ได้
```
สาเหตุ: PostgreSQL ไม่ทำงาน
วิธีแก้:
1. ตรวจสอบสถานะ PostgreSQL:
   sudo systemctl status postgresql
2. เริ่มต้น PostgreSQL:
   sudo systemctl start postgresql
3. ตรวจสอบการเชื่อมต่อ:
   psql -U postgres -h localhost
```

#### 3. Frontend ไม่สามารถเชื่อมต่อ Backend ได้
```
สาเหตุ: API URL ผิด
วิธีแก้:
1. ตรวจสอบไฟล์ .env.local:
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
2. ตรวจสอบว่า Backend ทำงานอยู่:
   curl http://localhost:3001/health
3. ตรวจสอบ CORS settings
```

#### 4. ไม่สามารถสร้างผู้ป่วยได้
```
สาเหตุ: ข้อมูลไม่ครบถ้วน
วิธีแก้:
1. ตรวจสอบข้อมูลที่จำเป็น:
   - Thai Name
   - National ID
   - Gender
   - Birth Date
2. ตรวจสอบรูปแบบข้อมูล:
   - National ID: 13 หลัก
   - Birth Date: YYYY-MM-DD
   - Email: รูปแบบที่ถูกต้อง
```

### การ Debug

#### 1. ตรวจสอบ Logs
```bash
# Backend logs
cd backend
npm run dev

# Frontend logs
cd frontend
npm run dev

# Database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. ตรวจสอบ Health Status
```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl http://localhost:3000/health

# Database connection
psql -U postgres -c "SELECT 1;"
```

#### 3. ตรวจสอบ Network
```bash
# ตรวจสอบ ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432

# ตรวจสอบ processes
ps aux | grep node
ps aux | grep postgres
```

---

## 📞 การสนับสนุน

### ช่องทางการติดต่อ
- 📧 Email: support@healthchain.co.th
- 📱 Phone: 02-123-4567
- 💬 Chat: ผ่านระบบในแอป
- 📋 Ticket: สร้าง ticket ในระบบ

### เอกสารเพิ่มเติม
- 📖 API Documentation: `/api/docs`
- 🔧 Developer Guide: `DEVELOPER_GUIDE.md`
- 🚀 Deployment Guide: `DEPLOYMENT_GUIDE.md`
- 🔒 Security Guide: `SECURITY_GUIDE.md`

---

**🎉 ขอให้ใช้งานระบบ EMR อย่างมีความสุข!**
