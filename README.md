# EMR System - Electronic Medical Records

ระบบจัดการเวชระเบียนอิเล็กทรอนิกส์ (EMR) ที่ครบถ้วน พร้อมระบบ AI สำหรับการคาดการณ์โรคเบาหวาน

## 🏥 ฟีเจอร์หลัก

### ระบบ EMR หลัก
- **Patient Management** - จัดการข้อมูลผู้ป่วย
- **Doctor Workflows** - ระบบการทำงานของแพทย์
- **Nurse Workflows** - ระบบการทำงานของพยาบาล
- **Appointment Scheduling** - ระบบนัดหมาย
- **Lab Management** - จัดการแลปและผลตรวจ
- **Prescription System** - ระบบใบสั่งยา
- **Document Management** - จัดการเอกสารทางการแพทย์
- **Vital Signs** - บันทึกสัญญาณชีพ
- **History Taking** - การซักประวัติ
- **Queue Management** - จัดการคิวผู้ป่วย

### ระบบ AI
- **AI Diabetes Prediction** - คาดการณ์ความเสี่ยงโรคเบาหวาน
- **Risk Assessment** - ประเมินความเสี่ยงสุขภาพ
- **Personalized Recommendations** - คำแนะนำเฉพาะบุคคล
- **Treatment Timeline** - แผนการรักษาระยะยาว

### ระบบ Admin
- **User Management** - จัดการผู้ใช้งาน
- **Role & Permissions** - จัดการสิทธิ์และบทบาท
- **System Monitoring** - ตรวจสอบระบบ
- **Database Management** - จัดการฐานข้อมูล
- **Activity Logs** - บันทึกกิจกรรม
- **Notifications** - ระบบแจ้งเตือน

### ระบบ External Requesters
- **Consent Management** - จัดการความยินยอม
- **Data Request System** - ระบบขอข้อมูล
- **Audit Trail** - ติดตามการใช้งาน
- **Compliance Monitoring** - ตรวจสอบการปฏิบัติตามกฎระเบียบ

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดระบบ
- Docker Desktop
- Node.js 18+ (สำหรับ development)
- PostgreSQL 15+ (ถ้าไม่ใช้ Docker)

### การติดตั้ง
1. Clone repository:
```bash
git clone <repository-url>
cd Project
```

2. เริ่มระบบ:
```bash
start.bat start
```

3. สร้าง Admin User:
```bash
start.bat admin
```

### คำสั่งที่ใช้ได้
```bash
start.bat start      # เริ่มระบบ
start.bat stop       # หยุดระบบ
start.bat restart    # รีสตาร์ทระบบ
start.bat clean      # ล้างข้อมูล Docker
start.bat admin      # สร้าง Admin User
start.bat help       # แสดงความช่วยเหลือ
```

## 🌐 URLs ระบบ

### Frontend
- **Main Application**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **EMR Dashboard**: http://localhost:3000/emr/dashboard
- **AI Diabetes Prediction**: http://localhost:3000/admin/ai-diabetes

### Backend
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

### Database Management
- **pgAdmin**: http://localhost:8080

## 👤 บัญชี Admin เริ่มต้น

```
Username: admin
Password: admin123
Email: admin@admin.com
```

## 🏗️ สถาปัตยกรรมระบบ

### Backend (Node.js + Express)
- **API Routes**: RESTful API
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston

### Frontend (Next.js + React)
- **Framework**: Next.js 14
- **UI Library**: Tailwind CSS
- **State Management**: React Context
- **Authentication**: JWT + HTTP-only cookies
- **Real-time**: WebSocket

### Database Schema
- **26+ Tables**: ครอบคลุมทุกฟีเจอร์
- **AI Tables**: ai_diabetes_predictions, ai_insights, ai_research_data
- **Audit Trail**: ครบถ้วนทุกการเปลี่ยนแปลง
- **Performance**: Indexes และ constraints ที่เหมาะสม

## 🤖 ระบบ AI Diabetes Prediction

### ฟีเจอร์
- **Risk Assessment**: ประเมินความเสี่ยงจาก 6 ปัจจัยหลัก
- **Personalized Recommendations**: คำแนะนำเฉพาะบุคคล
- **Treatment Timeline**: แผนการรักษา 3 ระยะ
- **Real-time Analysis**: วิเคราะห์ข้อมูลแบบ real-time
- **Data Visualization**: แสดงผลด้วยกราฟและ charts

### ปัจจัยความเสี่ยง
1. **อายุ** - อายุที่เพิ่มขึ้น
2. **น้ำหนัก** - BMI และน้ำหนัก
3. **ความดันโลหิต** - ค่าความดัน
4. **ประวัติครอบครัว** - ประวัติโรคเบาหวานในครอบครัว
5. **ไลฟ์สไตล์** - การออกกำลังกาย, สูบบุหรี่, ดื่มแอลกอฮอล์
6. **โรคเรื้อรัง** - โรคประจำตัว

### ระดับความเสี่ยง
- **LOW** (ต่ำ): 0-25 คะแนน
- **MODERATE** (ปานกลาง): 26-50 คะแนน
- **HIGH** (สูง): 51-75 คะแนน
- **VERY_HIGH** (สูงมาก): 76-100 คะแนน

## 📊 ข้อมูลตัวอย่าง

ระบบมาพร้อมกับข้อมูลผู้ป่วย 29 คน จากไฟล์ `เวิร์กบุ๊ก3.csv`:
- **อายุ**: 18-25 ปี
- **เพศ**: ชาย 18 คน, หญิง 11 คน
- **ข้อมูลสุขภาพ**: น้ำหนัก, ส่วนสูง, ความดัน, อุณหภูมิ, อัตราการเต้นหัวใจ
- **ไลฟ์สไตล์**: การออกกำลังกาย, สูบบุหรี่, ดื่มแอลกอฮอล์
- **ประวัติ**: ประวัติครอบครัว, โรคเรื้อรัง, แพ้อาหาร

## 🔧 การพัฒนา

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migration
```bash
# รัน migrations
npm run migrate

# รีเซ็ตฐานข้อมูล
npm run reset-db
```

## 📦 การย้ายฐานข้อมูลไปเครื่องใหม่

### 🔄 **Backup ฐานข้อมูล (เครื่องเก่า)**
```bash
# เริ่มระบบ
start.bat start

# สร้าง backup
docker exec emr_postgres pg_dump -U postgres -d emr_development > emr_backup.sql
```

### 📥 **Restore ฐานข้อมูล (เครื่องใหม่)**
```bash
# เริ่มระบบ
start.bat start

# Restore ข้อมูล
docker exec -i emr_postgres psql -U postgres -d emr_development < emr_backup.sql
```

### 📁 **ไฟล์ที่ต้องคัดลอก**
- `emr_backup.sql` - ไฟล์ backup ฐานข้อมูล
- `เวิร์กบุ๊ก3.csv` - ข้อมูลผู้ป่วย 29 คน

### ✅ **ตรวจสอบการย้าย**
1. เข้า `http://localhost:3000/admin`
2. ตรวจสอบข้อมูลผู้ป่วย 29 คน
3. ทดสอบ AI Diabetes Prediction

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

สำหรับการสนับสนุนหรือคำถาม:
- Email: admin@admin.com
- Documentation: ดูในไฟล์ README นี้

---

**EMR System** - ระบบจัดการเวชระเบียนอิเล็กทรอนิกส์ที่ทันสมัย พร้อมระบบ AI สำหรับการดูแลสุขภาพ