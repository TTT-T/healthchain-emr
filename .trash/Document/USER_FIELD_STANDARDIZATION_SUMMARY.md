# สรุปการปรับแก้ไขฟิลด์ตาราง Users ให้สอดคล้องกับข้อกำหนด

## ข้อกำหนดที่ต้องปฏิบัติตาม

1. **`first_name`** - ใช้เก็บเฉพาะชื่อภาษาอังกฤษเท่านั้น
2. **`last_name`** - ใช้เก็บเฉพาะนามสกุลภาษาอังกฤษเท่านั้น
3. **`thai_name`** - ใช้เก็บเฉพาะชื่อภาษาไทยเท่านั้น
4. **`thai_last_name`** - ใช้เก็บเฉพาะนามสกุลภาษาไทยเท่านั้น
5. **`username`** - ใช้สำหรับเก็บข้อมูลเอาไวสำหรับ login
6. **`title`** - สำหรับเก็บคำนำหน้าชื่อในภาษาไทยเท่านั้น

## การเปลี่ยนแปลงที่ทำ

### 1. Database Migrations
- **ไฟล์**: `backend/src/database/migrations/023_standardize_user_name_fields.sql`
- **การเปลี่ยนแปลง**:
  - เพิ่ม comments อธิบายการใช้งานของแต่ละฟิลด์
  - เพิ่ม validation constraints เพื่อตรวจสอบรูปแบบข้อมูล
  - เพิ่ม indexes สำหรับการค้นหาที่มีประสิทธิภาพ
  - อัปเดต migration manager

### 2. Backend Schema Validation
- **ไฟล์**: `backend/src/schemas/user.ts`
- **การเปลี่ยนแปลง**:
  - อัปเดต `FieldValidators` เพื่อเพิ่ม regex validation
  - เพิ่ม validation สำหรับ `title` field
  - อัปเดต `CreateUserSchema` และ `UpdateUserProfileSchema`
  - อัปเดต transform functions

### 3. Backend Controllers
- **ไฟล์**: `backend/src/controllers/authController.ts`
- **การเปลี่ยนแปลง**:
  - อัปเดต `createUser` function เพื่อรองรับ `title` field
  - อัปเดต `getUserById` function
  - อัปเดต user registration logic
  - อัปเดต profile mapping

- **ไฟล์**: `backend/src/controllers/externalRequesterRegistrationController.ts`
- **การเปลี่ยนแปลง**:
  - แก้ไข field mapping ใน user creation query
  - แยก `firstNameThai` และ `lastNameThai` อย่างถูกต้อง

### 4. Frontend Types
- **ไฟล์**: `frontend/src/types/api.ts`
- **การเปลี่ยนแปลง**:
  - อัปเดต `User` interface เพื่อเพิ่ม comments อธิบายการใช้งาน
  - อัปเดต `RegisterRequest` interface
  - เพิ่ม `title` field

- **ไฟล์**: `frontend/src/types/user.ts`
- **การเปลี่ยนแปลง**:
  - อัปเดต `User` interface เพื่อให้สอดคล้องกับ backend
  - เพิ่ม `title` field

### 5. Frontend Components
- **ไฟล์**: `frontend/src/app/register/page.tsx`
- **การเปลี่ยนแปลง**:
  - อัปเดต `FormData` interface เพื่อเพิ่ม comments
  - อัปเดต registration logic เพื่อส่ง `title` field

- **ไฟล์**: `frontend/src/contexts/AuthContext.tsx`
- **การเปลี่ยนแปลง**:
  - อัปเดต `RegisterData` interface เพื่อเพิ่ม `title` field

## Validation Rules ที่เพิ่ม

### English Names (first_name, last_name)
- อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ, ช่องว่าง, ขีด, จุด
- Pattern: `/^[a-zA-Z\s\-\'\.]+$/`

### Thai Names (thai_name, thai_last_name, title)
- อนุญาตเฉพาะตัวอักษรไทย, ช่องว่าง, ขีด, จุด
- Pattern: `/^[\u0E00-\u0E7F\s\-\'\.]+$/`

### Username
- อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ, ตัวเลข, และ underscore
- Pattern: `/^[a-zA-Z0-9_]+$/`

## Database Constraints ที่เพิ่ม

```sql
-- English names should contain only English characters
ALTER TABLE users 
ADD CONSTRAINT check_english_name_format 
CHECK (
  (first_name IS NULL OR first_name ~ '^[a-zA-Z\s\-\'\.]+$') AND
  (last_name IS NULL OR last_name ~ '^[a-zA-Z\s\-\'\.]+$')
);

-- Thai names should contain only Thai characters
ALTER TABLE users 
ADD CONSTRAINT check_thai_name_format 
CHECK (
  (thai_name IS NULL OR thai_name ~ '^[\u0E00-\u0E7F\s\-\'\.]+$') AND
  (thai_last_name IS NULL OR thai_last_name ~ '^[\u0E00-\u0E7F\s\-\'\.]+$')
);

-- Title should contain only Thai characters
ALTER TABLE users 
ADD CONSTRAINT check_title_format 
CHECK (
  title IS NULL OR title ~ '^[\u0E00-\u0E7F\s\-\'\.]+$'
);
```

## Indexes ที่เพิ่ม

```sql
-- Individual name indexes
CREATE INDEX IF NOT EXISTS idx_users_first_name_english ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name_english ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_name_first ON users(thai_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_last_name ON users(thai_last_name);
CREATE INDEX IF NOT EXISTS idx_users_title ON users(title);

-- Composite indexes for name searches
CREATE INDEX IF NOT EXISTS idx_users_english_name_search ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_name_search ON users(thai_name, thai_last_name);
```

## การทดสอบที่แนะนำ

1. **ทดสอบการลงทะเบียนผู้ใช้ใหม่**:
   - ทดสอบด้วยชื่อไทยและอังกฤษที่ถูกต้อง
   - ทดสอบด้วยชื่อที่มีตัวอักษรที่ไม่ถูกต้อง
   - ทดสอบการส่ง title field

2. **ทดสอบการอัปเดตโปรไฟล์**:
   - ทดสอบการอัปเดตชื่อไทยและอังกฤษแยกกัน
   - ทดสอบการอัปเดต title

3. **ทดสอบการค้นหา**:
   - ทดสอบการค้นหาด้วยชื่อไทย
   - ทดสอบการค้นหาด้วยชื่ออังกฤษ

## หมายเหตุ

- การเปลี่ยนแปลงนี้จะไม่ส่งผลกระทบต่อข้อมูลที่มีอยู่แล้วในฐานข้อมูล
- ระบบจะยังคงรองรับ legacy fields เพื่อความเข้ากันได้ย้อนหลัง
- การ validation จะเริ่มทำงานหลังจาก migration ถูกเรียกใช้
- ควรทดสอบระบบอย่างละเอียดก่อนนำไปใช้งานจริง

## ไฟล์ที่เปลี่ยนแปลง

### Backend
- `backend/src/database/migrations/023_standardize_user_name_fields.sql`
- `backend/src/database/migrations.ts`
- `backend/src/schemas/user.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/controllers/externalRequesterRegistrationController.ts`

### Frontend
- `frontend/src/types/api.ts`
- `frontend/src/types/user.ts`
- `frontend/src/app/register/page.tsx`
- `frontend/src/contexts/AuthContext.tsx`
