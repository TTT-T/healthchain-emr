-- Add enhanced AI analysis fields to existing tables
-- This migration adds new columns to support comprehensive AI analysis

-- Add new columns to vital_signs table
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(5,2);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS bone_density VARCHAR(50);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS skin_fold_thickness DECIMAL(5,2);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS hydration_status VARCHAR(50);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS depression_score INTEGER CHECK (depression_score >= 0 AND depression_score <= 27);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10);
ALTER TABLE vital_signs ADD COLUMN IF NOT EXISTS quality_of_life_score INTEGER CHECK (quality_of_life_score >= 0 AND quality_of_life_score <= 100);

-- Add comments for new vital signs columns
COMMENT ON COLUMN vital_signs.body_fat_percentage IS 'Body fat percentage for AI analysis';
COMMENT ON COLUMN vital_signs.muscle_mass IS 'Muscle mass in kg for AI analysis';
COMMENT ON COLUMN vital_signs.bone_density IS 'Bone density status (normal/osteopenia/osteoporosis)';
COMMENT ON COLUMN vital_signs.skin_fold_thickness IS 'Skin fold thickness in mm for body composition analysis';
COMMENT ON COLUMN vital_signs.hydration_status IS 'Hydration status (good/moderate/poor)';
COMMENT ON COLUMN vital_signs.sleep_quality IS 'Sleep quality score 1-10';
COMMENT ON COLUMN vital_signs.stress_level IS 'Stress level score 1-10';
COMMENT ON COLUMN vital_signs.depression_score IS 'Depression score 0-27 (PHQ-9 scale)';
COMMENT ON COLUMN vital_signs.anxiety_level IS 'Anxiety level score 1-10';
COMMENT ON COLUMN vital_signs.quality_of_life_score IS 'Quality of life score 0-100';

-- Create enhanced lab results table for critical values
CREATE TABLE IF NOT EXISTS critical_lab_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    lab_result_id UUID REFERENCES lab_results(id) ON DELETE CASCADE,
    
    -- Diabetes-related markers
    hba1c DECIMAL(4,2), -- HbA1c percentage
    fasting_insulin DECIMAL(6,2), -- Fasting insulin (μU/mL)
    c_peptide DECIMAL(6,2), -- C-Peptide (ng/mL)
    
    -- Lipid profile
    total_cholesterol DECIMAL(6,2), -- Total cholesterol (mg/dL)
    hdl_cholesterol DECIMAL(6,2), -- HDL cholesterol (mg/dL)
    ldl_cholesterol DECIMAL(6,2), -- LDL cholesterol (mg/dL)
    triglycerides DECIMAL(6,2), -- Triglycerides (mg/dL)
    
    -- Kidney function
    bun DECIMAL(6,2), -- BUN (mg/dL)
    creatinine DECIMAL(6,2), -- Creatinine (mg/dL)
    egfr DECIMAL(6,2), -- eGFR (mL/min/1.73m²)
    
    -- Liver function
    alt DECIMAL(6,2), -- ALT (U/L)
    ast DECIMAL(6,2), -- AST (U/L)
    alp DECIMAL(6,2), -- ALP (U/L)
    bilirubin DECIMAL(6,2), -- Bilirubin (mg/dL)
    
    -- Thyroid function
    tsh DECIMAL(6,2), -- TSH (mIU/L)
    t3 DECIMAL(6,2), -- T3 (ng/dL)
    t4 DECIMAL(6,2), -- T4 (μg/dL)
    
    -- Inflammatory markers
    crp DECIMAL(6,2), -- CRP (mg/L)
    esr INTEGER, -- ESR (mm/hr)
    
    -- Vitamins and minerals
    vitamin_d DECIMAL(6,2), -- Vitamin D (ng/mL)
    b12 DECIMAL(6,2), -- Vitamin B12 (pg/mL)
    folate DECIMAL(6,2), -- Folate (ng/mL)
    iron DECIMAL(6,2), -- Iron (μg/dL)
    ferritin DECIMAL(6,2), -- Ferritin (ng/mL)
    uric_acid DECIMAL(6,2), -- Uric acid (mg/dL)
    
    -- Metadata
    test_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes for critical lab values
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_patient_id ON critical_lab_values(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_test_date ON critical_lab_values(test_date);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_lab_result_id ON critical_lab_values(lab_result_id);

-- Add comments for critical lab values table
COMMENT ON TABLE critical_lab_values IS 'Critical lab values for AI analysis and risk assessment';
COMMENT ON COLUMN critical_lab_values.hba1c IS 'HbA1c - 3-month average blood glucose';
COMMENT ON COLUMN critical_lab_values.fasting_insulin IS 'Fasting insulin level for insulin resistance assessment';
COMMENT ON COLUMN critical_lab_values.c_peptide IS 'C-Peptide for pancreatic function assessment';

-- Create detailed nutrition tracking table
CREATE TABLE IF NOT EXISTS detailed_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    
    -- Daily intake
    daily_calorie_intake INTEGER, -- Daily calorie intake
    carbohydrate_intake DECIMAL(6,2), -- Carbohydrate intake (grams)
    protein_intake DECIMAL(6,2), -- Protein intake (grams)
    fat_intake DECIMAL(6,2), -- Fat intake (grams)
    fiber_intake DECIMAL(6,2), -- Fiber intake (grams)
    sugar_intake DECIMAL(6,2), -- Sugar intake (grams)
    sodium_intake DECIMAL(6,2), -- Sodium intake (mg)
    water_intake DECIMAL(4,2), -- Water intake (liters)
    
    -- Eating patterns
    meal_frequency INTEGER, -- Number of meals per day
    snacking_frequency VARCHAR(50), -- Snacking frequency
    eating_out_frequency VARCHAR(50), -- Eating out frequency
    processed_food_consumption VARCHAR(50), -- Processed food consumption
    organic_food_consumption VARCHAR(50), -- Organic food consumption
    
    -- Supplements and substances
    supplement_use TEXT, -- Supplement use details
    alcohol_consumption DECIMAL(4,2), -- Alcohol consumption (standard drinks/week)
    caffeine_consumption DECIMAL(6,2), -- Caffeine consumption (mg/day)
    
    -- Metadata
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes for detailed nutrition
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_patient_id ON detailed_nutrition(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessment_date ON detailed_nutrition(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_visit_id ON detailed_nutrition(visit_id);

-- Create detailed exercise tracking table
CREATE TABLE IF NOT EXISTS detailed_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    
    -- Exercise details
    exercise_type VARCHAR(100), -- Type of exercise
    exercise_duration INTEGER, -- Duration per session (minutes)
    exercise_frequency INTEGER, -- Frequency per week
    exercise_intensity VARCHAR(50), -- Intensity level
    mets DECIMAL(4,2), -- Metabolic equivalents
    heart_rate_zones VARCHAR(100), -- Heart rate zones
    vo2_max DECIMAL(5,2), -- VO2 Max
    
    -- Training types
    strength_training VARCHAR(100), -- Strength training details
    flexibility_training VARCHAR(100), -- Flexibility training details
    balance_training VARCHAR(100), -- Balance training details
    sports_participation VARCHAR(100), -- Sports participation
    
    -- Daily activity
    physical_activity_at_work VARCHAR(100), -- Physical activity at work
    transportation_method VARCHAR(100), -- Transportation method
    stairs_usage VARCHAR(50), -- Stairs usage
    walking_steps INTEGER, -- Daily walking steps
    
    -- Metadata
    assessment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes for detailed exercise
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_patient_id ON detailed_exercise(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessment_date ON detailed_exercise(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_visit_id ON detailed_exercise(visit_id);

-- Add comments for new tables
COMMENT ON TABLE detailed_nutrition IS 'Detailed nutrition tracking for AI analysis';
COMMENT ON TABLE detailed_exercise IS 'Detailed exercise tracking for AI analysis';
