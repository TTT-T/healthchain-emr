# 🏥 EMR System - Electronic Medical Records

ระบบบันทึกข้อมูลทางการแพทย์อิเล็กทรอนิกส์ที่สมบูรณ์ พร้อมใช้งาน

## 🚀 Quick Start

### เริ่มต้นใช้งาน
```bash
# เริ่มระบบ
start.bat start

# สร้าง Admin User
start.bat admin

# เปิดเว็บไซต์
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# pgAdmin:  http://localhost:8080
```

### บัญชี Admin เริ่มต้น
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@admin.com`

## 📋 ฟีเจอร์หลัก

### 🏥 EMR Dashboard
- **URL:** http://localhost:3000/emr/dashboard
- **ฟีเจอร์:** แดชบอร์ดหลักสำหรับแพทย์และพยาบาล
- **ข้อมูล:** สถานะคิว, จำนวนผู้ป่วย, กิจกรรมล่าสุด

### 📝 Patient Check-in
- **URL:** http://localhost:3000/emr/checkin
- **ฟีเจอร์:** ระบบลงทะเบียนผู้ป่วย
- **ข้อมูล:** เลือกแผนก, ข้อมูลผู้ป่วย, การนัดหมาย

### 💊 Vital Signs
- **URL:** http://localhost:3000/emr/vital-signs
- **ฟีเจอร์:** บันทึกสัญญาณชีพ
- **ข้อมูล:** ความดัน, ชีพจร, อุณหภูมิ, น้ำหนัก, ส่วนสูง

### 📋 History Taking
- **URL:** http://localhost:3000/emr/history-taking
- **ฟีเจอร์:** บันทึกประวัติการเจ็บป่วย
- **ข้อมูล:** อาการหลัก, ประวัติการเจ็บป่วย, การตรวจร่างกาย

### 🧪 Lab Results
- **URL:** http://localhost:3000/emr/lab-result
- **ฟีเจอร์:** บันทึกผลการตรวจแลป
- **ข้อมูล:** ผลการตรวจ, การแปลผล, คำแนะนำ

### 📅 Appointments
- **URL:** http://localhost:3000/emr/appointments
- **ฟีเจอร์:** จัดการการนัดหมาย
- **ข้อมูล:** สร้างนัดหมาย, ดูรายการนัดหมาย, จัดการเวลา

### 📄 Documents
- **URL:** http://localhost:3000/emr/documents
- **ฟีเจอร์:** ออกเอกสารทางการแพทย์
- **ข้อมูล:** ใบรับรองแพทย์, ใบส่งตัว, เอกสารอื่นๆ

### 👤 Patient Portal
- **URL:** http://localhost:3000/accounts/patient
- **ฟีเจอร์:** พอร์ทัลสำหรับผู้ป่วย
- **ข้อมูล:** ดูประวัติ, ผลแลป, การนัดหมาย

### 🔧 Admin Panel
- **URL:** http://localhost:3000/admin
- **ฟีเจอร์:** จัดการระบบ
- **ข้อมูล:** จัดการผู้ใช้, ตั้งค่าระบบ, รายงาน

## 🛠️ การติดตั้งและใช้งาน

### ความต้องการของระบบ
- **Docker Desktop** (Windows/Mac/Linux)
- **Node.js 18+** (สำหรับ development)
- **PostgreSQL 15+** (ผ่าน Docker)
- **Redis 7+** (ผ่าน Docker)

### การติดตั้ง
1. **Clone โปรเจกต์**
   ```bash
   git clone <repository-url>
   cd Project
   ```

2. **เริ่มระบบ**
   ```bash
   start.bat start
   ```

3. **สร้าง Admin User**
```bash
start.bat admin
```

4. **เปิดเว็บไซต์**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- pgAdmin: http://localhost:8080

### คำสั่งที่ใช้ได้
```bash
start.bat start      # เริ่มระบบ
start.bat stop       # หยุดระบบ
start.bat restart    # รีสตาร์ทระบบ
start.bat clean      # ล้างข้อมูล Docker
start.bat admin      # สร้าง Admin User
start.bat help       # แสดงความช่วยเหลือ
```

## 🗄️ ฐานข้อมูล

### ตารางหลัก
- **users** - ข้อมูลผู้ใช้งาน
- **patients** - ข้อมูลผู้ป่วย
- **visits** - การมาโรงพยาบาล
- **medical_records** - บันทึกทางการแพทย์
- **vital_signs** - สัญญาณชีพ
- **appointments** - การนัดหมาย
- **prescriptions** - ใบสั่งยา
- **lab_orders** - คำสั่งแลป
- **lab_results** - ผลแลป
- **notifications** - การแจ้งเตือน
- **departments** - แผนก
- **queue_history** - ประวัติคิว

### ตารางเพิ่มเติม
- **detailed_nutrition** - ข้อมูลโภชนาการ
- **detailed_exercise** - ข้อมูลการออกกำลังกาย
- **critical_lab_values** - ผลแลปสำคัญ
- **external_requesters** - ผู้ขอข้อมูลภายนอก
- **consent_contracts** - สัญญายินยอม
- **audit_logs** - บันทึกการตรวจสอบ

## 🔧 การพัฒนา

### โครงสร้างโปรเจกต์
```
Project/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # API Controllers
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic
│   │   ├── database/       # Database Connection & Migrations
│   │   └── middleware/     # Express Middleware
├── frontend/               # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React Components
│   │   ├── services/      # API Services
│   │   └── contexts/      # React Contexts
├── docker-compose.yml      # Docker Configuration
├── start.bat              # Management Script
└── README.md              # Documentation
```

### การพัฒนา
1. **Backend Development**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Management**
   - pgAdmin: http://localhost:8080
   - Username: admin@admin.com
   - Password: admin

## 🔐 ความปลอดภัย

### การยืนยันตัวตน
- **JWT Authentication** - Token-based authentication
- **Role-based Access Control** - ควบคุมการเข้าถึงตามบทบาท
- **Password Hashing** - bcrypt สำหรับรหัสผ่าน

### บทบาทผู้ใช้
- **admin** - ผู้ดูแลระบบ
- **doctor** - แพทย์
- **nurse** - พยาบาล
- **patient** - ผู้ป่วย
- **pharmacist** - เภสัชกร
- **lab_tech** - นักเทคนิคการแพทย์

## 📊 การแจ้งเตือน

### ระบบแจ้งเตือน
- **Email Notifications** - ส่งอีเมลแจ้งเตือน
- **SMS Notifications** - ส่ง SMS แจ้งเตือน
- **In-App Notifications** - แจ้งเตือนในแอป
- **Real-time Updates** - อัปเดตแบบเรียลไทม์

### ประเภทการแจ้งเตือน
- การนัดหมายใหม่
- ผลแลปพร้อม
- ใบสั่งยาพร้อม
- เอกสารออกแล้ว
- การแจ้งเตือนระบบ

## 🤖 AI Features

### การประเมินความเสี่ยง
- **Diabetes Risk Assessment** - ประเมินความเสี่ยงเบาหวาน
- **Critical Lab Values** - วิเคราะห์ผลแลปสำคัญ
- **Health Insights** - ข้อมูลเชิงลึกด้านสุขภาพ

### การวิเคราะห์ข้อมูล
- **Nutrition Analysis** - วิเคราะห์ข้อมูลโภชนาการ
- **Exercise Tracking** - ติดตามการออกกำลังกาย
- **Health Trends** - แนวโน้มสุขภาพ

## 🌐 External Requester System

### ระบบผู้ขอข้อมูลภายนอก
- **Registration** - ลงทะเบียนผู้ขอข้อมูล
- **Consent Management** - จัดการการยินยอม
- **Data Request** - ขอข้อมูลผู้ป่วย
- **Audit Trail** - บันทึกการตรวจสอบ

## 📱 Responsive Design

### การรองรับอุปกรณ์
- **Desktop** - คอมพิวเตอร์
- **Tablet** - แท็บเล็ต
- **Mobile** - มือถือ
- **Cross-browser** - รองรับทุกเบราว์เซอร์

## 🚀 Production Deployment

### การเตรียม Production
1. **Environment Variables**
```bash
   # Backend
   NODE_ENV=production
   JWT_SECRET=your-production-secret
   DB_PASSWORD=your-secure-password
   
   # Frontend
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

2. **Security Settings**
   - เปลี่ยน JWT secrets
   - ตั้งรหัสผ่านฐานข้อมูลที่ปลอดภัย
   - เปิดใช้ HTTPS
   - ตั้งค่า CORS

3. **Database Backup**
   ```bash
   # Backup database
   docker exec emr_postgres pg_dump -U postgres emr_development > backup.sql
   
   # Restore database
   docker exec -i emr_postgres psql -U postgres emr_development < backup.sql
   ```

## 📞 การสนับสนุน

### การแก้ไขปัญหา
1. **ตรวจสอบ Logs**
   ```bash
   # Backend logs
   docker logs emr_backend
   
   # Frontend logs
   docker logs emr_frontend
   
   # Database logs
   docker logs emr_postgres
   ```

2. **รีสตาร์ทระบบ**
   ```bash
   start.bat restart
   ```

3. **ล้างข้อมูลและเริ่มใหม่**
   ```bash
   start.bat clean
   start.bat start
   start.bat admin
   ```

### การติดต่อ
- **Email:** support@emr-system.com
- **Documentation:** [Wiki](https://github.com/your-repo/wiki)
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **Next.js** - React Framework
- **Express.js** - Node.js Framework
- **PostgreSQL** - Database
- **Docker** - Containerization
- **Tailwind CSS** - Styling
- **TypeScript** - Type Safety

---

**🏥 EMR System - Electronic Medical Records**  
*ระบบบันทึกข้อมูลทางการแพทย์อิเล็กทรอนิกส์ที่สมบูรณ์ พร้อมใช้งาน*

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** Production Ready ✅