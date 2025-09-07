-- Migration: Add user_id field to patients table
-- Created: January 7, 2025
-- Purpose: Link patient records to user accounts for proper authentication

-- =============================================================================
-- 1. ADD USER_ID FIELD TO PATIENTS TABLE
-- =============================================================================

-- Add user_id column if it doesn't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- =============================================================================
-- 2. UPDATE EXISTING PATIENTS TO LINK WITH USERS
-- =============================================================================

-- For existing patients, try to match them with users based on email
-- This is a best-effort approach to link existing data
UPDATE patients 
SET user_id = (
    SELECT u.id 
    FROM users u 
    WHERE u.email = patients.email 
    AND u.role = 'patient'
    LIMIT 1
)
WHERE user_id IS NULL 
AND email IS NOT NULL 
AND email != '';

-- =============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN patients.user_id IS 'Reference to users table for authentication and authorization';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
