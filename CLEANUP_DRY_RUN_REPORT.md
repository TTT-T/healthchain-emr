# 🧹 EMR System - Cleanup DRY-RUN Report

**วันที่:** 7 มกราคม 2025  
**ประเภทโปรเจกต์:** Next.js 15.3.4 (Frontend) + Node.js + Express + TypeScript (Backend)  
**คำสั่งทดสอบ:** `npm run build`, `npm run lint`, `npm run test`, `npm run type-check`

---

## 📊 SUMMARY

**จำนวนไฟล์/บล็อกโค้ดที่เสนอให้ลบ/ย้าย/แก้:**
- **ไฟล์ที่ลบได้:** 8 ไฟล์
- **ไฟล์ที่ย้ายไป .trash:** 4 ไฟล์  
- **โค้ดที่แก้ไข:** 1 ไฟล์ (deprecated code)
- **ไฟล์ที่ห้ามลบ:** 3 ไฟล์ (Docker files)

---

## 📁 FILE CANDIDATES

### ✅ **ไฟล์ที่ลบได้ (ไม่ถูกอ้างอิง)**

#### **1. ไฟล์ Test Scripts ที่ไม่จำเป็น**
- **`backend/test-*.js`** (8 ไฟล์)
  - `backend/test-duplicate-email-protection.js`
  - `backend/test-complete-user-flow.js` 
  - `backend/test-forgot-password.js`
  - `backend/test-email-templates.js`
  - `backend/test-registration.js`
  - `backend/test-email.js`
  - `test-api.js` (root level)
  - `backend/test-api.js`
  - **เหตุผล:** ไฟล์ test scripts ที่ใช้สำหรับการทดสอบ manual ไม่ถูกอ้างอิงจาก package.json scripts
  - **หลักฐาน:** ไม่พบการอ้างอิงใน `package.json` scripts หรือ CI/CD
  - **สถานะการอ้างอิง:** ไม่พบ

#### **2. ไฟล์ PowerShell Script**
- **`backend/test-api.ps1`**
  - **เหตุผล:** PowerShell script สำหรับทดสอบ API ไม่ถูกอ้างอิง
  - **หลักฐาน:** ไม่พบการอ้างอิงในเอกสารหรือสคริปต์อื่น
  - **สถานะการอ้างอิง:** ไม่พบ

### 🗂️ **ไฟล์ที่ย้ายไป .trash (ไม่แน่ใจ)**

#### **1. ไฟล์ .md ที่ไม่ถูกอ้างอิง**
- **`frontend/ERROR_HANDLING_TEST_REPORT.md`**
  - **เหตุผล:** รายงานการทดสอบ error handling ไม่ถูกอ้างอิงจาก README
  - **หลักฐาน:** ไม่พบการอ้างอิงใน README.md หรือเอกสารอื่น
  - **สถานะการอ้างอิง:** ไม่พบ

- **`frontend/ALERT_SYSTEM_GUIDE.md`**
  - **เหตุผล:** คู่มือระบบ alert ไม่ถูกอ้างอิงจาก README
  - **หลักฐาน:** ไม่พบการอ้างอิงใน README.md
  - **สถานะการอ้างอิง:** ไม่พบ

- **`TESTING_SUMMARY_REPORT.md`**
  - **เหตุผล:** รายงานสรุปการทดสอบ ไม่ถูกอ้างอิงจาก README
  - **หลักฐาน:** ไม่พบการอ้างอิงใน README.md
  - **สถานะการอ้างอิง:** ไม่พบ

- **`backend/src/scripts/database-access-guide.md`**
  - **เหตุผล:** คู่มือการเข้าถึงฐานข้อมูล ไม่ถูกอ้างอิงจากเอกสารหลัก
  - **หลักฐาน:** ไม่พบการอ้างอิงใน README.md
  - **สถานะการอ้างอิง:** ไม่พบ

### ❌ **ไฟล์ที่ห้ามลบ (ถูกอ้างอิง)**

#### **1. ไฟล์ Docker**
- **`backend/Dockerfile`** - ถูกอ้างอิงใน `docker-compose.yml` และ `scripts/build-production.sh`
- **`frontend/Dockerfile`** - ถูกอ้างอิงใน `docker-compose.yml` และ `scripts/build-production.sh`
- **`docker-compose.yml`** - ถูกอ้างอิงใน `scripts/build-production.sh` และ README.md

#### **2. ไฟล์ Environment Example**
- **`frontend/env.production.example`** - ถูกอ้างอิงใน `scripts/build-production.sh`
- **`backend/env.production.example`** - ถูกอ้างอิงใน `scripts/build-production.sh`

---

## 🔧 CODE CANDIDATES

### **1. Deprecated Code ที่ควรลบ**
- **ไฟล์:** `backend/src/database/index.ts`
- **บรรทัด:** 7-26
- **สาเหตุ:** Class `DatabaseConnection` ถูก mark เป็น `@deprecated` และมี console.warn
- **ข้อเสนอการแก้:** ลบ class `DatabaseConnection` ทั้งหมด เนื่องจากมี `databaseManager` จาก `./connection` แทนแล้ว

### **2. Unused Imports/Variables (จาก ESLint)**
- **จำนวน:** 200+ warnings จาก ESLint
- **ประเภท:** 
  - `@typescript-eslint/no-unused-vars` - ตัวแปรที่ไม่ถูกใช้
  - `@typescript-eslint/no-explicit-any` - การใช้ `any` type
  - `react-hooks/exhaustive-deps` - missing dependencies ใน useEffect
- **ข้อเสนอการแก้:** แก้ไขทีละไฟล์ตามความสำคัญ

---

## ⚠️ RISK NOTES

### **ประเด็นเสี่ยง/จุดต้องขออนุญาตพิเศษ:**

1. **ไฟล์ Test Scripts:** อาจมีข้อมูลการทดสอบที่สำคัญ ควรย้ายไป `.trash` แทนการลบทันที

2. **ไฟล์ .md:** อาจมีข้อมูลสำคัญที่ยังไม่ได้อ้างอิงในเอกสารหลัก

3. **Deprecated Code:** ต้องตรวจสอบให้แน่ใจว่าไม่มีโค้ดอื่นที่ยังใช้ `DatabaseConnection`

4. **ESLint Warnings:** การแก้ไขอาจส่งผลต่อการทำงานของระบบ ต้องทดสอบอย่างละเอียด

---

## ✅ CHECKLIST

### **สถานะการทดสอบปัจจุบัน:**
- **Backend Type Check:** ✅ ผ่าน (0 errors)
- **Frontend Lint:** ✅ ผ่าน (มี warnings แต่ไม่ใช่ errors)
- **Frontend Build:** ❌ ล้มเหลว (มี ESLint errors ที่ต้องแก้ไข)
- **Backend Build:** ✅ ผ่าน

### **คำสั่งที่ใช้ตรวจ:**
```bash
# Backend
cd backend && npm run type-check  # ✅ ผ่าน
cd backend && npm run build       # ✅ ผ่าน

# Frontend  
cd frontend && npm run lint       # ✅ ผ่าน (warnings only)
cd frontend && npm run build      # ❌ ล้มเหลว (ESLint errors)
```

---

## 📋 ACTION PLAN

### **ขั้นตอนหลังได้รับอนุมัติ:**

#### **Phase 1: ลบไฟล์ที่ไม่จำเป็น (Commit 1)**
1. สร้าง branch `chore/safe-cleanup-2025-01-07`
2. ลบไฟล์ test scripts ทั้งหมด (8 ไฟล์)
3. ลบไฟล์ PowerShell script (1 ไฟล์)
4. Commit: `chore: remove unused test scripts and PowerShell files`

#### **Phase 2: ย้ายไฟล์ .md ไป .trash (Commit 2)**
1. สร้างโฟลเดอร์ `.trash/2025-01-07/`
2. ย้ายไฟล์ .md ทั้งหมด (4 ไฟล์) ไป `.trash/2025-01-07/`
3. Commit: `chore: move unused documentation files to trash`

#### **Phase 3: แก้ไข Deprecated Code (Commit 3)**
1. ลบ class `DatabaseConnection` จาก `backend/src/database/index.ts`
2. ทดสอบ backend build และ type-check
3. Commit: `refactor: remove deprecated DatabaseConnection class`

#### **Phase 4: แก้ไข ESLint Errors (Commit 4)**
1. แก้ไข ESLint errors ที่ทำให้ build ล้มเหลว
2. ทดสอบ frontend build
3. Commit: `fix: resolve ESLint errors preventing build`

#### **Phase 5: ทดสอบระบบ (Commit 5)**
1. รัน `npm run build` ทั้ง frontend และ backend
2. รัน `npm run lint` ทั้งสองส่วน
3. รัน `npm run test` (ถ้ามี)
4. Commit: `test: verify system functionality after cleanup`

---

## 📝 หมายเหตุเพิ่มเติม

1. **โฟลเดอร์ .trash:** จะเก็บไฟล์ไว้ 7 วัน หรือจนกว่าจะได้รับคำสั่งลบถาวร

2. **การทดสอบ:** ทุก commit จะต้องผ่าน lint, type-check, และ build

3. **การ Rollback:** หากเกิดปัญหา สามารถ rollback ได้โดยใช้ git

4. **การติดตาม:** จะสร้าง `CLEANUP_REPORT.md` หลังเสร็จสิ้นการทำความสะอาด

---

**สถานะ:** รอการอนุมัติจากผู้ใช้  
**ผู้สร้างรายงาน:** AI Assistant  
**วันที่สร้าง:** 7 มกราคม 2025
