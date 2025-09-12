-- =============================================================================
-- Migration 017: Create consent_requests table
-- =============================================================================
-- Description: Create consent_requests table for consent dashboard functionality
-- Date: 2025-09-12
-- Author: System
-- =============================================================================

-- Create consent_requests table
CREATE TABLE IF NOT EXISTS consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(50) UNIQUE NOT NULL,
    requester_name VARCHAR(200) NOT NULL,
    requester_type VARCHAR(50) NOT NULL 
        CHECK (requester_type IN ('hospital', 'clinic', 'insurance', 'research', 'government')),
    patient_name VARCHAR(200) NOT NULL,
    patient_hn VARCHAR(20),
    request_type VARCHAR(50) NOT NULL 
        CHECK (request_type IN ('hospital_transfer', 'insurance_claim', 'research', 'legal', 'emergency')),
    requested_data_types TEXT[] NOT NULL,
    purpose TEXT NOT NULL,
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (urgency_level IN ('emergency', 'urgent', 'normal')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent_to_patient', 'patient_reviewing', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_compliant BOOLEAN DEFAULT TRUE,
    compliance_notes TEXT,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for consent_requests
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_created_at ON consent_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_requests_requester_type ON consent_requests(requester_type);
CREATE INDEX IF NOT EXISTS idx_consent_requests_urgency_level ON consent_requests(urgency_level);

-- Create trigger for timestamp updates (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_consent_requests_updated_at') THEN
        CREATE TRIGGER update_consent_requests_updated_at BEFORE UPDATE ON consent_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE consent_requests IS 'Consent Requests - Table for managing external data access requests';

-- Update migration log
INSERT INTO migrations (migration_name, executed_at, execution_time_ms, success, error_message) 
VALUES ('017_create_consent_requests_table', CURRENT_TIMESTAMP, 0, true, NULL);
