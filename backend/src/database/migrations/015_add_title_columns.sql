-- =============================================================================
-- Migration 015: Add title columns to users and patients tables
-- =============================================================================
-- Description: Add title/prefix columns for proper name handling
-- Date: 2025-09-10
-- Author: System
-- =============================================================================

-- Add title column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS title VARCHAR(50);

-- Add title column to patients table  
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS title VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN users.title IS 'Title/prefix for name (Mr., Mrs., Miss, Ms., นาย, นาง, นางสาว, etc.)';
COMMENT ON COLUMN patients.title IS 'Title/prefix for name (Mr., Mrs., Miss, Ms., นาย, นาง, นางสาว, etc.)';

-- Update migration log
INSERT INTO migrations (migration_name, executed_at, execution_time_ms, success, error_message) 
VALUES ('015_add_title_columns', CURRENT_TIMESTAMP, 0, true, NULL);
