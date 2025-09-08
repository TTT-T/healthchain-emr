-- Migration: Add user approval fields
-- Created: January 21, 2025
-- Purpose: Add fields for user approval and rejection tracking

-- =============================================================================
-- 1. ADD REJECTION REASON FIELD TO USERS TABLE
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- =============================================================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN users.rejection_reason IS 'Reason for user rejection by admin';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
