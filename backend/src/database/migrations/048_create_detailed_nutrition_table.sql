-- Create Detailed Nutrition Table
-- This table stores detailed nutritional information for AI risk assessment

CREATE TABLE IF NOT EXISTS detailed_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    
    -- Daily Intake
    daily_calorie_intake INTEGER,
    carbohydrate_intake DECIMAL(8,2), -- grams
    protein_intake DECIMAL(8,2), -- grams
    fat_intake DECIMAL(8,2), -- grams
    fiber_intake DECIMAL(8,2), -- grams
    sugar_intake DECIMAL(8,2), -- grams
    sodium_intake DECIMAL(8,2), -- mg
    
    -- Fluid Intake
    water_intake DECIMAL(8,2), -- liters
    
    -- Eating Patterns
    meal_frequency INTEGER, -- meals per day
    snacking_frequency INTEGER, -- snacks per day
    
    -- Beverages
    alcohol_consumption DECIMAL(8,2), -- drinks per week
    caffeine_consumption DECIMAL(8,2), -- mg per day
    
    -- Food Quality Assessment
    processed_food_intake VARCHAR(20) CHECK (processed_food_intake IN ('low', 'moderate', 'high')),
    organic_food_intake VARCHAR(20) CHECK (organic_food_intake IN ('low', 'moderate', 'high')),
    fast_food_frequency INTEGER, -- times per week
    
    -- Dietary Restrictions
    dietary_restrictions TEXT[],
    food_allergies TEXT[],
    
    -- Assessment Method
    assessment_method VARCHAR(50) DEFAULT 'self_report' 
        CHECK (assessment_method IN ('self_report', 'dietitian_interview', 'food_diary', 'recall_24h')),
    
    -- Additional Fields
    notes TEXT,
    assessed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_patient_id ON detailed_nutrition(patient_id);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessment_date ON detailed_nutrition(assessment_date);
CREATE INDEX IF NOT EXISTS idx_detailed_nutrition_assessed_by ON detailed_nutrition(assessed_by);

-- Add comments
COMMENT ON TABLE detailed_nutrition IS 'Detailed nutritional information for AI risk assessment';
COMMENT ON COLUMN detailed_nutrition.daily_calorie_intake IS 'Daily calorie intake (kcal)';
COMMENT ON COLUMN detailed_nutrition.carbohydrate_intake IS 'Daily carbohydrate intake (grams)';
COMMENT ON COLUMN detailed_nutrition.protein_intake IS 'Daily protein intake (grams)';
COMMENT ON COLUMN detailed_nutrition.fat_intake IS 'Daily fat intake (grams)';
COMMENT ON COLUMN detailed_nutrition.fiber_intake IS 'Daily fiber intake (grams)';
COMMENT ON COLUMN detailed_nutrition.sugar_intake IS 'Daily sugar intake (grams)';
COMMENT ON COLUMN detailed_nutrition.sodium_intake IS 'Daily sodium intake (mg)';
COMMENT ON COLUMN detailed_nutrition.water_intake IS 'Daily water intake (liters)';
COMMENT ON COLUMN detailed_nutrition.meal_frequency IS 'Number of meals per day';
COMMENT ON COLUMN detailed_nutrition.snacking_frequency IS 'Number of snacks per day';
COMMENT ON COLUMN detailed_nutrition.alcohol_consumption IS 'Alcohol consumption (drinks per week)';
COMMENT ON COLUMN detailed_nutrition.caffeine_consumption IS 'Caffeine consumption (mg per day)';
COMMENT ON COLUMN detailed_nutrition.processed_food_intake IS 'Level of processed food consumption';
COMMENT ON COLUMN detailed_nutrition.organic_food_intake IS 'Level of organic food consumption';
COMMENT ON COLUMN detailed_nutrition.fast_food_frequency IS 'Fast food consumption frequency (times per week)';
COMMENT ON COLUMN detailed_nutrition.dietary_restrictions IS 'Array of dietary restrictions';
COMMENT ON COLUMN detailed_nutrition.food_allergies IS 'Array of food allergies';
COMMENT ON COLUMN detailed_nutrition.assessment_method IS 'Method used for nutritional assessment';
