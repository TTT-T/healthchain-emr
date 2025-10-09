-- EMR Core Database Tables
-- Created: January 10, 2025
-- Purpose: Core medical record functionality

-- =============================================================================
-- 1. USERS TABLE - ผู้ใช้งานระบบ
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    thai_first_name VARCHAR(100),
    thai_last_name VARCHAR(100),
    title VARCHAR(50),
    national_id VARCHAR(20),
    birth_date DATE,
    birth_day INTEGER,
    birth_month INTEGER,
    birth_year INTEGER,
    gender VARCHAR(10),
    blood_type VARCHAR(5),
    role VARCHAR(30) NOT NULL DEFAULT 'patient' 
        CHECK (role IN ('patient', 'doctor', 'nurse', 'admin', 'staff', 'pharmacist', 'lab_tech', 'medical_staff', 'external_requester', 'external_admin', 'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor', 'patient_guardian', 'legal_representative', 'medical_attorney')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    address TEXT,
    id_card_address TEXT,
    current_address TEXT,
    nationality VARCHAR(50) DEFAULT 'Thai',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    allergies TEXT,
    drug_allergies TEXT,
    food_allergies TEXT,
    environment_allergies TEXT,
    medical_history TEXT,
    current_medications TEXT,
    chronic_diseases TEXT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    occupation VARCHAR(100),
    education VARCHAR(100),
    marital_status VARCHAR(20),
    religion VARCHAR(50),
    race VARCHAR(50),
    insurance_type VARCHAR(50),
    insurance_number VARCHAR(50),
    insurance_expiry_date DATE,
    insurance_expiry_day INTEGER,
    insurance_expiry_month INTEGER,
    insurance_expiry_year INTEGER,
    profile_image TEXT,
    last_login TIMESTAMP,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. DEPARTMENTS TABLE - หน่วยงาน/แผนก
-- =============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(20) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (id, department_code, department_name, department_type, description, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'MED', 'อายุรกรรม', 'medical', 'แผนกอายุรกรรม', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'SUR', 'ศัลยกรรม', 'medical', 'แผนกศัลยกรรม', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PED', 'กุมารเวชกรรม', 'medical', 'แผนกกุมารเวชกรรม', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'OBG', 'สูติ-นรีเวชกรรม', 'medical', 'แผนกสูติ-นรีเวชกรรม', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'EYE', 'จักษุวิทยา', 'medical', 'แผนกจักษุวิทยา', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'ENT', 'หู คอ จมูก', 'medical', 'แผนกหู คอ จมูก', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'ORT', 'กระดูกและข้อ', 'medical', 'แผนกกระดูกและข้อ', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PSY', 'จิตเวช', 'medical', 'แผนกจิตเวช', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'DER', 'ผิวหนัง', 'medical', 'แผนกผิวหนัง', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'REH', 'เวชศาสตร์ฟื้นฟู', 'medical', 'แผนกเวชศาสตร์ฟื้นฟู', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (department_code) DO NOTHING;

-- =============================================================================
-- 3. PATIENTS TABLE - ข้อมูลผู้ป่วย
-- =============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    
    -- Personal Information
    patient_number VARCHAR(20) UNIQUE NOT NULL, -- P2025070001
    hn VARCHAR(20), -- Hospital Number
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    thai_first_name VARCHAR(100),
    thai_last_name VARCHAR(100),
    thai_name VARCHAR(200),
    title VARCHAR(50),
    national_id VARCHAR(20),
    
    -- Basic Information
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    nationality VARCHAR(50) DEFAULT 'Thai',
    religion VARCHAR(50),
    race VARCHAR(50),
    occupation VARCHAR(100),
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    education VARCHAR(100),
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    id_card_address TEXT,
    current_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Medical Information
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'A', 'B', 'AB', 'O')),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    allergies TEXT,
    drug_allergies TEXT,
    food_allergies TEXT,
    environment_allergies TEXT,
    chronic_diseases TEXT,
    medical_history TEXT,
    current_medications TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- =============================================================================
-- 4. VISITS TABLE - การมาพบแพทย์
-- =============================================================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient & Visit Information
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_number VARCHAR(20) UNIQUE NOT NULL, -- V2025070001
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME NOT NULL DEFAULT CURRENT_TIME,
    
    -- Visit Details
    visit_type VARCHAR(20) NOT NULL DEFAULT 'walk_in' 
        CHECK (visit_type IN ('walk_in', 'appointment', 'emergency', 'follow_up', 'referral')),
    chief_complaint TEXT, -- อาการสำคัญ
    present_illness TEXT, -- ประวัติการเจ็บป่วยปัจจุบัน
    
    -- Physical Examination
    physical_examination TEXT,
    diagnosis TEXT, -- การวินิจฉัย
    treatment_plan TEXT, -- แผนการรักษา
    doctor_notes TEXT, -- บันทึกแพทย์
    recommendations TEXT, -- คำแนะนำ
    
    -- Visit Status
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    priority VARCHAR(10) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Staff Information
    attending_doctor_id UUID,
    assigned_nurse_id UUID,
    department_id UUID REFERENCES departments(id),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- =============================================================================
-- 5. VITAL SIGNS TABLE - สัญญาณชีพ
-- =============================================================================
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Basic Vital Signs
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation DECIMAL(5,2),
    
    -- Additional Measurements
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location TEXT,
    blood_glucose DECIMAL(5,2),
    waist_circumference DECIMAL(5,2),
    position VARCHAR(50),
    
    -- AI Risk Assessment Fields
    diabetes_risk_score DECIMAL(3,2),
    hypertension_risk_score DECIMAL(3,2),
    cardiovascular_risk_score DECIMAL(3,2),
    
    -- System Fields
    recorded_by UUID NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measurement_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_by UUID,
    notes TEXT,
    abnormal_findings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 6. LAB ORDERS TABLE - ใบสั่งตรวจ
-- =============================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit & Patient Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Order Information
    order_number VARCHAR(20) UNIQUE NOT NULL, -- L2025070001
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_time TIME NOT NULL DEFAULT CURRENT_TIME,
    
    -- Test Details
    test_type VARCHAR(100) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    clinical_indication TEXT,
    special_instructions TEXT,
    specimen_type VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal',
    requested_completion TIMESTAMP,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ordered'
        CHECK (status IN ('ordered', 'collected', 'processing', 'completed', 'cancelled')),
    
    -- Staff Information
    ordered_by UUID NOT NULL,
    collected_by UUID,
    collection_date DATE,
    collection_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 7. LAB RESULTS TABLE - ผลตรวจแลป
-- =============================================================================
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit & Patient Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    lab_order_id UUID REFERENCES lab_orders(id) ON DELETE SET NULL,
    
    -- Result Information
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    result_value VARCHAR(255),
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    result_status VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (result_status IN ('normal', 'abnormal', 'critical', 'pending')),
    
    -- Additional Information
    result_notes TEXT,
    interpretation TEXT,
    recommendations TEXT,
    
    -- Staff Information
    performed_by UUID,
    verified_by UUID,
    
    -- System Fields
    result_date DATE NOT NULL DEFAULT CURRENT_DATE,
    result_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. PRESCRIPTIONS TABLE - ใบสั่งยา
-- =============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit & Patient Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Prescription Information
    prescription_number VARCHAR(20) UNIQUE NOT NULL, -- RX2025070001
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    prescription_time TIME NOT NULL DEFAULT CURRENT_TIME,
    
    -- Prescription Details
    diagnosis TEXT,
    instructions TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    
    -- Staff Information
    prescribed_by UUID NOT NULL,
    dispensed_by UUID,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 9. PRESCRIPTION ITEMS TABLE - รายการยาในใบสั่ง
-- =============================================================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Prescription Reference
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Medication Information
    medication_name VARCHAR(255) NOT NULL,
    medication_code VARCHAR(50),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INTEGER,
    unit VARCHAR(50),
    
    -- Instructions
    instructions TEXT,
    side_effects TEXT,
    contraindications TEXT,
    
    -- Status
    item_status VARCHAR(20) NOT NULL DEFAULT 'prescribed'
        CHECK (item_status IN ('prescribed', 'dispensed', 'completed', 'cancelled')),
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 10. VISIT ATTACHMENTS TABLE - ไฟล์แนบการมาพบ
-- =============================================================================
CREATE TABLE IF NOT EXISTS visit_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    file_type VARCHAR(50) NOT NULL, -- "image/jpeg", "application/pdf"
    mime_type VARCHAR(100) NOT NULL,
    
    -- Attachment Details
    attachment_type VARCHAR(50) NOT NULL 
        CHECK (attachment_type IN ('photo', 'document', 'lab_image', 'xray', 'scan', 'report', 'other')),
    description TEXT,
    
    -- Security
    is_sensitive BOOLEAN DEFAULT TRUE,
    encryption_key VARCHAR(255), -- For encrypted files
    
    -- Upload Information
    uploaded_by UUID NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR CORE TABLES
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_blood_type ON patients(blood_type);

-- Visits indexes
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON visits(attending_doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);

-- Vital signs indexes
CREATE INDEX IF NOT EXISTS idx_vital_signs_visit_id ON vital_signs(visit_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs(recorded_at);

-- Lab orders indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_visit_id ON lab_orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_number ON lab_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);

-- Lab results indexes
CREATE INDEX IF NOT EXISTS idx_lab_results_visit_id ON lab_results(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_lab_order_id ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_result_status ON lab_results(result_status);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_number ON prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Prescription items indexes
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_name ON prescription_items(medication_name);
CREATE INDEX IF NOT EXISTS idx_prescription_items_status ON prescription_items(item_status);

-- Visit attachments indexes
CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit_id ON visit_attachments(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_attachments_patient_id ON visit_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_attachments_type ON visit_attachments(attachment_type);

-- =============================================================================
-- SEQUENCES FOR NUMBER GENERATION
-- =============================================================================

-- Patient Number Sequence
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1;

-- Visit Number Sequence
CREATE SEQUENCE IF NOT EXISTS visit_number_seq START 1;

-- Lab Order Number Sequence  
CREATE SEQUENCE IF NOT EXISTS lab_order_number_seq START 1;

-- Prescription Number Sequence
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at BEFORE UPDATE ON vital_signs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_items_updated_at BEFORE UPDATE ON prescription_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_attachments_updated_at BEFORE UPDATE ON visit_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- =============================================================================
-- ENHANCED DATA TABLES - ตารางข้อมูลเพิ่มเติม
-- =============================================================================

-- Detailed Nutrition Table
CREATE TABLE IF NOT EXISTS detailed_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    daily_calorie_intake INTEGER,
    protein_intake DECIMAL(5,2),
    carbohydrate_intake DECIMAL(5,2),
    fat_intake DECIMAL(5,2),
    fiber_intake DECIMAL(5,2),
    sugar_intake DECIMAL(5,2),
    sodium_intake DECIMAL(5,2),
    water_intake DECIMAL(5,2),
    meal_frequency INTEGER,
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Exercise Table
CREATE TABLE IF NOT EXISTS detailed_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    exercise_type VARCHAR(100),
    exercise_duration INTEGER, -- minutes
    exercise_intensity VARCHAR(50),
    exercise_frequency INTEGER, -- times per week
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for enhanced data tables
CREATE TRIGGER update_detailed_nutrition_updated_at BEFORE UPDATE ON detailed_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detailed_exercise_updated_at BEFORE UPDATE ON detailed_exercise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'ผู้ใช้งานระบบ - System users';
COMMENT ON TABLE departments IS 'หน่วยงาน/แผนก - Hospital departments';
COMMENT ON TABLE patients IS 'ข้อมูลผู้ป่วย - Patient information';
COMMENT ON TABLE visits IS 'การมาพบแพทย์ - Medical visits';
COMMENT ON TABLE detailed_nutrition IS 'ข้อมูลโภชนาการรายละเอียด - Detailed nutrition assessment';
COMMENT ON TABLE detailed_exercise IS 'ข้อมูลการออกกำลังกายรายละเอียด - Detailed exercise assessment';
COMMENT ON TABLE vital_signs IS 'สัญญาณชีพ - Vital signs measurements';
COMMENT ON TABLE lab_orders IS 'ใบสั่งตรวจ - Laboratory test orders';
COMMENT ON TABLE lab_results IS 'ผลตรวจแลป - Laboratory test results';
COMMENT ON TABLE prescriptions IS 'ใบสั่งยา - Medical prescriptions';
COMMENT ON TABLE prescription_items IS 'รายการยาในใบสั่ง - Prescription items';
COMMENT ON TABLE visit_attachments IS 'ไฟล์แนบการมาพบ - Visit attachments';
COMMENT ON TABLE detailed_nutrition IS 'ข้อมูลโภชนาการรายละเอียด - Detailed nutrition assessment';
COMMENT ON TABLE detailed_exercise IS 'ข้อมูลการออกกำลังกายรายละเอียด - Detailed exercise assessment';

-- =============================================================================
-- 11. APPOINTMENTS TABLE - การนัดหมาย
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    department_id UUID REFERENCES departments(id),
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Status and Information
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
    reason TEXT,
    notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- =============================================================================
-- 12. NOTIFICATIONS TABLE - การแจ้งเตือน
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    patient_id UUID,
    
    -- Notification Details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' 
        CHECK (type IN ('info', 'warning', 'error', 'success', 'appointment', 'lab_result', 'prescription', 'consent_request', 'consent_response', 'system')),
    notification_type VARCHAR(50),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Action Required
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    
    -- Related Data
    related_table VARCHAR(50), -- 'appointments', 'lab_results', etc.
    related_id UUID,
    metadata JSONB,
    
    -- Staff Information
    created_by UUID,
    
    -- Expiration
    expires_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- =============================================================================
-- 13. MEDICAL RECORDS TABLE - บันทึกทางการแพทย์
-- =============================================================================
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    
    -- Record Information
    record_type VARCHAR(50) NOT NULL 
        CHECK (record_type IN ('diagnosis', 'treatment', 'medication', 'lab_result', 'vital_signs', 'note', 'history_taking', 'doctor_visit', 'pharmacy_dispensing', 'ai_research_data', 'other')),
    title VARCHAR(255),
    content TEXT,
    
    -- History Taking Fields
    chief_complaint TEXT,
    present_illness TEXT,
    past_history TEXT,
    family_history TEXT,
    social_history TEXT,
    pregnancy_history TEXT,
    dietary_history TEXT,
    lifestyle_factors TEXT,
    review_of_systems TEXT,
    surgical_history TEXT,
    drug_allergies TEXT,
    current_medications TEXT,
    
    -- Doctor Visit Fields
    physical_exam TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    advice TEXT,
    follow_up TEXT,
    
    -- Pharmacy Dispensing Fields
    medications JSONB,
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    
    -- AI Research Data Fields
    ai_data JSONB,
    data_version VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Classification
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    
    -- Notes
    notes TEXT,
    
    -- Staff Information
    created_by UUID,
    recorded_by UUID,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 14. AUDIT LOGS TABLE - บันทึกการใช้งาน
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID,
    user_email VARCHAR(100),
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    resource VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 15. USER SESSIONS TABLE - เซสชันผู้ใช้
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Session Information
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255),
    
    -- Device Information
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 16. PASSWORD RESET TOKENS TABLE - โทเค็นรีเซ็ตรหัสผ่าน
-- =============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Token Information
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- Status
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 17. EMAIL VERIFICATION TOKENS TABLE - โทเค็นยืนยันอีเมล
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Token Information
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- Status
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 18. USER SECURITY SETTINGS TABLE - การตั้งค่าความปลอดภัย
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Password Settings
    password_changed_at TIMESTAMP,
    password_expires_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 19. EXTERNAL DATA REQUESTS TABLE - คำขอข้อมูลจากองค์กรภายนอก
-- =============================================================================
CREATE TABLE IF NOT EXISTS external_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Information
    request_id VARCHAR(50) UNIQUE NOT NULL, -- REQ2025070001
    request_type VARCHAR(50) NOT NULL 
        CHECK (request_type IN ('patient_data', 'aggregated_statistics', 'research_data', 'audit_data', 'organization_registration')),
    
    -- Requester Information
    requester_name VARCHAR(255) NOT NULL,
    requester_organization VARCHAR(255) NOT NULL,
    requester_email VARCHAR(100) NOT NULL,
    requester_phone VARCHAR(20),
    requester_address TEXT,
    
    -- Request Details
    requested_data_types TEXT[], -- Array of data types
    purpose TEXT NOT NULL,
    data_usage_period VARCHAR(100),
    consent_required BOOLEAN DEFAULT TRUE,
    
    -- Data Scope
    patient_ids UUID[], -- Array of specific patient IDs
    date_range_start DATE,
    date_range_end DATE,
    additional_requirements TEXT,
    
    -- Status and Approval
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled', 'completed')),
    
    -- Approval Information
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_notes TEXT,
    rejected_reason TEXT,
    
    -- Data Transfer
    data_volume BIGINT DEFAULT 0, -- bytes
    transfer_method VARCHAR(50),
    transfer_status VARCHAR(20) DEFAULT 'pending'
        CHECK (transfer_status IN ('pending', 'in_progress', 'completed', 'failed')),
    transfer_started_at TIMESTAMP,
    transfer_completed_at TIMESTAMP,
    
    -- Compliance
    compliance_certifications TEXT[],
    data_protection_certification VARCHAR(255),
    last_compliance_audit DATE,
    
    -- Additional Registration Fields
    organization_type VARCHAR(50),
    registration_number VARCHAR(100),
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    address JSONB,
    allowed_request_types TEXT[],
    data_access_level VARCHAR(20) DEFAULT 'basic'
        CHECK (data_access_level IN ('basic', 'standard', 'premium', 'research')),
    max_concurrent_requests INTEGER DEFAULT 5,
    verification_documents JSONB,
    
    -- System Fields
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 20. EXTERNAL ORGANIZATIONS TABLE - องค์กรภายนอก
-- =============================================================================
CREATE TABLE IF NOT EXISTS external_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Information
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    organization_type VARCHAR(50) NOT NULL 
        CHECK (organization_type IN ('hospital', 'clinic', 'research_institute', 'government_agency', 'insurance_company', 'other')),
    
    -- Registration Information
    registration_number VARCHAR(100),
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    
    -- Contact Information
    primary_contact_name VARCHAR(255) NOT NULL,
    primary_contact_email VARCHAR(100) NOT NULL,
    primary_contact_phone VARCHAR(20),
    address TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    verified_by UUID,
    
    -- Access Control
    allowed_request_types TEXT[] DEFAULT ARRAY['aggregated_statistics'],
    data_access_level VARCHAR(20) DEFAULT 'basic'
        CHECK (data_access_level IN ('basic', 'standard', 'premium', 'research')),
    max_concurrent_requests INTEGER DEFAULT 5,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    suspension_reason TEXT,
    
    -- Compliance
    compliance_certifications TEXT[],
    data_protection_certification VARCHAR(255),
    last_compliance_audit DATE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- =============================================================================
-- 21. EXTERNAL REQUEST LOGS TABLE - บันทึกการใช้งาน
-- =============================================================================
CREATE TABLE IF NOT EXISTS external_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Reference
    request_id UUID NOT NULL REFERENCES external_data_requests(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES external_organizations(id),
    
    -- Action Information
    action VARCHAR(100) NOT NULL,
    action_details TEXT,
    performed_by UUID,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ADDITIONAL INDEXES FOR ALL TABLES
-- =============================================================================

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Medical records indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_id ON medical_records(visit_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_by ON medical_records(created_by);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Password reset tokens indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Email verification tokens indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON email_verification_tokens(email);

-- User security settings indexes
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_two_factor ON user_security_settings(two_factor_enabled);

-- External data requests indexes
CREATE INDEX IF NOT EXISTS idx_external_data_requests_request_id ON external_data_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_requester_email ON external_data_requests(requester_email);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_requester_organization ON external_data_requests(requester_organization);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_request_type ON external_data_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_status ON external_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_created_at ON external_data_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_external_data_requests_approved_by ON external_data_requests(approved_by);

-- External organizations indexes
CREATE INDEX IF NOT EXISTS idx_external_organizations_name ON external_organizations(organization_name);
CREATE INDEX IF NOT EXISTS idx_external_organizations_type ON external_organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_external_organizations_contact_email ON external_organizations(primary_contact_email);
CREATE INDEX IF NOT EXISTS idx_external_organizations_status ON external_organizations(status);
CREATE INDEX IF NOT EXISTS idx_external_organizations_is_verified ON external_organizations(is_verified);

-- External request logs indexes
CREATE INDEX IF NOT EXISTS idx_external_request_logs_request_id ON external_request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_external_request_logs_organization_id ON external_request_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_request_logs_action ON external_request_logs(action);
CREATE INDEX IF NOT EXISTS idx_external_request_logs_created_at ON external_request_logs(created_at);

-- =============================================================================
-- ADDITIONAL SEQUENCES
-- =============================================================================

-- External Request Number Sequence
CREATE SEQUENCE IF NOT EXISTS external_request_number_seq START 1;

-- =============================================================================
-- ADDITIONAL TRIGGERS
-- =============================================================================

-- Triggers for updated_at
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE ON user_security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_data_requests_updated_at BEFORE UPDATE ON external_data_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_organizations_updated_at BEFORE UPDATE ON external_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ADDITIONAL COMMENTS
-- =============================================================================

COMMENT ON TABLE appointments IS 'การนัดหมาย - Patient appointments';
COMMENT ON TABLE notifications IS 'การแจ้งเตือน - System notifications';
COMMENT ON TABLE medical_records IS 'บันทึกทางการแพทย์ - Medical records';
COMMENT ON TABLE audit_logs IS 'บันทึกการใช้งาน - Audit trail';
COMMENT ON TABLE user_sessions IS 'เซสชันผู้ใช้ - User sessions';
COMMENT ON TABLE password_reset_tokens IS 'โทเค็นรีเซ็ตรหัสผ่าน - Password reset tokens';
COMMENT ON TABLE email_verification_tokens IS 'โทเค็นยืนยันอีเมล - Email verification tokens';
COMMENT ON TABLE user_security_settings IS 'การตั้งค่าความปลอดภัย - User security settings';
COMMENT ON TABLE external_data_requests IS 'คำขอข้อมูลจากองค์กรภายนอก - External organization data requests';
COMMENT ON TABLE external_organizations IS 'องค์กรภายนอก - External organizations';
COMMENT ON TABLE external_request_logs IS 'บันทึกการใช้งานคำขอภายนอก - External request activity logs';

-- =============================================================================
-- 22. CONSENT REQUESTS TABLE - คำขอเข้าถึงข้อมูล
-- =============================================================================
CREATE TABLE IF NOT EXISTS consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    
    -- Request Information
    request_type VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    data_types TEXT[] NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
    
    -- Dates
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_reason TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 23. CONSENT CONTRACTS TABLE - สัญญาการยินยอม
-- =============================================================================
CREATE TABLE IF NOT EXISTS consent_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    consent_request_id UUID REFERENCES consent_requests(id),
    
    -- Contract Details
    contract_type VARCHAR(50) NOT NULL,
    allowed_data_types TEXT[] NOT NULL,
    purpose TEXT NOT NULL,
    conditions JSONB,
    
    -- Smart Contract Rules
    smart_contract_rules JSONB,
    auto_expire BOOLEAN DEFAULT TRUE,
    auto_revoke_conditions JSONB,
    audit_logging BOOLEAN DEFAULT TRUE,
    encryption_required BOOLEAN DEFAULT TRUE,
    
    -- Access Control
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    access_level VARCHAR(20) DEFAULT 'read_only'
        CHECK (access_level IN ('read_only', 'read_write', 'full_access')),
    
    -- Validity Period
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'suspended')),
    revoked_at TIMESTAMP,
    revoked_by UUID,
    revoked_reason TEXT,
    suspension_reason TEXT,
    
    -- Last Access
    last_accessed TIMESTAMP,
    last_accessed_by UUID,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =============================================================================
-- 24. CONSENT ACCESS LOGS TABLE - บันทึกการเข้าถึงตาม Consent
-- =============================================================================
CREATE TABLE IF NOT EXISTS consent_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_contract_id UUID NOT NULL REFERENCES consent_contracts(id),
    patient_id UUID NOT NULL,
    accessed_by UUID NOT NULL,
    
    -- Access Details
    access_type VARCHAR(50) NOT NULL,
    data_accessed TEXT[],
    access_reason TEXT,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    
    -- Access Result
    access_granted BOOLEAN DEFAULT TRUE,
    denial_reason TEXT,
    
    -- System Fields
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 25. CONSENT AUDIT TRAIL TABLE - ติดตามการเปลี่ยนแปลง Consent
-- =============================================================================
CREATE TABLE IF NOT EXISTS consent_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_contract_id UUID REFERENCES consent_contracts(id),
    consent_request_id UUID REFERENCES consent_requests(id),
    
    -- Audit Information
    action VARCHAR(100) NOT NULL,
    performed_by UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    change_description TEXT,
    
    -- Compliance
    compliance_check_passed BOOLEAN DEFAULT TRUE,
    compliance_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 26. COMPLIANCE ALERTS TABLE - การแจ้งเตือน Compliance
-- =============================================================================
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Alert Information
    alert_type VARCHAR(50) NOT NULL
        CHECK (alert_type IN ('violation', 'warning', 'info', 'critical')),
    alert_category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Related Records
    related_table VARCHAR(50),
    related_id UUID,
    consent_contract_id UUID REFERENCES consent_contracts(id),
    
    -- Severity
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    priority INTEGER DEFAULT 3,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed', 'escalated')),
    
    -- Resolution
    resolved_at TIMESTAMP,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Assigned To
    assigned_to UUID,
    assigned_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =============================================================================
-- 27. AI RESEARCH DATA TABLE - ข้อมูลสำหรับการวิจัย AI
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    
    -- Record Reference
    record_type VARCHAR(50) NOT NULL
        CHECK (record_type IN ('doctor_visit', 'pharmacy', 'lab_result', 'appointment', 'vital_signs', 'other')),
    record_id TEXT,
    
    -- Research Data (JSONB for flexibility)
    research_data JSONB NOT NULL,
    data_version VARCHAR(20) DEFAULT '1.0',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Staff Information
    recorded_by UUID,
    recorded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 28. QUEUE HISTORY TABLE - ประวัติการจัดการคิว
-- =============================================================================
CREATE TABLE IF NOT EXISTS queue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Queue Information
    queue_number VARCHAR(20) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    patient_id UUID NOT NULL,
    
    -- Patient Information (denormalized for quick access)
    patient_hn VARCHAR(20),
    patient_name VARCHAR(200),
    patient_national_id VARCHAR(20),
    
    -- Visit Information
    treatment_type VARCHAR(100),
    department VARCHAR(100),
    symptoms TEXT,
    
    -- Doctor Information
    doctor_id UUID,
    doctor_name VARCHAR(200),
    
    -- Queue Status
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    -- Timing
    visit_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    waiting_time_minutes INTEGER,
    service_time_minutes INTEGER,
    
    -- Additional Information
    notes TEXT,
    pdf_url TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =============================================================================
-- 29. ACTIVITY LOGS TABLE - บันทึกกิจกรรมผู้ใช้
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID NOT NULL,
    user_email VARCHAR(100),
    user_role VARCHAR(30),
    
    -- Activity Details
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(50),
    description TEXT,
    
    -- Target Resource
    target_table VARCHAR(100),
    target_id UUID,
    target_name VARCHAR(255),
    
    -- Action Details
    action_data JSONB,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 30. ROLE PERMISSIONS TABLE - การจัดการสิทธิ์
-- =============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Role Information
    role VARCHAR(30) NOT NULL,
    
    -- Permission Details
    resource VARCHAR(100) NOT NULL,
    actions TEXT[] NOT NULL, -- ['create', 'read', 'update', 'delete']
    
    -- Constraints
    conditions JSONB, -- Additional conditions for permission
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Unique constraint
    UNIQUE(role, resource)
);

-- =============================================================================
-- 31. SYSTEM SETTINGS TABLE - การตั้งค่าระบบ
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Setting Information
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string'
        CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    
    -- Metadata
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Validation
    validation_rules JSONB,
    default_value TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- =============================================================================
-- 32. DATABASE BACKUPS TABLE - ข้อมูลการสำรองฐานข้อมูล
-- =============================================================================
CREATE TABLE IF NOT EXISTS database_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Backup Information
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(20) NOT NULL DEFAULT 'full'
        CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_size BIGINT, -- bytes
    
    -- File Information
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    
    -- Backup Status
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Additional Information
    database_name VARCHAR(100),
    backup_method VARCHAR(50),
    compression_used BOOLEAN DEFAULT TRUE,
    encryption_used BOOLEAN DEFAULT TRUE,
    
    -- Result
    error_message TEXT,
    notes TEXT,
    
    -- Retention
    retention_days INTEGER DEFAULT 30,
    expires_at TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- =============================================================================
-- INDEXES FOR NEW TABLES
-- =============================================================================

-- Consent requests indexes
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_requester_id ON consent_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_requested_at ON consent_requests(requested_at);

-- Consent contracts indexes
CREATE INDEX IF NOT EXISTS idx_consent_contracts_contract_id ON consent_contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_patient_id ON consent_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_requester_id ON consent_contracts(requester_id);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_status ON consent_contracts(status);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_valid_until ON consent_contracts(valid_until);

-- Consent access logs indexes
CREATE INDEX IF NOT EXISTS idx_consent_access_logs_contract_id ON consent_access_logs(consent_contract_id);
CREATE INDEX IF NOT EXISTS idx_consent_access_logs_patient_id ON consent_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_access_logs_accessed_by ON consent_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_consent_access_logs_accessed_at ON consent_access_logs(accessed_at);

-- Consent audit trail indexes
CREATE INDEX IF NOT EXISTS idx_consent_audit_trail_contract_id ON consent_audit_trail(consent_contract_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_trail_request_id ON consent_audit_trail(consent_request_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_trail_action ON consent_audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_trail_created_at ON consent_audit_trail(created_at);

-- Compliance alerts indexes
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_alert_type ON compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_assigned_to ON compliance_alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created_at ON compliance_alerts(created_at);

-- AI research data indexes
CREATE INDEX IF NOT EXISTS idx_ai_research_data_patient_id ON ai_research_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_record_type ON ai_research_data(record_type);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_is_active ON ai_research_data(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_recorded_time ON ai_research_data(recorded_time);

-- Enhanced data indexes
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_patient_id ON detailed_nutrition(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessment_date ON detailed_nutrition(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_patient_id ON detailed_exercise(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessment_date ON detailed_exercise(assessment_date);

-- Queue history indexes
CREATE INDEX IF NOT EXISTS idx_queue_history_patient_id ON queue_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_visit_id ON queue_history(visit_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_doctor_id ON queue_history(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_history_status ON queue_history(status);
CREATE INDEX IF NOT EXISTS idx_queue_history_visit_time ON queue_history(visit_time);
CREATE INDEX IF NOT EXISTS idx_queue_history_queue_number ON queue_history(queue_number);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_table ON activity_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Role permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_is_active ON role_permissions(is_active);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_setting_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Database backups indexes
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON database_backups(status);
CREATE INDEX IF NOT EXISTS idx_database_backups_started_at ON database_backups(started_at);
CREATE INDEX IF NOT EXISTS idx_database_backups_expires_at ON database_backups(expires_at);

-- =============================================================================
-- ADDITIONAL SEQUENCES FOR NEW TABLES
-- =============================================================================

-- Consent Contract ID Sequence
CREATE SEQUENCE IF NOT EXISTS consent_contract_number_seq START 1;

-- Queue Number Sequence
CREATE SEQUENCE IF NOT EXISTS queue_number_seq START 1;

-- =============================================================================
-- ADDITIONAL TRIGGERS FOR NEW TABLES
-- =============================================================================

-- Triggers for updated_at on new tables
CREATE TRIGGER update_consent_requests_updated_at BEFORE UPDATE ON consent_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_contracts_updated_at BEFORE UPDATE ON consent_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_alerts_updated_at BEFORE UPDATE ON compliance_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_research_data_updated_at BEFORE UPDATE ON ai_research_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_history_updated_at BEFORE UPDATE ON queue_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ADDITIONAL COMMENTS FOR NEW TABLES
-- =============================================================================

COMMENT ON TABLE consent_requests IS 'คำขอเข้าถึงข้อมูล - Data access consent requests';
COMMENT ON TABLE consent_contracts IS 'สัญญาการยินยอม - Consent contracts with smart contract rules';
COMMENT ON TABLE consent_access_logs IS 'บันทึกการเข้าถึงตาม Consent - Consent-based access logs';
COMMENT ON TABLE consent_audit_trail IS 'ติดตามการเปลี่ยนแปลง Consent - Consent change audit trail';
COMMENT ON TABLE compliance_alerts IS 'การแจ้งเตือน Compliance - Compliance violation alerts';
COMMENT ON TABLE ai_research_data IS 'ข้อมูลสำหรับการวิจัย AI - AI research and analytics data';
COMMENT ON TABLE queue_history IS 'ประวัติการจัดการคิว - Patient queue management history';
COMMENT ON TABLE activity_logs IS 'บันทึกกิจกรรมผู้ใช้ - User activity audit logs';
COMMENT ON TABLE role_permissions IS 'การจัดการสิทธิ์ - Role-based access control permissions';
COMMENT ON TABLE system_settings IS 'การตั้งค่าระบบ - System configuration settings';
COMMENT ON TABLE database_backups IS 'ข้อมูลการสำรองฐานข้อมูล - Database backup records';

-- =============================================================================
-- DOCTORS AND NURSES TABLES
-- =============================================================================

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medical_license_number VARCHAR(50) UNIQUE,
    specialization VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    hospital_affiliation VARCHAR(200),
    years_of_experience INTEGER,
    consultation_fee DECIMAL(10,2) DEFAULT 500.00,
    availability JSONB,
    education JSONB,
    certifications JSONB,
    languages JSONB,
    work_schedule JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create nurses table
CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nursing_license_number VARCHAR(50) UNIQUE,
    specialization VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    hospital_affiliation VARCHAR(200),
    years_of_experience INTEGER,
    availability JSONB,
    education JSONB,
    certifications JSONB,
    languages JSONB,
    work_schedule JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for doctors and nurses
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_medical_license ON doctors(medical_license_number);
CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_nurses_nursing_license ON nurses(nursing_license_number);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_nurses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_doctors_updated_at();

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON nurses
    FOR EACH ROW EXECUTE FUNCTION update_nurses_updated_at();

-- Add comments for doctors and nurses tables
COMMENT ON TABLE doctors IS 'ข้อมูลแพทย์ - Doctor professional information';
COMMENT ON TABLE nurses IS 'ข้อมูลพยาบาล - Nurse professional information';

-- =============================================================================
-- ADDITIONAL FOREIGN KEY CONSTRAINTS (from Migration 002)
-- =============================================================================
-- These foreign keys ensure referential integrity across the system
-- Added: October 6, 2025

-- Appointments Table Foreign Keys
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS fk_appointments_patient,
  ADD CONSTRAINT fk_appointments_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS fk_appointments_doctor,
  ADD CONSTRAINT fk_appointments_doctor 
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS fk_appointments_created_by,
  ADD CONSTRAINT fk_appointments_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS fk_appointments_updated_by,
  ADD CONSTRAINT fk_appointments_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Notifications Table Foreign Keys
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_user,
  ADD CONSTRAINT fk_notifications_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_patient,
  ADD CONSTRAINT fk_notifications_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_created_by,
  ADD CONSTRAINT fk_notifications_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Medical Records Table Foreign Keys
ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS fk_medical_records_patient,
  ADD CONSTRAINT fk_medical_records_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS fk_medical_records_created_by,
  ADD CONSTRAINT fk_medical_records_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS fk_medical_records_recorded_by,
  ADD CONSTRAINT fk_medical_records_recorded_by 
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Audit Logs Table Foreign Keys
ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS fk_audit_logs_user,
  ADD CONSTRAINT fk_audit_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- User Sessions Table Foreign Keys
ALTER TABLE user_sessions
  DROP CONSTRAINT IF EXISTS fk_user_sessions_user,
  ADD CONSTRAINT fk_user_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Password Reset Tokens Foreign Keys
ALTER TABLE password_reset_tokens
  DROP CONSTRAINT IF EXISTS fk_password_reset_tokens_user,
  ADD CONSTRAINT fk_password_reset_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Email Verification Tokens Foreign Keys
ALTER TABLE email_verification_tokens
  DROP CONSTRAINT IF EXISTS fk_email_verification_tokens_user,
  ADD CONSTRAINT fk_email_verification_tokens_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- User Security Settings Foreign Keys
ALTER TABLE user_security_settings
  DROP CONSTRAINT IF EXISTS fk_user_security_settings_user,
  ADD CONSTRAINT fk_user_security_settings_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Consent Requests Table Foreign Keys
ALTER TABLE consent_requests
  DROP CONSTRAINT IF EXISTS fk_consent_requests_patient,
  ADD CONSTRAINT fk_consent_requests_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE consent_requests
  DROP CONSTRAINT IF EXISTS fk_consent_requests_requester,
  ADD CONSTRAINT fk_consent_requests_requester 
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

-- Consent Contracts Table Foreign Keys
ALTER TABLE consent_contracts
  DROP CONSTRAINT IF EXISTS fk_consent_contracts_patient,
  ADD CONSTRAINT fk_consent_contracts_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE consent_contracts
  DROP CONSTRAINT IF EXISTS fk_consent_contracts_requester,
  ADD CONSTRAINT fk_consent_contracts_requester 
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE consent_contracts
  DROP CONSTRAINT IF EXISTS fk_consent_contracts_created_by,
  ADD CONSTRAINT fk_consent_contracts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE consent_contracts
  DROP CONSTRAINT IF EXISTS fk_consent_contracts_revoked_by,
  ADD CONSTRAINT fk_consent_contracts_revoked_by 
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE consent_contracts
  DROP CONSTRAINT IF EXISTS fk_consent_contracts_last_accessed_by,
  ADD CONSTRAINT fk_consent_contracts_last_accessed_by 
    FOREIGN KEY (last_accessed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Consent Access Logs Table Foreign Keys
ALTER TABLE consent_access_logs
  DROP CONSTRAINT IF EXISTS fk_consent_access_logs_patient,
  ADD CONSTRAINT fk_consent_access_logs_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE consent_access_logs
  DROP CONSTRAINT IF EXISTS fk_consent_access_logs_accessed_by,
  ADD CONSTRAINT fk_consent_access_logs_accessed_by 
    FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE CASCADE;

-- Consent Audit Trail Table Foreign Keys
ALTER TABLE consent_audit_trail
  DROP CONSTRAINT IF EXISTS fk_consent_audit_trail_performed_by,
  ADD CONSTRAINT fk_consent_audit_trail_performed_by 
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Compliance Alerts Table Foreign Keys
ALTER TABLE compliance_alerts
  DROP CONSTRAINT IF EXISTS fk_compliance_alerts_assigned_to,
  ADD CONSTRAINT fk_compliance_alerts_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE compliance_alerts
  DROP CONSTRAINT IF EXISTS fk_compliance_alerts_resolved_by,
  ADD CONSTRAINT fk_compliance_alerts_resolved_by 
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE compliance_alerts
  DROP CONSTRAINT IF EXISTS fk_compliance_alerts_created_by,
  ADD CONSTRAINT fk_compliance_alerts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- AI Research Data Table Foreign Keys
ALTER TABLE ai_research_data
  DROP CONSTRAINT IF EXISTS fk_ai_research_data_patient,
  ADD CONSTRAINT fk_ai_research_data_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE ai_research_data
  DROP CONSTRAINT IF EXISTS fk_ai_research_data_recorded_by,
  ADD CONSTRAINT fk_ai_research_data_recorded_by 
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Queue History Table Foreign Keys
ALTER TABLE queue_history
  DROP CONSTRAINT IF EXISTS fk_queue_history_patient,
  ADD CONSTRAINT fk_queue_history_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE queue_history
  DROP CONSTRAINT IF EXISTS fk_queue_history_doctor,
  ADD CONSTRAINT fk_queue_history_doctor 
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Enhanced data foreign keys
ALTER TABLE detailed_nutrition
  DROP CONSTRAINT IF EXISTS fk_detailed_nutrition_patient,
  ADD CONSTRAINT fk_detailed_nutrition_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE detailed_nutrition
  DROP CONSTRAINT IF EXISTS fk_detailed_nutrition_assessed_by,
  ADD CONSTRAINT fk_detailed_nutrition_assessed_by 
    FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE detailed_exercise
  DROP CONSTRAINT IF EXISTS fk_detailed_exercise_patient,
  ADD CONSTRAINT fk_detailed_exercise_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE detailed_exercise
  DROP CONSTRAINT IF EXISTS fk_detailed_exercise_assessed_by,
  ADD CONSTRAINT fk_detailed_exercise_assessed_by 
    FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE queue_history
  DROP CONSTRAINT IF EXISTS fk_queue_history_created_by,
  ADD CONSTRAINT fk_queue_history_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Enhanced data foreign keys
ALTER TABLE detailed_nutrition
  DROP CONSTRAINT IF EXISTS fk_detailed_nutrition_patient,
  ADD CONSTRAINT fk_detailed_nutrition_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE detailed_nutrition
  DROP CONSTRAINT IF EXISTS fk_detailed_nutrition_assessed_by,
  ADD CONSTRAINT fk_detailed_nutrition_assessed_by 
    FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE detailed_exercise
  DROP CONSTRAINT IF EXISTS fk_detailed_exercise_patient,
  ADD CONSTRAINT fk_detailed_exercise_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE detailed_exercise
  DROP CONSTRAINT IF EXISTS fk_detailed_exercise_assessed_by,
  ADD CONSTRAINT fk_detailed_exercise_assessed_by 
    FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Activity Logs Table Foreign Keys
ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS fk_activity_logs_user,
  ADD CONSTRAINT fk_activity_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Role Permissions Table Foreign Keys
ALTER TABLE role_permissions
  DROP CONSTRAINT IF EXISTS fk_role_permissions_created_by,
  ADD CONSTRAINT fk_role_permissions_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE role_permissions
  DROP CONSTRAINT IF EXISTS fk_role_permissions_updated_by,
  ADD CONSTRAINT fk_role_permissions_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- System Settings Table Foreign Keys
ALTER TABLE system_settings
  DROP CONSTRAINT IF EXISTS fk_system_settings_updated_by,
  ADD CONSTRAINT fk_system_settings_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Database Backups Table Foreign Keys
ALTER TABLE database_backups
  DROP CONSTRAINT IF EXISTS fk_database_backups_created_by,
  ADD CONSTRAINT fk_database_backups_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- External Data Requests Table Foreign Keys
ALTER TABLE external_data_requests
  DROP CONSTRAINT IF EXISTS fk_external_data_requests_approved_by,
  ADD CONSTRAINT fk_external_data_requests_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE external_data_requests
  DROP CONSTRAINT IF EXISTS fk_external_data_requests_created_by,
  ADD CONSTRAINT fk_external_data_requests_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- External Organizations Table Foreign Keys
ALTER TABLE external_organizations
  DROP CONSTRAINT IF EXISTS fk_external_organizations_verified_by,
  ADD CONSTRAINT fk_external_organizations_verified_by 
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- External Request Logs Table Foreign Keys
ALTER TABLE external_request_logs
  DROP CONSTRAINT IF EXISTS fk_external_request_logs_performed_by,
  ADD CONSTRAINT fk_external_request_logs_performed_by 
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================================================
-- COLUMN STANDARDIZATION AND IMPROVEMENTS (from Migration 003)
-- =============================================================================

-- Add column comments for clarity
COMMENT ON COLUMN patients.hn IS 'Hospital Number (HN) - Primary patient identifier';
COMMENT ON COLUMN patients.patient_number IS 'Legacy patient number field';

COMMENT ON COLUMN vital_signs.blood_pressure_systolic IS 
  'Systolic blood pressure (mmHg) - Standard field name';
COMMENT ON COLUMN vital_signs.blood_pressure_diastolic IS 
  'Diastolic blood pressure (mmHg) - Standard field name';

COMMENT ON COLUMN lab_orders.test_type IS 
  'Type/category of laboratory test';
COMMENT ON COLUMN lab_orders.test_name IS 
  'Full name of the laboratory test';
COMMENT ON COLUMN lab_orders.test_code IS 
  'Standard test code (LOINC, local code, etc.)';

-- Fix lab_results foreign key to CASCADE
ALTER TABLE lab_results 
  DROP CONSTRAINT IF EXISTS lab_results_lab_order_id_fkey;

ALTER TABLE lab_results
  ADD CONSTRAINT lab_results_lab_order_id_fkey 
    FOREIGN KEY (lab_order_id) 
    REFERENCES lab_orders(id) 
    ON DELETE CASCADE;

COMMENT ON CONSTRAINT lab_results_lab_order_id_fkey ON lab_results IS 
  'Foreign key to lab_orders - CASCADE to remove orphaned results';

-- Add performance indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_by ON appointments(updated_by);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_by ON medical_records(created_by);
CREATE INDEX IF NOT EXISTS idx_medical_records_recorded_by ON medical_records(recorded_by);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_created_by ON consent_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_revoked_by ON consent_contracts(revoked_by);
CREATE INDEX IF NOT EXISTS idx_consent_contracts_last_accessed_by ON consent_contracts(last_accessed_by);
CREATE INDEX IF NOT EXISTS idx_consent_access_logs_patient_accessed_by ON consent_access_logs(patient_id, accessed_by);
CREATE INDEX IF NOT EXISTS idx_queue_history_created_by ON queue_history(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_permissions_created_by ON role_permissions(created_by);
CREATE INDEX IF NOT EXISTS idx_role_permissions_updated_by ON role_permissions(updated_by);

-- =============================================================================
-- LEGACY VIEWS FOR BACKWARD COMPATIBILITY (from Migration 004)
-- =============================================================================

-- Vital Signs Legacy View
CREATE OR REPLACE VIEW vital_signs_legacy AS
SELECT 
    id, visit_id, patient_id,
    blood_pressure_systolic AS systolic_bp,
    blood_pressure_diastolic AS diastolic_bp,
    heart_rate, respiratory_rate, temperature, oxygen_saturation,
    weight, height, bmi, pain_scale, pain_location, blood_glucose,
    waist_circumference, position, measurement_time, measured_by,
    notes, abnormal_findings, diabetes_risk_score,
    hypertension_risk_score, cardiovascular_risk_score,
    recorded_by, recorded_at, created_at, updated_at
FROM vital_signs;

COMMENT ON VIEW vital_signs_legacy IS 
  'Legacy view for backward compatibility - maps new column names to old API field names';

-- Lab Orders Legacy View
CREATE OR REPLACE VIEW lab_orders_legacy AS
SELECT 
    id, visit_id, patient_id, order_number, order_date, order_time,
    test_type AS _category,
    test_name AS _name,
    test_code AS _code,
    clinical_indication, special_instructions, specimen_type,
    priority, requested_completion, status, ordered_by, collected_by,
    collection_date, collection_notes, created_at, updated_at
FROM lab_orders;

COMMENT ON VIEW lab_orders_legacy IS 
  'Legacy view for backward compatibility - uses underscore-prefixed field names';

-- Lab Results Legacy View
CREATE OR REPLACE VIEW lab_results_legacy AS
SELECT 
    id, visit_id, patient_id, lab_order_id,
    test_name AS _name,
    test_code AS _code,
    result_value, result_unit, reference_range, result_status,
    result_notes, interpretation, recommendations, performed_by,
    verified_by, result_date, result_time, created_at, updated_at
FROM lab_results;

COMMENT ON VIEW lab_results_legacy IS 
  'Legacy view for backward compatibility - uses underscore-prefixed field names';

-- INSTEAD OF triggers for legacy views
CREATE OR REPLACE FUNCTION vital_signs_legacy_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO vital_signs (
        id, visit_id, patient_id,
        blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, respiratory_rate, temperature, oxygen_saturation,
        weight, height, bmi, pain_scale, pain_location, blood_glucose,
        waist_circumference, position, measurement_time, measured_by,
        notes, abnormal_findings, diabetes_risk_score,
        hypertension_risk_score, cardiovascular_risk_score,
        recorded_by, recorded_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.visit_id, NEW.patient_id,
        NEW.systolic_bp, NEW.diastolic_bp,
        NEW.heart_rate, NEW.respiratory_rate, NEW.temperature, NEW.oxygen_saturation,
        NEW.weight, NEW.height, NEW.bmi, NEW.pain_scale, NEW.pain_location,
        NEW.blood_glucose, NEW.waist_circumference, NEW.position,
        NEW.measurement_time, NEW.measured_by, NEW.notes, NEW.abnormal_findings,
        NEW.diabetes_risk_score, NEW.hypertension_risk_score,
        NEW.cardiovascular_risk_score, NEW.recorded_by, NEW.recorded_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vital_signs_legacy_insert_trigger
    INSTEAD OF INSERT ON vital_signs_legacy
    FOR EACH ROW
    EXECUTE FUNCTION vital_signs_legacy_insert();

CREATE OR REPLACE FUNCTION lab_orders_legacy_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lab_orders (
        id, visit_id, patient_id, order_number, order_date, order_time,
        test_type, test_name, test_code,
        clinical_indication, special_instructions, specimen_type,
        priority, requested_completion, status, ordered_by, collected_by,
        collection_date, collection_notes
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.visit_id, NEW.patient_id, NEW.order_number, NEW.order_date, NEW.order_time,
        NEW._category, NEW._name, NEW._code,
        NEW.clinical_indication, NEW.special_instructions, NEW.specimen_type,
        NEW.priority, NEW.requested_completion, NEW.status, NEW.ordered_by,
        NEW.collected_by, NEW.collection_date, NEW.collection_notes
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_orders_legacy_insert_trigger
    INSTEAD OF INSERT ON lab_orders_legacy
    FOR EACH ROW
    EXECUTE FUNCTION lab_orders_legacy_insert();

-- Grant permissions to views
GRANT SELECT, INSERT ON vital_signs_legacy TO PUBLIC;
GRANT SELECT, INSERT ON lab_orders_legacy TO PUBLIC;
GRANT SELECT ON lab_results_legacy TO PUBLIC;

-- =============================================================================
-- AI INSIGHTS TABLE - ข้อมูล AI Insights และ Risk Assessment
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient Reference
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Insight Information
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('diabetes_risk', 'hypertension_risk', 'cardiovascular_risk', 'general_health')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Risk Assessment
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
    risk_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Recommendations
    recommendations TEXT,
    action_items JSONB,
    
    -- AI Model Information
    model_version VARCHAR(50),
    model_parameters JSONB,
    
    -- Staff Information
    generated_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- System Fields
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_patient_id ON ai_insights(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_risk_level ON ai_insights(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_at ON ai_insights(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_active ON ai_insights(is_active);

COMMENT ON TABLE ai_insights IS 
  'Stores AI-generated insights and risk assessments for patients';

-- =============================================================================
-- AI DIABETES PREDICTION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_diabetes_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient Reference
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Prediction Data
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH')),
    probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
    
    -- Risk Factors (JSONB for flexibility)
    risk_factors JSONB NOT NULL,
    
    -- Recommendations (JSONB for flexibility)
    recommendations JSONB NOT NULL,
    
    -- Timeline (JSONB for flexibility)
    timeline JSONB NOT NULL,
    
    -- Health Metrics
    bmi DECIMAL(4,1),
    bmi_category VARCHAR(20),
    blood_pressure_category VARCHAR(20),
    heart_rate_category VARCHAR(20),
    oxygen_level_category VARCHAR(20),
    
    -- Metadata
    model_version VARCHAR(50) DEFAULT '1.0.0',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for AI Diabetes Predictions
CREATE INDEX IF NOT EXISTS idx_ai_diabetes_predictions_patient_id ON ai_diabetes_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_diabetes_predictions_risk_level ON ai_diabetes_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_diabetes_predictions_risk_score ON ai_diabetes_predictions(risk_score);
CREATE INDEX IF NOT EXISTS idx_ai_diabetes_predictions_generated_at ON ai_diabetes_predictions(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_diabetes_predictions_is_active ON ai_diabetes_predictions(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_ai_diabetes_predictions_updated_at BEFORE UPDATE ON ai_diabetes_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ai_diabetes_predictions IS 'AI Diabetes Risk Predictions - การคาดการณ์ความเสี่ยงโรคเบาหวานด้วย AI';

-- Deprecation tracking table
CREATE TABLE IF NOT EXISTS deprecated_api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deprecated_api_usage_view ON deprecated_api_usage(view_name, logged_at);
CREATE INDEX IF NOT EXISTS idx_deprecated_api_usage_logged_at ON deprecated_api_usage(logged_at);

COMMENT ON TABLE deprecated_api_usage IS 
  'Tracks usage of deprecated API views to help plan migration timeline';

-- Analyze tables for query optimization
ANALYZE patients;
ANALYZE visits;
ANALYZE vital_signs;
ANALYZE lab_orders;
ANALYZE lab_results;
ANALYZE prescriptions;
ANALYZE prescription_items;
ANALYZE appointments;
ANALYZE notifications;
ANALYZE medical_records;
ANALYZE audit_logs;
ANALYZE activity_logs;
ANALYZE user_sessions;
ANALYZE consent_requests;
ANALYZE consent_contracts;
ANALYZE consent_access_logs;

-- =============================================================================
-- 33. CRITICAL LAB VALUES TABLE - ข้อมูลผลแลบสำคัญ
-- =============================================================================
CREATE TABLE IF NOT EXISTS critical_lab_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    
    -- Insulin and Diabetes Markers
    fasting_insulin DECIMAL(8,2),
    c_peptide DECIMAL(8,2),
    
    -- Lipid Profile
    total_cholesterol DECIMAL(8,2),
    hdl_cholesterol DECIMAL(8,2),
    ldl_cholesterol DECIMAL(8,2),
    triglycerides DECIMAL(8,2),
    
    -- Kidney Function
    bun DECIMAL(8,2), -- Blood Urea Nitrogen
    creatinine DECIMAL(8,2),
    
    -- Liver Function
    alt DECIMAL(8,2), -- Alanine Aminotransferase
    ast DECIMAL(8,2), -- Aspartate Aminotransferase
    
    -- Staff Information
    ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for critical_lab_values
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_patient_id ON critical_lab_values(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_test_date ON critical_lab_values(test_date);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_ordered_by ON critical_lab_values(ordered_by);

-- Trigger for critical_lab_values
CREATE TRIGGER update_critical_lab_values_updated_at BEFORE UPDATE ON critical_lab_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for critical_lab_values
COMMENT ON TABLE critical_lab_values IS 'ข้อมูลผลแลบสำคัญ - Critical lab values for AI analysis';
COMMENT ON COLUMN critical_lab_values.fasting_insulin IS 'ระดับอินซูลินขณะอดอาหาร (μU/mL)';
COMMENT ON COLUMN critical_lab_values.c_peptide IS 'ระดับ C-peptide (ng/mL)';
COMMENT ON COLUMN critical_lab_values.total_cholesterol IS 'คอเลสเตอรอลรวม (mg/dL)';
COMMENT ON COLUMN critical_lab_values.hdl_cholesterol IS 'HDL คอเลสเตอรอล (mg/dL)';
COMMENT ON COLUMN critical_lab_values.ldl_cholesterol IS 'LDL คอเลสเตอรอล (mg/dL)';
COMMENT ON COLUMN critical_lab_values.triglycerides IS 'ไตรกลีเซอไรด์ (mg/dL)';
COMMENT ON COLUMN critical_lab_values.bun IS 'BUN - Blood Urea Nitrogen (mg/dL)';
COMMENT ON COLUMN critical_lab_values.creatinine IS 'ครีอะตินิน (mg/dL)';
COMMENT ON COLUMN critical_lab_values.alt IS 'ALT - Alanine Aminotransferase (U/L)';
COMMENT ON COLUMN critical_lab_values.ast IS 'AST - Aspartate Aminotransferase (U/L)';

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================
-- 
-- ✅ COMPLETE DATABASE SCHEMA (October 6, 2025)
-- 
-- TABLES: 32+ core tables
-- FOREIGN KEYS: 55+ constraints (includes all from migration 002)
-- INDEXES: 100+ indexes (includes performance indexes from migration 003)
-- VIEWS: 3 legacy views (backward compatibility from migration 004)
-- TRIGGERS: 20+ update triggers + 2 legacy insert triggers
-- SEQUENCES: 5+ number generation sequences
-- 
-- IMPROVEMENTS INCLUDED:
-- ✅ All Foreign Key Constraints (from 002_add_foreign_keys.sql)
-- ✅ Column Standardization (from 003_standardize_columns.sql)
-- ✅ Backward Compatibility Views (from 004_add_column_aliases.sql)
-- ✅ Performance Indexes
-- ✅ Data Integrity Checks
-- ✅ Comprehensive Documentation
-- 
-- BACKWARD COMPATIBILITY: 100%
-- - Old column names work via legacy views
-- - No breaking changes
-- - Gradual migration supported
-- 
-- =============================================================================
-- END OF COMPLETE DATABASE SCHEMA
-- =============================================================================

-- =============================================================================
-- DATABASE SUMMARY
-- =============================================================================
-- 
-- 📊 TABLES CREATED: 26+ tables
-- 🏥 CORE TABLES:
--   - users (ผู้ใช้งานระบบ)
--   - patients (ข้อมูลผู้ป่วย)
--   - visits (การมาโรงพยาบาล)
--   - medical_records (บันทึกทางการแพทย์)
--   - vital_signs (สัญญาณชีพ)
--   - appointments (การนัดหมาย)
--   - prescriptions (ใบสั่งยา)
--   - lab_orders (คำสั่งแลป)
--   - lab_results (ผลแลป)
--   - notifications (การแจ้งเตือน)
--   - departments (แผนก)
--   - queue_history (ประวัติคิว)
--   - detailed_nutrition (ข้อมูลโภชนาการ)
--   - detailed_exercise (ข้อมูลการออกกำลังกาย)
--   - critical_lab_values (ผลแลปสำคัญ)
--   - ai_diabetes_predictions (การคาดการณ์โรคเบาหวานด้วย AI)
-- 
-- 🔧 FEATURES INCLUDED:
--   - Complete EMR functionality
--   - Patient management
--   - Doctor workflows
--   - Lab management
--   - Prescription system
--   - Appointment scheduling
--   - Document management
--   - Notification system
--   - AI data collection
--   - AI Diabetes Prediction
--   - External requester system
--   - Consent management
--   - Audit logging
-- 
-- 🚀 READY FOR PRODUCTION:
--   - All constraints and indexes
--   - Proper foreign keys
--   - Data validation
--   - Performance optimization
--   - Security measures
-- 
-- =============================================================================
