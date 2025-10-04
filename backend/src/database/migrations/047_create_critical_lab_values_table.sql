-- Create Critical Lab Values Table
-- This table stores critical laboratory values for AI risk assessment

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
    bun DECIMAL(8,2),
    creatinine DECIMAL(8,2),
    egfr DECIMAL(8,2),
    
    -- Liver Function
    alt DECIMAL(8,2),
    ast DECIMAL(8,2),
    alp DECIMAL(8,2),
    bilirubin DECIMAL(8,2),
    
    -- Thyroid Function
    tsh DECIMAL(8,2),
    t3 DECIMAL(8,2),
    t4 DECIMAL(8,2),
    
    -- Inflammatory Markers
    crp DECIMAL(8,2),
    esr DECIMAL(8,2),
    
    -- Vitamins and Minerals
    vitamin_d DECIMAL(8,2),
    b12 DECIMAL(8,2),
    folate DECIMAL(8,2),
    iron DECIMAL(8,2),
    ferritin DECIMAL(8,2),
    uric_acid DECIMAL(8,2),
    
    -- Additional Fields
    notes TEXT,
    lab_facility VARCHAR(200),
    ordered_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_patient_id ON critical_lab_values(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_test_date ON critical_lab_values(test_date);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_ordered_by ON critical_lab_values(ordered_by);

-- Add comments
COMMENT ON TABLE critical_lab_values IS 'Critical laboratory values for AI risk assessment';
COMMENT ON COLUMN critical_lab_values.fasting_insulin IS 'Fasting insulin level (μU/mL)';
COMMENT ON COLUMN critical_lab_values.c_peptide IS 'C-peptide level (ng/mL)';
COMMENT ON COLUMN critical_lab_values.total_cholesterol IS 'Total cholesterol (mg/dL)';
COMMENT ON COLUMN critical_lab_values.hdl_cholesterol IS 'HDL cholesterol (mg/dL)';
COMMENT ON COLUMN critical_lab_values.ldl_cholesterol IS 'LDL cholesterol (mg/dL)';
COMMENT ON COLUMN critical_lab_values.triglycerides IS 'Triglycerides (mg/dL)';
COMMENT ON COLUMN critical_lab_values.bun IS 'Blood urea nitrogen (mg/dL)';
COMMENT ON COLUMN critical_lab_values.creatinine IS 'Creatinine (mg/dL)';
COMMENT ON COLUMN critical_lab_values.egfr IS 'Estimated glomerular filtration rate (mL/min/1.73m²)';
COMMENT ON COLUMN critical_lab_values.alt IS 'Alanine aminotransferase (U/L)';
COMMENT ON COLUMN critical_lab_values.ast IS 'Aspartate aminotransferase (U/L)';
COMMENT ON COLUMN critical_lab_values.alp IS 'Alkaline phosphatase (U/L)';
COMMENT ON COLUMN critical_lab_values.bilirubin IS 'Bilirubin (mg/dL)';
COMMENT ON COLUMN critical_lab_values.tsh IS 'Thyroid stimulating hormone (mIU/L)';
COMMENT ON COLUMN critical_lab_values.t3 IS 'Triiodothyronine (ng/dL)';
COMMENT ON COLUMN critical_lab_values.t4 IS 'Thyroxine (μg/dL)';
COMMENT ON COLUMN critical_lab_values.crp IS 'C-reactive protein (mg/L)';
COMMENT ON COLUMN critical_lab_values.esr IS 'Erythrocyte sedimentation rate (mm/hr)';
COMMENT ON COLUMN critical_lab_values.vitamin_d IS 'Vitamin D (ng/mL)';
COMMENT ON COLUMN critical_lab_values.b12 IS 'Vitamin B12 (pg/mL)';
COMMENT ON COLUMN critical_lab_values.folate IS 'Folate (ng/mL)';
COMMENT ON COLUMN critical_lab_values.iron IS 'Iron (μg/dL)';
COMMENT ON COLUMN critical_lab_values.ferritin IS 'Ferritin (ng/mL)';
COMMENT ON COLUMN critical_lab_values.uric_acid IS 'Uric acid (mg/dL)';
