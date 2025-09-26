-- =============================================================================
-- Migration 023: Standardize User Name Fields
-- =============================================================================
-- Description: Standardize user name fields according to requirements:
--   - first_name: English first name only
--   - last_name: English last name only  
--   - thai_name: Thai first name only
--   - thai_last_name: Thai last name only
--   - username: For login purposes
--   - title: Thai title/prefix only
-- Date: 2025-01-27
-- Author: System
-- =============================================================================

-- =============================================================================
-- 1. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Update column comments to clarify usage
COMMENT ON COLUMN users.first_name IS 'English first name only (ชื่อภาษาอังกฤษ)';
COMMENT ON COLUMN users.last_name IS 'English last name only (นามสกุลภาษาอังกฤษ)';
COMMENT ON COLUMN users.thai_name IS 'Thai first name only (ชื่อภาษาไทย)';
COMMENT ON COLUMN users.thai_last_name IS 'Thai last name only (นามสกุลภาษาไทย)';
COMMENT ON COLUMN users.username IS 'Username for login purposes (ชื่อผู้ใช้สำหรับเข้าสู่ระบบ)';
COMMENT ON COLUMN users.title IS 'Thai title/prefix only (คำนำหน้าชื่อภาษาไทยเท่านั้น)';

-- =============================================================================
-- 2. ADD VALIDATION CONSTRAINTS
-- =============================================================================

-- Add check constraints to ensure proper usage
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_english_name_format,
DROP CONSTRAINT IF EXISTS check_thai_name_format,
DROP CONSTRAINT IF EXISTS check_title_format;

-- English names should contain only English characters
ALTER TABLE users 
ADD CONSTRAINT check_english_name_format 
CHECK (
  (first_name IS NULL OR first_name ~ '^[a-zA-Z\s\-\'\.]+$') AND
  (last_name IS NULL OR last_name ~ '^[a-zA-Z\s\-\'\.]+$')
);

-- Thai names should contain only Thai characters
ALTER TABLE users 
ADD CONSTRAINT check_thai_name_format 
CHECK (
  (thai_name IS NULL OR thai_name ~ '^[ก-๙\s\-\'\.]+$') AND
  (thai_last_name IS NULL OR thai_last_name ~ '^[ก-๙\s\-\'\.]+$')
);

-- Title should contain only Thai characters
ALTER TABLE users 
ADD CONSTRAINT check_title_format 
CHECK (
  title IS NULL OR title ~ '^[ก-๙\s\-\'\.]+$'
);

-- =============================================================================
-- 3. CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Create indexes for frequently queried name fields
CREATE INDEX IF NOT EXISTS idx_users_first_name_english ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name_english ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_name_first ON users(thai_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_last_name ON users(thai_last_name);
CREATE INDEX IF NOT EXISTS idx_users_title ON users(title);

-- Composite indexes for name searches
CREATE INDEX IF NOT EXISTS idx_users_english_name_search ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_name_search ON users(thai_name, thai_last_name);

-- =============================================================================
-- 4. UPDATE EXISTING DATA (IF NEEDED)
-- =============================================================================

-- Note: This migration assumes existing data is already properly separated
-- If data needs to be migrated, add specific UPDATE statements here
-- For example, if thai_name contains both first and last name:
-- UPDATE users SET 
--   thai_name = SPLIT_PART(thai_name, ' ', 1),
--   thai_last_name = SPLIT_PART(thai_name, ' ', 2)
-- WHERE thai_name IS NOT NULL AND thai_last_name IS NULL;

-- =============================================================================
-- 5. VERIFICATION QUERIES
-- =============================================================================

-- Query to verify all name fields exist and are properly constrained
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' 
--   AND column_name IN ('first_name', 'last_name', 'thai_name', 'thai_last_name', 'username', 'title')
-- ORDER BY ordinal_position;

-- =============================================================================
-- 6. MIGRATION COMPLETE
-- =============================================================================

