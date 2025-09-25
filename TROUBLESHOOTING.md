# 🆘 การแก้ไขปัญหา - EMR System

## 🐳 ปัญหา Docker

### ปัญหา: ระบบค้างที่ "Checking Docker installation..."

**สาเหตุ:** Docker ยังไม่ได้ติดตั้งหรือไม่ได้เริ่มต้น

**วิธีแก้ไข:**

#### Windows
1. **ตรวจสอบ Docker Desktop:**
   ```cmd
   docker --version
   ```

2. **หากไม่ได้ติดตั้ง:**
   - ดาวน์โหลดจาก: https://www.docker.com/products/docker-desktop
   - ติดตั้ง Docker Desktop
   - รีสตาร์ทคอมพิวเตอร์

3. **หากติดตั้งแล้วแต่ไม่ทำงาน:**
   - เปิด Docker Desktop จาก Start Menu
   - รอให้ Docker เริ่มต้น (whale icon ใน system tray)
   - ทดสอบ: `docker run hello-world`

#### Mac/Linux
1. **ตรวจสอบ Docker:**
   ```bash
   docker --version
   ```

2. **หากไม่ได้ติดตั้ง:**
   ```bash
   # macOS
   brew install --cask docker
   
   # Linux
   sudo apt update
   sudo apt install docker.io docker-compose
   ```

3. **หากติดตั้งแล้วแต่ไม่ทำงาน:**
   ```bash
   # Linux
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # macOS
   # เปิด Docker Desktop จาก Applications
   ```

### ปัญหา: "Docker is installed but not running"

**วิธีแก้ไข:**

#### Windows
1. เปิด Docker Desktop จาก Start Menu
2. รอให้ Docker เริ่มต้น (whale icon ควรจะ stable)
3. ทดสอบ: `docker info`

#### Mac/Linux
1. **Linux:**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **macOS:**
   - เปิด Docker Desktop จาก Applications
   - รอให้ Docker เริ่มต้น

---

## 🚀 ปัญหาการเริ่มต้นระบบ

### ปัญหา: "Port 3000 is already in use"

**วิธีแก้ไข:**
```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# ฆ่า process ที่ใช้ port
sudo kill -9 <PID>
```

### ปัญหา: "Port 5432 is already in use" (PostgreSQL)

**วิธีแก้ไข:**
```bash
# ตรวจสอบ PostgreSQL
sudo systemctl status postgresql

# หยุด PostgreSQL
sudo systemctl stop postgresql

# หรือเปลี่ยน port ใน docker-compose.simple.yml
```

### ปัญหา: "Port 6379 is already in use" (Redis)

**วิธีแก้ไข:**
```bash
# ตรวจสอบ Redis
sudo systemctl status redis

# หยุด Redis
sudo systemctl stop redis

# หรือเปลี่ยน port ใน docker-compose.simple.yml
```

---

## 🗄️ ปัญหาฐานข้อมูล

### ปัญหา: "Database connection failed"

**วิธีแก้ไข:**

1. **ตรวจสอบ PostgreSQL container:**
   ```bash
   docker ps
   docker logs emr_postgres
   ```

2. **เริ่มต้นฐานข้อมูลใหม่:**
   ```bash
   docker-compose -f docker-compose.simple.yml down -v
   docker-compose -f docker-compose.simple.yml up postgres -d
   ```

3. **รอให้ฐานข้อมูลพร้อม:**
   ```bash
   docker exec emr_postgres pg_isready -U postgres
   ```

### ปัญหา: "Migration failed"

**วิธีแก้ไข:**
```bash
# ลบข้อมูลและเริ่มใหม่
docker-compose -f docker-compose.simple.yml down -v
docker-compose -f docker-compose.simple.yml up --build
```

---

## 🔧 ปัญหา Docker Compose

### ปัญหา: "docker-compose: command not found"

**วิธีแก้ไข:**

#### Windows
- Docker Desktop ควรมี Docker Compose รวมอยู่แล้ว
- หากไม่มี ให้อัปเดต Docker Desktop

#### Mac/Linux
```bash
# ติดตั้ง Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### ปัญหา: "Build failed"

**วิธีแก้ไข:**
```bash
# ลบ images เก่า
docker-compose -f docker-compose.simple.yml down --rmi all

# Build ใหม่
docker-compose -f docker-compose.simple.yml build --no-cache
```

---

## 🌐 ปัญหาการเข้าถึงเว็บไซต์

### ปัญหา: ไม่สามารถเข้าถึง http://localhost:3000

**วิธีแก้ไข:**

1. **ตรวจสอบ containers:**
   ```bash
   docker ps
   ```

2. **ตรวจสอบ logs:**
   ```bash
   docker logs emr_frontend
   docker logs emr_backend
   ```

3. **เริ่มต้นใหม่:**
   ```bash
   docker-compose -f docker-compose.simple.yml restart
   ```

### ปัญหา: "Connection refused"

**วิธีแก้ไข:**
```bash
# ตรวจสอบ firewall
sudo ufw status

# เปิด port (หากจำเป็น)
sudo ufw allow 3000
sudo ufw allow 3001
```

---

## 🔄 การรีเซ็ตระบบ

### รีเซ็ตทั้งหมด
```bash
# หยุดและลบทุกอย่าง
docker-compose -f docker-compose.simple.yml down -v --rmi all

# ลบ volumes
docker volume prune -f

# ลบ networks
docker network prune -f

# เริ่มต้นใหม่
docker-compose -f docker-compose.simple.yml up --build
```

### รีเซ็ตเฉพาะฐานข้อมูล
```bash
# หยุดระบบ
docker-compose -f docker-compose.simple.yml down

# ลบฐานข้อมูล
docker volume rm emr_postgres_data

# เริ่มต้นใหม่
docker-compose -f docker-compose.simple.yml up --build
```

---

## 📊 การตรวจสอบสถานะ

### ตรวจสอบ containers
```bash
docker ps
docker ps -a
```

### ตรวจสอบ logs
```bash
# ดู logs ทั้งหมด
docker-compose -f docker-compose.simple.yml logs

# ดู logs เฉพาะ service
docker-compose -f docker-compose.simple.yml logs backend
docker-compose -f docker-compose.simple.yml logs frontend
docker-compose -f docker-compose.simple.yml logs postgres
```

### ตรวจสอบ resources
```bash
# ดูการใช้ memory และ CPU
docker stats

# ดู disk usage
docker system df
```

---

## 🆘 การขอความช่วยเหลือ

หากยังแก้ไขปัญหาไม่ได้:

1. **รวบรวมข้อมูล:**
   ```bash
   # ระบบปฏิบัติการ
   uname -a
   
   # Docker version
   docker --version
   docker-compose --version
   
   # Container status
   docker ps -a
   
   # Logs
   docker-compose -f docker-compose.simple.yml logs
   ```

2. **ติดต่อทีมพัฒนา** พร้อมข้อมูลข้างต้น

---

## 🎯 เคล็ดลับ

### เพิ่มความเร็วในการเริ่มต้น
```bash
# ใช้ cache สำหรับ build
docker-compose -f docker-compose.simple.yml build --parallel

# เริ่มต้นเฉพาะ services ที่จำเป็น
docker-compose -f docker-compose.simple.yml up postgres redis -d
sleep 30
docker-compose -f docker-compose.simple.yml up backend frontend
```

### ลดการใช้ memory
```bash
# จำกัด memory สำหรับ containers
# แก้ไข docker-compose.simple.yml
deploy:
  resources:
    limits:
      memory: 512M
```

### เปิดใช้งาน auto-restart
```bash
# แก้ไข docker-compose.simple.yml
restart: unless-stopped
```

---

**หมายเหตุ**: หากพบปัญหาที่ไม่ได้ระบุไว้ในคู่มือนี้ กรุณาติดต่อทีมพัฒนา
