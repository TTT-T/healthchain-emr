# 📊 รายงานโครงสร้างการเก็บข้อมูลและการดึงข้อมูลของระบบ EMR

## 📋 สารบัญ
1. [โครงสร้างฐานข้อมูล](#1-โครงสร้างฐานข้อมูล-database-tables)
2. [หน้า Frontend และการดึงข้อมูล](#2-หน้า-frontend-และการดึงข้อมูล)
3. [Backend API Routes และ Controllers](#3-backend-api-routes-และ-controllers)
4. [การเก็บข้อมูลของแต่ละฟอร์ม](#4-การเก็บข้อมูลของแต่ละฟอร์ม)
5. [การไหลของข้อมูล](#5-การไหลของข้อมูล-data-flow)
6. [สรุปการใช้งานตาราง](#6-สรุปการใช้งานตาราง)

---

## 1. โครงสร้างฐานข้อมูล (Database Tables)

### 1.1 ตารางหลัก (Core Tables)

| ตาราง | วัตถุประสงค์ | ฟิลด์สำคัญ |
|-------|-------------|-----------|
| **`users`** | ข้อมูลผู้ใช้งานระบบ | `id`, `username`, `email`, `role`, `first_name`, `last_name`, `thai_name` |
| **`patients`** | ข้อมูลผู้ป่วย | `id`, `user_id`, `patient_number`, `hospital_number`, `first_name`, `last_name`, `thai_name` |
| **`departments`** | ข้อมูลแผนก/หน่วยงาน | `id`, `department_code`, `department_name`, `department_type` |
| **`visits`** | การมาพบแพทย์ | `id`, `patient_id`, `visit_number`, `visit_type`, `chief_complaint`, `diagnosis`, `status` |

### 1.2 ตารางการรักษา (Medical Records)

| ตาราง | วัตถุประสงค์ | ฟิลด์สำคัญ |
|-------|-------------|-----------|
| **`medical_records`** | บันทึกทางการแพทย์รวม | `id`, `patient_id`, `record_type`, `chief_complaint`, `diagnosis`, `treatment_plan` |
| **`vital_signs`** | สัญญาณชีพ | `id`, `visit_id`, `patient_id`, `systolic_bp`, `heart_rate`, `temperature`, `weight`, `height` |
| **`lab_orders`** | ใบสั่งตรวจ | `id`, `visit_id`, `patient_id`, `order_number`, `test_name`, `test_category`, `status` |
| **`lab_results`** | ผลตรวจแลป | `id`, `lab_order_id`, `patient_id`, `test_name`, `result_value`, `abnormal_flag` |
| **`prescriptions`** | ใบสั่งยา | `id`, `visit_id`, `patient_id`, `prescription_number`, `prescribed_by`, `status` |
| **`prescription_items`** | รายการยาในใบสั่ง | `id`, `prescription_id`, `medication_name`, `strength`, `quantity_prescribed` |

### 1.3 ตารางนัดหมายและเอกสาร

| ตาราง | วัตถุประสงค์ | ฟิลด์สำคัญ |
|-------|-------------|-----------|
| **`appointments`** | นัดหมาย | `id`, `patient_id`, `doctor_id`, `start_time`, `end_time`, `status` |
| **`appointment_types`** | ประเภทนัดหมาย | `id`, `name`, `description`, `duration_minutes` |
| **`visit_attachments`** | ไฟล์แนบ | `id`, `visit_id`, `patient_id`, `file_name`, `file_path`, `attachment_type` |

### 1.4 ตารางแพทย์และบุคลากร

| ตาราง | วัตถุประสงค์ | ฟิลด์สำคัญ |
|-------|-------------|-----------|
| **`doctors`** | ข้อมูลแพทย์ | `id`, `user_id`, `medical_license_number`, `specialization`, `department` |
| **`nurses`** | ข้อมูลพยาบาล | `id`, `user_id`, `nursing_license_number`, `department` |

---

## 2. หน้า Frontend และการดึงข้อมูล

### 2.1 หน้า EMR (สำหรับแพทย์/พยาบาล)

| หน้า | URL | ตารางที่ดึงข้อมูล | API Endpoint |
|------|-----|------------------|--------------|
| **EMR Dashboard** | `/emr` | `visits`, `patients`, `appointments` | `GET /api/medical/patients`, `GET /api/medical/visits`, `GET /api/medical/appointments` |
| **Patient Registration** | `/emr/register-patient` | `patients`, `users` | `POST /api/medical/patients` |
| **Check-in** | `/emr/checkin` | `visits`, `patients` | `POST /api/medical/visits` |
| **Vital Signs** | `/emr/vital-signs` | `vital_signs`, `visits` | `POST /api/medical/vital-signs` |
| **History Taking** | `/emr/history-taking` | `medical_records` | `POST /api/medical/history-taking` |
| **Doctor Visit** | `/emr/doctor-visit` | `visits`, `medical_records` | `POST /api/medical/doctor-visits` |
| **Pharmacy** | `/emr/pharmacy` | `prescriptions`, `prescription_items` | `POST /api/medical/prescriptions` |
| **Lab Orders** | `/emr/lab-orders` | `lab_orders`, `lab_results` | `POST /api/medical/lab-orders` |
| **Appointments** | `/emr/appointments` | `appointments`, `appointment_types` | `GET /api/medical/appointments` |
| **Patient Summary** | `/emr/patient-summary` | `medical_records`, `visits`, `vital_signs` | `GET /api/medical/patients/:id/summary` |
| **Queue History** | `/emr/queue-history` | `visits` | `GET /api/medical/queue-history` |

### 2.2 หน้า Patient Portal (สำหรับผู้ป่วย)

| หน้า | URL | ตารางที่ดึงข้อมูล | API Endpoint |
|------|-----|------------------|--------------|
| **Patient Dashboard** | `/accounts/patient/dashboard` | `patients`, `visits`, `appointments` | `GET /api/medical/patients/:id` |
| **Medical Records** | `/accounts/patient/records` | `visits`, `medical_records` | `GET /api/medical/patients/:id/records` |
| **Lab Results** | `/accounts/patient/lab-results` | `lab_results`, `medical_records` | `GET /api/medical/patients/:id/lab-results` |
| **Documents** | `/accounts/patient/documents` | `medical_records` (record_type='document') | `GET /api/medical/patients/:id/medical-documents/patient` |
| **Appointments** | `/accounts/patient/appointments` | `appointments` | `GET /api/medical/patients/:id/appointments` |
| **Medications** | `/accounts/patient/medications` | `prescriptions`, `prescription_items` | `GET /api/medical/patients/:id/medications` |
| **Notifications** | `/accounts/patient/notifications` | `notifications` | `GET /api/medical/patients/:id/notifications` |

### 2.3 หน้า Admin

| หน้า | URL | ตารางที่ดึงข้อมูล | API Endpoint |
|------|-----|------------------|--------------|
| **System Monitoring** | `/admin/system-monitoring` | `users`, `visits`, `appointments` | `GET /api/admin/system-overview` |
| **Consent Requests** | `/admin/consent-requests` | `consent_requests` | `GET /api/admin/consent-requests` |
| **Consent Contracts** | `/admin/consent-contracts` | `consent_contracts` | `GET /api/admin/consent-contracts` |

---

## 3. Backend API Routes และ Controllers

### 3.1 Medical Routes (`/api/medical`)

| Route | Method | Controller | ตารางที่ใช้ |
|-------|--------|------------|-------------|
| `/patients` | GET | `getAllPatients` | `patients`, `users` |
| `/patients/:id` | GET | `getPatientById` | `patients`, `users` |
| `/patients/:id/records` | GET | `getPatientRecords` | `visits`, `medical_records` |
| `/patients/:id/lab-results` | GET | `getPatientLabResults` | `medical_records` (record_type='lab_result') |
| `/patients/:id/medical-documents/patient` | GET | `getDocumentsByPatient` | `medical_records` (record_type='document') |
| `/patients/:id/medications` | GET | `getPatientMedications` | `medical_records` (record_type='pharmacy_dispensing') |
| `/patients/:id/appointments` | GET | `getPatientAppointments` | `appointments` |
| `/visits` | GET | `getAllVisits` | `visits`, `patients`, `users` |
| `/visits` | POST | `createVisit` | `visits` |
| `/vital-signs` | POST | `recordVitalSigns` | `vital_signs` |
| `/lab-orders` | POST | `createLabOrder` | `lab_orders` |
| `/prescriptions` | POST | `createPrescription` | `prescriptions`, `prescription_items` |
| `/appointments` | GET | `getAllAppointments` | `appointments`, `appointment_types` |
| `/doctors` | GET | `getAllDoctors` | `doctors`, `users` |

### 3.2 Patient Routes (`/api/patients`)

| Route | Method | Controller | ตารางที่ใช้ |
|-------|--------|------------|-------------|
| `/patients/:id/records` | GET | `getPatientRecords` | `visits` |
| `/patients/:id/documents` | GET | `getPatientDocuments` | `medical_records` |

---

## 4. การเก็บข้อมูลของแต่ละฟอร์ม

### 4.1 ฟอร์มลงทะเบียนผู้ป่วย
- **ตารางหลัก:** `patients`, `users`
- **ฟิลด์:** ข้อมูลส่วนตัว, ข้อมูลการติดต่อ, ข้อมูลประกัน

### 4.2 ฟอร์มเช็คอิน/สร้างคิว
- **ตารางหลัก:** `visits`
- **ฟิลด์:** `visit_type`, `chief_complaint`, `status`, `priority`

### 4.3 ฟอร์มวัดสัญญาณชีพ
- **ตารางหลัก:** `vital_signs`
- **ฟิลด์:** `systolic_bp`, `diastolic_bp`, `heart_rate`, `temperature`, `weight`, `height`

### 4.4 ฟอร์มซักประวัติ
- **ตารางหลัก:** `medical_records` (record_type='history_taking')
- **ฟิลด์:** `chief_complaint`, `present_illness`, `past_history`, `family_history`

### 4.5 ฟอร์มตรวจโดยแพทย์
- **ตารางหลัก:** `visits`, `medical_records` (record_type='doctor_visit')
- **ฟิลด์:** `diagnosis`, `treatment_plan`, `physical_examination`

### 4.6 ฟอร์มสั่งยา
- **ตารางหลัก:** `prescriptions`, `prescription_items`
- **ฟิลด์:** `medication_name`, `strength`, `quantity_prescribed`, `dosage_instructions`

### 4.7 ฟอร์มสั่งตรวจ
- **ตารางหลัก:** `lab_orders`, `lab_results`
- **ฟิลด์:** `test_name`, `test_category`, `result_value`, `abnormal_flag`

### 4.8 ฟอร์มนัดหมาย
- **ตารางหลัก:** `appointments`, `appointment_types`
- **ฟิลด์:** `start_time`, `end_time`, `reason`, `status`

---

## 5. การไหลของข้อมูล (Data Flow)

### 5.1 การสร้างข้อมูลใหม่
1. **Frontend Form** → **API Endpoint** → **Controller** → **Database Table**
2. **Validation** → **Business Logic** → **Database Insert** → **Response**

### 5.2 การดึงข้อมูล
1. **Frontend Page** → **API Call** → **Controller** → **Database Query** → **Response** → **Frontend Display**

### 5.3 การอัปเดตข้อมูล
1. **Frontend Form** → **API Endpoint** → **Controller** → **Database Update** → **Response**

---

## 6. สรุปการใช้งานตาราง

| ตาราง | หน้าที่หลัก | หน้า Frontend ที่ใช้ |
|-------|------------|-------------------|
| **`users`** | ข้อมูลผู้ใช้งาน | ทุกหน้า (authentication) |
| **`patients`** | ข้อมูลผู้ป่วย | Patient Portal, EMR |
| **`visits`** | การมาพบแพทย์ | EMR, Patient Records |
| **`medical_records`** | บันทึกทางการแพทย์ | Patient Records, Documents, Lab Results |
| **`vital_signs`** | สัญญาณชีพ | EMR Vital Signs |
| **`lab_orders`** | ใบสั่งตรวจ | EMR Lab Orders |
| **`lab_results`** | ผลตรวจ | Patient Lab Results |
| **`prescriptions`** | ใบสั่งยา | EMR Pharmacy, Patient Medications |
| **`appointments`** | นัดหมาย | EMR Appointments, Patient Appointments |
| **`doctors`** | ข้อมูลแพทย์ | EMR Doctor Selection |

---

## 📊 สรุปการวิเคราะห์โครงสร้างระบบ EMR

### สิ่งที่วิเคราะห์แล้ว:
1. **🗄️ โครงสร้างฐานข้อมูล** - 15+ ตารางหลัก
2. **🖥️ หน้า Frontend** - 20+ หน้า พร้อม API endpoints
3. **🔗 Backend Routes** - 50+ API endpoints
4. **📋 การเก็บข้อมูลฟอร์ม** - 8+ ฟอร์มหลัก
5. **🔄 การไหลของข้อมูล** - Data flow patterns

### ข้อมูลสำคัญ:
- **ตารางหลัก:** `users`, `patients`, `visits`, `medical_records`
- **ตารางการรักษา:** `vital_signs`, `lab_orders`, `lab_results`, `prescriptions`
- **ตารางนัดหมาย:** `appointments`, `appointment_types`
- **ตารางเอกสาร:** `visit_attachments`, `medical_records` (documents)

### การใช้งาน:
- **EMR System:** สำหรับแพทย์/พยาบาล
- **Patient Portal:** สำหรับผู้ป่วย
- **Admin Panel:** สำหรับผู้ดูแลระบบ

ระบบมีการออกแบบที่ครอบคลุมและเชื่อมโยงกันอย่างดี โดยใช้ `medical_records` เป็นตารางรวมสำหรับบันทึกทางการแพทย์ต่างๆ และมีตารางเฉพาะสำหรับข้อมูลเฉพาะทาง เช่น `vital_signs`, `lab_results`, `prescriptions`

---

**📅 วันที่สร้างเอกสาร:** 21 กันยายน 2568  
**👨‍💻 ผู้สร้าง:** AI Assistant  
**📋 เวอร์ชัน:** 1.0
