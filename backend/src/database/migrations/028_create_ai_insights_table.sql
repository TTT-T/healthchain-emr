-- Create AI Insights table for storing AI risk assessments and insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'diabetes_risk', 'hypertension_risk', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0-1 scale
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100), -- 0-100 scale
    recommendations JSONB, -- Array of recommendation strings
    contributing_factors JSONB, -- Array of contributing factors
    metadata JSONB, -- Additional AI-specific data
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_ai_insights_patient_id ON ai_insights(patient_id);
CREATE INDEX idx_ai_insights_insight_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_risk_level ON ai_insights(risk_level);
CREATE INDEX idx_ai_insights_generated_at ON ai_insights(generated_at);
CREATE INDEX idx_ai_insights_active ON ai_insights(is_active);

-- Create composite index for common queries
CREATE INDEX idx_ai_insights_patient_type_active ON ai_insights(patient_id, insight_type, is_active);

-- Add comments
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and risk assessments for patients';
COMMENT ON COLUMN ai_insights.insight_type IS 'Type of AI insight (diabetes_risk, hypertension_risk, etc.)';
COMMENT ON COLUMN ai_insights.confidence_score IS 'AI confidence score from 0 to 1';
COMMENT ON COLUMN ai_insights.risk_level IS 'Risk level classification';
COMMENT ON COLUMN ai_insights.risk_score IS 'Risk score from 0 to 100';
COMMENT ON COLUMN ai_insights.recommendations IS 'JSON array of AI-generated recommendations';
COMMENT ON COLUMN ai_insights.contributing_factors IS 'JSON array of factors contributing to the risk assessment';
COMMENT ON COLUMN ai_insights.metadata IS 'Additional AI-specific data and parameters';
