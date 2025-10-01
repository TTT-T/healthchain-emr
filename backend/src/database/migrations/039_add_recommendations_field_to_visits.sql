-- Add recommendations field to visits table
-- This migration adds the recommendations field to store patient recommendations

-- Add recommendations column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS recommendations TEXT;

-- Add comment to document the new column
COMMENT ON COLUMN visits.recommendations IS 'Patient recommendations and advice from doctor';

-- Update the migration log
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
    '039_add_recommendations_field_to_visits', 
    NOW() AT TIME ZONE 'Asia/Bangkok',
    'Added recommendations field to visits table for storing patient recommendations'
) ON CONFLICT (migration_name) DO NOTHING;
