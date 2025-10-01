-- Create AI Risk Assessment Tables
-- This migration creates tables needed for AI diabetes risk assessment

-- Create critical_lab_values table for storing critical laboratory values
CREATE TABLE IF NOT EXISTS critical_lab_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fasting_glucose DECIMAL(5,2),
    hba1c DECIMAL(4,2),
    fasting_insulin DECIMAL(6,2),
    c_peptide DECIMAL(6,2),
    total_cholesterol DECIMAL(5,2),
    hdl_cholesterol DECIMAL(5,2),
    ldl_cholesterol DECIMAL(5,2),
    triglycerides DECIMAL(5,2),
    creatinine DECIMAL(5,2),
    bun DECIMAL(5,2),
    alt DECIMAL(5,2),
    ast DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create detailed_nutrition table for storing detailed nutrition assessment data
CREATE TABLE IF NOT EXISTS detailed_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daily_calories INTEGER,
    protein_grams DECIMAL(6,2),
    carbohydrate_grams DECIMAL(6,2),
    fat_grams DECIMAL(6,2),
    fiber_grams DECIMAL(6,2),
    sugar_grams DECIMAL(6,2),
    sodium_mg DECIMAL(8,2),
    water_intake_liters DECIMAL(4,2),
    meal_frequency INTEGER,
    diet_quality_score INTEGER CHECK (diet_quality_score >= 1 AND diet_quality_score <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create detailed_exercise table for storing detailed exercise assessment data
CREATE TABLE IF NOT EXISTS detailed_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exercise_type VARCHAR(100),
    duration_minutes INTEGER,
    intensity_level VARCHAR(20) CHECK (intensity_level IN ('low', 'moderate', 'high')),
    frequency_per_week INTEGER,
    calories_burned INTEGER,
    heart_rate_avg INTEGER,
    heart_rate_max INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_patient_id ON critical_lab_values(patient_id);
CREATE INDEX IF NOT EXISTS idx_critical_lab_values_test_date ON critical_lab_values(test_date);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_patient_id ON detailed_nutrition(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessment_date ON detailed_nutrition(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_patient_id ON detailed_exercise(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessment_date ON detailed_exercise(assessment_date);

-- Add comments to document the tables
COMMENT ON TABLE critical_lab_values IS 'Critical laboratory values for AI risk assessment';
COMMENT ON TABLE detailed_nutrition IS 'Detailed nutrition assessment data for AI analysis';
COMMENT ON TABLE detailed_exercise IS 'Detailed exercise assessment data for AI analysis';

COMMENT ON COLUMN critical_lab_values.fasting_glucose IS 'Fasting blood glucose level (mg/dL)';
COMMENT ON COLUMN critical_lab_values.hba1c IS 'Hemoglobin A1c percentage';
COMMENT ON COLUMN critical_lab_values.fasting_insulin IS 'Fasting insulin level (μU/mL)';
COMMENT ON COLUMN critical_lab_values.c_peptide IS 'C-peptide level (ng/mL)';
COMMENT ON COLUMN detailed_nutrition.diet_quality_score IS 'Diet quality score from 1-10 (10 being best)';
COMMENT ON COLUMN detailed_exercise.intensity_level IS 'Exercise intensity: low, moderate, or high';
