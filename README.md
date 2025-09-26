# EMR System - Electronic Medical Records

**ระบบบริหารจัดการเวชระเบียนอิเล็กทรอนิกส์ที่ครบครัน**

## ภาพรวมระบบ

EMR System เป็นระบบบริหารจัดการเวชระเบียนอิเล็กทรอนิกส์ที่ออกแบบมาสำหรับโรงพยาบาลและสถานพยาบาล ระบบประกอบด้วยฟีเจอร์หลักดังนี้:

- **Patient Management** - ระบบจัดการผู้ป่วย
- **Medical Records** - เวชระเบียนอิเล็กทรอนิกส์
- **Multi-Role System** - ระบบบทบาทหลายระดับ
- **Database Management** - ระบบจัดการฐานข้อมูล
- **Docker Support** - รองรับการใช้งานด้วย Docker

## การติดตั้งและเริ่มใช้งาน

### ข้อกำหนดของระบบ
- **Node.js** >= 18.0.0
- **Docker Desktop** >= 4.0.0
- **Windows 10/11** หรือ **macOS/Linux**

### การติดตั้ง Dependencies

#### 1. ติดตั้ง Node.js
- ดาวน์โหลดจาก: https://nodejs.org/
- เลือกเวอร์ชัน LTS (แนะนำ v18.x หรือ v20.x)
- ติดตั้งตามขั้นตอนปกติ
- รีสตาร์ทคอมพิวเตอร์หลังติดตั้ง
- ตรวจสอบการติดตั้ง: `node --version`

#### 2. ติดตั้ง Docker Desktop
- ดาวน์โหลดจาก: https://www.docker.com/products/docker-desktop
- ติดตั้ง Docker Desktop
- เริ่ม Docker Desktop และรอให้เริ่มทำงานเสร็จ
- ตรวจสอบการติดตั้ง: `docker --version`
- ตรวจสอบ Docker Compose: `docker compose version`

#### 3. ติดตั้ง Dependencies ของโปรเจค
```bash
# ติดตั้ง Frontend dependencies
cd frontend
npm install
cd ..

# ติดตั้ง Backend dependencies
cd backend
npm install
cd ..
```

### การเริ่มใช้งาน
```bash
# โคลนโปรเจก
git clone <repository-url>
cd Project

# เริ่มต้นทันที
start.bat
# เลือกตัวเลือก 1 (START)
```

### การเข้าถึงระบบ
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database Manager (pgAdmin)**: http://localhost:8080

### การตั้งค่า pgAdmin (Database Manager)

#### 1. เข้าสู่ระบบ pgAdmin
- เปิดเบราว์เซอร์ไปที่: http://localhost:8080
- **Email**: admin@admin.com
- **Password**: admin

#### 2. เพิ่มเซิร์ฟเวอร์ฐานข้อมูล
1. คลิกขวาที่ "Servers" ในหน้าซ้าย
2. เลือก "Register" > "Server..."
3. ตั้งค่าดังนี้:
   - **Name**: EMR Database
   - **Host name/address**: emr_postgres
   - **Port**: 5432
   - **Maintenance database**: emr_development
   - **Username**: postgres
   - **Password**: 12345
4. คลิก "Save"

#### 3. การใช้งาน pgAdmin
- ดูข้อมูลในตารางต่างๆ
- รัน SQL queries
- จัดการฐานข้อมูล
- สำรองข้อมูล

### บัญชีทดสอบ
- **Admin**: admin / password123
- **Doctor**: doctor / password123
- **Patient**: patient / password123

## คู่มือการใช้งาน

### การจัดการระบบด้วย start.bat
1. **เริ่มระบบ**: เลือกตัวเลือก 1 (START)
2. **หยุดระบบ**: เลือกตัวเลือก 2 (STOP)
3. **ตรวจสอบสถานะ**: เลือกตัวเลือก 3 (STATUS)
4. **ออกจากโปรแกรม**: เลือกตัวเลือก 4 (END)

### การจัดการระบบด้วย Docker
```bash
# เริ่มระบบ
docker compose up -d

# หยุดระบบ
docker compose down

# หยุดและลบข้อมูล
docker compose down -v

# ดู logs
docker compose logs -f

# ตรวจสอบสถานะ
docker compose ps
```

## สถานะการพัฒนา

### ส่วนที่เสร็จแล้ว
- **Backend System** - API และ Database พร้อมใช้งาน
- **Frontend UI** - Interface ครบถ้วน
- **Authentication** - ระบบล็อกอิน/ลงทะเบียน
- **Database Schema** - โครงสร้างฐานข้อมูลครบถ้วน
- **Docker Support** - รองรับการใช้งานด้วย Docker
- **start.bat** - ไฟล์จัดการระบบสำหรับ Windows

## โครงสร้างโปรเจค

```
Project/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # API Controllers
│   │   ├── database/       # Database connection & schema
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── Dockerfile          # Backend Docker configuration
│   └── package.json
├── frontend/               # Frontend App (Next.js + React)
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Library functions
│   │   └── types/          # TypeScript types
│   ├── Dockerfile          # Frontend Docker configuration
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
├── start.bat              # Windows startup script
└── README.md              # เอกสารหลัก
```

## เทคโนโลยีที่ใช้

### Backend
- **Node.js** + Express.js
- **TypeScript** - Type safety
- **PostgreSQL** - ฐานข้อมูลหลัก
- **JWT Authentication** - ระบบยืนยันตัวตน
- **Docker** - Containerization

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Docker** - Containerization

### Database
- **PostgreSQL** - ฐานข้อมูลหลัก
- **pgAdmin** - Database management
- **Redis** - Caching (optional)

## การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไป branch
5. สร้าง Pull Request

## License

MIT License

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** January 2025
