# Admin Management Scripts

สคริปต์สำหรับจัดการ admin users ในระบบ HealthChain EMR

## 📁 ไฟล์สคริปต์

### 1. `create-admin.js`
สร้าง admin user ใหม่

**การใช้งาน:**
```bash
cd backend
node scripts/create-admin.js
```

**ข้อมูลเริ่มต้น:**
- Username: `admin`
- Email: `admin@healthchain.co.th`
- Password: `AdminSecure123!@#`
- Role: `admin`

### 2. `reset-admin-password.js`
รีเซ็ต password ของ admin user

**การใช้งาน:**
```bash
cd backend
node scripts/reset-admin-password.js
```

### 3. `delete-admin.js`
ลบ admin user

**การใช้งาน:**
```bash
cd backend
node scripts/delete-admin.js
```

## 🔐 ความปลอดภัย

### ⚠️ ข้อควรระวัง

1. **สภาพแวดล้อมที่ปลอดภัย**
   - สคริปต์เหล่านี้ควรรันในสภาพแวดล้อมที่ปลอดภัยเท่านั้น
   - หลีกเลี่ยงการรันใน production environment

2. **การจัดการสคริปต์**
   - ลบสคริปต์เหล่านี้หลังจากใช้งานเสร็จ
   - เก็บสคริปต์ไว้ในที่ปลอดภัย
   - จำกัดสิทธิ์การเข้าถึงไฟล์สคริปต์

3. **การจัดการ Password**
   - ใช้ strong password ที่มีอย่างน้อย 12 ตัวอักษร
   - เปลี่ยน password ทันทีหลังจาก login ครั้งแรก
   - เก็บ credentials ไว้อย่างปลอดภัย

4. **การตรวจสอบ Logs**
   - ตรวจสอบ logs หลังจากใช้งานสคริปต์
   - ตรวจสอบ audit trails
   - ตรวจสอบการเข้าถึงระบบ

### 🛡️ มาตรการความปลอดภัย

1. **Password Hashing**
   - ใช้ bcrypt ด้วย salt rounds = 12
   - Password ถูก hash ก่อนเก็บในฐานข้อมูล

2. **Audit Logging**
   - ทุกการดำเนินการถูกบันทึกใน `admin_activity_logs`
   - บันทึก IP address และ user agent
   - บันทึก timestamp และ details

3. **Validation**
   - ตรวจสอบ password strength
   - ตรวจสอบ environment security
   - ตรวจสอบการมีอยู่ของ admin user

4. **Error Handling**
   - จัดการ error อย่างเหมาะสม
   - ไม่เปิดเผยข้อมูลที่ละเอียดอ่อน
   - Log error สำหรับการตรวจสอบ

## 🚨 ระดับความปลอดภัย

### 🔴 ความเสี่ยงสูง (High Risk)

1. **การเข้าถึงฐานข้อมูลโดยตรง**
   - สคริปต์เข้าถึงฐานข้อมูลโดยตรง
   - ใช้ hardcoded database credentials
   - ไม่มีการ authentication เพิ่มเติม

2. **การสร้าง Admin User**
   - สามารถสร้าง admin user ได้โดยไม่ต้องผ่าน authentication
   - ไม่มีการตรวจสอบสิทธิ์การสร้าง admin

3. **การลบ Admin User**
   - สามารถลบ admin user ได้โดยไม่ต้องผ่าน authentication
   - อาจทำให้ระบบไม่สามารถเข้าถึงได้

### 🟡 ความเสี่ยงปานกลาง (Medium Risk)

1. **การ Reset Password**
   - สามารถ reset password ได้โดยไม่ต้องผ่าน authentication
   - ไม่มีการตรวจสอบสิทธิ์การ reset password

2. **การ Logging**
   - Logs อาจถูกแก้ไขหรือลบได้
   - ไม่มีการ encrypt logs

### 🟢 ความปลอดภัยที่ดี (Good Security)

1. **Password Hashing**
   - ใช้ bcrypt ด้วย salt rounds สูง
   - Password ไม่ถูกเก็บในรูปแบบ plain text

2. **Input Validation**
   - ตรวจสอบ password strength
   - ตรวจสอบการมีอยู่ของ user
   - ตรวจสอบ environment

3. **Audit Trail**
   - บันทึกทุกการดำเนินการ
   - บันทึก metadata ที่สำคัญ

## 📋 คำแนะนำการใช้งาน

### ก่อนใช้งาน

1. **ตรวจสอบ Environment**
   ```bash
   # ตรวจสอบว่าไม่ใช่ production
   echo $NODE_ENV
   
   # ตรวจสอบ database connection
   psql -h localhost -U postgres -d postgres
   ```

2. **สำรองข้อมูล**
   ```bash
   # สำรองฐานข้อมูล
   pg_dump -h localhost -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **ตรวจสอบสิทธิ์**
   ```bash
   # ตรวจสอบสิทธิ์ไฟล์
   ls -la scripts/
   ```

### หลังใช้งาน

1. **ลบสคริปต์**
   ```bash
   rm scripts/create-admin.js
   rm scripts/reset-admin-password.js
   rm scripts/delete-admin.js
   ```

2. **ตรวจสอบ Logs**
   ```bash
   # ตรวจสอบ admin activity logs
   psql -h localhost -U postgres -d postgres -c "SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 10;"
   ```

3. **ตรวจสอบการเข้าถึง**
   ```bash
   # ตรวจสอบ admin users
   psql -h localhost -U postgres -d postgres -c "SELECT username, email, created_at FROM users WHERE role = 'admin';"
   ```

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Database Connection Error**
   - ตรวจสอบ database credentials
   - ตรวจสอบ database service
   - ตรวจสอบ network connection

2. **Permission Denied**
   - ตรวจสอบสิทธิ์ไฟล์
   - ตรวจสอบสิทธิ์ database user
   - ตรวจสอบ firewall settings

3. **Admin Already Exists**
   - ใช้ `reset-admin-password.js` แทน
   - ตรวจสอบ existing admin users
   - ใช้ `delete-admin.js` เพื่อลบ admin เก่า

## 📞 การติดต่อ

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา

---

**⚠️ คำเตือน: สคริปต์เหล่านี้มีอำนาจสูงในการจัดการระบบ กรุณาใช้อย่างระมัดระวังและในสภาพแวดล้อมที่ปลอดภัยเท่านั้น**


_______________________________________________________________________________________________________________________________________


# Interactive Admin Setup Scripts

สคริปต์แบบ interactive สำหรับสร้าง admin user ในระบบ HealthChain EMR

## 📁 ไฟล์สคริปต์

### 1. `interactive-admin-setup.js` - Interactive Command Line
สคริปต์แบบ command line ที่ให้ผู้ใช้กรอกข้อมูลทีละขั้นตอน

**การใช้งาน:**
```bash
cd backend/scripts
node interactive-admin-setup.js
```

**คุณสมบัติ:**
- ✅ กรอกข้อมูลทีละขั้นตอน
- ✅ ตรวจสอบ password strength
- ✅ ตรวจสอบ username และ email ซ้ำ
- ✅ ซ่อน password ขณะพิมพ์
- ✅ แสดงสรุปข้อมูลก่อนสร้าง
- ✅ บันทึก audit log

### 2. `gui-admin-setup.js` - GUI-style Command Line
สคริปต์แบบ GUI ที่มีเมนูและหน้าจอสวยงาม

**การใช้งาน:**
```bash
cd backend/scripts
node gui-admin-setup.js
```

**คุณสมบัติ:**
- ✅ เมนูหลักแบบ GUI
- ✅ สร้าง admin user ใหม่
- ✅ แสดงรายการ admin users
- ✅ รีเซ็ต password
- ✅ ลบ admin user
- ✅ Progress bar และ animations
- ✅ สีสันและ icons

### 3. `web-admin-setup.js` - Web Interface
สคริปต์แบบ web interface ที่ใช้ browser

**การใช้งาน:**
```bash
cd backend/scripts
node web-admin-setup.js
```

**คุณสมบัติ:**
- ✅ Web interface สวยงาม
- ✅ Responsive design
- ✅ Real-time validation
- ✅ Loading animations
- ✅ Success/error messages
- ✅ ใช้งานผ่าน browser

## 🔐 ความปลอดภัย

### ⚠️ ข้อควรระวัง

1. **สภาพแวดล้อมที่ปลอดภัย**
   - สคริปต์เหล่านี้ควรรันในสภาพแวดล้อมที่ปลอดภัยเท่านั้น
   - หลีกเลี่ยงการรันใน production environment
   - ใช้ใน network ที่ปลอดภัย

2. **การจัดการสคริปต์**
   - ลบสคริปต์เหล่านี้หลังจากใช้งานเสร็จ
   - เก็บสคริปต์ไว้ในที่ปลอดภัย
   - จำกัดสิทธิ์การเข้าถึงไฟล์สคริปต์

3. **การจัดการ Password**
   - ใช้ strong password ที่มีอย่างน้อย 8 ตัวอักษร
   - เปลี่ยน password ทันทีหลังจาก login ครั้งแรก
   - เก็บ credentials ไว้อย่างปลอดภัย

4. **การตรวจสอบ Logs**
   - ตรวจสอบ logs หลังจากใช้งานสคริปต์
   - ตรวจสอบ audit trails
   - ตรวจสอบการเข้าถึงระบบ

### 🛡️ มาตรการความปลอดภัย

1. **Password Validation**
   - ตรวจสอบความยาวขั้นต่ำ 8 ตัวอักษร
   - ต้องมีตัวพิมพ์ใหญ่
   - ต้องมีตัวพิมพ์เล็ก
   - ต้องมีตัวเลข
   - ต้องมีอักขระพิเศษ

2. **Input Validation**
   - ตรวจสอบ username (3-20 ตัวอักษร)
   - ตรวจสอบ email format
   - ตรวจสอบข้อมูลซ้ำ
   - ตรวจสอบ required fields

3. **Audit Logging**
   - บันทึกทุกการดำเนินการ
   - บันทึก IP address และ user agent
   - บันทึก timestamp และ details
   - บันทึกข้อมูลผู้สร้าง admin

4. **Error Handling**
   - จัดการ error อย่างเหมาะสม
   - ไม่เปิดเผยข้อมูลที่ละเอียดอ่อน
   - Log error สำหรับการตรวจสอบ

## 📋 วิธีการใช้งาน

### Interactive Command Line Script

```bash
# 1. ไปที่โฟลเดอร์ scripts
cd backend/scripts

# 2. รันสคริปต์
node interactive-admin-setup.js

# 3. กรอกข้อมูลตามที่ระบบถาม
# - Username
# - Email
# - First Name
# - Last Name
# - Password
# - Phone (optional)
# - Department (optional)

# 4. ยืนยันข้อมูล
# 5. รอการสร้าง admin user
```

### GUI-style Command Line Script

```bash
# 1. ไปที่โฟลเดอร์ scripts
cd backend/scripts

# 2. รันสคริปต์
node gui-admin-setup.js

# 3. เลือกเมนูที่ต้องการ
# 1. Create New Admin User
# 2. List Existing Admin Users
# 3. Reset Admin Password
# 4. Delete Admin User
# 5. Exit

# 4. กรอกข้อมูลตามที่ระบบถาม
# 5. รอการดำเนินการ
```

### Web Interface Script

```bash
# 1. ไปที่โฟลเดอร์ scripts
cd backend/scripts

# 2. รันสคริปต์
node web-admin-setup.js

# 3. เปิด browser ไปที่
# http://localhost:3002

# 4. กรอกข้อมูลในฟอร์ม
# 5. กดปุ่ม "Create Admin User"
# 6. รอผลลัพธ์
```

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Database Connection Error**
   - ตรวจสอบ database credentials
   - ตรวจสอบ database service
   - ตรวจสอบ network connection

2. **Permission Denied**
   - ตรวจสอบสิทธิ์ไฟล์
   - ตรวจสอบสิทธิ์ database user
   - ตรวจสอบ firewall settings

3. **Username/Email Already Exists**
   - ใช้ username หรือ email ที่แตกต่าง
   - ตรวจสอบ existing users
   - ใช้ reset password แทน

4. **Password Validation Failed**
   - ตรวจสอบ password requirements
   - ใช้ password ที่แข็งแกร่ง
   - ตรวจสอบ special characters

### การ Debug

```bash
# ตรวจสอบ database connection
psql -h localhost -U postgres -d postgres

# ตรวจสอบ existing users
psql -h localhost -U postgres -d postgres -c "SELECT username, email FROM users WHERE role = 'admin';"

# ตรวจสอบ logs
tail -f logs/all.log
```

## 📊 เปรียบเทียบสคริปต์

| คุณสมบัติ | Interactive | GUI | Web |
|-----------|-------------|-----|-----|
| **ความสะดวก** | 🟡 ปานกลาง | 🟢 สูง | 🟢 สูง |
| **ความสวยงาม** | 🔴 ต่ำ | 🟢 สูง | 🟢 สูง |
| **ความปลอดภัย** | 🟢 สูง | 🟢 สูง | 🟡 ปานกลาง |
| **การใช้งาน** | 🟡 ปานกลาง | 🟢 สูง | 🟢 สูง |
| **การติดตั้ง** | 🟢 ง่าย | 🟢 ง่าย | 🟡 ปานกลาง |
| **ความเหมาะสม** | 🟢 Development | 🟢 Development | 🟡 Production |

## 🚀 คำแนะนำการใช้งาน

### สำหรับ Development
- ใช้ **Interactive** หรือ **GUI** script
- รันในสภาพแวดล้อมที่ปลอดภัย
- ลบสคริปต์หลังจากใช้งานเสร็จ

### สำหรับ Production
- ใช้ **Web** script อย่างระมัดระวัง
- ใช้ใน network ที่ปลอดภัย
- จำกัดการเข้าถึง IP address
- ลบสคริปต์หลังจากใช้งานเสร็จ

### สำหรับ Emergency
- ใช้ **Interactive** script
- รันในสภาพแวดล้อมที่ปลอดภัย
- เปลี่ยน password ทันทีหลังจากสร้าง
- ลบสคริปต์หลังจากใช้งานเสร็จ

## 📞 การติดต่อ

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา

---

**⚠️ คำเตือน: สคริปต์เหล่านี้มีอำนาจสูงในการจัดการระบบ กรุณาใช้อย่างระมัดระวังและในสภาพแวดล้อมที่ปลอดภัยเท่านั้น**
