# 👨‍⚕️ คู่มือการสมัครแพทย์ใหม่

## 📋 วิธีการสมัครแพทย์ใหม่

### 1. ผ่าน Frontend Registration Form
- ไปที่หน้า `/medical-staff/register`
- กรอกข้อมูลแพทย์
- ระบบจะสร้าง user และ doctor profile อัตโนมัติ

### 2. ผ่าน API Endpoint
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "dr_new_doctor",
  "email": "dr.new@hospital.com",
  "password": "password123",
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "thaiFirstName": "นพ. สมชาย",
  "thaiLastName": "ใจดี",
  "phoneNumber": "0812345678",
  "role": "doctor",
  "nationalId": "1234567890123",
  "birthDate": "1985-01-01",
  "gender": "male",
  "address": "123 ถนนทดสอบ กรุงเทพฯ",
  "bloodType": "A+",
  "medicalLicenseNumber": "MD123456",
  "specialization": "อายุรกรรม",
  "yearsOfExperience": 10,
  "department": "อายุรกรรม",
  "position": "แพทย์ผู้เชี่ยวชาญ",
  "consultationFee": 500
}
```

## 🔧 ระบบทำงานอย่างไร

### 1. สร้าง User Account
- สร้าง record ในตาราง `users`
- ตั้งค่า `role = 'doctor'`
- ตั้งค่า `is_active = false` (ต้องรอการอนุมัติ)

### 2. สร้าง Doctor Profile
- สร้าง record ในตาราง `doctors`
- เชื่อมโยงกับ user ผ่าน `user_id`
- ใส่ข้อมูลแพทย์ครบถ้วน

### 3. ข้อมูลเริ่มต้น (Default Values)
หากไม่ระบุข้อมูล ระบบจะใส่ค่าเริ่มต้น:
- `medicalLicenseNumber`: `MD` + 8 ตัวอักษรแรกของ UUID
- `specialization`: "อายุรกรรม"
- `yearsOfExperience`: 5
- `department`: "อายุรกรรม"
- `position`: "แพทย์ผู้เชี่ยวชาญ"
- `consultationFee`: 500
- `availability`: จันทร์-ศุกร์

## ✅ การตรวจสอบ

### ตรวจสอบแพทย์ทั้งหมด
```sql
SELECT 
  d.id,
  d.medical_license_number,
  d.specialization,
  d.department,
  d.position,
  d.consultation_fee,
  u.first_name,
  u.last_name,
  u.thai_name,
  u.username,
  u.email,
  u.is_active
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.role = 'doctor'
ORDER BY d.created_at DESC;
```

### ตรวจสอบแพทย์ที่รอการอนุมัติ
```sql
SELECT 
  d.id,
  d.medical_license_number,
  d.specialization,
  u.first_name,
  u.last_name,
  u.thai_name,
  u.username,
  u.email,
  u.created_at
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE u.role = 'doctor' AND u.is_active = false
ORDER BY u.created_at DESC;
```

## 🎯 ผลลัพธ์

หลังจากการสมัครแพทย์ใหม่:
1. ✅ **User Account**: สร้างในตาราง `users`
2. ✅ **Doctor Profile**: สร้างในตาราง `doctors`
3. ✅ **ข้อมูลครบถ้วน**: มีข้อมูลแพทย์ครบถ้วน
4. ✅ **API Ready**: สามารถเรียกใช้ API `/api/medical/doctors` ได้
5. ✅ **EMR Checkin**: แสดงในรายชื่อแพทย์ (เมื่อ `is_active = true`)

## 🔑 การอนุมัติแพทย์

เพื่อให้แพทย์ปรากฏในระบบ EMR:
1. Admin ต้องอนุมัติโดยเปลี่ยน `is_active = true`
2. หรือใช้ API endpoint สำหรับการอนุมัติ

## 📊 สถานะปัจจุบัน

- **แพทย์ทั้งหมด**: 6 คน
- **แพทย์ที่ใช้งานได้**: 5 คน (`is_active = true`)
- **แพทย์ที่รอการอนุมัติ**: 1 คน (`is_active = false`)
