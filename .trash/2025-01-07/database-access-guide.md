# 📊 วิธีการดูข้อมูลใน EMR Database

## 🎯 วิธีการต่างๆ ในการเข้าถึงข้อมูล

### 1. **ผ่าน Command Line Script** (ที่เพิ่งใช้)
```bash
cd backend
npx tsx src/scripts/view-database-data.ts
```

### 2. **ผ่าน Database Management Tools**

#### **pgAdmin** (แนะนำ)
- ดาวน์โหลด: https://www.pgadmin.org/
- Connection Settings:
  - Host: localhost
  - Port: 5432
  - Database: postgres
  - Username: postgres
  - Password: [รหัสผ่านที่ตั้งไว้]

#### **DBeaver** (ฟรี)
- ดาวน์โหลด: https://dbeaver.io/
- รองรับ PostgreSQL
- Interface ที่ใช้งานง่าย

#### **TablePlus** (Mac/Windows)
- ดาวน์โหลด: https://tableplus.com/
- Interface สวยงาม
- รองรับ PostgreSQL

### 3. **ผ่าน Web Interface**

#### **Adminer** (Web-based)
```bash
# ติดตั้ง Adminer
npm install -g adminer

# รัน Adminer
adminer
# เปิด http://localhost:8080
```

### 4. **ผ่าน API Endpoints** (เมื่อระบบรัน)

#### **Health Check**
```bash
curl http://localhost:3001/health
```

#### **Database Status**
```bash
curl http://localhost:3001/api/admin/database/status
```

### 5. **ผ่าน Direct SQL Queries**

#### **ตัวอย่างคำสั่ง SQL ที่มีประโยชน์:**

```sql
-- ดูข้อมูลผู้ป่วยทั้งหมด
SELECT hospital_number, first_name, last_name, date_of_birth, gender 
FROM patients 
ORDER BY hospital_number;

-- ดูข้อมูลการมาพบแพทย์
SELECT v.visit_number, v.visit_date, p.first_name, p.last_name, v.diagnosis
FROM visits v
JOIN patients p ON v.patient_id = p.id
ORDER BY v.visit_date DESC;

-- ดูข้อมูลนัดหมาย
SELECT a.title, a.appointment_date, p.first_name, p.last_name, a.status
FROM appointments a
JOIN patients p ON a.patient_id = p.id
ORDER BY a.appointment_date;

-- ดูข้อมูลใบสั่งยา
SELECT pr.prescription_number, p.first_name, p.last_name, pr.status
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.id
ORDER BY pr.prescription_date DESC;

-- ดูข้อมูลผลตรวจแลป
SELECT lo.order_number, lo.test_name, lr.result_value, lr.abnormal_flag
FROM lab_orders lo
JOIN lab_results lr ON lo.id = lr.lab_order_id
ORDER BY lo.order_date DESC;
```

### 6. **ผ่าน Backend API** (เมื่อระบบรัน)

#### **ตัวอย่าง API Calls:**
```bash
# ดูข้อมูลผู้ป่วย
curl http://localhost:3001/api/patients

# ดูข้อมูลการมาพบแพทย์
curl http://localhost:3001/api/visits

# ดูข้อมูลนัดหมาย
curl http://localhost:3001/api/appointments
```

## 🔧 การตั้งค่า Connection

### **Environment Variables**
ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ backend:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
```

### **Connection String**
```
postgresql://postgres:password@localhost:5432/postgres
```

## 📋 ข้อมูลที่มีอยู่ในระบบ

### **ตารางหลัก:**
- **users**: 6 ผู้ใช้ (admin, doctors, nurses, staff)
- **patients**: 11 ผู้ป่วย
- **visits**: 3 การมาพบแพทย์
- **appointments**: 3 นัดหมาย
- **lab_orders**: 3 ใบสั่งตรวจ
- **lab_results**: 3 ผลตรวจ
- **prescriptions**: 3 ใบสั่งยา
- **prescription_items**: 6 รายการยา
- **departments**: 6 แผนก

### **ข้อมูลตัวอย่าง:**
- ผู้ป่วยไทย 5 คน (สมชาย, สมหญิง, เด็กชาย, คุณยาย, คุณตา)
- การรักษา: ไข้หวัดใหญ่, โรคเบาหวาน, โรคหอบหืด
- แผนก: อายุรกรรม, ศัลยกรรม, กุมารเวชกรรม, ฉุกเฉิน, ห้องปฏิบัติการ

## 🚀 การเริ่มต้นใช้งาน

1. **รัน Backend Server:**
```bash
cd backend
npm run dev
```

2. **เปิด Database Tool:**
- ใช้ pgAdmin หรือ DBeaver
- เชื่อมต่อกับ localhost:5432

3. **ดูข้อมูลผ่าน Script:**
```bash
npx tsx src/scripts/view-database-data.ts
```

## 🔍 Tips การใช้งาน

- ใช้ **pgAdmin** สำหรับการจัดการฐานข้อมูลแบบ GUI
- ใช้ **DBeaver** สำหรับการเขียน SQL queries
- ใช้ **Script** สำหรับการดูข้อมูลแบบรวดเร็ว
- ใช้ **API** สำหรับการเข้าถึงข้อมูลผ่านแอปพลิเคชัน
