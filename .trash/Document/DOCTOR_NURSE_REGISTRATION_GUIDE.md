# 🏥 Doctor & Nurse Registration System - Complete Implementation Guide

## 📋 Overview

ระบบสมัครสมาชิกสำหรับแพทย์และพยาบาลที่สมบูรณ์แบบ พร้อมการจัดการข้อมูลวิชาชีพและการเข้าถึงระบบ EMR

## 🚀 Features Implemented

### ✅ Backend Features
- **Database Tables**: ตาราง `doctors` และ `nurses` สำหรับเก็บข้อมูลวิชาชีพ
- **Registration Logic**: ระบบสมัครสมาชิกที่สร้างข้อมูลในตาราง users และตารางวิชาชีพ
- **Profile Management**: ระบบจัดการโปรไฟล์แพทย์และพยาบาล
- **License Validation**: ตรวจสอบหมายเลขใบอนุญาตไม่ซ้ำกัน

### ✅ Frontend Features
- **Dedicated Pages**: หน้า login และ register แยกสำหรับแพทย์และพยาบาล
- **Professional Forms**: ฟอร์มสมัครสมาชิกที่เก็บข้อมูลวิชาชีพครบถ้วน
- **Role-based Routing**: ระบบ routing ที่แยกตาม role
- **UI/UX**: ดีไซน์ที่สวยงามและใช้งานง่าย

## 🗄️ Database Schema

### Doctors Table
```sql
CREATE TABLE doctors (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    medical_license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INTEGER,
    education JSONB,
    certifications JSONB,
    languages JSONB,
    department VARCHAR(100),
    position VARCHAR(100),
    work_schedule JSONB,
    consultation_fee DECIMAL(10,2),
    availability JSONB,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    notification_preferences JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Nurses Table
```sql
CREATE TABLE nurses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    nursing_license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INTEGER,
    education JSONB,
    certifications JSONB,
    languages JSONB,
    department VARCHAR(100),
    position VARCHAR(100),
    work_schedule JSONB,
    shift_preference VARCHAR(50),
    availability JSONB,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    notification_preferences JSONB,
    privacy_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Installation & Setup

### 1. Run Database Migrations
```bash
# Navigate to backend directory
cd backend

# Run migrations
npm run migration:run
# หรือ
npx ts-node src/scripts/runMigration.ts
```

### 2. Test the System
```bash
# Run test script
npx ts-node src/scripts/testDoctorNurseRegistration.ts
```

### 3. Start the Application
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## 📱 Usage Guide

### For Doctors

#### Registration
1. ไปที่ `http://localhost:3000/`
2. คลิก "การสมัครแพทย์" ในส่วน Registration Options
3. กรอกข้อมูลส่วนตัวและข้อมูลวิชาชีพ
4. ระบบจะสร้างบัญชีในตาราง `users` และ `doctors`

#### Login
1. ไปที่ `http://localhost:3000/doctor/login`
2. กรอกอีเมลและรหัสผ่าน
3. ระบบจะตรวจสอบ role และ redirect ไป EMR dashboard

### For Nurses

#### Registration
1. ไปที่ `http://localhost:3000/medical-staff/register`
2. เลือก "พยาบาล" ใน dropdown อาชีพ
3. กรอกข้อมูลส่วนตัวและข้อมูลวิชาชีพ
4. ระบบจะสร้างบัญชีในตาราง `users` และ `nurses`

#### Login
1. ไปที่ `http://localhost:3000/nurse/login`
2. กรอกอีเมลและรหัสผ่าน
3. ระบบจะตรวจสอบ role และ redirect ไป EMR dashboard

## 🔗 API Endpoints

### Medical Staff APIs
- `POST /api/medical-staff/register` - สมัครสมาชิกบุคลากรทางการแพทย์ (แพทย์/พยาบาล/เจ้าหน้าที่)
- `POST /api/medical-staff/login` - เข้าสู่ระบบบุคลากรทางการแพทย์

### Individual APIs (ยังคงใช้งานได้)
- `POST /api/doctor/login` - เข้าสู่ระบบแพทย์
- `POST /api/nurse/login` - เข้าสู่ระบบพยาบาล

### Backend APIs
- `POST /api/auth/register` - สมัครสมาชิกทั่วไป (รองรับ role)
- `POST /api/auth/login` - เข้าสู่ระบบทั่วไป

## 🎨 UI/UX Features

### Color Themes
- **Doctor**: Emerald (เขียว) - `from-emerald-50 to-emerald-100`
- **Nurse**: Pink (ชมพู) - `from-pink-50 to-pink-100`
- **External**: Amber (เหลือง) - `from-amber-50 to-amber-100`
- **Admin**: Purple (ม่วง) - `from-purple-50 to-purple-100`

### Form Features
- **Validation**: ตรวจสอบข้อมูลก่อนส่ง
- **Professional Fields**: ฟิลด์เฉพาะสำหรับข้อมูลวิชาชีพ
- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Error Handling**: แสดงข้อความผิดพลาดที่เข้าใจง่าย

## 🔒 Security Features

### Authentication
- **JWT Tokens**: ใช้ JWT สำหรับ authentication
- **Role-based Access**: ตรวจสอบ role ก่อนเข้าถึง
- **Password Hashing**: เข้ารหัสรหัสผ่านด้วย bcrypt

### Validation
- **License Number**: ตรวจสอบหมายเลขใบอนุญาตไม่ซ้ำกัน
- **Email Format**: ตรวจสอบรูปแบบอีเมล
- **Password Strength**: ตรวจสอบความแข็งแกร่งของรหัสผ่าน

## 📊 Data Flow

### Registration Flow
1. **Frontend Form** → ตรวจสอบข้อมูล
2. **API Route** → ส่งต่อไปยัง Backend
3. **Backend Controller** → สร้าง user ในตาราง `users`
4. **Database Helper** → สร้าง profile ในตาราง `doctors`/`nurses`
5. **Response** → ส่งผลลัพธ์กลับไป Frontend

### Login Flow
1. **Frontend Form** → ส่งข้อมูล login
2. **API Route** → ตรวจสอบ role
3. **Backend Controller** → ตรวจสอบข้อมูลและสร้าง token
4. **Response** → ส่ง token และข้อมูล user กลับไป

## 🧪 Testing

### Manual Testing
1. **Registration Test**: ทดสอบสมัครสมาชิกแพทย์และพยาบาล
2. **Login Test**: ทดสอบเข้าสู่ระบบ
3. **Role Test**: ทดสอบการเข้าถึงตาม role
4. **Validation Test**: ทดสอบการตรวจสอบข้อมูล

### Automated Testing
```bash
# Run test script
npx ts-node src/scripts/testDoctorNurseRegistration.ts
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Tables Not Found
```bash
# Run migrations
npm run migration:run
```

#### 2. Registration Fails
- ตรวจสอบข้อมูลที่กรอก
- ตรวจสอบหมายเลขใบอนุญาตไม่ซ้ำกัน
- ตรวจสอบรูปแบบอีเมล

#### 3. Login Fails
- ตรวจสอบอีเมลและรหัสผ่าน
- ตรวจสอบ role ของผู้ใช้
- ตรวจสอบ token ใน cookies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Future Enhancements

### Planned Features
- **Profile Management**: หน้าแก้ไขโปรไฟล์
- **Dashboard**: หน้า dashboard สำหรับแพทย์และพยาบาล
- **Notifications**: ระบบแจ้งเตือน
- **File Upload**: อัปโหลดเอกสารประกอบ

### Technical Improvements
- **Caching**: เพิ่ม Redis cache
- **Rate Limiting**: จำกัดจำนวน request
- **Audit Log**: บันทึกการเปลี่ยนแปลง
- **Backup**: ระบบสำรองข้อมูล

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ log ใน console
2. ดู error message ที่แสดง
3. ตรวจสอบ database connection
4. ทดสอบด้วย test script

---

**🎉 ระบบสมัครสมาชิกแพทย์และพยาบาลพร้อมใช้งานแล้ว!**
