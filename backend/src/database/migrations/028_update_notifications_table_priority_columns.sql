-- Update notifications table to add priority and action columns
-- This migration adds missing columns to the notifications table

-- Add priority column for notification priority levels
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- Add action_required column to indicate if action is needed
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false;

-- Add action_url column for notification action links
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Add expires_at column for notification expiration
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Add comments to document the new columns
COMMENT ON COLUMN notifications.priority IS 'Notification priority level (normal, high, urgent)';
COMMENT ON COLUMN notifications.action_required IS 'Whether the notification requires user action';
COMMENT ON COLUMN notifications.action_url IS 'URL for notification action (if applicable)';
COMMENT ON COLUMN notifications.expires_at IS 'Notification expiration timestamp (if applicable)';
