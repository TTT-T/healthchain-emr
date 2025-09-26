-- Add additional fields for history taking to medical_records table
-- This migration adds fields that were missing for comprehensive history taking

-- Add new columns to medical_records table
ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS pregnancy_history TEXT,
ADD COLUMN IF NOT EXISTS dietary_history TEXT,
ADD COLUMN IF NOT EXISTS lifestyle_factors TEXT,
ADD COLUMN IF NOT EXISTS review_of_systems TEXT,
ADD COLUMN IF NOT EXISTS surgical_history TEXT,
ADD COLUMN IF NOT EXISTS drug_allergies TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN medical_records.pregnancy_history IS 'Pregnancy history data in JSON format';
COMMENT ON COLUMN medical_records.dietary_history IS 'Dietary history data in JSON format';
COMMENT ON COLUMN medical_records.lifestyle_factors IS 'Lifestyle factors data in JSON format';
COMMENT ON COLUMN medical_records.review_of_systems IS 'Review of systems data in JSON format';
COMMENT ON COLUMN medical_records.surgical_history IS 'Surgical history information';
COMMENT ON COLUMN medical_records.drug_allergies IS 'Drug allergies information';
COMMENT ON COLUMN medical_records.current_medications IS 'Current medications information';
