-- Migration: Add thai_last_name column to patients table
-- Created: September 25, 2025
-- Purpose: Add thai_last_name column to patients table to match users table schema

-- =============================================================================
-- 1. ADD THAI_LAST_NAME COLUMN TO PATIENTS TABLE
-- =============================================================================

-- Add thai_last_name column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS thai_last_name VARCHAR(200);

-- =============================================================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN patients.thai_last_name IS 'Thai last name for patient identification (matches users table schema)';

-- =============================================================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- =============================================================================

-- Create index for thai_last_name field
CREATE INDEX IF NOT EXISTS idx_patients_thai_last_name ON patients(thai_last_name);

-- =============================================================================
-- 4. UPDATE EXISTING RECORDS (IF ANY)
-- =============================================================================

-- Update existing patient records to copy thai_last_name from users table
UPDATE patients 
SET thai_last_name = u.thai_last_name
FROM users u
WHERE patients.user_id = u.id 
AND patients.thai_last_name IS NULL 
AND u.thai_last_name IS NOT NULL;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
