-- Migration: Add thai_last_name field for proper Thai name handling
-- Created: January 20, 2025
-- Purpose: Add thai_last_name field to store Thai last name separately

-- =============================================================================
-- 1. ADD THAI_LAST_NAME FIELD
-- =============================================================================

-- Add thai_last_name column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS thai_last_name VARCHAR(200);

-- =============================================================================
-- 2. CREATE INDEX FOR BETTER PERFORMANCE
-- =============================================================================

-- Create index for frequently queried field
CREATE INDEX IF NOT EXISTS idx_users_thai_last_name ON users(thai_last_name);

-- =============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Add comments for better documentation
COMMENT ON COLUMN users.thai_last_name IS 'Thai last name (นามสกุลไทย)';

-- =============================================================================
-- 4. MIGRATION COMPLETE
-- =============================================================================

-- This migration adds thai_last_name field to users table
-- Now users can have both thai_name (first name) and thai_last_name (last name)
