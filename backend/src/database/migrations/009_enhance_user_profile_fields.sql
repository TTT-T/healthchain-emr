-- Migration: Enhance user profile fields for comprehensive profile management
-- Created: January 20, 2025
-- Purpose: Add missing fields and ensure all profile data can be stored properly

-- =============================================================================
-- 1. ADD MISSING PROFILE FIELDS TO USERS TABLE
-- =============================================================================

-- Add missing fields that weren't covered in previous migrations
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id_card_address TEXT,
ADD COLUMN IF NOT EXISTS chronic_diseases TEXT,
ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'Thai',
ADD COLUMN IF NOT EXISTS province VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- =============================================================================
-- 2. ENSURE ALL PROFILE FIELDS EXIST
-- =============================================================================

-- Check and add any missing core profile fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS thai_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS national_id VARCHAR(13),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS drug_allergies TEXT,
ADD COLUMN IF NOT EXISTS food_allergies TEXT,
ADD COLUMN IF NOT EXISTS environment_allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS education VARCHAR(100),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS race VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);

-- =============================================================================
-- 3. CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_thai_name ON users(thai_name);
CREATE INDEX IF NOT EXISTS idx_users_province ON users(province);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_users_occupation ON users(occupation);
CREATE INDEX IF NOT EXISTS idx_users_marital_status ON users(marital_status);

-- =============================================================================
-- 4. ADD CONSTRAINTS AND VALIDATION
-- =============================================================================

-- Clean up duplicate national_id values before adding unique constraint
UPDATE users 
SET national_id = NULL 
WHERE national_id = '1234567890123' 
AND id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY created_at ASC) as rn
        FROM users 
        WHERE national_id = '1234567890123'
    ) t WHERE t.rn = 1
);

-- Remove any other duplicate national_id values
UPDATE users 
SET national_id = NULL 
WHERE national_id IS NOT NULL 
AND id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY created_at ASC) as rn
        FROM users 
        WHERE national_id IS NOT NULL
    ) t WHERE t.rn = 1
);

-- Now safely add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_users_national_id' 
        AND table_name = 'users'
    ) THEN
        -- Only create unique constraint for non-null values
        CREATE UNIQUE INDEX unique_users_national_id ON users (national_id) WHERE national_id IS NOT NULL;
    END IF;
END $$;

-- Add check constraints for data validation
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_weight_range,
DROP CONSTRAINT IF EXISTS check_height_range,
DROP CONSTRAINT IF EXISTS check_bmi_range;

ALTER TABLE users 
ADD CONSTRAINT check_weight_range CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1000)),
ADD CONSTRAINT check_height_range CHECK (height IS NULL OR (height >= 0 AND height <= 300)),
ADD CONSTRAINT check_bmi_range CHECK (bmi IS NULL OR (bmi >= 0 AND bmi <= 100));

-- =============================================================================
-- 5. CREATE TRIGGER FOR BMI CALCULATION
-- =============================================================================

-- Function to calculate BMI when weight or height is updated
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
        NEW.bmi = ROUND((NEW.weight / ((NEW.height / 100.0) * (NEW.height / 100.0)))::numeric, 2);
    ELSE
        NEW.bmi = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_calculate_bmi ON users;
CREATE TRIGGER trigger_calculate_bmi
    BEFORE INSERT OR UPDATE OF weight, height ON users
    FOR EACH ROW EXECUTE FUNCTION calculate_bmi();

-- =============================================================================
-- 6. UPDATE EXISTING RECORDS
-- =============================================================================

-- Update BMI for existing records
UPDATE users 
SET bmi = CASE 
    WHEN weight IS NOT NULL AND height IS NOT NULL AND height > 0 
    THEN ROUND((weight / ((height / 100.0) * (height / 100.0)))::numeric, 2)
    ELSE NULL
END
WHERE weight IS NOT NULL AND height IS NOT NULL;

-- =============================================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN users.id_card_address IS 'Address as per ID card';
COMMENT ON COLUMN users.chronic_diseases IS 'List of chronic diseases';
COMMENT ON COLUMN users.bmi IS 'Body Mass Index (calculated automatically)';
COMMENT ON COLUMN users.nationality IS 'Nationality';
COMMENT ON COLUMN users.province IS 'Province/State';
COMMENT ON COLUMN users.district IS 'District/County';
COMMENT ON COLUMN users.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN users.weight IS 'Weight in kilograms';
COMMENT ON COLUMN users.height IS 'Height in centimeters';

-- =============================================================================
-- 8. SAMPLE DATA UPDATE (OPTIONAL)
-- =============================================================================

-- Uncomment to set default nationality for existing records
-- UPDATE users SET nationality = 'Thai' WHERE nationality IS NULL;

-- =============================================================================
-- 9. VERIFICATION QUERY
-- =============================================================================

-- Query to verify all fields exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;
