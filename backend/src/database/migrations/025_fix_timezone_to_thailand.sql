-- Migration: Fix timezone to Thailand (GMT+7)
-- Created: September 25, 2025
-- Purpose: Update all timestamp fields to use Thailand timezone

-- =============================================================================
-- 1. UPDATE USERS TABLE TIMESTAMPS
-- =============================================================================

-- Update users table timestamp defaults
ALTER TABLE users 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN last_login SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN last_activity SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN password_changed_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 2. UPDATE VISITS TABLE TIMESTAMPS
-- =============================================================================

-- Update visits table timestamp defaults
ALTER TABLE visits 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 3. UPDATE VITAL_SIGNS TABLE TIMESTAMPS
-- =============================================================================

-- Update vital_signs table timestamp defaults
ALTER TABLE vital_signs 
ALTER COLUMN measurement_time SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 4. UPDATE LAB_ORDERS TABLE TIMESTAMPS
-- =============================================================================

-- Update lab_orders table timestamp defaults
ALTER TABLE lab_orders 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 5. UPDATE LAB_RESULTS TABLE TIMESTAMPS
-- =============================================================================

-- Update lab_results table timestamp defaults
ALTER TABLE lab_results 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 6. UPDATE PRESCRIPTIONS TABLE TIMESTAMPS
-- =============================================================================

-- Update prescriptions table timestamp defaults
ALTER TABLE prescriptions 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 7. UPDATE PRESCRIPTION_ITEMS TABLE TIMESTAMPS
-- =============================================================================

-- Update prescription_items table timestamp defaults
ALTER TABLE prescription_items 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 8. UPDATE VISIT_ATTACHMENTS TABLE TIMESTAMPS
-- =============================================================================

-- Update visit_attachments table timestamp defaults
ALTER TABLE visit_attachments 
ALTER COLUMN upload_date SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 9. UPDATE DOCTORS TABLE TIMESTAMPS
-- =============================================================================

-- Update doctors table timestamp defaults
ALTER TABLE doctors 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 10. UPDATE NURSES TABLE TIMESTAMPS
-- =============================================================================

-- Update nurses table timestamp defaults
ALTER TABLE nurses 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 11. UPDATE NOTIFICATIONS TABLE TIMESTAMPS
-- =============================================================================

-- Update notifications table timestamp defaults
ALTER TABLE notifications 
ALTER COLUMN read_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 12. UPDATE CONSENT_REQUESTS TABLE TIMESTAMPS
-- =============================================================================

-- Update consent_requests table timestamp defaults
ALTER TABLE consent_requests 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN expires_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 13. UPDATE EXTERNAL_DATA_REQUESTS TABLE TIMESTAMPS
-- =============================================================================

-- Update external_data_requests table timestamp defaults
ALTER TABLE external_data_requests 
ALTER COLUMN approved_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 14. UPDATE MIGRATIONS TABLE TIMESTAMPS
-- =============================================================================

-- Update migrations table timestamp defaults
ALTER TABLE migrations 
ALTER COLUMN executed_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Bangkok');

-- =============================================================================
-- 15. UPDATE TRIGGER FUNCTION FOR THAILAND TIMEZONE
-- =============================================================================

-- Update the trigger function to use Thailand timezone
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Bangkok';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 16. UPDATE EXISTING DATA TO THAILAND TIMEZONE
-- =============================================================================

-- Update existing timestamp data to Thailand timezone
-- Note: This converts existing timestamps to Thailand timezone
UPDATE users SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    last_login = last_login AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    last_activity = last_activity AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    password_changed_at = password_changed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE visits SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE vital_signs SET 
    measurement_time = measurement_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE lab_orders SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE lab_results SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE prescriptions SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE prescription_items SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE visit_attachments SET 
    upload_date = upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE doctors SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE nurses SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE notifications SET 
    read_at = read_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE consent_requests SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    expires_at = expires_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE external_data_requests SET 
    approved_at = approved_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE created_at IS NOT NULL;

UPDATE migrations SET 
    executed_at = executed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'
WHERE executed_at IS NOT NULL;

-- =============================================================================
-- 17. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN users.created_at IS 'User creation timestamp (Thailand timezone)';
COMMENT ON COLUMN users.updated_at IS 'User last update timestamp (Thailand timezone)';
COMMENT ON COLUMN users.last_login IS 'User last login timestamp (Thailand timezone)';
COMMENT ON COLUMN users.last_activity IS 'User last activity timestamp (Thailand timezone)';
COMMENT ON COLUMN users.password_changed_at IS 'Password last changed timestamp (Thailand timezone)';

COMMENT ON COLUMN visits.created_at IS 'Visit creation timestamp (Thailand timezone)';
COMMENT ON COLUMN visits.updated_at IS 'Visit last update timestamp (Thailand timezone)';

COMMENT ON COLUMN vital_signs.measurement_time IS 'Vital signs measurement timestamp (Thailand timezone)';
COMMENT ON COLUMN vital_signs.created_at IS 'Vital signs creation timestamp (Thailand timezone)';
COMMENT ON COLUMN vital_signs.updated_at IS 'Vital signs last update timestamp (Thailand timezone)';

COMMENT ON COLUMN lab_orders.created_at IS 'Lab order creation timestamp (Thailand timezone)';
COMMENT ON COLUMN lab_orders.updated_at IS 'Lab order last update timestamp (Thailand timezone)';

COMMENT ON COLUMN lab_results.created_at IS 'Lab result creation timestamp (Thailand timezone)';
COMMENT ON COLUMN lab_results.updated_at IS 'Lab result last update timestamp (Thailand timezone)';

COMMENT ON COLUMN prescriptions.created_at IS 'Prescription creation timestamp (Thailand timezone)';
COMMENT ON COLUMN prescriptions.updated_at IS 'Prescription last update timestamp (Thailand timezone)';

COMMENT ON COLUMN prescription_items.created_at IS 'Prescription item creation timestamp (Thailand timezone)';
COMMENT ON COLUMN prescription_items.updated_at IS 'Prescription item last update timestamp (Thailand timezone)';

COMMENT ON COLUMN visit_attachments.upload_date IS 'Attachment upload timestamp (Thailand timezone)';
COMMENT ON COLUMN visit_attachments.created_at IS 'Attachment creation timestamp (Thailand timezone)';
COMMENT ON COLUMN visit_attachments.updated_at IS 'Attachment last update timestamp (Thailand timezone)';

COMMENT ON COLUMN doctors.created_at IS 'Doctor creation timestamp (Thailand timezone)';
COMMENT ON COLUMN doctors.updated_at IS 'Doctor last update timestamp (Thailand timezone)';

COMMENT ON COLUMN nurses.created_at IS 'Nurse creation timestamp (Thailand timezone)';
COMMENT ON COLUMN nurses.updated_at IS 'Nurse last update timestamp (Thailand timezone)';

COMMENT ON COLUMN notifications.read_at IS 'Notification read timestamp (Thailand timezone)';
COMMENT ON COLUMN notifications.created_at IS 'Notification creation timestamp (Thailand timezone)';
COMMENT ON COLUMN notifications.updated_at IS 'Notification last update timestamp (Thailand timezone)';

COMMENT ON COLUMN consent_requests.created_at IS 'Consent request creation timestamp (Thailand timezone)';
COMMENT ON COLUMN consent_requests.expires_at IS 'Consent request expiration timestamp (Thailand timezone)';
COMMENT ON COLUMN consent_requests.updated_at IS 'Consent request last update timestamp (Thailand timezone)';

COMMENT ON COLUMN external_data_requests.approved_at IS 'External data request approval timestamp (Thailand timezone)';
COMMENT ON COLUMN external_data_requests.created_at IS 'External data request creation timestamp (Thailand timezone)';
COMMENT ON COLUMN external_data_requests.updated_at IS 'External data request last update timestamp (Thailand timezone)';

COMMENT ON COLUMN migrations.executed_at IS 'Migration execution timestamp (Thailand timezone)';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
