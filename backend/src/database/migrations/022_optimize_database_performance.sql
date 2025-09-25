-- =============================================================================
-- Migration 022: Optimize Database Performance
-- =============================================================================
-- Description: Add performance indexes and optimizations based on audit findings
-- Date: 2025-01-27
-- Author: Database Audit System
-- =============================================================================

-- Add performance indexes for frequently queried columns
-- These indexes will improve query performance without removing any data

-- Indexes for patients table
CREATE INDEX IF NOT EXISTS idx_patients_thai_name ON patients(thai_name);
CREATE INDEX IF NOT EXISTS idx_patients_birth_date ON patients(birth_date);
CREATE INDEX IF NOT EXISTS idx_patients_blood_group ON patients(blood_group);
CREATE INDEX IF NOT EXISTS idx_patients_blood_type ON patients(blood_type);
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_patients_chronic_diseases ON patients(chronic_diseases);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_thai_name ON users(thai_name);
CREATE INDEX IF NOT EXISTS idx_users_professional_license ON users(professional_license);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_patients_name_search ON patients(first_name, last_name, thai_name);
CREATE INDEX IF NOT EXISTS idx_patients_contact_search ON patients(phone, phone_number, email);

-- Indexes for medical records queries
CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON visits(patient_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_time ON vital_signs(patient_id, measurement_time);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_date ON lab_orders(patient_id, order_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_date ON prescriptions(patient_id, prescription_date);

-- Indexes for notification and audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_type ON notifications(patient_id, notification_type, created_at);

-- Add comments for documentation
COMMENT ON INDEX idx_patients_thai_name IS 'Index for Thai name searches in patient records';
COMMENT ON INDEX idx_patients_birth_date IS 'Index for age calculations and birth date queries';
COMMENT ON INDEX idx_users_thai_name IS 'Index for Thai name searches in user records';
COMMENT ON INDEX idx_patients_name_search IS 'Composite index for patient name searches';
COMMENT ON INDEX idx_patients_contact_search IS 'Composite index for patient contact information searches';

-- =============================================================================
-- Performance Analysis Queries (for monitoring)
-- =============================================================================

-- Query to check index usage (run after deployment)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- Query to identify slow queries (requires pg_stat_statements)
/*
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements 
WHERE mean_exec_time > 1000  -- queries taking more than 1 second
ORDER BY mean_exec_time DESC
LIMIT 10;
*/

-- =============================================================================
-- END OF PERFORMANCE OPTIMIZATION MIGRATION
-- =============================================================================
