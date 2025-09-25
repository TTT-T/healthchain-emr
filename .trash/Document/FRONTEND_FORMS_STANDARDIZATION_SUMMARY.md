# สรุปการปรับแก้ไขฟอร์มต่างๆ ใน Frontend ให้ใช้ฟิลด์มาตรฐาน

## ฟอร์มที่ได้รับการปรับแก้ไข

### 1. ฟอร์มลงทะเบียนผู้ป่วย (Patient Registration)
**ไฟล์**: `frontend/src/app/register/page.tsx`
- ✅ **อัปเดตแล้ว**: ใช้ฟิลด์มาตรฐานในการส่งข้อมูล
- **การเปลี่ยนแปลง**:
  - `firstName` → English first name
  - `lastName` → English last name  
  - `thaiFirstName` → Thai first name
  - `thaiLastName` → Thai last name
  - `title` → Thai title/prefix

### 2. ฟอร์มลงทะเบียนบุคลากรทางการแพทย์ (Medical Staff Registration)
**ไฟล์**: `frontend/src/app/medical-staff/register/page.tsx`
- ✅ **อัปเดตแล้ว**: เพิ่ม comments อธิบายฟิลด์
- **ไฟล์ API**: `frontend/src/app/api/medical-staff/register/route.ts`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 3. ฟอร์มลงทะเบียนองค์กรภายนอก (External Requester Registration)
**ไฟล์**: `frontend/src/app/external-requesters/register/page.tsx`
- ✅ **อัปเดตแล้ว**: ใช้ฟิลด์มาตรฐานในการส่งข้อมูล
- **ไฟล์ API**: `frontend/src/app/api/external-requesters/register/route.ts`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 4. ฟอร์มโปรไฟล์ผู้ป่วย (Patient Profile)
**ไฟล์**: `frontend/src/app/accounts/patient/profile/page.tsx`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 5. ฟอร์มโปรไฟล์แพทย์ (Doctor Profile)
**ไฟล์**: `frontend/src/app/accounts/doctor/profile/page.tsx`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 6. ฟอร์มโปรไฟล์พยาบาล (Nurse Profile)
**ไฟล์**: `frontend/src/app/accounts/nurse/profile/page.tsx`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 7. ฟอร์มตั้งค่าโปรไฟล์ (Setup Profile)
**ไฟล์**: `frontend/src/app/setup-profile/page.tsx`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

### 8. ฟอร์มลงทะเบียนผู้ป่วยใน EMR (EMR Patient Registration)
**ไฟล์**: `frontend/src/app/emr/register-patient/page.tsx`
- ✅ **อัปเดตแล้ว**: ปรับการส่งข้อมูลให้ใช้ฟิลด์มาตรฐาน

## การเปลี่ยนแปลงหลัก

### 1. การส่งข้อมูลไปยัง Backend
ทุกฟอร์มได้รับการปรับแก้ไขให้ส่งข้อมูลในรูปแบบมาตรฐาน:

```javascript
// ตัวอย่างการส่งข้อมูลที่ปรับแก้ไขแล้ว
const registrationData = {
  username: formData.username,
  email: formData.email,
  password: formData.password,
  firstName: formData.firstNameEn,        // English first name
  lastName: formData.lastNameEn,          // English last name
  thaiFirstName: formData.firstName,      // Thai first name
  thaiLastName: formData.lastName,        // Thai last name
  title: formData.titlePrefix,            // Thai title/prefix
  phoneNumber: formData.phone,
  // ... ฟิลด์อื่นๆ
};
```

### 2. การอัปเดต Profile
ฟอร์มโปรไฟล์ต่างๆ ได้รับการปรับแก้ไขให้ส่งข้อมูลในรูปแบบมาตรฐาน:

```javascript
// ตัวอย่างการอัปเดตโปรไฟล์
const updateData = {
  firstName: formData.first_name,         // English first name
  lastName: formData.last_name,           // English last name
  thaiFirstName: formData.thai_first_name, // Thai first name
  thaiLastName: formData.thai_last_name,   // Thai last name
  title: formData.title,                   // Thai title/prefix
  email: formData.email,
  phone: formData.phone,
  // ... ฟิลด์อื่นๆ
};
```

### 3. การเพิ่ม Comments
เพิ่ม comments อธิบายการใช้งานของแต่ละฟิลด์ใน interface และ form data:

```typescript
interface FormData {
  titlePrefix: string; // Thai title/prefix
  firstName: string;   // Thai first name
  lastName: string;    // Thai last name
  firstNameEn: string; // English first name
  lastNameEn: string;  // English last name
  username: string;    // For login purposes
  // ... ฟิลด์อื่นๆ
}
```

## ฟิลด์ที่ได้รับการปรับมาตรฐาน

### ฟิลด์หลัก
- **`firstName`** - เก็บเฉพาะชื่อภาษาอังกฤษ
- **`lastName`** - เก็บเฉพาะนามสกุลภาษาอังกฤษ
- **`thaiFirstName`** - เก็บเฉพาะชื่อภาษาไทย
- **`thaiLastName`** - เก็บเฉพาะนามสกุลภาษาไทย
- **`title`** - เก็บคำนำหน้าชื่อภาษาไทย
- **`username`** - ใช้สำหรับ login

### ฟิลด์รอง
- **`phoneNumber`** - เบอร์โทรศัพท์
- **`email`** - อีเมล
- **`nationalId`** - เลขบัตรประชาชน
- **`birthDate`** - วันเกิด
- **`gender`** - เพศ
- **`address`** - ที่อยู่

## การตรวจสอบและทดสอบ

### 1. ฟอร์มที่ต้องทดสอบ
- [ ] ฟอร์มลงทะเบียนผู้ป่วย
- [ ] ฟอร์มลงทะเบียนบุคลากรทางการแพทย์
- [ ] ฟอร์มลงทะเบียนองค์กรภายนอก
- [ ] ฟอร์มโปรไฟล์ผู้ป่วย
- [ ] ฟอร์มโปรไฟล์แพทย์
- [ ] ฟอร์มโปรไฟล์พยาบาล
- [ ] ฟอร์มตั้งค่าโปรไฟล์
- [ ] ฟอร์มลงทะเบียนผู้ป่วยใน EMR

### 2. การทดสอบที่แนะนำ
1. **ทดสอบการลงทะเบียน**: ตรวจสอบว่าข้อมูลถูกส่งในรูปแบบที่ถูกต้อง
2. **ทดสอบการอัปเดตโปรไฟล์**: ตรวจสอบว่าข้อมูลถูกอัปเดตอย่างถูกต้อง
3. **ทดสอบการแสดงผล**: ตรวจสอบว่าข้อมูลแสดงผลอย่างถูกต้อง
4. **ทดสอบการ validation**: ตรวจสอบว่าการตรวจสอบข้อมูลทำงานอย่างถูกต้อง

## ไฟล์ที่เปลี่ยนแปลง

### Frontend Forms
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/medical-staff/register/page.tsx`
- `frontend/src/app/external-requesters/register/page.tsx`
- `frontend/src/app/accounts/patient/profile/page.tsx`
- `frontend/src/app/accounts/doctor/profile/page.tsx`
- `frontend/src/app/accounts/nurse/profile/page.tsx`
- `frontend/src/app/setup-profile/page.tsx`
- `frontend/src/app/emr/register-patient/page.tsx`

### Frontend API Routes
- `frontend/src/app/api/medical-staff/register/route.ts`
- `frontend/src/app/api/external-requesters/register/route.ts`

### Frontend Types
- `frontend/src/types/api.ts`
- `frontend/src/types/user.ts`
- `frontend/src/contexts/AuthContext.tsx`

## หมายเหตุ

- การเปลี่ยนแปลงนี้จะทำให้ระบบมีความสอดคล้องกันมากขึ้น
- ข้อมูลจะถูกเก็บในรูปแบบที่ถูกต้องตามข้อกำหนด
- ระบบจะสามารถตรวจสอบและ validate ข้อมูลได้อย่างถูกต้อง
- ควรทดสอบระบบอย่างละเอียดก่อนนำไปใช้งานจริง

## สถานะการทำงาน

✅ **เสร็จสิ้น**: การปรับแก้ไขฟอร์มทั้งหมดใน frontend ให้ใช้ฟิลด์มาตรฐาน
✅ **เสร็จสิ้น**: การปรับแก้ไข API routes ให้ส่งข้อมูลในรูปแบบมาตรฐาน
✅ **เสร็จสิ้น**: การเพิ่ม comments อธิบายการใช้งานของแต่ละฟิลด์
✅ **เสร็จสิ้น**: การตรวจสอบฟอร์มทั้งหมดในระบบ
