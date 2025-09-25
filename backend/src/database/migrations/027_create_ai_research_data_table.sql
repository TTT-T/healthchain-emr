-- Migration: Create AI Research Data Table
-- Created: September 25, 2025
-- Purpose: Store AI research data from EMR forms

-- =============================================================================
-- 1. CREATE AI RESEARCH DATA TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient Reference
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Record Type and Reference
    record_type VARCHAR(50) NOT NULL 
        CHECK (record_type IN ('doctor_visit', 'pharmacy', 'lab_result', 'appointment')),
    record_id UUID, -- Reference to specific record (visit_id, prescription_id, etc.)
    
    -- AI Research Data (JSONB for flexibility)
    research_data JSONB NOT NULL,
    
    -- Metadata
    data_version VARCHAR(10) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Staff Information
    recorded_by UUID NOT NULL REFERENCES users(id),
    recorded_time TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
    
    -- System Fields
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok')
);

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_research_data_patient_id ON ai_research_data(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_record_type ON ai_research_data(record_type);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_recorded_time ON ai_research_data(recorded_time);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_recorded_by ON ai_research_data(recorded_by);
CREATE INDEX IF NOT EXISTS idx_ai_research_data_is_active ON ai_research_data(is_active);

-- =============================================================================
-- 3. CREATE TRIGGER FOR TIMESTAMP UPDATES
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_research_data_updated_at') THEN
        CREATE TRIGGER update_ai_research_data_updated_at BEFORE UPDATE ON ai_research_data
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE ai_research_data IS 'AI Research Data - Store structured data for AI model training and research';
COMMENT ON COLUMN ai_research_data.record_type IS 'Type of EMR record: doctor_visit, pharmacy, lab_result, appointment';
COMMENT ON COLUMN ai_research_data.research_data IS 'JSONB field containing all AI research fields from frontend forms';
COMMENT ON COLUMN ai_research_data.data_version IS 'Version of data structure for future compatibility';
COMMENT ON COLUMN ai_research_data.is_active IS 'Whether this research data is active and should be used for AI training';
