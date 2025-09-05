# 🎬 HealthChain EMR System - Demo Scripts

## 📋 สารบัญ
1. [Demo Script 1: การใช้งานพื้นฐาน](#demo-script-1-การใช้งานพื้นฐาน)
2. [Demo Script 2: การจัดการผู้ป่วย](#demo-script-2-การจัดการผู้ป่วย)
3. [Demo Script 3: การบันทึกข้อมูลทางการแพทย์](#demo-script-3-การบันทึกข้อมูลทางการแพทย์)
4. [Demo Script 4: AI Risk Assessment](#demo-script-4-ai-risk-assessment)
5. [Demo Script 5: การจัดการความยินยอม](#demo-script-5-การจัดการความยินยอม)
6. [API Testing Scripts](#api-testing-scripts)

---

## 🎬 Demo Script 1: การใช้งานพื้นฐาน

### สถานการณ์: ผู้ดูแลระบบเข้าสู่ระบบและตรวจสอบสถานะ

#### ขั้นตอนที่ 1: เข้าสู่ระบบ
```bash
# เปิดเบราว์เซอร์ไปที่ http://localhost:3000
# คลิก "Login"

# กรอกข้อมูล:
Username: admin
Password: admin123

# คลิก "Sign In"
```

#### ขั้นตอนที่ 2: ตรวจสอบ Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 HealthChain EMR - Admin Dashboard                    │
├─────────────────────────────────────────────────────────┤
│ 👋 Welcome, Admin!                                      │
│                                                         │
│ 📊 System Overview                                      │
│ ├─ Total Users: 25                                      │
│ ├─ Active Patients: 1,250                               │
│ ├─ Today's Appointments: 45                             │
│ └─ System Health: ✅ Healthy                            │
│                                                         │
│ 🔧 Quick Actions                                        │
│ ├─ 👥 Manage Users (5 new registrations)               │
│ ├─ 🏥 Patient Management                                │
│ ├─ 📅 Appointment Overview                              │
│ └─ 🔍 System Logs                                       │
└─────────────────────────────────────────────────────────┘
```

#### ขั้นตอนที่ 3: ตรวจสอบ System Health
```bash
# ไปที่ System → Health Check
# หรือเรียก API โดยตรง:

curl http://localhost:3001/health
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": "15ms"
    },
    "api": {
      "status": "running",
      "port": 3001
    }
  }
}
```

---

## 🎬 Demo Script 2: การจัดการผู้ป่วย

### สถานการณ์: แพทย์สร้างผู้ป่วยใหม่และบันทึกข้อมูล

#### ขั้นตอนที่ 1: เข้าสู่ระบบด้วยบัญชีแพทย์
```bash
# Logout จาก Admin
# Login ใหม่ด้วย:
Username: doctor
Password: doctor123
```

#### ขั้นตอนที่ 2: สร้างผู้ป่วยใหม่
```
1. ไปที่ "Patient Management" → "Add New Patient"

2. กรอกข้อมูลส่วนตัว:
   ├─ Thai Name: สมชาย ใจดี
   ├─ English Name: Somchai Jaidee
   ├─ National ID: 1234567890123
   ├─ Gender: Male
   ├─ Birth Date: 1985-05-15
   ├─ Phone: 081-234-5678
   ├─ Email: somchai@email.com
   └─ Address: 123 ถนนสุขุมวิท กรุงเทพฯ 10110

3. กรอกข้อมูลฉุกเฉิน:
   ├─ Emergency Contact: นางสมใจ ใจดี
   ├─ Phone: 082-345-6789
   └─ Relationship: ภรรยา

4. คลิก "Create Patient"
```

#### ขั้นตอนที่ 3: ตรวจสอบข้อมูลผู้ป่วย
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
│ ├─ Blood Type: Not specified                           │
│ ├─ Allergies: None recorded                            │
│ ├─ Chronic Conditions: None recorded                   │
│ └─ Current Medications: None                           │
└─────────────────────────────────────────────────────────┘
```

#### ขั้นตอนที่ 4: ค้นหาผู้ป่วย
```
1. ไปที่ "Patient Search"
2. ใส่คำค้นหา: "สมชาย"
3. คลิก "Search"
4. ระบบจะแสดงรายการผู้ป่วยที่ตรงกัน
```

---

## 🎬 Demo Script 3: การบันทึกข้อมูลทางการแพทย์

### สถานการณ์: ผู้ป่วยเข้ามาตรวจและแพทย์บันทึกข้อมูล

#### ขั้นตอนที่ 1: สร้างการเยี่ยมผู้ป่วย
```
1. ไปที่ Patient Record ของ สมชาย ใจดี
2. คลิก "New Visit"
3. กรอกข้อมูลการเยี่ยม:
   ├─ Visit Type: Walk-in
   ├─ Chief Complaint: ปวดหัว
   ├─ Present Illness: ปวดหัวมา 2 วัน หลังตื่นนอน
   ├─ Priority: Normal
   └─ Attending Doctor: Dr. Smith
4. คลิก "Create Visit"
```

#### ขั้นตอนที่ 2: บันทึก Vital Signs
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

#### ขั้นตอนที่ 3: สั่ง Lab Tests
```
1. คลิก "Order Lab Tests"
2. เลือกการตรวจ:
   ├─ Blood Tests
   │  ├─ Complete Blood Count (CBC)
   │  └─ Blood Sugar (FBS)
   └─ Urine Tests
      └─ Urinalysis
3. ระบุความเร่งด่วน: Routine
4. เพิ่มหมายเหตุ: "Fasting required for FBS"
5. คลิก "Submit Order"
```

#### ขั้นตอนที่ 4: เขียนใบสั่งยา
```
1. คลิก "Write Prescription"
2. กรอกข้อมูล:
   ├─ Diagnosis: Hypertension
   ├─ Medications:
   │  └─ Amlodipine 5mg
   │     ├─ Dosage: 1 tablet
   │     ├─ Frequency: Once daily
   │     ├─ Duration: 30 days
   │     └─ Instructions: Take with food
3. คลิก "Save Prescription"
```

#### ขั้นตอนที่ 5: สร้างการนัดหมาย
```
1. คลิก "Schedule Follow-up"
2. เลือกวันที่: 2025-02-15
3. เลือกเวลา: 10:00 AM
4. เลือกประเภท: Follow-up
5. ระบุหมายเหตุ: "Blood pressure check"
6. คลิก "Schedule Appointment"
```

---

## 🎬 Demo Script 4: AI Risk Assessment

### สถานการณ์: แพทย์ใช้ AI ประเมินความเสี่ยงโรคเบาหวาน

#### ขั้นตอนที่ 1: เริ่มการประเมินความเสี่ยง
```
1. ไปที่ Patient Record ของ สมชาย ใจดี
2. คลิก "AI Risk Assessment" → "Diabetes Risk"
3. กรอกข้อมูล:
   ├─ Age: 39
   ├─ BMI: 24.2
   ├─ Family History: No
   ├─ Physical Activity: Moderate
   ├─ Blood Pressure: 140/90
   ├─ Blood Sugar: 95 mg/dL
   └─ Waist Circumference: 85 cm
4. คลิก "Assess Risk"
```

#### ขั้นตอนที่ 2: ดูผลลัพธ์การประเมิน
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI Diabetes Risk Assessment                         │
├─────────────────────────────────────────────────────────┤
│ Patient: สมชาย ใจดี (HN: 68-123456)                    │
│ Assessment Date: 2025-01-15                            │
│                                                         │
│ ⚠️ Risk Level: MODERATE (45%)                          │
│                                                         │
│ Risk Factors:                                           │
│ ├─ ⚠️ High Blood Pressure - Risk: High                 │
│ ├─ ⚠️ Age (39) - Risk: Moderate                        │
│ ├─ ✅ Normal BMI - Risk: Low                           │
│ ├─ ✅ No Family History - Risk: Low                    │
│ └─ ✅ Normal Blood Sugar - Risk: Low                   │
│                                                         │
│ Recommendations:                                        │
│ ├─ 🏃‍♂️ Maintain regular exercise                      │
│ ├─ 🥗 Continue healthy diet                            │
│ ├─ 💊 Blood pressure management                        │
│ └─ 🔬 Annual blood sugar check                         │
│                                                         │
│ Next Assessment: 6 months                               │
└─────────────────────────────────────────────────────────┘
```

#### ขั้นตอนที่ 3: บันทึกการประเมิน
```
1. คลิก "Save Assessment"
2. เพิ่มหมายเหตุแพทย์: "Patient shows moderate risk due to hypertension"
3. คลิก "Confirm"
4. ระบบจะบันทึกการประเมินในประวัติผู้ป่วย
```

#### ขั้นตอนที่ 4: ดูประวัติการประเมิน
```
1. ไปที่ "Risk Assessment History"
2. ดูรายการการประเมินทั้งหมด:

┌─────────────────────────────────────────────────────────┐
│ 📊 Risk Assessment History - สมชาย ใจดี                 │
├─────────────────────────────────────────────────────────┤
│ 2025-01-15 │ Diabetes      │ MODERATE (45%) │ Dr. Smith │
│ 2025-01-15 │ Hypertension  │ HIGH (65%)     │ Dr. Smith │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Demo Script 5: การจัดการความยินยอม

### สถานการณ์: สถาบันวิจัยขอข้อมูลผู้ป่วย

#### ขั้นตอนที่ 1: สร้างสัญญาความยินยอม
```
1. เข้าสู่ระบบด้วยบัญชี Consent Admin
   Username: consent_admin
   Password: consent123

2. ไปที่ "Consent Management" → "New Contract"
3. กรอกข้อมูล:
   ├─ Patient: สมชาย ใจดี
   ├─ Requester: สถาบันวิจัยโรคเบาหวาน
   ├─ Data Types:
   │  ├─ Medical Records
   │  ├─ Lab Results
   │  └─ Prescription History
   ├─ Purpose: Medical Research
   ├─ Duration: 1 year
   └─ Conditions:
      ├─ Access Level: Read-only
      ├─ Time Restrictions: Business hours only
      └─ Purpose Restrictions: Research only
4. คลิก "Create Contract"
```

#### ขั้นตอนที่ 2: ผู้ป่วยอนุมัติความยินยอม
```
1. Logout จาก Consent Admin
2. Login ด้วยบัญชีผู้ป่วย:
   Username: patient
   Password: patient123

3. ไปที่ "Consent Requests"
4. ดูรายละเอียดสัญญา:
   ├─ ข้อมูลที่จะถูกใช้: ประวัติการรักษา, ผลแล็บ, ใบสั่งยา
   ├─ วัตถุประสงค์: การวิจัยโรคเบาหวาน
   ├─ ระยะเวลา: 1 ปี
   └─ เงื่อนไข: อ่านอย่างเดียว, เฉพาะเวลาทำการ

5. คลิก "Approve"
6. ระบุเหตุผล: "ยินดีให้ข้อมูลเพื่อการวิจัย"
7. คลิก "Confirm Approval"
```

#### ขั้นตอนที่ 3: ติดตามสถานะความยินยอม
```
1. Login กลับด้วยบัญชี Consent Admin
2. ไปที่ "Consent Dashboard"
3. ดูสถานะสัญญา:

┌─────────────────────────────────────────────────────────┐
│ 📋 Consent Contract Status                              │
├─────────────────────────────────────────────────────────┤
│ Contract ID: CON-2025-001                              │
│ Patient: สมชาย ใจดี                                     │
│ Requester: สถาบันวิจัยโรคเบาหวาน                        │
│ Status: ✅ APPROVED                                     │
│ Created: 2025-01-15                                    │
│ Approved: 2025-01-15                                    │
│ Expires: 2026-01-15                                    │
│                                                         │
│ Data Access Log:                                        │
│ ├─ 2025-01-15 14:30 - Contract created                 │
│ ├─ 2025-01-15 14:35 - Patient approved                 │
│ └─ No data access yet                                  │
└─────────────────────────────────────────────────────────┘
```

#### ขั้นตอนที่ 4: จำลองการเข้าถึงข้อมูล
```
1. ไปที่ "Data Access" → "Grant Access"
2. เลือก Contract: CON-2025-001
3. เลือกข้อมูลที่จะให้เข้าถึง:
   ├─ Medical Records
   ├─ Lab Results
   └─ Prescriptions
4. คลิก "Grant Access"
5. ระบบจะบันทึกการเข้าถึงใน Audit Log
```

---

## 🔧 API Testing Scripts

### Script 1: ทดสอบ Authentication

```bash
#!/bin/bash
# test_auth.sh

echo "🔐 Testing Authentication API..."

# Test Login
echo "1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
echo "Access Token: $TOKEN"

# Test Profile
echo "2. Testing Get Profile..."
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN")

echo "Profile Response: $PROFILE_RESPONSE"

# Test Logout
echo "3. Testing Logout..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "dummy"}')

echo "Logout Response: $LOGOUT_RESPONSE"
```

### Script 2: ทดสอบ Patient Management

```bash
#!/bin/bash
# test_patients.sh

echo "🏥 Testing Patient Management API..."

# Login first
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor", "password": "doctor123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# Create Patient
echo "1. Creating Patient..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/patients \
  -H "Authorization: Bearer $TOKEN" \
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
  }')

echo "Create Patient Response: $CREATE_RESPONSE"

# Extract patient ID
PATIENT_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo "Patient ID: $PATIENT_ID"

# Get Patient
echo "2. Getting Patient..."
GET_RESPONSE=$(curl -s -X GET http://localhost:3001/api/patients/$PATIENT_ID \
  -H "Authorization: Bearer $TOKEN")

echo "Get Patient Response: $GET_RESPONSE"

# Search Patients
echo "3. Searching Patients..."
SEARCH_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/patients/search?query=สมชาย&searchType=name" \
  -H "Authorization: Bearer $TOKEN")

echo "Search Response: $SEARCH_RESPONSE"
```

### Script 3: ทดสอบ Medical Records

```bash
#!/bin/bash
# test_medical.sh

echo "📋 Testing Medical Records API..."

# Login first
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor", "password": "doctor123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# Create Visit
echo "1. Creating Visit..."
VISIT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/visits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "visitType": "walk_in",
    "chiefComplaint": "ปวดหัว",
    "presentIllness": "ปวดหัวมา 2 วัน",
    "priority": "normal",
    "attendingDoctorId": "doctor-uuid"
  }')

echo "Create Visit Response: $VISIT_RESPONSE"

# Create Vital Signs
echo "2. Creating Vital Signs..."
VITALS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/vital-signs \
  -H "Authorization: Bearer $TOKEN" \
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
  }')

echo "Create Vital Signs Response: $VITALS_RESPONSE"

# Create Lab Order
echo "3. Creating Lab Order..."
LAB_RESPONSE=$(curl -s -X POST http://localhost:3001/api/lab-orders \
  -H "Authorization: Bearer $TOKEN" \
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
  }')

echo "Create Lab Order Response: $LAB_RESPONSE"
```

### Script 4: ทดสอบ AI Risk Assessment

```bash
#!/bin/bash
# test_ai.sh

echo "🤖 Testing AI Risk Assessment API..."

# Login first
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "doctor", "password": "doctor123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# Diabetes Risk Assessment
echo "1. Diabetes Risk Assessment..."
DIABETES_RESPONSE=$(curl -s -X POST http://localhost:3001/api/ai/risk-assessment/diabetes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "factors": {
      "age": 45,
      "bmi": 28.5,
      "familyHistory": true,
      "physicalActivity": "low",
      "bloodPressure": 140,
      "bloodSugar": 110,
      "waistCircumference": 95
    }
  }')

echo "Diabetes Risk Assessment Response: $DIABETES_RESPONSE"

# Hypertension Risk Assessment
echo "2. Hypertension Risk Assessment..."
HYPERTENSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/ai/risk-assessment/hypertension \
  -H "Authorization: Bearer $TOKEN" \
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
  }')

echo "Hypertension Risk Assessment Response: $HYPERTENSION_RESPONSE"
```

### Script 5: ทดสอบ Consent Management

```bash
#!/bin/bash
# test_consent.sh

echo "🔒 Testing Consent Management API..."

# Login as Consent Admin
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "consent_admin", "password": "consent123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# Create Consent Contract
echo "1. Creating Consent Contract..."
CONTRACT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/consent/contracts \
  -H "Authorization: Bearer $TOKEN" \
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
  }')

echo "Create Contract Response: $CONTRACT_RESPONSE"

# Get Consent Contracts
echo "2. Getting Consent Contracts..."
CONTRACTS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/consent/contracts \
  -H "Authorization: Bearer $TOKEN")

echo "Get Contracts Response: $CONTRACTS_RESPONSE"

# Update Contract Status
echo "3. Updating Contract Status..."
STATUS_RESPONSE=$(curl -s -X PATCH http://localhost:3001/api/consent/contracts/contract-uuid/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reason": "Patient approved the contract"
  }')

echo "Update Status Response: $STATUS_RESPONSE"
```

---

## 🎯 การรัน Demo Scripts

### 1. เตรียมระบบ
```bash
# เริ่มระบบ
cd backend && npm run dev &
cd frontend && npm run dev &

# รอให้ระบบเริ่มต้นเสร็จ
sleep 10

# ตรวจสอบสถานะ
curl http://localhost:3001/health
curl http://localhost:3000/health
```

### 2. รัน API Tests
```bash
# ให้สิทธิ์ execute
chmod +x test_*.sh

# รัน tests ทีละตัว
./test_auth.sh
./test_patients.sh
./test_medical.sh
./test_ai.sh
./test_consent.sh

# หรือรันทั้งหมด
for script in test_*.sh; do
  echo "Running $script..."
  ./$script
  echo "---"
done
```

### 3. ตรวจสอบผลลัพธ์
```bash
# ตรวจสอบ logs
tail -f backend/logs/app.log
tail -f frontend/.next/server.log

# ตรวจสอบ database
psql -U postgres -d emr_development -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d emr_development -c "SELECT COUNT(*) FROM patients;"
```

---

## 📊 Expected Results

### 1. Authentication Test
- ✅ Login successful
- ✅ Token generated
- ✅ Profile retrieved
- ✅ Logout successful

### 2. Patient Management Test
- ✅ Patient created
- ✅ Patient retrieved
- ✅ Patient search working
- ✅ Data validation working

### 3. Medical Records Test
- ✅ Visit created
- ✅ Vital signs recorded
- ✅ Lab order created
- ✅ Data relationships working

### 4. AI Risk Assessment Test
- ✅ Risk assessment completed
- ✅ Risk level calculated
- ✅ Recommendations generated
- ✅ History recorded

### 5. Consent Management Test
- ✅ Contract created
- ✅ Status updated
- ✅ Audit trail working
- ✅ Access control working

---

**🎉 Demo Scripts พร้อมใช้งาน! ทดสอบระบบได้เลย!**
