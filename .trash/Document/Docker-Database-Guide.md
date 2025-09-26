# วิธีการดูข้อมูลใน Database ใน Docker

## ภาพรวม
โปรเจคนี้ใช้ PostgreSQL database ที่รันใน Docker container ชื่อ `emr_postgres` พร้อมกับ pgAdmin GUI tool สำหรับการจัดการฐานข้อมูล

## ข้อมูลการเชื่อมต่อ Database
- **Host:** `localhost` (จากภายนอก) หรือ `emr_postgres` (จากภายใน Docker network)
- **Port:** `5432`
- **Database:** `emr_development`
- **Username:** `postgres`
- **Password:** `12345`

## วิธีที่ 1: ใช้ pgAdmin (GUI Tool) - แนะนำ

### การติดตั้งและเริ่มต้น
```bash
# เริ่ม Docker containers
docker-compose up -d

# ติดตั้ง pgAdmin
docker run --name pgadmin -p 8080:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  --network project_emr_network \
  -d dpage/pgadmin4
```

### การเข้าใช้งาน pgAdmin
1. เปิดเว็บเบราว์เซอร์
2. ไปที่: **http://localhost:8080**
3. **Email:** `admin@admin.com`
4. **Password:** `admin`

### การเชื่อมต่อกับ Database
1. **คลิกขวาที่ "Servers"** → **"Create"** → **"Server..."**

2. **ในแท็บ "General":**
   - **Name:** `EMR Database`

3. **ในแท็บ "Connection":**
   - **Host name/address:** `emr_postgres`
   - **Port:** `5432`
   - **Maintenance database:** `emr_development`
   - **Username:** `postgres`
   - **Password:** `12345`

4. **คลิก "Save"**

### การดูข้อมูลใน Database
1. **ขยาย:** `Servers` → `EMR Database` → `Databases` → `emr_development` → `Schemas` → `public` → `Tables`
2. **คลิกขวาที่ table ที่ต้องการ** → **"View/Edit Data"** → **"All Rows"**

### การรัน SQL Query
1. **คลิกที่ "Tools"** → **"Query Tool"**
2. **พิมพ์ SQL query** เช่น:
   ```sql
   -- ดูข้อมูลผู้ใช้
   SELECT * FROM users LIMIT 10;
   
   -- ดูข้อมูลผู้ป่วย
   SELECT * FROM patients;
   
   -- นับจำนวนนัดหมาย
   SELECT COUNT(*) FROM appointments;
   
   -- ดูโครงสร้าง table
   \d table_name
   ```
3. **กด F5 หรือคลิก "Execute"**

## วิธีที่ 2: Command Line Interface

### เข้าไปใน PostgreSQL container
```bash
docker exec -it emr_postgres psql -U postgres -d emr_development
```

### คำสั่งพื้นฐานใน PostgreSQL
```sql
-- ดูรายการ tables ทั้งหมด
\dt

-- ดูรายการ databases
\l

-- ดูโครงสร้างของ table
\d table_name

-- ดูข้อมูลใน table
SELECT * FROM table_name LIMIT 10;

-- ดูข้อมูลผู้ใช้
SELECT * FROM users;

-- ดูข้อมูลผู้ป่วย
SELECT * FROM patients;

-- ดูข้อมูลนัดหมาย
SELECT * FROM appointments;

-- ออกจาก psql
\q
```

## วิธีที่ 3: Database Client Tools อื่นๆ

### DBeaver (ฟรี)
1. ดาวน์โหลดและติดตั้ง DBeaver
2. สร้างการเชื่อมต่อใหม่:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `emr_development`
   - **Username:** `postgres`
   - **Password:** `12345`

### DataGrip (JetBrains)
1. เปิด DataGrip
2. สร้าง Data Source ใหม่:
   - **Database:** PostgreSQL
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `emr_development`
   - **User:** `postgres`
   - **Password:** `12345`

### TablePlus (Mac/Windows)
1. เปิด TablePlus
2. สร้างการเชื่อมต่อใหม่:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `emr_development`
   - **Username:** `postgres`
   - **Password:** `12345`

## การจัดการ Docker Containers

### ดูสถานะ containers
```bash
docker ps
```

### เริ่ม containers
```bash
docker-compose up -d
```

### หยุด containers
```bash
docker-compose down
```

### ดู logs
```bash
# ดู logs ของ database
docker logs emr_postgres

# ดู logs ของ backend
docker logs emr_backend

# ดู logs แบบ real-time
docker logs -f emr_postgres
```

### เข้าไปใน container
```bash
# เข้าไปใน PostgreSQL container
docker exec -it emr_postgres bash

# เข้าไปใน backend container
docker exec -it emr_backend bash
```

## SQL Queries ที่มีประโยชน์

### ดูข้อมูลพื้นฐาน
```sql
-- ดูข้อมูลผู้ใช้ทั้งหมด
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at DESC;

-- ดูข้อมูลผู้ป่วย
SELECT id, first_name, last_name, phone, email, created_at 
FROM patients 
ORDER BY created_at DESC;

-- ดูข้อมูลแพทย์
SELECT id, first_name, last_name, specialization, license_number 
FROM doctors 
ORDER BY first_name;

-- ดูข้อมูลนัดหมาย
SELECT a.id, p.first_name, p.last_name, d.first_name as doctor_name, 
       a.appointment_date, a.status 
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.appointment_date DESC;
```

### ดูสถิติ
```sql
-- นับจำนวนผู้ใช้แต่ละ role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- นับจำนวนนัดหมายแต่ละสถานะ
SELECT status, COUNT(*) as count 
FROM appointments 
GROUP BY status;

-- ดูจำนวนผู้ป่วยที่ลงทะเบียนในแต่ละเดือน
SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as new_patients
FROM patients 
GROUP BY month 
ORDER BY month DESC;
```

### ดูโครงสร้าง Database
```sql
-- ดูรายการ tables ทั้งหมด
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- ดู columns ของ table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

## การแก้ไขปัญหา

### Database ไม่สามารถเชื่อมต่อได้
```bash
# ตรวจสอบว่า container รันอยู่หรือไม่
docker ps | grep postgres

# เริ่ม container ใหม่
docker-compose restart postgres

# ดู logs เพื่อหาสาเหตุ
docker logs emr_postgres
```

### pgAdmin ไม่สามารถเชื่อมต่อได้
1. ตรวจสอบว่า pgAdmin container รันอยู่
2. ตรวจสอบ network connection
3. ลบและสร้าง pgAdmin container ใหม่:
   ```bash
   docker rm -f pgadmin
   docker run --name pgadmin -p 8080:80 \
     -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
     -e PGADMIN_DEFAULT_PASSWORD=admin \
     --network project_emr_network \
     -d dpage/pgadmin4
   ```

### ลืมรหัสผ่าน
- **pgAdmin:** `admin@admin.com` / `admin`
- **PostgreSQL:** `postgres` / `12345`

## หมายเหตุ
- ข้อมูลการเชื่อมต่อนี้ใช้สำหรับ development environment เท่านั้น
- ใน production ควรใช้รหัสผ่านที่แข็งแกร่งกว่า
- ควรทำการ backup ข้อมูลเป็นประจำ
- ใช้ SSL connection ใน production environment
