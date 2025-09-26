-- =============================================================================
-- Migration 021: Add current_address field to users table
-- =============================================================================
-- Description: Add current_address field to distinguish from id_card_address
-- Date: 2025-09-24
-- Author: System
-- =============================================================================

-- Add current_address column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.current_address IS 'Current residential address (different from ID card address)';

