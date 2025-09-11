-- Migration: Add separate birth date fields
-- Created: January 21, 2025
-- Purpose: Add birth_day, birth_month, birth_year fields to users table for better date handling

-- =============================================================================
-- 1. ADD SEPARATE BIRTH DATE FIELDS TO USERS TABLE
-- =============================================================================

-- Add separate birth date fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birth_day INTEGER CHECK (birth_day >= 1 AND birth_day <= 31),
ADD COLUMN IF NOT EXISTS birth_month INTEGER CHECK (birth_month >= 1 AND birth_month <= 12),
ADD COLUMN IF NOT EXISTS birth_year INTEGER CHECK (birth_year >= 2400 AND birth_year <= 2700);

-- =============================================================================
-- 2. ADD SEPARATE INSURANCE EXPIRY DATE FIELDS TO USERS TABLE
-- =============================================================================

-- Add separate insurance expiry date fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS insurance_expiry_day INTEGER CHECK (insurance_expiry_day >= 1 AND insurance_expiry_day <= 31),
ADD COLUMN IF NOT EXISTS insurance_expiry_month INTEGER CHECK (insurance_expiry_month >= 1 AND insurance_expiry_month <= 12),
ADD COLUMN IF NOT EXISTS insurance_expiry_year INTEGER CHECK (insurance_expiry_year >= 2400 AND insurance_expiry_year <= 2700);

-- =============================================================================
-- 3. CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================================================

-- Create indexes for birth date fields
CREATE INDEX IF NOT EXISTS idx_users_birth_day ON users(birth_day);
CREATE INDEX IF NOT EXISTS idx_users_birth_month ON users(birth_month);
CREATE INDEX IF NOT EXISTS idx_users_birth_year ON users(birth_year);

-- Create indexes for insurance expiry date fields
CREATE INDEX IF NOT EXISTS idx_users_insurance_expiry_day ON users(insurance_expiry_day);
CREATE INDEX IF NOT EXISTS idx_users_insurance_expiry_month ON users(insurance_expiry_month);
CREATE INDEX IF NOT EXISTS idx_users_insurance_expiry_year ON users(insurance_expiry_year);

-- =============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Add comments for birth date fields
COMMENT ON COLUMN users.birth_day IS 'Day of birth (1-31)';
COMMENT ON COLUMN users.birth_month IS 'Month of birth (1-12)';
COMMENT ON COLUMN users.birth_year IS 'Year of birth in Buddhist Era (พ.ศ.)';

-- Add comments for insurance expiry date fields
COMMENT ON COLUMN users.insurance_expiry_day IS 'Day of insurance expiry (1-31)';
COMMENT ON COLUMN users.insurance_expiry_month IS 'Month of insurance expiry (1-12)';
COMMENT ON COLUMN users.insurance_expiry_year IS 'Year of insurance expiry in Buddhist Era (พ.ศ.)';

-- =============================================================================
-- 5. MIGRATION COMPLETE
-- =============================================================================

-- This migration adds separate birth date and insurance expiry date fields
-- These fields allow for better date handling in the frontend forms
-- The fields use Buddhist Era (พ.ศ.) for years as per Thai standards
