# 🚀 Quick Start Guide - EMR System

## ⚡ ติดตั้งเร็วๆ ใน 5 นาที

### ข้อกำหนด
- Node.js 18+
- Docker & Docker Compose
- Git

### ขั้นตอน

#### 1. โคลนโปรเจก
```bash
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr
```

#### 2. เริ่มต้นด้วย Docker
```bash
# เริ่มต้นฐานข้อมูล
docker-compose up postgres redis -d

# รอ 30 วินาที แล้วเริ่มต้นแอป
docker-compose up backend frontend
```

#### 3. เข้าถึงระบบ
- **เว็บไซต์**: http://localhost:3000
- **API**: http://localhost:3001

### บัญชีทดสอบ
- **Admin**: admin@example.com / admin123
- **Doctor**: doctor@example.com / doctor123
- **Patient**: patient@example.com / patient123

---

## 🔧 การตั้งค่าเพิ่มเติม

### สร้าง Admin User
```bash
cd backend
npm install
npm run db:cli
# เลือก "Create Admin User"
```

### ตั้งค่า Email
แก้ไขไฟล์ `backend/.env`:
```bash
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 📚 เอกสารเพิ่มเติม
- [คู่มือการติดตั้งแบบละเอียด](SETUP_GUIDE.md)
- [API Documentation](http://localhost:3001/api-docs)

---

## 🆘 ปัญหาที่พบบ่อย

### Port ถูกใช้งาน
```bash
# ตรวจสอบ port
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# ฆ่า process
sudo kill -9 <PID>
```

### Docker มีปัญหา
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### ฐานข้อมูลเชื่อมต่อไม่ได้
```bash
# รอให้ฐานข้อมูลพร้อม
sleep 30
docker-compose up backend frontend
```
