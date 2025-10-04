-- Create AI Insights Table
-- This table stores AI-generated insights and risk assessments for patients

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL 
        CHECK (insight_type IN ('diabetes_risk', 'hypertension_risk', 'heart_disease_risk', 'stroke_risk', 'cancer_risk', 'general_health')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(5,4) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    risk_level VARCHAR(20) 
        CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
    risk_score DECIMAL(5,2) DEFAULT 0.0 CHECK (risk_score >= 0 AND risk_score <= 100),
    recommendations TEXT[],
    factors JSONB DEFAULT '{}'::jsonb,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_patient_id ON ai_insights(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_risk_level ON ai_insights(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_at ON ai_insights(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights(is_active);

-- Add comments
COMMENT ON TABLE ai_insights IS 'AI-generated insights and risk assessments for patients';
COMMENT ON COLUMN ai_insights.insight_type IS 'Type of AI insight (diabetes_risk, hypertension_risk, etc.)';
COMMENT ON COLUMN ai_insights.confidence_score IS 'AI confidence score (0-1)';
COMMENT ON COLUMN ai_insights.risk_level IS 'Risk level assessment';
COMMENT ON COLUMN ai_insights.risk_score IS 'Risk score (0-100)';
COMMENT ON COLUMN ai_insights.recommendations IS 'Array of recommendations';
COMMENT ON COLUMN ai_insights.factors IS 'JSON object containing risk factors';
