# EMR Patient Portal System

**Electronic Medical Records System with AI Risk Assessment and Consent Engine**

## ภาพรวมระบบ

EMR Patient Portal System เป็นระบบบริหารจัดการเวชระเบียนอิเล็กทรอนิกส์ที่ออกแบบมาสำหรับโรงพยาบาลและสถานพยาบาล ระบบประกอบด้วยฟีเจอร์หลักดังนี้:

- **Patient Management** - ระบบจัดการผู้ป่วย
- **Medical Records** - เวชระเบียนอิเล็กทรอนิกส์
- **AI Risk Assessment** - ระบบประเมินความเสี่ยงด้วย AI
- **Consent Engine** - ระบบจัดการยินยอมข้อมูล
- **Multi-Role System** - ระบบบทบาทหลายระดับ

## การติดตั้งและเริ่มใช้งาน

### ข้อกำหนดของระบบ
- Node.js 18+
- PostgreSQL 12+
- npm หรือ yarn

### 1. ติดตั้ง Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. ตั้งค่า Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/emr_db
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. เริ่มต้นระบบ

**เริ่มต้น Backend:**
```bash
cd backend
npm run dev
```
Server จะทำงานที่: http://localhost:3001

**เริ่มต้น Frontend:**
```bash
cd frontend
npm run dev
```
Application จะทำงานที่: http://localhost:3000

## สถานะการพัฒนา

### ส่วนที่เสร็จแล้ว
- **Backend System** (100%) - API และ Database พร้อมใช้งาน
- **Frontend UI** (95%) - Interface ครบถ้วน
- **Authentication** (100%) - ระบบล็อกอิน/ลงทะเบียน
- **Database Schema** (100%) - โครงสร้างฐานข้อมูลครบถ้วน
- **TypeScript Compliance** (100%) - ไม่มี TypeScript errors

### ส่วนที่ยังไม่เสร็จ
- **Frontend-Backend Integration** (0%) - ยังไม่ได้เชื่อมต่อ
- **AI Risk Assessment** (30%) - ยังไม่มี logic การคำนวณ
- **Consent Engine** (30%) - ยังไม่มี smart contract logic

## โครงสร้างโปรเจค

```
emr-system/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # API Controllers
│   │   ├── database/       # Database connection & schema
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── frontend/               # Frontend App (Next.js + React)
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Library functions
│   │   └── types/          # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - ล็อกอิน
- `POST /api/auth/register` - ลงทะเบียน
- `POST /api/auth/refresh` - รีเฟรชโทเคน

### Patient Management
- `GET /api/patients` - ดึงรายชื่อผู้ป่วย
- `POST /api/patients` - สร้างผู้ป่วยใหม่
- `GET /api/patients/:id` - ดึงข้อมูลผู้ป่วย
- `PUT /api/patients/:id` - อัพเดทข้อมูลผู้ป่วย

### Medical Records
- `GET /api/medical/visits` - ดึงประวัติการรักษา
- `POST /api/medical/visits` - บันทึกการรักษา
- `POST /api/medical/vital-signs` - บันทึกสัญญาณชีพ
- `POST /api/medical/lab-orders` - สั่งแล็บ
- `POST /api/medical/prescriptions` - สั่งยา

## ฟีเจอร์หลัก

### 1. Patient Management
- ลงทะเบียนผู้ป่วยใหม่
- สร้าง Hospital Number อัตโนมัติ
- จัดการข้อมูลผู้ป่วย
- ค้นหาและกรองข้อมูล

### 2. Medical Records
- บันทึกประวัติการรักษา
- บันทึกสัญญาณชีพ (คำนวณ BMI อัตโนมัติ)
- สั่งการตรวจทางห้องปฏิบัติการ
- สั่งยาและจัดการใบสั่งยา

### 3. AI Risk Assessment
- ประเมินความเสี่ยงเบาหวาน
- วิเคราะห์ข้อมูลทางการแพทย์
- สร้างรายงานความเสี่ยง
- ให้คำแนะนำตามระดับความเสี่ยง

### 4. Consent Engine
- จัดการการยินยอมข้อมูล
- ควบคุมการเข้าถึงข้อมูล
- ระบบ audit trail
- API สำหรับหน่วยงานภายนอก

## เทคโนโลยีที่ใช้

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL
- JWT Authentication
- Zod Validation

### Frontend
- Next.js 15
- React + TypeScript
- Tailwind CSS
- Axios
- React Hook Form

### Database
- PostgreSQL
- 56 Tables
- 75+ Relationships
- Complete indexing

## เอกสารเพิ่มเติม

- [System Documentation](./SYSTEM_DOCUMENTATION.md) - คู่มือระบบละเอียด
- [Todo List](./TODO_LIST.md) - รายการสิ่งที่ต้องทำ
- [Issues Not Working](./ISSUES_NOT_WORKING.md) - ปัญหาที่ยังไม่ได้แก้ไข
- [Backend Roadmap](./BACKEND_DEVELOPMENT_ROADMAP.md) - แผนพัฒนา Backend
- [Project Structure](./PROJECT_STRUCTURE.md) - โครงสร้างไฟล์และโฟลเดอร์

## การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไป branch
5. สร้าง Pull Request

## License

MIT License - ดูไฟล์ LICENSE สำหรับรายละเอียด

## ติดต่อ

สำหรับคำถามหรือการสนับสนุน โปรดติดต่อทีมพัฒนา

---

**Version:** 1.0.0  
**Status:** Development  
**Last Updated:** January 2025
