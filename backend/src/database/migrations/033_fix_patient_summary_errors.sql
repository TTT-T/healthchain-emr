-- Fix Patient Summary Errors
-- This migration fixes the remaining errors in patient summary functionality

-- 1. Add missing thai_last_name column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS thai_last_name VARCHAR(200);

-- 2. Create ai_insights table for AI risk assessment history
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    generated_by VARCHAR(100) DEFAULT 'ai_system',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for ai_insights table
CREATE INDEX IF NOT EXISTS idx_ai_insights_patient_id ON ai_insights(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_at ON ai_insights(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights(is_active);

-- 4. Add comments
COMMENT ON TABLE ai_insights IS 'AI-generated insights and risk assessments for patients';
COMMENT ON COLUMN ai_insights.insight_type IS 'Type of insight: diabetes_risk, health_trend, prediction, etc.';
COMMENT ON COLUMN ai_insights.insight_data IS 'JSON data containing the insight details and results';
COMMENT ON COLUMN ai_insights.confidence_score IS 'AI confidence score from 0.0 to 1.0';
COMMENT ON COLUMN patients.thai_last_name IS 'Thai last name for patients (added to fix patient summary query)';
