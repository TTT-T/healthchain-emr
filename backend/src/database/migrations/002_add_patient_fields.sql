-- Migration: Add missing fields to patients table
-- Created: July 7, 2025
-- Purpose: Add fields needed for comprehensive patient profile

-- Add missing columns to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(13),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS race VARCHAR(50),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS education VARCHAR(100),
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS id_card_address TEXT,
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS drug_allergies TEXT,
ADD COLUMN IF NOT EXISTS food_allergies TEXT,
ADD COLUMN IF NOT EXISTS environment_allergies TEXT,
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_patients_birth_date ON patients(birth_date);
CREATE INDEX IF NOT EXISTS idx_patients_blood_group ON patients(blood_group);

-- Add constraint for national_id uniqueness if provided (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_national_id'
    ) THEN
        ALTER TABLE patients 
        ADD CONSTRAINT unique_national_id UNIQUE (national_id);
    END IF;
END $$;

-- Update gender constraint to match frontend
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_gender_check;

ALTER TABLE patients 
ADD CONSTRAINT patients_gender_check CHECK (gender IN ('male', 'female', 'other'));

-- Add comment for documentation
COMMENT ON TABLE patients IS 'Patient information including personal, medical, and contact details';
COMMENT ON COLUMN patients.national_id IS 'Thai national ID card number (13 digits)';
COMMENT ON COLUMN patients.birth_date IS 'Date of birth (duplicate of date_of_birth for consistency)';
COMMENT ON COLUMN patients.blood_group IS 'Blood group (A, B, AB, O)';
COMMENT ON COLUMN patients.weight IS 'Weight in kilograms';
COMMENT ON COLUMN patients.height IS 'Height in centimeters';
COMMENT ON COLUMN patients.drug_allergies IS 'Drug allergies separated from general allergies';
COMMENT ON COLUMN patients.food_allergies IS 'Food allergies';
COMMENT ON COLUMN patients.environment_allergies IS 'Environmental allergies';
COMMENT ON COLUMN patients.chronic_diseases IS 'Chronic diseases (duplicate of chronic_conditions for consistency)';
