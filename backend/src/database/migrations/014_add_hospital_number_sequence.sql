-- Migration: Add hospital number sequence for HR number generation
-- Created: January 10, 2025
-- Purpose: Create sequence for generating unique hospital numbers (HR numbers)

-- =============================================================================
-- 1. CREATE HOSPITAL NUMBER SEQUENCE
-- =============================================================================

-- Create sequence for hospital numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS hospital_number_seq START 1;

-- =============================================================================
-- 2. CREATE FUNCTION TO GENERATE HOSPITAL NUMBER
-- =============================================================================

-- Function to generate hospital number (HR number)
CREATE OR REPLACE FUNCTION generate_hospital_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    year_suffix VARCHAR(2);
    sequence_num VARCHAR(4);
    hospital_number VARCHAR(20);
BEGIN
    -- Get last 2 digits of current year
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get next sequence number
    sequence_num := LPAD(nextval('hospital_number_seq')::TEXT, 4, '0');
    
    -- Format: HN + YY + 4-digit sequence
    hospital_number := 'HN' || year_suffix || sequence_num;
    
    RETURN hospital_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON SEQUENCE hospital_number_seq IS 'Sequence for generating unique hospital numbers (HR numbers)';
COMMENT ON FUNCTION generate_hospital_number() IS 'Generates unique hospital number in format HN + YY + 4-digit sequence (e.g., HN250001)';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
