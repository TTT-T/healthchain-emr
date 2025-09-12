-- Create medical_records table for patient summary functionality
-- This table will store all medical activities in a unified format

CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient Reference
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Record Type and Classification
    record_type VARCHAR(50) NOT NULL 
        CHECK (record_type IN ('visit', 'vital_signs', 'history_taking', 'doctor_visit', 'pharmacy_dispensing', 'lab_result', 'appointment', 'document')),
    
    -- Visit Reference (if applicable)
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    
    -- Staff Information
    recorded_by UUID NOT NULL REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    
    -- Timing
    recorded_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Record Data (JSON fields for flexibility)
    visit_type VARCHAR(50),
    symptoms TEXT,
    chief_complaint TEXT,
    present_illness TEXT,
    past_history TEXT,
    family_history TEXT,
    social_history TEXT,
    
    -- Physical Examination
    physical_exam JSONB,
    
    -- Vital Signs
    blood_pressure VARCHAR(20),
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(5,2),
    
    -- Diagnosis and Treatment
    diagnosis JSONB,
    treatment_plan JSONB,
    advice TEXT,
    follow_up TEXT,
    
    -- Medications
    medications JSONB,
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    
    -- Lab Results
    test_type VARCHAR(100),
    test_name VARCHAR(200),
    test_results JSONB,
    overall_result VARCHAR(500),
    interpretation TEXT,
    recommendations TEXT,
    attachments JSONB,
    
    -- Appointments
    appointment_type VARCHAR(50),
    appointment_date DATE,
    appointment_time TIME,
    duration INTEGER,
    reason TEXT,
    status VARCHAR(50),
    priority VARCHAR(20),
    location VARCHAR(200),
    
    -- Documents
    document_type VARCHAR(100),
    document_title VARCHAR(200),
    content TEXT,
    issued_date DATE,
    valid_until DATE,
    
    -- General Fields
    notes TEXT,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_recorded_time ON medical_records(recorded_time);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_id ON medical_records(visit_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_recorded_by ON medical_records(recorded_by);

-- Trigger for timestamp updates (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_medical_records_updated_at') THEN
        CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMENT ON TABLE medical_records IS 'Medical Records - Unified table for all medical activities and patient summary';
