# 📊 HealthChain EMR System - Sample Data

## 📋 สารบัญ
1. [Sample Users](#sample-users)
2. [Sample Patients](#sample-patients)
3. [Sample Medical Records](#sample-medical-records)
4. [Sample Appointments](#sample-appointments)
5. [Sample AI Risk Assessments](#sample-ai-risk-assessments)
6. [Sample Consent Contracts](#sample-consent-contracts)
7. [Database Seeding Scripts](#database-seeding-scripts)

---

## 👥 Sample Users

### 1. Admin Users
```json
{
  "username": "admin",
  "email": "admin@healthchain.co.th",
  "password": "admin123",
  "firstName": "System",
  "lastName": "Administrator",
  "role": "admin",
  "isActive": true,
  "emailVerified": true
}
```

### 2. Medical Staff
```json
[
  {
    "username": "dr_smith",
    "email": "dr.smith@healthchain.co.th",
    "password": "doctor123",
    "firstName": "Dr. John",
    "lastName": "Smith",
    "role": "doctor",
    "department": "Cardiology",
    "professionalLicense": "MD-12345",
    "isActive": true,
    "emailVerified": true
  },
  {
    "username": "nurse_wilson",
    "email": "nurse.wilson@healthchain.co.th",
    "password": "nurse123",
    "firstName": "Sarah",
    "lastName": "Wilson",
    "role": "nurse",
    "department": "General Medicine",
    "professionalLicense": "RN-67890",
    "isActive": true,
    "emailVerified": true
  },
  {
    "username": "pharmacist_chen",
    "email": "pharmacist.chen@healthchain.co.th",
    "password": "pharmacist123",
    "firstName": "Dr. Lisa",
    "lastName": "Chen",
    "role": "pharmacist",
    "department": "Pharmacy",
    "professionalLicense": "PharmD-11111",
    "isActive": true,
    "emailVerified": true
  }
]
```

### 3. Patients
```json
[
  {
    "username": "patient_doe",
    "email": "john.doe@email.com",
    "password": "patient123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "emailVerified": true
  },
  {
    "username": "patient_somchai",
    "email": "somchai@email.com",
    "password": "patient123",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "role": "patient",
    "isActive": true,
    "emailVerified": true
  }
]
```

---

## 🏥 Sample Patients

### 1. John Doe
```json
{
  "hospitalNumber": "68-123456",
  "nationalId": "1234567890123",
  "thaiName": "จอห์น โด",
  "englishName": "John Doe",
  "gender": "male",
  "birthDate": "1985-05-15",
  "phone": "081-234-5678",
  "email": "john.doe@email.com",
  "address": "123 Sukhumvit Road, Bangkok 10110",
  "district": "Watthana",
  "province": "Bangkok",
  "postalCode": "10110",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "082-345-6789",
    "relationship": "Wife"
  },
  "bloodType": "O+",
  "allergies": ["Penicillin", "Shellfish"],
  "chronicConditions": ["Hypertension"],
  "currentMedications": ["Amlodipine 5mg daily"],
  "insuranceProvider": "Social Security",
  "insuranceNumber": "SS-123456789"
}
```

### 2. สมชาย ใจดี
```json
{
  "hospitalNumber": "68-123457",
  "nationalId": "2345678901234",
  "thaiName": "สมชาย ใจดี",
  "englishName": "Somchai Jaidee",
  "gender": "male",
  "birthDate": "1978-03-22",
  "phone": "081-234-5679",
  "email": "somchai@email.com",
  "address": "456 ถนนสุขุมวิท กรุงเทพฯ 10110",
  "district": "วัฒนา",
  "province": "กรุงเทพฯ",
  "postalCode": "10110",
  "emergencyContact": {
    "name": "นางสมใจ ใจดี",
    "phone": "082-345-6790",
    "relationship": "ภรรยา"
  },
  "bloodType": "A+",
  "allergies": [],
  "chronicConditions": ["Diabetes Type 2"],
  "currentMedications": ["Metformin 500mg twice daily"],
  "insuranceProvider": "ประกันสังคม",
  "insuranceNumber": "PS-234567890"
}
```

### 3. Jane Smith
```json
{
  "hospitalNumber": "68-123458",
  "nationalId": "3456789012345",
  "thaiName": "เจน สมิธ",
  "englishName": "Jane Smith",
  "gender": "female",
  "birthDate": "1990-12-08",
  "phone": "081-234-5680",
  "email": "jane.smith@email.com",
  "address": "789 Silom Road, Bangkok 10500",
  "district": "Bang Rak",
  "province": "Bangkok",
  "postalCode": "10500",
  "emergencyContact": {
    "name": "Robert Smith",
    "phone": "082-345-6791",
    "relationship": "Husband"
  },
  "bloodType": "B+",
  "allergies": ["Latex"],
  "chronicConditions": [],
  "currentMedications": [],
  "insuranceProvider": "Private Insurance",
  "insuranceNumber": "PI-345678901"
}
```

---

## 📋 Sample Medical Records

### 1. Visit Records for John Doe

#### Visit 1: Initial Consultation
```json
{
  "visitNumber": "V-2025-001",
  "visitDate": "2025-01-15",
  "visitTime": "09:00",
  "visitType": "consultation",
  "chiefComplaint": "Chest pain and shortness of breath",
  "presentIllness": "Patient reports chest pain that started 2 days ago, worsens with exertion. Also experiencing shortness of breath during physical activity.",
  "physicalExamination": "BP: 150/95, HR: 88, RR: 18, Temp: 36.8°C. Heart sounds normal, no murmurs. Lungs clear bilaterally.",
  "diagnosis": "Hypertension, possible angina",
  "treatmentPlan": "Start antihypertensive medication, lifestyle modifications, stress test scheduled",
  "status": "completed",
  "priority": "normal",
  "attendingDoctorId": "dr_smith_uuid",
  "assignedNurseId": "nurse_wilson_uuid",
  "departmentId": "cardiology_uuid"
}
```

#### Visit 2: Follow-up
```json
{
  "visitNumber": "V-2025-002",
  "visitDate": "2025-01-22",
  "visitTime": "10:30",
  "visitType": "follow_up",
  "chiefComplaint": "Follow-up for hypertension",
  "presentIllness": "Patient reports improvement in chest pain since starting medication. No shortness of breath at rest.",
  "physicalExamination": "BP: 135/85, HR: 82, RR: 16, Temp: 36.5°C. Heart sounds normal.",
  "diagnosis": "Hypertension - controlled",
  "treatmentPlan": "Continue current medication, monitor blood pressure, lifestyle counseling",
  "status": "completed",
  "priority": "normal",
  "attendingDoctorId": "dr_smith_uuid"
}
```

### 2. Vital Signs Records

#### Vital Signs for Visit 1
```json
{
  "visitId": "visit_1_uuid",
  "patientId": "john_doe_uuid",
  "weight": 75.5,
  "height": 175,
  "bmi": 24.7,
  "waistCircumference": 88,
  "hipCircumference": 95,
  "waistHipRatio": 0.93,
  "systolicBp": 150,
  "diastolicBp": 95,
  "heartRate": 88,
  "bodyTemperature": 36.8,
  "respiratoryRate": 18,
  "oxygenSaturation": 98,
  "bloodSugar": 95,
  "fastingGlucose": 92,
  "painLevel": 3,
  "generalCondition": "Stable",
  "notes": "Patient appears comfortable, no acute distress",
  "measurementTime": "2025-01-15T09:15:00Z",
  "measuredBy": "nurse_wilson_uuid"
}
```

#### Vital Signs for Visit 2
```json
{
  "visitId": "visit_2_uuid",
  "patientId": "john_doe_uuid",
  "weight": 74.8,
  "height": 175,
  "bmi": 24.4,
  "systolicBp": 135,
  "diastolicBp": 85,
  "heartRate": 82,
  "bodyTemperature": 36.5,
  "respiratoryRate": 16,
  "oxygenSaturation": 99,
  "bloodSugar": 88,
  "painLevel": 0,
  "generalCondition": "Good",
  "notes": "Significant improvement in blood pressure",
  "measurementTime": "2025-01-22T10:45:00Z",
  "measuredBy": "nurse_wilson_uuid"
}
```

### 3. Lab Orders and Results

#### Lab Order 1: Complete Blood Count
```json
{
  "orderNumber": "LO-2025-001",
  "patientId": "john_doe_uuid",
  "visitId": "visit_1_uuid",
  "testCategory": "blood",
  "testName": "Complete Blood Count",
  "testCode": "CBC",
  "clinicalIndication": "Routine check-up for hypertension",
  "specimenType": "Whole Blood",
  "collectionInstructions": "Fasting not required",
  "priority": "routine",
  "status": "completed",
  "orderedBy": "dr_smith_uuid",
  "orderedDate": "2025-01-15T09:30:00Z",
  "collectedDate": "2025-01-15T10:00:00Z",
  "resultDate": "2025-01-15T14:00:00Z",
  "notes": "All values within normal limits"
}
```

#### Lab Results for CBC
```json
{
  "labOrderId": "lab_order_1_uuid",
  "testName": "Complete Blood Count",
  "results": {
    "hemoglobin": {
      "value": 14.2,
      "unit": "g/dL",
      "referenceRange": "13.8-17.2",
      "status": "normal"
    },
    "hematocrit": {
      "value": 42.5,
      "unit": "%",
      "referenceRange": "40.7-50.3",
      "status": "normal"
    },
    "whiteBloodCells": {
      "value": 7.2,
      "unit": "10^3/μL",
      "referenceRange": "4.5-11.0",
      "status": "normal"
    },
    "platelets": {
      "value": 285,
      "unit": "10^3/μL",
      "referenceRange": "150-450",
      "status": "normal"
    }
  },
  "interpretation": "All CBC parameters are within normal limits",
  "resultDate": "2025-01-15T14:00:00Z",
  "reportedBy": "lab_tech_uuid"
}
```

### 4. Prescriptions

#### Prescription 1: Antihypertensive
```json
{
  "prescriptionNumber": "RX-2025-001",
  "patientId": "john_doe_uuid",
  "visitId": "visit_1_uuid",
  "diagnosisForPrescription": "Hypertension",
  "prescriberId": "dr_smith_uuid",
  "status": "dispensed",
  "totalAmount": 450.00,
  "insuranceCoverage": 400.00,
  "patientPayment": 50.00,
  "dispensedBy": "pharmacist_chen_uuid",
  "dispensedDate": "2025-01-15T15:30:00Z",
  "medications": [
    {
      "medicationName": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take with food, preferably in the morning",
      "quantity": 30,
      "unitPrice": 15.00
    }
  ],
  "notes": "Monitor blood pressure regularly, return in 1 week for follow-up"
}
```

---

## 📅 Sample Appointments

### 1. Upcoming Appointments
```json
[
  {
    "id": "appointment_1_uuid",
    "title": "Follow-up Visit",
    "type": "follow_up",
    "status": "scheduled",
    "date": "2025-01-29",
    "time": "10:00",
    "duration": 30,
    "patientId": "john_doe_uuid",
    "physician": {
      "name": "Dr. John Smith",
      "specialty": "Cardiology",
      "department": "Cardiology"
    },
    "location": {
      "hospital": "HealthChain Hospital",
      "building": "Main Building",
      "room": "Cardiology Clinic Room 1",
      "floor": "3rd Floor"
    },
    "priority": "normal",
    "notes": "Blood pressure check and medication review",
    "preparations": ["Bring current medications", "Fasting not required"],
    "reminderSent": true,
    "canReschedule": true,
    "canCancel": true
  },
  {
    "id": "appointment_2_uuid",
    "title": "Stress Test",
    "type": "test",
    "status": "scheduled",
    "date": "2025-02-05",
    "time": "14:00",
    "duration": 60,
    "patientId": "john_doe_uuid",
    "physician": {
      "name": "Dr. John Smith",
      "specialty": "Cardiology",
      "department": "Cardiology"
    },
    "location": {
      "hospital": "HealthChain Hospital",
      "building": "Diagnostic Building",
      "room": "Stress Test Room",
      "floor": "2nd Floor"
    },
    "priority": "normal",
    "notes": "Exercise stress test to evaluate heart function",
    "preparations": ["No caffeine 24 hours before", "Wear comfortable clothes", "Bring list of medications"],
    "reminderSent": false,
    "canReschedule": true,
    "canCancel": true
  }
]
```

### 2. Completed Appointments
```json
[
  {
    "id": "appointment_3_uuid",
    "title": "Initial Consultation",
    "type": "consultation",
    "status": "completed",
    "date": "2025-01-15",
    "time": "09:00",
    "duration": 45,
    "patientId": "john_doe_uuid",
    "physician": {
      "name": "Dr. John Smith",
      "specialty": "Cardiology",
      "department": "Cardiology"
    },
    "location": {
      "hospital": "HealthChain Hospital",
      "building": "Main Building",
      "room": "Cardiology Clinic Room 1",
      "floor": "3rd Floor"
    },
    "priority": "normal",
    "notes": "Initial consultation for chest pain and hypertension",
    "outcome": "Diagnosed with hypertension, started on Amlodipine",
    "followUpRequired": true,
    "followUpDate": "2025-01-22"
  }
]
```

---

## 🤖 Sample AI Risk Assessments

### 1. Diabetes Risk Assessment for สมชาย ใจดี
```json
{
  "id": "risk_assessment_1_uuid",
  "patientId": "somchai_uuid",
  "assessmentType": "diabetes",
  "assessmentDate": "2025-01-15T10:00:00Z",
  "riskLevel": "high",
  "probability": 78,
  "factors": [
    {
      "factor": "Age",
      "value": 46,
      "risk": "moderate",
      "weight": 0.2
    },
    {
      "factor": "BMI",
      "value": 28.5,
      "risk": "high",
      "weight": 0.25
    },
    {
      "factor": "Family History",
      "value": "Mother has diabetes",
      "risk": "high",
      "weight": 0.3
    },
    {
      "factor": "Physical Activity",
      "value": "Low",
      "risk": "high",
      "weight": 0.15
    },
    {
      "factor": "Blood Pressure",
      "value": "140/90",
      "risk": "high",
      "weight": 0.1
    }
  ],
  "recommendations": [
    "Increase physical activity to at least 30 minutes daily",
    "Adopt a low-carb, low-sugar diet",
    "Weight reduction to achieve BMI < 25",
    "Blood pressure management",
    "Regular blood sugar monitoring every 3 months",
    "Consider metformin if lifestyle changes insufficient"
  ],
  "nextAssessmentDate": "2025-04-15",
  "assessedBy": "dr_smith_uuid",
  "notes": "Patient shows high risk due to multiple factors including family history and lifestyle"
}
```

### 2. Hypertension Risk Assessment for John Doe
```json
{
  "id": "risk_assessment_2_uuid",
  "patientId": "john_doe_uuid",
  "assessmentType": "hypertension",
  "assessmentDate": "2025-01-15T09:30:00Z",
  "riskLevel": "moderate",
  "probability": 65,
  "factors": [
    {
      "factor": "Age",
      "value": 39,
      "risk": "moderate",
      "weight": 0.2
    },
    {
      "factor": "BMI",
      "value": 24.7,
      "risk": "low",
      "weight": 0.15
    },
    {
      "factor": "Family History",
      "value": "Father has hypertension",
      "risk": "high",
      "weight": 0.25
    },
    {
      "factor": "Smoking",
      "value": "No",
      "risk": "low",
      "weight": 0.1
    },
    {
      "factor": "Alcohol",
      "value": "Moderate",
      "risk": "moderate",
      "weight": 0.1
    },
    {
      "factor": "Physical Activity",
      "value": "Low",
      "risk": "high",
      "weight": 0.2
    }
  ],
  "recommendations": [
    "Regular aerobic exercise (30 minutes, 5 days/week)",
    "Reduce sodium intake to < 2.3g daily",
    "Limit alcohol consumption",
    "Stress management techniques",
    "Regular blood pressure monitoring",
    "Consider DASH diet"
  ],
  "nextAssessmentDate": "2025-04-15",
  "assessedBy": "dr_smith_uuid",
  "notes": "Patient already diagnosed with hypertension, focus on management and lifestyle modifications"
}
```

---

## 🔒 Sample Consent Contracts

### 1. Research Consent Contract
```json
{
  "contractId": "CON-2025-001",
  "patientId": "somchai_uuid",
  "requesterId": "research_institute_uuid",
  "dataTypes": ["medical_records", "lab_results", "prescriptions"],
  "purpose": "Medical Research on Diabetes Management",
  "duration": "1 year",
  "conditions": {
    "accessLevel": "read_only",
    "timeRestrictions": "business_hours_only",
    "purposeRestrictions": ["research", "publication"]
  },
  "status": "approved",
  "createdAt": "2025-01-15T08:00:00Z",
  "approvedAt": "2025-01-16T14:30:00Z",
  "expiresAt": "2026-01-16T23:59:59Z",
  "smartContractRules": {
    "autoExpire": true,
    "autoRevoke": {
      "onSuspiciousActivity": true,
      "onDataBreach": true,
      "onPolicyViolation": true
    },
    "auditLogging": true,
    "encryptionRequired": true
  },
  "accessLog": [
    {
      "timestamp": "2025-01-20T10:30:00Z",
      "action": "data_access",
      "dataType": "medical_records",
      "userId": "researcher_1_uuid",
      "ipAddress": "192.168.1.100"
    },
    {
      "timestamp": "2025-01-20T10:31:00Z",
      "action": "data_access",
      "dataType": "lab_results",
      "userId": "researcher_1_uuid",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

### 2. Insurance Consent Contract
```json
{
  "contractId": "CON-2025-002",
  "patientId": "john_doe_uuid",
  "requesterId": "insurance_company_uuid",
  "dataTypes": ["medical_records", "lab_results", "prescriptions", "billing"],
  "purpose": "Insurance Claims Processing",
  "duration": "2 years",
  "conditions": {
    "accessLevel": "read_write",
    "timeRestrictions": "business_hours_only",
    "purposeRestrictions": ["claims_processing", "underwriting"]
  },
  "status": "pending",
  "createdAt": "2025-01-20T09:00:00Z",
  "expiresAt": "2027-01-20T23:59:59Z",
  "smartContractRules": {
    "autoExpire": true,
    "autoRevoke": {
      "onSuspiciousActivity": true,
      "onDataBreach": true,
      "onPolicyViolation": true
    },
    "auditLogging": true,
    "encryptionRequired": true
  }
}
```

---

## 🗄️ Database Seeding Scripts

### 1. Seed Users Script
```sql
-- Insert sample users
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at) VALUES
('admin-uuid', 'admin', 'admin@healthchain.co.th', '$2a$12$hash1', 'System', 'Administrator', 'admin', true, true, NOW(), NOW()),
('dr-smith-uuid', 'dr_smith', 'dr.smith@healthchain.co.th', '$2a$12$hash2', 'Dr. John', 'Smith', 'doctor', true, true, NOW(), NOW()),
('nurse-wilson-uuid', 'nurse_wilson', 'nurse.wilson@healthchain.co.th', '$2a$12$hash3', 'Sarah', 'Wilson', 'nurse', true, true, NOW(), NOW()),
('pharmacist-chen-uuid', 'pharmacist_chen', 'pharmacist.chen@healthchain.co.th', '$2a$12$hash4', 'Dr. Lisa', 'Chen', 'pharmacist', true, true, NOW(), NOW()),
('patient-doe-uuid', 'patient_doe', 'john.doe@email.com', '$2a$12$hash5', 'John', 'Doe', 'patient', true, true, NOW(), NOW()),
('patient-somchai-uuid', 'patient_somchai', 'somchai@email.com', '$2a$12$hash6', 'สมชาย', 'ใจดี', 'patient', true, true, NOW(), NOW());
```

### 2. Seed Patients Script
```sql
-- Insert sample patients
INSERT INTO patients (id, hospital_number, national_id, first_name, last_name, thai_name, gender, date_of_birth, phone, email, address, district, province, postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, blood_type, allergies, chronic_conditions, current_medications, insurance_provider, insurance_policy_number, created_at, updated_at) VALUES
('john-doe-patient-uuid', '68-123456', '1234567890123', 'John', 'Doe', 'จอห์น โด', 'male', '1985-05-15', '081-234-5678', 'john.doe@email.com', '123 Sukhumvit Road, Bangkok 10110', 'Watthana', 'Bangkok', '10110', 'Jane Doe', '082-345-6789', 'Wife', 'O+', '["Penicillin", "Shellfish"]', '["Hypertension"]', '["Amlodipine 5mg daily"]', 'Social Security', 'SS-123456789', NOW(), NOW()),
('somchai-patient-uuid', '68-123457', '2345678901234', 'สมชาย', 'ใจดี', 'สมชาย ใจดี', 'male', '1978-03-22', '081-234-5679', 'somchai@email.com', '456 ถนนสุขุมวิท กรุงเทพฯ 10110', 'วัฒนา', 'กรุงเทพฯ', '10110', 'นางสมใจ ใจดี', '082-345-6790', 'ภรรยา', 'A+', '[]', '["Diabetes Type 2"]', '["Metformin 500mg twice daily"]', 'ประกันสังคม', 'PS-234567890', NOW(), NOW()),
('jane-smith-patient-uuid', '68-123458', '3456789012345', 'Jane', 'Smith', 'เจน สมิธ', 'female', '1990-12-08', '081-234-5680', 'jane.smith@email.com', '789 Silom Road, Bangkok 10500', 'Bang Rak', 'Bangkok', '10500', 'Robert Smith', '082-345-6791', 'Husband', 'B+', '["Latex"]', '[]', '[]', 'Private Insurance', 'PI-345678901', NOW(), NOW());
```

### 3. Seed Medical Records Script
```sql
-- Insert sample visits
INSERT INTO visits (id, patient_id, visit_number, visit_date, visit_time, visit_type, chief_complaint, present_illness, physical_examination, diagnosis, treatment_plan, status, priority, attending_doctor_id, assigned_nurse_id, created_at, updated_at) VALUES
('visit-1-uuid', 'john-doe-patient-uuid', 'V-2025-001', '2025-01-15', '09:00', 'consultation', 'Chest pain and shortness of breath', 'Patient reports chest pain that started 2 days ago, worsens with exertion', 'BP: 150/95, HR: 88, RR: 18, Temp: 36.8°C', 'Hypertension, possible angina', 'Start antihypertensive medication, lifestyle modifications', 'completed', 'normal', 'dr-smith-uuid', 'nurse-wilson-uuid', NOW(), NOW()),
('visit-2-uuid', 'john-doe-patient-uuid', 'V-2025-002', '2025-01-22', '10:30', 'follow_up', 'Follow-up for hypertension', 'Patient reports improvement in chest pain since starting medication', 'BP: 135/85, HR: 82, RR: 16, Temp: 36.5°C', 'Hypertension - controlled', 'Continue current medication, monitor blood pressure', 'completed', 'normal', 'dr-smith-uuid', 'nurse-wilson-uuid', NOW(), NOW());

-- Insert sample vital signs
INSERT INTO vital_signs (id, visit_id, patient_id, weight, height, bmi, systolic_bp, diastolic_bp, heart_rate, body_temperature, respiratory_rate, oxygen_saturation, blood_sugar, pain_level, general_condition, notes, measurement_time, measured_by, created_at, updated_at) VALUES
('vitals-1-uuid', 'visit-1-uuid', 'john-doe-patient-uuid', 75.5, 175, 24.7, 150, 95, 88, 36.8, 18, 98, 95, 3, 'Stable', 'Patient appears comfortable, no acute distress', '2025-01-15 09:15:00', 'nurse-wilson-uuid', NOW(), NOW()),
('vitals-2-uuid', 'visit-2-uuid', 'john-doe-patient-uuid', 74.8, 175, 24.4, 135, 85, 82, 36.5, 16, 99, 88, 0, 'Good', 'Significant improvement in blood pressure', '2025-01-22 10:45:00', 'nurse-wilson-uuid', NOW(), NOW());
```

### 4. Complete Seeding Script
```bash
#!/bin/bash
# seed_database.sh

echo "🌱 Seeding database with sample data..."

# Connect to database
psql -U postgres -d emr_development << EOF

-- Clear existing data (optional)
-- TRUNCATE TABLE users, patients, visits, vital_signs, lab_orders, prescriptions, appointments, risk_assessments, consent_contracts CASCADE;

-- Insert sample users
\echo 'Inserting sample users...'
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at) VALUES
('admin-uuid', 'admin', 'admin@healthchain.co.th', '\$2a\$12\$hash1', 'System', 'Administrator', 'admin', true, true, NOW(), NOW()),
('dr-smith-uuid', 'dr_smith', 'dr.smith@healthchain.co.th', '\$2a\$12\$hash2', 'Dr. John', 'Smith', 'doctor', true, true, NOW(), NOW()),
('nurse-wilson-uuid', 'nurse_wilson', 'nurse.wilson@healthchain.co.th', '\$2a\$12\$hash3', 'Sarah', 'Wilson', 'nurse', true, true, NOW(), NOW()),
('patient-doe-uuid', 'patient_doe', 'john.doe@email.com', '\$2a\$12\$hash5', 'John', 'Doe', 'patient', true, true, NOW(), NOW()),
('patient-somchai-uuid', 'patient_somchai', 'somchai@email.com', '\$2a\$12\$hash6', 'สมชาย', 'ใจดี', 'patient', true, true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert sample patients
\echo 'Inserting sample patients...'
INSERT INTO patients (id, hospital_number, national_id, first_name, last_name, thai_name, gender, date_of_birth, phone, email, address, district, province, postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, blood_type, allergies, chronic_conditions, current_medications, insurance_provider, insurance_policy_number, created_at, updated_at) VALUES
('john-doe-patient-uuid', '68-123456', '1234567890123', 'John', 'Doe', 'จอห์น โด', 'male', '1985-05-15', '081-234-5678', 'john.doe@email.com', '123 Sukhumvit Road, Bangkok 10110', 'Watthana', 'Bangkok', '10110', 'Jane Doe', '082-345-6789', 'Wife', 'O+', '["Penicillin", "Shellfish"]', '["Hypertension"]', '["Amlodipine 5mg daily"]', 'Social Security', 'SS-123456789', NOW(), NOW()),
('somchai-patient-uuid', '68-123457', '2345678901234', 'สมชาย', 'ใจดี', 'สมชาย ใจดี', 'male', '1978-03-22', '081-234-5679', 'somchai@email.com', '456 ถนนสุขุมวิท กรุงเทพฯ 10110', 'วัฒนา', 'กรุงเทพฯ', '10110', 'นางสมใจ ใจดี', '082-345-6790', 'ภรรยา', 'A+', '[]', '["Diabetes Type 2"]', '["Metformin 500mg twice daily"]', 'ประกันสังคม', 'PS-234567890', NOW(), NOW())
ON CONFLICT (hospital_number) DO NOTHING;

-- Insert sample visits
\echo 'Inserting sample visits...'
INSERT INTO visits (id, patient_id, visit_number, visit_date, visit_time, visit_type, chief_complaint, present_illness, physical_examination, diagnosis, treatment_plan, status, priority, attending_doctor_id, assigned_nurse_id, created_at, updated_at) VALUES
('visit-1-uuid', 'john-doe-patient-uuid', 'V-2025-001', '2025-01-15', '09:00', 'consultation', 'Chest pain and shortness of breath', 'Patient reports chest pain that started 2 days ago, worsens with exertion', 'BP: 150/95, HR: 88, RR: 18, Temp: 36.8°C', 'Hypertension, possible angina', 'Start antihypertensive medication, lifestyle modifications', 'completed', 'normal', 'dr-smith-uuid', 'nurse-wilson-uuid', NOW(), NOW()),
('visit-2-uuid', 'john-doe-patient-uuid', 'V-2025-002', '2025-01-22', '10:30', 'follow_up', 'Follow-up for hypertension', 'Patient reports improvement in chest pain since starting medication', 'BP: 135/85, HR: 82, RR: 16, Temp: 36.5°C', 'Hypertension - controlled', 'Continue current medication, monitor blood pressure', 'completed', 'normal', 'dr-smith-uuid', 'nurse-wilson-uuid', NOW(), NOW())
ON CONFLICT (visit_number) DO NOTHING;

-- Insert sample vital signs
\echo 'Inserting sample vital signs...'
INSERT INTO vital_signs (id, visit_id, patient_id, weight, height, bmi, systolic_bp, diastolic_bp, heart_rate, body_temperature, respiratory_rate, oxygen_saturation, blood_sugar, pain_level, general_condition, notes, measurement_time, measured_by, created_at, updated_at) VALUES
('vitals-1-uuid', 'visit-1-uuid', 'john-doe-patient-uuid', 75.5, 175, 24.7, 150, 95, 88, 36.8, 18, 98, 95, 3, 'Stable', 'Patient appears comfortable, no acute distress', '2025-01-15 09:15:00', 'nurse-wilson-uuid', NOW(), NOW()),
('vitals-2-uuid', 'visit-2-uuid', 'john-doe-patient-uuid', 74.8, 175, 24.4, 135, 85, 82, 36.5, 16, 99, 88, 0, 'Good', 'Significant improvement in blood pressure', '2025-01-22 10:45:00', 'nurse-wilson-uuid', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

\echo '✅ Sample data inserted successfully!'

EOF

echo "🎉 Database seeding completed!"
```

---

## 🚀 การใช้งาน Sample Data

### 1. รัน Seeding Script
```bash
# ให้สิทธิ์ execute
chmod +x seed_database.sh

# รัน script
./seed_database.sh
```

### 2. ตรวจสอบข้อมูล
```bash
# ตรวจสอบ users
psql -U postgres -d emr_development -c "SELECT username, role, is_active FROM users;"

# ตรวจสอบ patients
psql -U postgres -d emr_development -c "SELECT hospital_number, thai_name, gender FROM patients;"

# ตรวจสอบ visits
psql -U postgres -d emr_development -c "SELECT visit_number, visit_date, diagnosis FROM visits;"
```

### 3. ทดสอบการเข้าถึงข้อมูล
```bash
# Login และทดสอบ API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# ค้นหาผู้ป่วย
curl -X GET "http://localhost:3001/api/patients/search?query=สมชาย" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**🎉 Sample Data พร้อมใช้งาน! ระบบมีข้อมูลตัวอย่างให้ทดสอบแล้ว!**
