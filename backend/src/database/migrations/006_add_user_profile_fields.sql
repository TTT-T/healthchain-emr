-- Migration: Add missing user profile fields
-- Created: January 7, 2025
-- Purpose: Add comprehensive user profile fields to users table

-- =============================================================================
-- 1. ADD MISSING FIELDS TO USERS TABLE
-- =============================================================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(13),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255),
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;

-- =============================================================================
-- 2. CREATE INDEXES FOR NEW FIELDS
-- =============================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_blood_type ON users(blood_type);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

-- =============================================================================
-- 3. ADD CONSTRAINTS
-- =============================================================================

-- Add unique constraint for national_id if provided
ALTER TABLE users 
ADD CONSTRAINT unique_users_national_id UNIQUE (national_id);

-- =============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Add comments for better documentation
COMMENT ON COLUMN users.national_id IS 'Thai national ID card number (13 digits)';
COMMENT ON COLUMN users.birth_date IS 'Date of birth';
COMMENT ON COLUMN users.gender IS 'Gender: male, female, other';
COMMENT ON COLUMN users.address IS 'Current address';
COMMENT ON COLUMN users.blood_type IS 'Blood type: A+, A-, B+, B-, AB+, AB-, O+, O-';
COMMENT ON COLUMN users.emergency_contact_name IS 'Emergency contact person name';
COMMENT ON COLUMN users.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN users.emergency_contact_relation IS 'Relationship to emergency contact';
COMMENT ON COLUMN users.allergies IS 'Drug, food, and environmental allergies';
COMMENT ON COLUMN users.medical_history IS 'Medical history and chronic conditions';
COMMENT ON COLUMN users.current_medications IS 'Current medications being taken';
COMMENT ON COLUMN users.insurance_type IS 'Type of insurance coverage';
COMMENT ON COLUMN users.insurance_number IS 'Insurance policy number';
COMMENT ON COLUMN users.insurance_expiry_date IS 'Insurance expiry date';
COMMENT ON COLUMN users.profile_image IS 'Profile image URL or path';
COMMENT ON COLUMN users.department_id IS 'Department/unit the user belongs to';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
COMMENT ON COLUMN users.last_activity IS 'Last activity timestamp';

-- =============================================================================
-- 5. UPDATE EXISTING DATA (OPTIONAL)
-- =============================================================================

-- Update existing users with default values if needed
-- UPDATE users SET 
--   gender = 'other' 
-- WHERE gender IS NULL;

-- =============================================================================
-- 6. CREATE REVERSIBLE MIGRATION (DOWN)
-- =============================================================================

-- This migration is reversible
-- To rollback, run the following commands:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_users_national_id;
-- DROP INDEX IF EXISTS idx_users_national_id;
-- DROP INDEX IF EXISTS idx_users_birth_date;
-- DROP INDEX IF EXISTS idx_users_gender;
-- DROP INDEX IF EXISTS idx_users_blood_type;
-- DROP INDEX IF EXISTS idx_users_department_id;
-- DROP INDEX IF EXISTS idx_users_last_login;
-- DROP INDEX IF EXISTS idx_users_last_activity;
-- ALTER TABLE users DROP COLUMN IF EXISTS national_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS birth_date;
-- ALTER TABLE users DROP COLUMN IF EXISTS gender;
-- ALTER TABLE users DROP COLUMN IF EXISTS address;
-- ALTER TABLE users DROP COLUMN IF EXISTS blood_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS emergency_contact_relation;
-- ALTER TABLE users DROP COLUMN IF EXISTS allergies;
-- ALTER TABLE users DROP COLUMN IF EXISTS medical_history;
-- ALTER TABLE users DROP COLUMN IF EXISTS current_medications;
-- ALTER TABLE users DROP COLUMN IF EXISTS insurance_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS insurance_number;
-- ALTER TABLE users DROP COLUMN IF EXISTS insurance_expiry_date;
-- ALTER TABLE users DROP COLUMN IF EXISTS profile_image;
-- ALTER TABLE users DROP COLUMN IF EXISTS department_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_login;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_activity;
