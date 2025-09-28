-- Update notifications table to support additional notification types
-- This migration adds support for history_taking_recorded, vital_signs_recorded, and patient_registered

-- First, drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add the new constraint with additional notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
    'document_created', 
    'record_updated', 
    'appointment_created', 
    'lab_result_ready', 
    'prescription_ready', 
    'queue_assigned', 
    'visit_completed',
    'history_taking_recorded',
    'vital_signs_recorded',
    'patient_registered'
));

-- Add comment to document the change
COMMENT ON CONSTRAINT notifications_notification_type_check ON notifications IS 
'Updated to support additional notification types: history_taking_recorded, vital_signs_recorded, patient_registered';
