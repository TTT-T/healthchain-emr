-- Add missing fields to notifications table
-- This migration adds the priority, action_required, action_url, and expires_at fields
-- that are referenced in the notification controller but missing from the schema

-- Add priority field
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add action_required field
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT FALSE;

-- Add action_url field
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);

-- Add expires_at field
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Update existing records to have default priority
UPDATE notifications 
SET priority = 'normal' 
WHERE priority IS NULL;

-- Add comments for the new fields
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, normal, high, urgent';
COMMENT ON COLUMN notifications.action_required IS 'Whether the notification requires user action';
COMMENT ON COLUMN notifications.action_url IS 'URL for action button in notification';
COMMENT ON COLUMN notifications.expires_at IS 'When the notification expires (optional)';
