-- =============================================================================
-- MIGRATION 002: Enhanced Data Tables
-- =============================================================================
-- เพิ่มตารางสำหรับข้อมูลโภชนาการและการออกกำลังกายรายละเอียด

-- Detailed Nutrition Table
CREATE TABLE IF NOT EXISTS detailed_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    daily_calorie_intake INTEGER,
    protein_intake DECIMAL(5,2),
    carbohydrate_intake DECIMAL(5,2),
    fat_intake DECIMAL(5,2),
    fiber_intake DECIMAL(5,2),
    sugar_intake DECIMAL(5,2),
    sodium_intake DECIMAL(5,2),
    water_intake DECIMAL(5,2),
    meal_frequency INTEGER,
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Exercise Table
CREATE TABLE IF NOT EXISTS detailed_exercise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    exercise_type VARCHAR(100),
    exercise_duration INTEGER, -- minutes
    exercise_intensity VARCHAR(50),
    exercise_frequency INTEGER, -- times per week
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_patient_id ON detailed_nutrition(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessment_date ON detailed_nutrition(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_patient_id ON detailed_exercise(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_exercise_assessment_date ON detailed_exercise(assessment_date);

-- Triggers
CREATE TRIGGER update_detailed_nutrition_updated_at BEFORE UPDATE ON detailed_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detailed_exercise_updated_at BEFORE UPDATE ON detailed_exercise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE detailed_nutrition IS 'ข้อมูลโภชนาการรายละเอียด - Detailed nutrition assessment';
COMMENT ON TABLE detailed_exercise IS 'ข้อมูลการออกกำลังกายรายละเอียด - Detailed exercise assessment';
