-- =============================================================================
-- Migration 020: Create external_data_requests table
-- =============================================================================
-- Description: Create external_data_requests table for external requester registrations and data requests
-- Date: 2025-09-23
-- Author: System
-- =============================================================================

-- Drop table if exists (for development)
DROP TABLE IF EXISTS external_data_requests CASCADE;

-- Create external_data_requests table
CREATE TABLE external_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Requester Information
    requester_name VARCHAR(200) NOT NULL,
    requester_organization VARCHAR(200) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20),
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL 
        CHECK (request_type IN ('organization_registration', 'patient_data', 'aggregated_statistics', 'research_data', 'audit_data')),
    requested_data_types TEXT[] NOT NULL DEFAULT '{}',
    purpose TEXT NOT NULL,
    data_usage_period INTEGER, -- in days
    
    -- Consent and Patient Information
    consent_required BOOLEAN DEFAULT TRUE,
    patient_ids UUID[] DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    
    -- Additional Requirements (JSONB for flexibility)
    additional_requirements JSONB,
    
    -- Organization Details (for registration)
    organization_type VARCHAR(50) 
        CHECK (organization_type IN ('hospital', 'clinic', 'insurance_company', 'research_institute', 'government_agency', 'legal_entity', 'audit_organization')),
    registration_number VARCHAR(100),
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    address JSONB,
    
    -- Access Permissions
    allowed_request_types TEXT[] DEFAULT '{}',
    data_access_level VARCHAR(20) DEFAULT 'basic' 
        CHECK (data_access_level IN ('basic', 'standard', 'premium')),
    max_concurrent_requests INTEGER DEFAULT 5,
    
    -- Compliance Information
    compliance_certifications TEXT[] DEFAULT '{}',
    data_protection_certification VARCHAR(100),
    verification_documents JSONB DEFAULT '[]',
    
    -- Status and Approval
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'approved', 'rejected', 'suspended', 'expired')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- System Fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for external_data_requests
CREATE INDEX idx_external_data_requests_request_id ON external_data_requests(request_id);
CREATE INDEX idx_external_data_requests_status ON external_data_requests(status);
CREATE INDEX idx_external_data_requests_created_at ON external_data_requests(created_at);
CREATE INDEX idx_external_data_requests_requester_email ON external_data_requests(requester_email);
CREATE INDEX idx_external_data_requests_organization_type ON external_data_requests(organization_type);
CREATE INDEX idx_external_data_requests_request_type ON external_data_requests(request_type);

-- Create trigger for timestamp updates (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_external_data_requests_updated_at' 
        AND event_object_table = 'external_data_requests'
    ) THEN
        CREATE TRIGGER update_external_data_requests_updated_at BEFORE UPDATE ON external_data_requests
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE external_data_requests IS 'External Data Requests - Table for managing external requester registrations and data access requests';
COMMENT ON COLUMN external_data_requests.request_type IS 'Type of request: organization_registration, patient_data, aggregated_statistics, research_data, audit_data';
COMMENT ON COLUMN external_data_requests.organization_type IS 'Type of organization: hospital, clinic, insurance_company, research_institute, government_agency, legal_entity, audit_organization';
COMMENT ON COLUMN external_data_requests.status IS 'Request status: pending_review, approved, rejected, suspended, expired';
COMMENT ON COLUMN external_data_requests.data_access_level IS 'Access level: basic, standard, premium';
COMMENT ON COLUMN external_data_requests.additional_requirements IS 'Additional requirements and metadata in JSON format';
COMMENT ON COLUMN external_data_requests.address IS 'Organization address in JSON format';
COMMENT ON COLUMN external_data_requests.verification_documents IS 'Verification documents metadata in JSON format';