-- Migration: Fix field names for consistency
-- Created: January 15, 2025
-- Purpose: Align database schema with code expectations

-- =============================================================================
-- 1. FIX PATIENTS TABLE FIELD NAMES
-- =============================================================================

-- Fix patients table field names
ALTER TABLE patients 
RENAME COLUMN patient_number TO hospital_number;

-- Add missing fields if not exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(13),
ADD COLUMN IF NOT EXISTS thai_name VARCHAR(200);

-- Update indexes
DROP INDEX IF EXISTS idx_patients_patient_number;
CREATE INDEX IF NOT EXISTS idx_patients_hospital_number ON patients(hospital_number);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);

-- Add comments for documentation
COMMENT ON COLUMN patients.hospital_number IS 'Hospital number (HN) - unique identifier';
COMMENT ON COLUMN patients.national_id IS 'Thai national ID card number (13 digits)';
COMMENT ON COLUMN patients.thai_name IS 'Thai name for patient identification';

-- =============================================================================
-- 2. FIX VISITS TABLE FIELD NAMES
-- =============================================================================

-- Add missing fields if not exist
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- =============================================================================
-- 3. ADD MISSING CONSTRAINTS
-- =============================================================================

-- Add unique constraint for hospital_number
ALTER TABLE patients 
ADD CONSTRAINT unique_hospital_number UNIQUE (hospital_number);

-- Add unique constraint for national_id if provided
ALTER TABLE patients 
ADD CONSTRAINT unique_national_id UNIQUE (national_id);

-- =============================================================================
-- 4. UPDATE SEQUENCES AND DEFAULTS
-- =============================================================================

-- Update default values for better consistency
ALTER TABLE patients 
ALTER COLUMN is_active SET DEFAULT TRUE;

ALTER TABLE visits 
ALTER COLUMN status SET DEFAULT 'in_progress';

-- =============================================================================
-- 5. ADD AUDIT FIELDS IF MISSING
-- =============================================================================

-- Add audit fields to patients if not exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add audit fields to visits if not exist
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- =============================================================================
-- 6. CREATE REVERSIBLE MIGRATION (DOWN)
-- =============================================================================

-- This migration is reversible
-- To rollback, run the following commands:
-- ALTER TABLE patients RENAME COLUMN hospital_number TO patient_number;
-- DROP INDEX IF EXISTS idx_patients_hospital_number;
-- DROP INDEX IF EXISTS idx_patients_national_id;
-- CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
-- ALTER TABLE patients DROP CONSTRAINT IF EXISTS unique_hospital_number;
-- ALTER TABLE patients DROP CONSTRAINT IF EXISTS unique_national_id;
