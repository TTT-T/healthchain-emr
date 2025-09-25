# 🏥 Thai Last Name Consistency Fix Summary
## สรุปการแก้ไขความสอดคล้องของ thai_last_name ระหว่าง users และ patients tables

### 📋 **Overview**
แก้ไขปัญหาความไม่สอดคล้องของคอลัมน์ `thai_last_name` ระหว่างตาราง `users` และ `patients` ในระบบ EMR

---

## 🔍 **ปัญหาที่พบ**

### **ปัญหาหลัก:**
- **ตาราง `users`**: มีคอลัมน์ `thai_last_name` ✅
- **ตาราง `patients`**: ไม่มีคอลัมน์ `thai_last_name` ❌
- **Frontend/Backend**: ไม่สอดคล้องกันในการจัดการข้อมูล `thai_last_name`

### **สาเหตุ:**
1. **Database Schema Inconsistency**: ตาราง `patients` ไม่มีคอลัมน์ `thai_last_name`
2. **Backend Controller Issues**: การ mapping ข้อมูลไม่ถูกต้อง
3. **Frontend Display Issues**: การแสดงผลไม่สอดคล้องกับข้อมูลจริง

---

## ✅ **การแก้ไขที่ทำ**

### 1. **เพิ่มคอลัมน์ `thai_last_name` ในตาราง `patients`**
```sql
-- Migration: 026_add_thai_last_name_to_patients.sql
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS thai_last_name VARCHAR(200);

COMMENT ON COLUMN patients.thai_last_name IS 'Thai last name for patient identification (matches users table schema)';

CREATE INDEX IF NOT EXISTS idx_patients_thai_last_name ON patients(thai_last_name);

-- Update existing patient records to copy thai_last_name from users table
UPDATE patients 
SET thai_last_name = u.thai_last_name
FROM users u
WHERE patients.user_id = u.id 
AND patients.thai_last_name IS NULL 
AND u.thai_last_name IS NOT NULL;
```

### 2. **แก้ไข Backend Controller (`patientRegistrationController.ts`)**

#### **แก้ไข INSERT Query:**
```typescript
// Before (ปัญหา)
INSERT INTO patients (
  user_id, hospital_number, first_name, last_name, thai_name,
  date_of_birth, gender, national_id, phone, email, address, blood_type,
  allergies, medical_history, current_medications, chronic_diseases,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
  drug_allergies, food_allergies, environment_allergies,
  weight, height, religion, race, occupation, education, marital_status,
  current_address, created_by
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
)

// After (แก้ไขแล้ว)
INSERT INTO patients (
  user_id, hospital_number, first_name, last_name, thai_name, thai_last_name,
  date_of_birth, gender, national_id, phone, email, address, blood_type,
  allergies, medical_history, current_medications, chronic_diseases,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
  drug_allergies, food_allergies, environment_allergies,
  weight, height, religion, race, occupation, education, marital_status,
  current_address, created_by
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
)
```

#### **แก้ไข RETURNING Query:**
```typescript
// Before (ปัญหา)
RETURNING id, hospital_number, first_name, last_name, thai_name,
          date_of_birth, gender, national_id, phone, email, address, blood_type,
          allergies, medical_history, current_medications, chronic_diseases,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
          drug_allergies, food_allergies, environment_allergies,
          weight, height, religion, race, occupation, education, marital_status,
          current_address, created_at, updated_at

// After (แก้ไขแล้ว)
RETURNING id, hospital_number, first_name, last_name, thai_name, thai_last_name,
          date_of_birth, gender, national_id, phone, email, address, blood_type,
          allergies, medical_history, current_medications, chronic_diseases,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
          drug_allergies, food_allergies, environment_allergies,
          weight, height, religion, race, occupation, education, marital_status,
          current_address, created_at, updated_at
```

#### **แก้ไข SELECT Query:**
```typescript
// Before (ปัญหา)
SELECT 
  p.id, p.hospital_number, p.first_name, p.last_name, p.thai_first_name, p.thai_last_name,
  p.date_of_birth, p.gender, p.national_id, p.phone, p.email, p.address, p.blood_type,
  p.allergies, p.medical_history, p.current_medications, p.chronic_diseases,
  p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation,
  p.insurance_type, p.insurance_number, p.insurance_expiry_date,
  p.created_at, p.updated_at,
  u.username, u.email as user_email
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = $1

// After (แก้ไขแล้ว)
SELECT 
  p.id, p.hospital_number, p.first_name, p.last_name, p.thai_name, p.thai_last_name,
  p.date_of_birth, p.gender, p.national_id, p.phone, p.email, p.address, p.blood_type,
  p.allergies, p.medical_history, p.current_medications, p.chronic_diseases,
  p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation,
  p.insurance_type, p.insurance_number, p.insurance_expiry_date,
  p.created_at, p.updated_at,
  u.username, u.email as user_email
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = $1
```

#### **แก้ไข Data Mapping:**
```typescript
// Before (ปัญหา)
validatedData.thaiFirstName && validatedData.thaiLastName ? 
  `${validatedData.thaiFirstName} ${validatedData.thaiLastName}` : null,

// After (แก้ไขแล้ว)
validatedData.thaiFirstName || null,
validatedData.thaiLastName || null,
```

#### **แก้ไข Response Mapping:**
```typescript
// Before (ปัญหา)
thaiFirstName: newPatient.thai_first_name,
thaiLastName: newPatient.thai_last_name,

// After (แก้ไขแล้ว)
thaiFirstName: newPatient.thai_name,
thaiLastName: newPatient.thai_last_name,
```

### 3. **แก้ไข Frontend (`emr/register-patient/page.tsx`)**

#### **แก้ไขการแสดงวันเกิด:**
```typescript
// Before (ปัญหา)
<p><strong>วันเกิด:</strong> {
  user.birthDate ? 
    (() => {
      // ถ้า birthDate เป็นรูปแบบ YYYY-MM-DD และปีเป็น พ.ศ.
      if (user.birthDate.includes('-')) {
        const [year, month, day] = user.birthDate.split('-');
        return `${day}/${month}/${year}`;
      }
      return new Date(user.birthDate).toLocaleString('th-TH');
    })() : 
  (user.birthDay && user.birthMonth && user.birthYear) ? 
    `${user.birthDay}/${user.birthMonth}/${user.birthYear}` : 
    'ไม่ระบุ'
}</p>

// After (แก้ไขแล้ว)
<p><strong>วันเกิด:</strong> {
  (user.birthDay && user.birthMonth && user.birthYear) ? 
    `${user.birthDay}/${user.birthMonth}/${user.birthYear}` : 
  user.birthDate ? 
    (() => {
      // ถ้า birthDate เป็นรูปแบบ YYYY-MM-DD
      if (user.birthDate.includes('-')) {
        const [year, month, day] = user.birthDate.split('-');
        return `${day}/${month}/${year}`;
      }
      // ถ้า birthDate เป็น Date object
      const date = new Date(user.birthDate);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
      return `${day}/${month}/${year}`;
    })() : 
    'ไม่ระบุ'
}</p>
```

#### **แก้ไขการ mapping ข้อมูล:**
```typescript
// Before (ปัญหา)
} else if (item.birthDay && item.birthMonth && item.birthYear) {
  // เก็บปีเป็น พ.ศ. ไว้สำหรับการแสดงผล
  birthDate = `${item.birthYear}-${String(item.birthMonth).padStart(2, '0')}-${String(item.birthDay).padStart(2, '0')}`;
}

// After (แก้ไขแล้ว)
} else if (item.birth_day && item.birth_month && item.birth_year) {
  // เก็บปีเป็น พ.ศ. ไว้สำหรับการแสดงผล
  birthDate = `${item.birth_year}-${String(item.birth_month).padStart(2, '0')}-${String(item.birth_day).padStart(2, '0')}`;
}
```

#### **แก้ไขการ mapping ข้อมูลวันเกิด:**
```typescript
// Before (ปัญหา)
birthDay: item.birthDay,
birthMonth: item.birthMonth,
birthYear: item.birthYear,

// After (แก้ไขแล้ว)
birthDay: item.birth_day,
birthMonth: item.birth_month,
birthYear: item.birth_year,
```

---

## 🧪 **การทดสอบ**

### **Test Scripts Created:**
- `backend/test-thai-last-name-consistency.js` - สคริปต์ทดสอบความสอดคล้องของ thai_last_name
- `backend/test-birth-date-fix.js` - สคริปต์ทดสอบการแก้ไขวันเกิด

### **Test Results:**
```
🔍 Test 7: Validation
   - Thai Name Correct: ✅
   - English Name Correct: ✅
   - Expected Thai: "ธีรภัทร์ ตันสกุล"
   - Actual Thai: "ธีรภัทร์ ตันสกุล"
   - Expected English: "Teerapat Tansakun"
   - Actual English: "Teerapat Tansakun"
   - 🎉 ALL NAMES ARE CORRECT!
```

### **Database Schema After Fix:**
```
📋 Patients Table Structure:
   - thai_last_name: character varying (nullable) ✅

📋 Users Table Structure:
   - thai_last_name: character varying (nullable) ✅
```

---

## 📊 **Database Schema Analysis**

### **Before Fix:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  thai_name VARCHAR,
  thai_last_name VARCHAR,  -- ✅ มี
  -- ... other columns
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  thai_name VARCHAR,
  -- thai_last_name VARCHAR,  -- ❌ ไม่มี
  -- ... other columns
);
```

### **After Fix:**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  thai_name VARCHAR,
  thai_last_name VARCHAR,  -- ✅ มี
  -- ... other columns
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  thai_name VARCHAR,
  thai_last_name VARCHAR,  -- ✅ เพิ่มแล้ว
  -- ... other columns
);
```

---

## 🎯 **ผลลัพธ์หลังแก้ไข**

### **Before (ปัญหา):**
- **ตาราง `users`**: มี `thai_last_name` ✅
- **ตาราง `patients`**: ไม่มี `thai_last_name` ❌
- **Frontend**: แสดง "ไม่ระบุ ตันสกุล" ❌
- **Backend**: ไม่สามารถบันทึก `thai_last_name` ในตาราง `patients` ❌

### **After (แก้ไขแล้ว):**
- **ตาราง `users`**: มี `thai_last_name` ✅
- **ตาราง `patients`**: มี `thai_last_name` ✅
- **Frontend**: แสดง "ธีรภัทร์ ตันสกุล" ✅
- **Backend**: สามารถบันทึก `thai_last_name` ในตาราง `patients` ✅

### **Validation Results:**
- ✅ **Thai Name**: "ธีรภัทร์ ตันสกุล" (ถูกต้อง)
- ✅ **English Name**: "Teerapat Tansakun" (ถูกต้อง)
- ✅ **Birth Date**: "26/2/2543" (ถูกต้อง)
- ✅ **All Tests Passed**: 🎉

---

## 🔧 **Technical Details**

### **Files Modified:**
- `backend/src/database/migrations/026_add_thai_last_name_to_patients.sql` - Migration เพิ่มคอลัมน์
- `backend/src/controllers/patientRegistrationController.ts` - แก้ไข controller
- `frontend/src/app/emr/register-patient/page.tsx` - แก้ไข frontend

### **Key Changes:**
1. **Database Schema**: เพิ่มคอลัมน์ `thai_last_name` ในตาราง `patients`
2. **Backend Controllers**: แก้ไข INSERT, SELECT, และ RETURNING queries
3. **Frontend Display**: แก้ไขการแสดงผลและ mapping ข้อมูล
4. **Data Consistency**: ทำให้ข้อมูลสอดคล้องกันระหว่าง `users` และ `patients`

### **API Endpoints Affected:**
- `POST /api/patients/register` - Patient registration
- `GET /api/patients/{userId}` - Get patient by user ID
- `GET /api/medical/users/search` - Search users for EMR registration

---

## 🚀 **Deployment Notes**

### **Before Deployment:**
1. ✅ รัน migration `026_add_thai_last_name_to_patients.sql`
2. ✅ ตรวจสอบโครงสร้างตาราง `patients`
3. ✅ ทดสอบการบันทึกข้อมูล `thai_last_name`

### **After Deployment:**
- ✅ ตาราง `patients` มีคอลัมน์ `thai_last_name`
- ✅ Backend สามารถบันทึกและดึงข้อมูล `thai_last_name`
- ✅ Frontend แสดงข้อมูล `thai_last_name` ถูกต้อง
- ✅ ข้อมูลสอดคล้องกันระหว่าง `users` และ `patients`

---

## 📝 **Verification**

### **Test Commands:**
```bash
# Test thai last name consistency
node test-thai-last-name-consistency.js

# Test birth date fix
node test-birth-date-fix.js

# Test EMR register patient page
# Visit: http://localhost:3002/emr/register-patient
# Search for user with national_id: 0123456789101
```

### **Expected Results:**
- ✅ ตาราง `patients` มีคอลัมน์ `thai_last_name`
- ✅ การแสดงชื่อไทย: "ธีรภัทร์ ตันสกุล"
- ✅ การแสดงชื่ออังกฤษ: "Teerapat Tansakun"
- ✅ การแสดงวันเกิด: "26/2/2543"
- ✅ ข้อมูลสอดคล้องกันระหว่าง `users` และ `patients`

---

## 🎉 **Summary**

ปัญหาเรื่องความไม่สอดคล้องของ `thai_last_name` ระหว่างตาราง `users` และ `patients` ได้รับการแก้ไขเรียบร้อยแล้ว:

### **Root Cause Identified:**
- **Database Schema Inconsistency**: ตาราง `patients` ไม่มีคอลัมน์ `thai_last_name`
- **Backend Controller Issues**: การ mapping ข้อมูลไม่ถูกต้อง
- **Frontend Display Issues**: การแสดงผลไม่สอดคล้องกับข้อมูลจริง

### **Solution Implemented:**
- **Database Migration**: เพิ่มคอลัมน์ `thai_last_name` ในตาราง `patients`
- **Backend Fixes**: แก้ไข INSERT, SELECT, และ RETURNING queries
- **Frontend Fixes**: แก้ไขการแสดงผลและ mapping ข้อมูล

### **Results:**
- ✅ **Database Schema**: สอดคล้องกันระหว่าง `users` และ `patients`
- ✅ **Backend Controllers**: สามารถจัดการ `thai_last_name` ได้ถูกต้อง
- ✅ **Frontend Display**: แสดงข้อมูลถูกต้อง
- ✅ **Data Consistency**: ข้อมูลสอดคล้องกันทั้งหมด

**ผลลัพธ์:** ระบบ EMR แสดงข้อมูลชื่อไทยและอังกฤษถูกต้องแล้ว! 🏥✅

---

## 📚 **Documentation Created:**
1. `backend/THAI_LAST_NAME_CONSISTENCY_FIX_SUMMARY.md` - สรุปการแก้ไขความสอดคล้อง
2. `backend/test-thai-last-name-consistency.js` - สคริปต์ทดสอบความสอดคล้อง
3. `backend/test-birth-date-fix.js` - สคริปต์ทดสอบการแก้ไขวันเกิด
4. `backend/src/database/migrations/026_add_thai_last_name_to_patients.sql` - Migration

**การแก้ไขเสร็จสมบูรณ์แล้ว!** 🎉
