-- Create notifications table for patient notifications
-- This table will store all notifications sent to patients

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient Reference
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL 
        CHECK (notification_type IN ('document_created', 'record_updated', 'appointment_created', 'lab_result_ready', 'prescription_ready', 'queue_assigned', 'visit_completed')),
    
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related Record Information
    record_type VARCHAR(50),
    record_id UUID,
    
    -- Delivery Status
    sms_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    in_app_sent BOOLEAN DEFAULT FALSE,
    
    -- Read Status
    read_at TIMESTAMP,
    read_by UUID REFERENCES users(id),
    
    -- Metadata
    metadata JSONB,
    
    -- Staff Information
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_record_id ON notifications(record_id);

-- Trigger for timestamp updates
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notifications IS 'Patient Notifications - All notifications sent to patients';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: document_created, record_updated, appointment_created, lab_result_ready, prescription_ready, queue_assigned, visit_completed';
COMMENT ON COLUMN notifications.record_type IS 'Type of related record (visit, document, lab_result, etc.)';
COMMENT ON COLUMN notifications.record_id IS 'ID of related record';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification data in JSON format';
