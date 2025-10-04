-- Create Detailed Exercise Table
-- This table stores detailed exercise and physical activity information for AI risk assessment

CREATE TABLE IF NOT EXISTS detailed_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    
    -- Exercise Types
    exercise_type VARCHAR(100), -- e.g., 'cardio', 'strength', 'yoga', 'swimming'
    exercise_duration INTEGER, -- minutes per session
    exercise_frequency INTEGER, -- sessions per week
    exercise_intensity VARCHAR(20) CHECK (exercise_intensity IN ('low', 'moderate', 'high')),
    
    -- Physical Activity Metrics
    mets DECIMAL(5,2), -- Metabolic equivalent of task
    vo2_max DECIMAL(5,2), -- Maximum oxygen consumption (mL/kg/min)
    walking_steps INTEGER, -- steps per day
    walking_distance DECIMAL(8,2), -- kilometers per day
    
    -- Activity Levels
    sedentary_time INTEGER, -- minutes per day
    light_activity_time INTEGER, -- minutes per day
    moderate_activity_time INTEGER, -- minutes per day
    vigorous_activity_time INTEGER, -- minutes per day
    
    -- Exercise History
    years_exercising INTEGER,
    exercise_consistency VARCHAR(20) CHECK (exercise_consistency IN ('poor', 'fair', 'good', 'excellent')),
    
    -- Physical Limitations
    physical_limitations TEXT[],
    exercise_barriers TEXT[],
    
    -- Fitness Goals
    fitness_goals TEXT[],
    target_weight DECIMAL(5,2),
    target_body_fat_percentage DECIMAL(5,2),
    
    -- Assessment Method
    assessment_method VARCHAR(50) DEFAULT 'self_report' 
        CHECK (assessment_method IN ('self_report', 'fitness_tracker', 'exercise_log', 'interview')),
    
    -- Additional Fields
    notes TEXT,
    assessed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_patient_id ON detailed_exercise(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessment_date ON detailed_exercise(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessed_by ON detailed_exercise(assessed_by);

-- Add comments
COMMENT ON TABLE detailed_exercise IS 'Detailed exercise and physical activity information for AI risk assessment';
COMMENT ON COLUMN detailed_exercise.exercise_type IS 'Type of exercise performed';
COMMENT ON COLUMN detailed_exercise.exercise_duration IS 'Duration of exercise per session (minutes)';
COMMENT ON COLUMN detailed_exercise.exercise_frequency IS 'Number of exercise sessions per week';
COMMENT ON COLUMN detailed_exercise.exercise_intensity IS 'Intensity level of exercise';
COMMENT ON COLUMN detailed_exercise.mets IS 'Metabolic equivalent of task';
COMMENT ON COLUMN detailed_exercise.vo2_max IS 'Maximum oxygen consumption (mL/kg/min)';
COMMENT ON COLUMN detailed_exercise.walking_steps IS 'Number of steps per day';
COMMENT ON COLUMN detailed_exercise.walking_distance IS 'Walking distance per day (kilometers)';
COMMENT ON COLUMN detailed_exercise.sedentary_time IS 'Time spent in sedentary activities (minutes per day)';
COMMENT ON COLUMN detailed_exercise.light_activity_time IS 'Time spent in light activities (minutes per day)';
COMMENT ON COLUMN detailed_exercise.moderate_activity_time IS 'Time spent in moderate activities (minutes per day)';
COMMENT ON COLUMN detailed_exercise.vigorous_activity_time IS 'Time spent in vigorous activities (minutes per day)';
COMMENT ON COLUMN detailed_exercise.years_exercising IS 'Number of years regularly exercising';
COMMENT ON COLUMN detailed_exercise.exercise_consistency IS 'Consistency of exercise routine';
COMMENT ON COLUMN detailed_exercise.physical_limitations IS 'Array of physical limitations';
COMMENT ON COLUMN detailed_exercise.exercise_barriers IS 'Array of barriers to exercise';
COMMENT ON COLUMN detailed_exercise.fitness_goals IS 'Array of fitness goals';
COMMENT ON COLUMN detailed_exercise.target_weight IS 'Target weight (kg)';
COMMENT ON COLUMN detailed_exercise.target_body_fat_percentage IS 'Target body fat percentage';
COMMENT ON COLUMN detailed_exercise.assessment_method IS 'Method used for exercise assessment';
