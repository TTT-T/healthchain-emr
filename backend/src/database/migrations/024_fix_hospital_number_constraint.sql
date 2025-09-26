-- Migration: Fix hospital_number constraint and populate existing records
-- Created: September 24, 2025
-- Purpose: Fix NOT NULL constraint violation for hospital_number field

-- =============================================================================
-- 1. REMOVE NOT NULL CONSTRAINT TEMPORARILY
-- =============================================================================

-- First, remove any existing NOT NULL constraint on hospital_number
ALTER TABLE patients 
ALTER COLUMN hospital_number DROP NOT NULL;

-- =============================================================================
-- 2. POPULATE MISSING HOSPITAL_NUMBER VALUES
-- =============================================================================

-- Update existing records that have NULL hospital_number
UPDATE patients 
SET hospital_number = generate_hospital_number()
WHERE hospital_number IS NULL;

-- =============================================================================
-- 3. ADD NOT NULL CONSTRAINT BACK
-- =============================================================================

-- Now add the NOT NULL constraint back
ALTER TABLE patients 
ALTER COLUMN hospital_number SET NOT NULL;

-- =============================================================================
-- 4. ENSURE UNIQUE CONSTRAINT EXISTS
-- =============================================================================

-- Make sure unique constraint exists
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
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN patients.hospital_number IS 'Hospital number (HN) - unique identifier for patient, auto-generated';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
