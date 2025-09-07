-- Migration: Fix patient schema consistency
-- Created: January 15, 2025
-- Purpose: Ensure database schema matches controller expectations

-- =============================================================================
-- 1. ENSURE HOSPITAL_NUMBER FIELD EXISTS AND IS UNIQUE
-- =============================================================================

-- Add hospital_number if it doesn't exist (should exist from migration 004)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS hospital_number VARCHAR(20);

-- Make hospital_number unique if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_hospital_number' 
        AND table_name = 'patients'
    ) THEN
        ALTER TABLE patients 
        ADD CONSTRAINT unique_hospital_number UNIQUE (hospital_number);
    END IF;
END $$;

-- =============================================================================
-- 2. ADD MISSING FIELDS FOR COMPLETE PATIENT PROFILE
-- =============================================================================

-- Add missing fields that are expected by the frontend
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS thai_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS national_id VARCHAR(13),
ADD COLUMN IF NOT EXISTS birth_date DATE,
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

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_patients_birth_date ON patients(birth_date);
CREATE INDEX IF NOT EXISTS idx_patients_blood_group ON patients(blood_group);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_number ON patients(hospital_number);

-- =============================================================================
-- 4. ADD CONSTRAINTS FOR DATA INTEGRITY
-- =============================================================================

-- Add unique constraint for national_id if provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_national_id' 
        AND table_name = 'patients'
    ) THEN
        ALTER TABLE patients 
        ADD CONSTRAINT unique_national_id UNIQUE (national_id);
    END IF;
END $$;

-- =============================================================================
-- 5. UPDATE COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE patients IS 'Patient information including personal, medical, and contact details';
COMMENT ON COLUMN patients.hospital_number IS 'Hospital number (HN) - unique identifier for patient';
COMMENT ON COLUMN patients.national_id IS 'Thai national ID card number (13 digits)';
COMMENT ON COLUMN patients.thai_name IS 'Thai name for patient identification';
COMMENT ON COLUMN patients.birth_date IS 'Date of birth (duplicate of date_of_birth for consistency)';
COMMENT ON COLUMN patients.blood_group IS 'Blood group (A, B, AB, O)';
COMMENT ON COLUMN patients.weight IS 'Weight in kilograms';
COMMENT ON COLUMN patients.height IS 'Height in centimeters';
COMMENT ON COLUMN patients.drug_allergies IS 'Drug allergies separated from general allergies';
COMMENT ON COLUMN patients.food_allergies IS 'Food allergies';
COMMENT ON COLUMN patients.environment_allergies IS 'Environmental allergies';
COMMENT ON COLUMN patients.chronic_diseases IS 'Chronic diseases (duplicate of chronic_conditions for consistency)';

-- =============================================================================
-- 6. MIGRATE DATA FROM OLD FIELDS TO NEW FIELDS
-- =============================================================================

-- Copy data from old fields to new fields for consistency
UPDATE patients 
SET 
    thai_name = COALESCE(thai_name, CONCAT(thai_first_name, ' ', thai_last_name)),
    birth_date = COALESCE(birth_date, date_of_birth),
    phone_number = COALESCE(phone_number, phone),
    current_address = COALESCE(current_address, address)
WHERE thai_name IS NULL OR birth_date IS NULL OR phone_number IS NULL OR current_address IS NULL;

-- =============================================================================
-- 7. CLEAN UP OLD FIELDS (OPTIONAL - COMMENTED OUT FOR SAFETY)
-- =============================================================================

-- Uncomment these lines if you want to remove old fields after migration
-- ALTER TABLE patients DROP COLUMN IF EXISTS thai_first_name;
-- ALTER TABLE patients DROP COLUMN IF EXISTS thai_last_name;
-- ALTER TABLE patients DROP COLUMN IF EXISTS patient_number;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
