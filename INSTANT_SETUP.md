# ⚡ Instant Setup - ไม่ต้องตั้งค่าใหม่!

## 🚀 เริ่มต้นใช้งานใน 1 คลิก

### สำหรับ Windows
```bash
# ดับเบิลคลิกไฟล์ start.bat
start.bat
```

### สำหรับ Mac/Linux
```bash
# ให้สิทธิ์และรัน
chmod +x start.sh
./start.sh
```

### หรือใช้คำสั่งเดียว
```bash
# Windows
docker-compose -f docker-compose.simple.yml up --build

# Mac/Linux
docker-compose -f docker-compose.simple.yml up --build
```

---

## ✨ สิ่งที่ระบบจะทำอัตโนมัติ

### 🔧 การตั้งค่าอัตโนมัติ
- ✅ ติดตั้ง Dependencies ทั้งหมด
- ✅ ตั้งค่าฐานข้อมูล PostgreSQL
- ✅ ตั้งค่า Redis Cache
- ✅ รัน Database Migrations
- ✅ สร้างข้อมูลตัวอย่าง
- ✅ เริ่มต้น Backend และ Frontend

### 🎯 ไม่ต้องตั้งค่าใดๆ
- ❌ ไม่ต้องติดตั้ง Node.js
- ❌ ไม่ต้องติดตั้ง PostgreSQL
- ❌ ไม่ต้องติดตั้ง Redis
- ❌ ไม่ต้องตั้งค่า Environment Variables
- ❌ ไม่ต้องรัน Migrations
- ❌ ไม่ต้องสร้าง Admin User

---

## 🌐 เข้าถึงระบบ

หลังจากรันคำสั่งแล้ว (รอประมาณ 2-3 นาที):

- **🌐 เว็บไซต์**: http://localhost:3000
- **🔧 API**: http://localhost:3001
- **📚 API Docs**: http://localhost:3001/api-docs

---

## 🔑 บัญชีทดสอบที่พร้อมใช้งาน

| บทบาท | อีเมล | รหัสผ่าน |
|--------|-------|----------|
| 👨‍💼 Admin | admin@example.com | admin123 |
| 👨‍⚕️ Doctor | doctor@example.com | doctor123 |
| 👩‍⚕️ Nurse | nurse@example.com | nurse123 |
| 🏥 Patient | patient@example.com | patient123 |

---

## 🛠️ การหยุดระบบ

### Windows
- กด `Ctrl + C` ใน Command Prompt
- หรือปิด Command Prompt

### Mac/Linux
- กด `Ctrl + C` ใน Terminal

### หรือใช้คำสั่ง
```bash
docker-compose -f docker-compose.simple.yml down
```

---

## 🔄 การเริ่มต้นใหม่

```bash
# หยุดระบบ
docker-compose -f docker-compose.simple.yml down

# เริ่มต้นใหม่
docker-compose -f docker-compose.simple.yml up
```

---

## 🗑️ การลบข้อมูลทั้งหมด

```bash
# หยุดและลบข้อมูลทั้งหมด
docker-compose -f docker-compose.simple.yml down -v

# ลบ images
docker-compose -f docker-compose.simple.yml down --rmi all
```

---

## 🆘 การแก้ไขปัญหา

### Docker ไม่ทำงาน
```bash
# ตรวจสอบ Docker
docker --version
docker-compose --version

# เริ่มต้น Docker Desktop (Windows/Mac)
# หรือ sudo systemctl start docker (Linux)
```

### Port ถูกใช้งาน
```bash
# ตรวจสอบ port
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# ฆ่า process
sudo kill -9 <PID>
```

### ฐานข้อมูลมีปัญหา
```bash
# ลบข้อมูลและเริ่มใหม่
docker-compose -f docker-compose.simple.yml down -v
docker-compose -f docker-compose.simple.yml up --build
```

---

## 📱 ระบบที่รองรับ

### ✅ Windows
- Windows 10/11
- Docker Desktop

### ✅ macOS
- macOS 10.15+
- Docker Desktop

### ✅ Linux
- Ubuntu 18.04+
- CentOS 7+
- Docker Engine

---

## 🎯 ข้อดีของระบบนี้

1. **ไม่ต้องติดตั้งอะไร** - แค่ Docker เท่านั้น
2. **ไม่ต้องตั้งค่า** - ระบบตั้งค่าทุกอย่างอัตโนมัติ
3. **ไม่ต้องรอ** - เริ่มใช้งานได้ทันที
4. **ไม่ต้องจำ** - ไม่ต้องจำคำสั่งหรือการตั้งค่า
5. **ไม่ต้องกังวล** - ระบบจัดการทุกอย่างให้

---

## 🚀 สำหรับ Production

หากต้องการใช้ใน Production ให้ดู:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

**หมายเหตุ**: ระบบนี้เหมาะสำหรับการทดสอบและพัฒนาเท่านั้น สำหรับ Production ควรใช้การตั้งค่าที่ปลอดภัยกว่า
