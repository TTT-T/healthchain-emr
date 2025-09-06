# 🔐 HealthChain EMR - Forgot Password System Guide

## ภาพรวม (Overview)

ระบบลืมรหัสผ่านของ HealthChain EMR ได้รับการพัฒนาให้ครบถ้วนและพร้อมใช้งานแล้ว โดยมีทั้ง Backend API และ Frontend UI ที่สมบูรณ์

## 🏗️ สถาปัตยกรรมระบบ

### Backend Components
1. **Database Methods** - จัดการ password reset tokens
2. **API Controllers** - ควบคุมการทำงานของ API
3. **Routes** - เส้นทาง API endpoints
4. **Email Service** - ส่งอีเมลรีเซ็ตรหัสผ่าน

### Frontend Components
1. **Forgot Password Page** - หน้าขอรีเซ็ตรหัสผ่าน
2. **Reset Password Page** - หน้ารีเซ็ตรหัสผ่าน
3. **Login Integration** - เชื่อมต่อกับหน้า login

## 📊 สถานะการพัฒนา

### ✅ สิ่งที่เสร็จสมบูรณ์แล้ว

#### Backend
- [x] **Database Schema**: ตาราง `password_reset_tokens` พร้อมใช้งาน
- [x] **Database Methods**: 
  - `createPasswordResetToken()` - สร้าง token รีเซ็ตรหัสผ่าน
  - `validatePasswordResetToken()` - ตรวจสอบ token
  - `markPasswordResetTokenAsUsed()` - ทำเครื่องหมาย token ว่าใช้แล้ว
  - `updateUserPassword()` - อัปเดตรหัสผ่าน
- [x] **API Controllers**:
  - `forgotPassword()` - ส่งอีเมลรีเซ็ตรหัสผ่าน
  - `resetPassword()` - รีเซ็ตรหัสผ่านด้วย token
- [x] **API Routes**:
  - `POST /api/auth/forgot-password` - ขอรีเซ็ตรหัสผ่าน
  - `POST /api/auth/reset-password` - รีเซ็ตรหัสผ่าน
- [x] **Email Templates**: เทมเพลตอีเมลรีเซ็ตรหัสผ่านที่สวยงาม
- [x] **Security Features**:
  - Token หมดอายุใน 1 ชั่วโมง
  - Token ใช้ได้ครั้งเดียว
  - การตรวจสอบความแข็งแกร่งของรหัสผ่าน
  - การ invalidate sessions หลังรีเซ็ตรหัสผ่าน

#### Frontend
- [x] **Forgot Password Page** (`/forgot-password`):
  - UI ที่สวยงามและใช้งานง่าย
  - การตรวจสอบอีเมล
  - การแสดงสถานะการส่งอีเมล
  - การจัดการ error
- [x] **Reset Password Page** (`/reset-password`):
  - การตรวจสอบความแข็งแกร่งของรหัสผ่าน
  - การยืนยันรหัสผ่าน
  - การแสดง/ซ่อนรหัสผ่าน
  - การจัดการ token จาก URL
- [x] **Login Integration**:
  - ลิงก์ "ลืมรหัสผ่าน?" เชื่อมต่อกับหน้า forgot password
- [x] **Responsive Design**: รองรับการแสดงผลบนมือถือ
- [x] **Error Handling**: การจัดการ error ที่ครอบคลุม

## 🚀 วิธีการใช้งาน

### 1. ขอรีเซ็ตรหัสผ่าน
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link has been sent to your email.",
  "data": {
    "emailSent": true,
    "email": "user@example.com"
  }
}
```

### 2. รีเซ็ตรหัสผ่าน
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "new_password": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please login with your new password.",
  "data": {
    "passwordReset": true
  }
}
```

### 3. การใช้งานใน Frontend

#### ขอรีเซ็ตรหัสผ่าน
1. ไปที่หน้า `/forgot-password`
2. กรอกอีเมลของคุณ
3. คลิก "ส่งลิงก์รีเซ็ตรหัสผ่าน"
4. ตรวจสอบอีเมลของคุณ

#### รีเซ็ตรหัสผ่าน
1. คลิกลิงก์ในอีเมล (จะไปที่ `/reset-password?token=...&email=...`)
2. กรอกรหัสผ่านใหม่
3. ยืนยันรหัสผ่าน
4. คลิก "รีเซ็ตรหัสผ่าน"
5. เข้าสู่ระบบด้วยรหัสผ่านใหม่

## 🔒 ความปลอดภัย

### Token Security
- **Expiration**: Token หมดอายุใน 1 ชั่วโมง
- **One-time Use**: Token ใช้ได้ครั้งเดียว
- **Cryptographically Secure**: ใช้ `crypto.randomBytes(32)`
- **Database Storage**: เก็บในฐานข้อมูลพร้อม expiration

### Password Security
- **Minimum Length**: อย่างน้อย 8 ตัวอักษร
- **Complexity Requirements**:
  - ตัวอักษรใหญ่อย่างน้อย 1 ตัว
  - ตัวอักษรเล็กอย่างน้อย 1 ตัว
  - ตัวเลขอย่างน้อย 1 ตัว
  - สัญลักษณ์พิเศษอย่างน้อย 1 ตัว
- **Hashing**: ใช้ bcrypt สำหรับ hash รหัสผ่าน
- **Session Invalidation**: ยกเลิก sessions ทั้งหมดหลังรีเซ็ตรหัสผ่าน

### Email Security
- **Rate Limiting**: ป้องกันการส่งอีเมลซ้ำๆ
- **No Information Disclosure**: ไม่เปิดเผยว่าอีเมลมีอยู่หรือไม่
- **Secure Links**: ลิงก์ในอีเมลมี token ที่ปลอดภัย

## 📧 Email Template Features

### Design Features
- **Modern UI**: การออกแบบที่ทันสมัยและสวยงาม
- **Responsive**: รองรับการแสดงผลบนมือถือ
- **Color Coding**: สีแดงแสดงความสำคัญ
- **Clear Instructions**: คำแนะนำที่ชัดเจน

### Content Features
- **Security Tips**: เคล็ดลับความปลอดภัยสำหรับรหัสผ่าน
- **Expiration Warning**: เตือนการหมดอายุของลิงก์
- **Contact Information**: ข้อมูลการติดต่อ
- **Professional Branding**: ใช้แบรนด์ HealthChain EMR

## 🧪 การทดสอบ

### Backend Testing
```bash
cd backend
node test-forgot-password.js
```

### Manual Testing Flow
1. **Test Forgot Password Request**:
   - ไปที่ `/forgot-password`
   - กรอกอีเมลที่ถูกต้อง
   - ตรวจสอบว่าส่งอีเมลสำเร็จ

2. **Test Email Template**:
   - เปิดอีเมลที่ส่งมา
   - ตรวจสอบการออกแบบและเนื้อหา
   - คลิกลิงก์รีเซ็ตรหัสผ่าน

3. **Test Reset Password**:
   - ตรวจสอบว่าหน้า reset password โหลดได้
   - ทดสอบการตรวจสอบความแข็งแกร่งของรหัสผ่าน
   - ทดสอบการรีเซ็ตรหัสผ่าน

4. **Test Login with New Password**:
   - เข้าสู่ระบบด้วยรหัสผ่านใหม่
   - ตรวจสอบว่าสามารถเข้าสู่ระบบได้

### Error Testing
- **Invalid Email**: ทดสอบด้วยอีเมลที่ไม่ถูกต้อง
- **Expired Token**: ทดสอบด้วย token ที่หมดอายุ
- **Used Token**: ทดสอบด้วย token ที่ใช้แล้ว
- **Weak Password**: ทดสอบด้วยรหัสผ่านที่อ่อนแอ
- **Mismatched Passwords**: ทดสอบด้วยรหัสผ่านที่ไม่ตรงกัน

## 📁 ไฟล์ที่เกี่ยวข้อง

### Backend Files
- `backend/src/database/index.ts` - Database methods
- `backend/src/controllers/authController.ts` - API controllers
- `backend/src/routes/auth.ts` - API routes
- `backend/src/services/emailService.ts` - Email service
- `backend/test-forgot-password.js` - Test script

### Frontend Files
- `frontend/src/app/forgot-password/page.tsx` - Forgot password page
- `frontend/src/app/reset-password/page.tsx` - Reset password page
- `frontend/src/app/login/LoginClient.tsx` - Login integration

### Documentation Files
- `EMAIL_TEMPLATES_GUIDE.md` - Email templates guide
- `FORGOT_PASSWORD_SYSTEM_GUIDE.md` - This guide

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. อีเมลไม่ส่ง
- ตรวจสอบการตั้งค่า SMTP ใน `.env`
- ตรวจสอบ logs ของ backend
- ทดสอบใน development mode

#### 2. Token ไม่ทำงาน
- ตรวจสอบว่า token ยังไม่หมดอายุ
- ตรวจสอบว่า token ยังไม่ถูกใช้
- ตรวจสอบ URL parameters

#### 3. รหัสผ่านไม่ผ่านการตรวจสอบ
- ตรวจสอบข้อกำหนดความแข็งแกร่ง
- ตรวจสอบการยืนยันรหัสผ่าน

### Debug Commands
```bash
# ตรวจสอบ logs ของ backend
cd backend && npm run dev

# ทดสอบ API endpoints
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🚀 การใช้งานใน Production

### Environment Variables
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
```

### Security Checklist
- [ ] ตั้งค่า HTTPS สำหรับ production
- [ ] ตั้งค่า rate limiting สำหรับ API
- [ ] ตั้งค่า CORS ที่เหมาะสม
- [ ] ตั้งค่า email provider ที่น่าเชื่อถือ
- [ ] ทดสอบการทำงานใน production environment

## 📞 การสนับสนุน

หากมีปัญหาหรือต้องการความช่วยเหลือ:
- 📧 อีเมล: support@healthchain.co.th
- 📞 โทรศัพท์: 02-xxx-xxxx
- 🕐 ชั่วโมงทำงาน: จันทร์-ศุกร์ 8:00-17:00

---

**© 2025 HealthChain EMR System. All rights reserved.**
