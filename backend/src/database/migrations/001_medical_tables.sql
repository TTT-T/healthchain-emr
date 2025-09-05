-- EMR Medical Records Database Tables
-- Created: July 6, 2025
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
    role VARCHAR(20) NOT NULL DEFAULT 'patient' 
        CHECK (role IN ('patient', 'doctor', 'nurse', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
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

-- =============================================================================
-- 3. PATIENTS TABLE - ข้อมูลผู้ป่วย
-- =============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Personal Information
    patient_number VARCHAR(20) UNIQUE NOT NULL, -- P2025070001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    thai_first_name VARCHAR(100),
    thai_last_name VARCHAR(100),
    
    -- Basic Information
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    nationality VARCHAR(50) DEFAULT 'Thai',
    religion VARCHAR(50),
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Medical Information
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT,
    medical_history TEXT,
    current_medications TEXT,
    
    -- Insurance Information
    insurance_type VARCHAR(50),
    insurance_number VARCHAR(50),
    insurance_expiry_date DATE,
    
    -- System Fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
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
    
    -- Visit Status
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    priority VARCHAR(10) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Staff Information
    attending_doctor_id UUID REFERENCES users(id),
    assigned_nurse_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_doctor ON visits(attending_doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);

-- =============================================================================
-- 2. VITAL SIGNS TABLE - สัญญาณชีพ (Enhanced for AI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Basic Vital Signs
    systolic_bp INTEGER, -- mmHg (80-250)
    diastolic_bp INTEGER, -- mmHg (40-150)
    heart_rate INTEGER, -- bpm (40-200)
    respiratory_rate INTEGER, -- per min (8-40)
    temperature DECIMAL(4,1), -- Celsius (35.0-45.0)
    oxygen_saturation INTEGER, -- % (70-100)
    
    -- Enhanced Measurements for AI
    weight DECIMAL(5,2), -- kg
    height DECIMAL(5,2), -- cm
    bmi DECIMAL(5,2), -- Calculated BMI
    
    -- Pain Assessment
    pain_scale INTEGER CHECK (pain_scale BETWEEN 0 AND 10),
    pain_location TEXT,
    
    -- Additional Measurements
    blood_glucose INTEGER, -- mg/dL (for diabetes risk)
    waist_circumference DECIMAL(5,2), -- cm (for metabolic syndrome)
    
    -- Measurement Context
    position VARCHAR(20) DEFAULT 'sitting' 
        CHECK (position IN ('sitting', 'standing', 'lying', 'ambulatory')),
    measurement_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_by UUID REFERENCES users(id),
    
    -- Notes
    notes TEXT,
    abnormal_findings TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vital signs
CREATE INDEX IF NOT EXISTS idx_vital_signs_visit_id ON vital_signs(visit_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_measurement_time ON vital_signs(measurement_time);

-- =============================================================================
-- 3. LAB ORDERS TABLE - ใบสั่งตรวจ
-- =============================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Visit & Patient Reference
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Order Information
    order_number VARCHAR(20) UNIQUE NOT NULL, -- LAB2025070001
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_time TIME NOT NULL DEFAULT CURRENT_TIME,
    
    -- Test Details
    test_category VARCHAR(50) NOT NULL, -- 'hematology', 'chemistry', 'microbiology', etc.
    test_name VARCHAR(200) NOT NULL,
    test_code VARCHAR(20),
    
    -- Clinical Information
    clinical_indication TEXT, -- เหตุผลการสั่งตรวจ
    specimen_type VARCHAR(50) DEFAULT 'blood' 
        CHECK (specimen_type IN ('blood', 'urine', 'stool', 'sputum', 'csf', 'other')),
    
    -- Priority & Timing
    priority VARCHAR(20) DEFAULT 'routine'
        CHECK (priority IN ('stat', 'urgent', 'routine')),
    requested_completion TIMESTAMP,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ordered'
        CHECK (status IN ('ordered', 'collected', 'processing', 'completed', 'cancelled')),
    
    -- Staff Information
    ordered_by UUID NOT NULL REFERENCES users(id), -- แพทย์ที่สั่ง
    collected_by UUID REFERENCES users(id), -- ผู้เก็บตัวอย่าง
    
    -- Collection Details
    collection_date TIMESTAMP,
    collection_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lab orders
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_visit_id ON lab_orders(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_number ON lab_orders(order_number);

-- =============================================================================
-- 4. LAB RESULTS TABLE - ผลตรวจแลป
-- =============================================================================
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lab Order Reference
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Result Information
    test_name VARCHAR(200) NOT NULL,
    test_code VARCHAR(20),
    
    -- Result Values
    result_value VARCHAR(500), -- Numeric or text result
    result_numeric DECIMAL(10,3), -- For numeric calculations
    result_unit VARCHAR(20), -- mg/dL, mmol/L, etc.
    
    -- Reference Values
    reference_range VARCHAR(200), -- "70-110 mg/dL"
    reference_min DECIMAL(10,3),
    reference_max DECIMAL(10,3),
    
    -- Result Interpretation
    abnormal_flag VARCHAR(10) 
        CHECK (abnormal_flag IN ('normal', 'high', 'low', 'critical_high', 'critical_low')),
    interpretation TEXT,
    
    -- Quality Control
    validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    
    -- Timing
    result_date DATE NOT NULL DEFAULT CURRENT_DATE,
    result_time TIME NOT NULL DEFAULT CURRENT_TIME,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Technical Details
    method VARCHAR(100), -- Testing method
    instrument VARCHAR(100), -- Testing instrument
    
    -- Notes
    technician_notes TEXT,
    pathologist_notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lab results
CREATE INDEX IF NOT EXISTS idx_lab_results_lab_order_id ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_result_date ON lab_results(result_date);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_name ON lab_results(test_name);

-- =============================================================================
-- 5. PRESCRIPTIONS TABLE - ใบสั่งยา
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
    
    -- Prescribing Information
    prescribed_by UUID NOT NULL REFERENCES users(id), -- แพทย์ที่สั่งจ่าย
    diagnosis_for_prescription TEXT, -- วินิจฉัยสำหรับการสั่งยา
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'dispensed', 'partially_dispensed', 'cancelled')),
    
    -- Pharmacy Information
    dispensed_by UUID REFERENCES users(id), -- เภสัชกร
    dispensed_at TIMESTAMP,
    
    -- Patient Instructions
    general_instructions TEXT,
    precautions TEXT,
    follow_up_instructions TEXT,
    
    -- Administrative
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    insurance_covered BOOLEAN DEFAULT FALSE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_number ON prescriptions(prescription_number);

-- =============================================================================
-- 6. PRESCRIPTION ITEMS TABLE - รายการยาในใบสั่ง
-- =============================================================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Prescription Reference
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    -- Medication Information
    medication_name VARCHAR(200) NOT NULL,
    medication_code VARCHAR(50), -- Drug code
    generic_name VARCHAR(200),
    brand_name VARCHAR(200),
    
    -- Dosage Information
    strength VARCHAR(50), -- "500mg", "10mg/ml"
    dosage_form VARCHAR(50) -- "tablet", "capsule", "syrup", "injection"
        CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other')),
    
    -- Prescription Details
    quantity_prescribed INTEGER NOT NULL, -- จำนวนที่สั่ง
    quantity_dispensed INTEGER DEFAULT 0, -- จำนวนที่จ่าย
    unit VARCHAR(20) DEFAULT 'tablet' -- "tablet", "ml", "bottle", "tube"
        CHECK (unit IN ('tablet', 'capsule', 'ml', 'bottle', 'tube', 'box', 'vial', 'ampule', 'other')),
    
    -- Instructions
    dosage_instructions TEXT NOT NULL, -- "1 tablet twice daily after meals"
    duration_days INTEGER, -- ระยะเวลาการใช้ยา (วัน)
    
    -- Cost
    unit_cost DECIMAL(8,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    item_status VARCHAR(20) DEFAULT 'pending'
        CHECK (item_status IN ('pending', 'dispensed', 'partially_dispensed', 'cancelled', 'substituted')),
    
    -- Substitution (if applicable)
    substituted_with VARCHAR(200),
    substitution_reason TEXT,
    
    -- Safety Checks
    allergy_checked BOOLEAN DEFAULT FALSE,
    interaction_checked BOOLEAN DEFAULT FALSE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for prescription items
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication_name ON prescription_items(medication_name);
CREATE INDEX IF NOT EXISTS idx_prescription_items_status ON prescription_items(item_status);

-- =============================================================================
-- 7. VISIT ATTACHMENTS TABLE - ไฟล์แนบการมาพบ
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
    uploaded_by UUID NOT NULL REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for visit attachments
CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit_id ON visit_attachments(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_attachments_patient_id ON visit_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_attachments_type ON visit_attachments(attachment_type);

-- =============================================================================
-- SEQUENCES FOR NUMBER GENERATION
-- =============================================================================

-- Visit Number Sequence
CREATE SEQUENCE IF NOT EXISTS visit_number_seq START 1;

-- Lab Order Number Sequence  
CREATE SEQUENCE IF NOT EXISTS lab_order_number_seq START 1;

-- Prescription Number Sequence
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;

-- =============================================================================
-- FUNCTIONS FOR AUTO-GENERATING NUMBERS
-- =============================================================================

-- Function to generate visit number
CREATE OR REPLACE FUNCTION generate_visit_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_month VARCHAR(6);
    sequence_num VARCHAR(6);
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    sequence_num := LPAD(nextval('visit_number_seq')::TEXT, 4, '0');
    RETURN 'V' || year_month || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate lab order number
CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_month VARCHAR(6);
    sequence_num VARCHAR(6);
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    sequence_num := LPAD(nextval('lab_order_number_seq')::TEXT, 4, '0');
    RETURN 'LAB' || year_month || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate prescription number
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_month VARCHAR(6);
    sequence_num VARCHAR(6);
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    sequence_num := LPAD(nextval('prescription_number_seq')::TEXT, 4, '0');
    RETURN 'RX' || year_month || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
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
-- END OF MEDICAL RECORDS TABLES
-- =============================================================================

COMMENT ON TABLE visits IS 'การมาพบแพทย์ - Core medical visit records';
COMMENT ON TABLE vital_signs IS 'สัญญาณชีพ - Enhanced for AI diabetes risk assessment';
COMMENT ON TABLE lab_orders IS 'ใบสั่งตรวจ - Laboratory test orders';
COMMENT ON TABLE lab_results IS 'ผลตรวจแลป - Laboratory test results';
COMMENT ON TABLE prescriptions IS 'ใบสั่งยา - Medical prescriptions';
COMMENT ON TABLE prescription_items IS 'รายการยาในใบสั่ง - Individual medication items';
COMMENT ON TABLE visit_attachments IS 'ไฟล์แนบการมาพบ - Visit-related file attachments';
