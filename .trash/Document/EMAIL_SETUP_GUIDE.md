# 📧 คู่มือการตั้งค่า Email Service

## วิธีการตั้งค่าให้ส่ง Email จริง

### 1. สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`

```bash
# Environment Configuration
NODE_ENV=production

# Server Configuration
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=password
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000
DB_AUTO_CREATE=true
DB_AUTO_CREATE_USER=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-must-be-at-least-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-must-be-at-least-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Application Configuration
FRONTEND_URL=http://localhost:3000

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 2. ตั้งค่า Gmail App Password

#### สำหรับ Gmail:

1. **เปิด 2-Factor Authentication:**
   - ไปที่ [Google Account Settings](https://myaccount.google.com/)
   - เลือก "Security"
   - เปิด "2-Step Verification"

2. **สร้าง App Password:**
   - ไปที่ "App passwords"
   - เลือก "Mail" และ "Other (Custom name)"
   - ใส่ชื่อ "EMR System"
   - คัดลอก App Password ที่ได้

3. **ตั้งค่าใน `.env`:**
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### 3. ตั้งค่า Email Provider อื่นๆ

#### สำหรับ Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```

#### สำหรับ Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@yahoo.com
```

#### สำหรับ SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=your-verified-sender@yourdomain.com
```

#### สำหรับ Mailgun:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM=your-verified-sender@yourdomain.com
```

### 4. เปลี่ยน Environment เป็น Production

```env
NODE_ENV=production
```

### 5. รีสตาร์ท Backend Server

```bash
cd backend
npm run dev
```

## การทดสอบ Email Service

### 1. ทดสอบการส่ง Email:

```bash
# ทดสอบ resend verification
curl -X POST http://localhost:3001/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. ตรวจสอบ Logs:

```bash
# ดู logs ใน terminal ที่รัน backend
# ควรเห็น:
# 📧 Email sent: <message-id>
```

### 3. ตรวจสอบ Email:

- ตรวจสอบกล่องจดหมาย
- ดูในโฟลเดอร์ Spam/Junk
- คลิกลิงก์ยืนยันในอีเมล

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

1. **"Authentication failed":**
   - ตรวจสอบ App Password
   - ตรวจสอบ 2-Factor Authentication

2. **"Connection timeout":**
   - ตรวจสอบ SMTP_HOST และ SMTP_PORT
   - ตรวจสอบ Firewall

3. **"Invalid credentials":**
   - ตรวจสอบ SMTP_USER และ SMTP_PASSWORD
   - ใช้ App Password แทนรหัสผ่านปกติ

### Debug Mode:

```env
# เพิ่มใน .env เพื่อดู debug logs
LOG_LEVEL=debug
```

## ตัวอย่างการตั้งค่าสำหรับ Production

```env
# Production Environment
NODE_ENV=production

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Security
JWT_SECRET=your-very-secure-jwt-secret-key-for-production
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key-for-production

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## หมายเหตุ

- **Development Mode:** ระบบจะแสดง log แทนการส่ง email จริง
- **Production Mode:** ระบบจะส่ง email จริง
- **App Password:** ใช้ App Password แทนรหัสผ่านปกติสำหรับ Gmail
- **Rate Limiting:** ระวังการส่ง email มากเกินไป
- **Spam:** ตั้งค่า SPF, DKIM, DMARC records สำหรับ domain
