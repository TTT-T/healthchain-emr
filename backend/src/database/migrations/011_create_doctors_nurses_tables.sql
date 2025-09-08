-- Migration: Create doctors and nurses tables
-- Created: January 21, 2025
-- Purpose: Create dedicated tables for doctor and nurse professional profiles

-- =============================================================================
-- 1. CREATE DOCTORS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional Information
    medical_license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INTEGER,
    
    -- Education & Qualifications
    education JSONB, -- Array of education records
    certifications JSONB, -- Array of certifications
    languages JSONB, -- Array of languages spoken
    
    -- Work Information
    department VARCHAR(100),
    position VARCHAR(100),
    work_schedule JSONB, -- Work schedule configuration
    consultation_fee DECIMAL(10,2),
    availability JSONB, -- Availability settings
    
    -- Emergency Contact
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    
    -- Preferences
    notification_preferences JSONB,
    privacy_settings JSONB,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. CREATE NURSES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional Information
    nursing_license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INTEGER,
    
    -- Education & Qualifications
    education JSONB, -- Array of education records
    certifications JSONB, -- Array of certifications
    languages JSONB, -- Array of languages spoken
    
    -- Work Information
    department VARCHAR(100),
    position VARCHAR(100),
    work_schedule JSONB, -- Work schedule configuration
    shift_preference VARCHAR(50), -- Day, Night, Rotating, etc.
    availability JSONB, -- Availability settings
    
    -- Emergency Contact
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    
    -- Preferences
    notification_preferences JSONB,
    privacy_settings JSONB,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Doctors table indexes
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_medical_license ON doctors(medical_license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);

-- Nurses table indexes
CREATE INDEX IF NOT EXISTS idx_nurses_user_id ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_nurses_nursing_license ON nurses(nursing_license_number);
CREATE INDEX IF NOT EXISTS idx_nurses_specialization ON nurses(specialization);
CREATE INDEX IF NOT EXISTS idx_nurses_department ON nurses(department);

-- =============================================================================
-- 4. CREATE TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================================================

-- Doctors table trigger
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nurses table trigger
CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON nurses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE doctors IS 'Doctor professional profiles and credentials';
COMMENT ON TABLE nurses IS 'Nurse professional profiles and credentials';

COMMENT ON COLUMN doctors.medical_license_number IS 'Medical license number (unique)';
COMMENT ON COLUMN doctors.specialization IS 'Medical specialization (e.g., Cardiology, Pediatrics)';
COMMENT ON COLUMN doctors.years_of_experience IS 'Years of professional experience';
COMMENT ON COLUMN doctors.education IS 'Education background (JSON array)';
COMMENT ON COLUMN doctors.certifications IS 'Professional certifications (JSON array)';
COMMENT ON COLUMN doctors.languages IS 'Languages spoken (JSON array)';
COMMENT ON COLUMN doctors.work_schedule IS 'Work schedule configuration (JSON)';
COMMENT ON COLUMN doctors.consultation_fee IS 'Consultation fee per visit';
COMMENT ON COLUMN doctors.availability IS 'Availability settings (JSON)';

COMMENT ON COLUMN nurses.nursing_license_number IS 'Nursing license number (unique)';
COMMENT ON COLUMN nurses.specialization IS 'Nursing specialization (e.g., ICU, Emergency)';
COMMENT ON COLUMN nurses.years_of_experience IS 'Years of professional experience';
COMMENT ON COLUMN nurses.education IS 'Education background (JSON array)';
COMMENT ON COLUMN nurses.certifications IS 'Professional certifications (JSON array)';
COMMENT ON COLUMN nurses.languages IS 'Languages spoken (JSON array)';
COMMENT ON COLUMN nurses.work_schedule IS 'Work schedule configuration (JSON)';
COMMENT ON COLUMN nurses.shift_preference IS 'Preferred shift type (Day, Night, Rotating)';
COMMENT ON COLUMN nurses.availability IS 'Availability settings (JSON)';

-- =============================================================================
-- 6. ADD CONSTRAINTS
-- =============================================================================

-- Add constraints for years of experience
ALTER TABLE doctors ADD CONSTRAINT check_doctors_experience 
    CHECK (years_of_experience >= 0 AND years_of_experience <= 50);

ALTER TABLE nurses ADD CONSTRAINT check_nurses_experience 
    CHECK (years_of_experience >= 0 AND years_of_experience <= 50);

-- Add constraints for consultation fee
ALTER TABLE doctors ADD CONSTRAINT check_consultation_fee 
    CHECK (consultation_fee >= 0);

-- Add constraints for shift preference
ALTER TABLE nurses ADD CONSTRAINT check_shift_preference 
    CHECK (shift_preference IN ('day', 'night', 'rotating', 'flexible', 'other'));

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
