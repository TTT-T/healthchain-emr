-- =============================================================================
-- Rollback Migration 022: Remove Performance Optimizations
-- =============================================================================
-- Description: Remove performance indexes added in migration 022
-- Date: 2025-01-27
-- Author: Database Audit System
-- =============================================================================

-- Remove performance indexes (in reverse order of creation)

-- Remove composite indexes
DROP INDEX IF EXISTS idx_notifications_patient_type;
DROP INDEX IF EXISTS idx_audit_logs_user_action;
DROP INDEX IF EXISTS idx_prescriptions_patient_date;
DROP INDEX IF EXISTS idx_lab_orders_patient_date;
DROP INDEX IF EXISTS idx_vital_signs_patient_time;
DROP INDEX IF EXISTS idx_visits_patient_date;

-- Remove contact search indexes
DROP INDEX IF EXISTS idx_patients_contact_search;
DROP INDEX IF EXISTS idx_patients_name_search;

-- Remove users table indexes
DROP INDEX IF EXISTS idx_users_professional_license;
DROP INDEX IF EXISTS idx_users_thai_name;

-- Remove patients table indexes
DROP INDEX IF EXISTS idx_patients_chronic_diseases;
DROP INDEX IF EXISTS idx_patients_phone_number;
DROP INDEX IF EXISTS idx_patients_blood_type;
DROP INDEX IF EXISTS idx_patients_blood_group;
DROP INDEX IF EXISTS idx_patients_birth_date;
DROP INDEX IF EXISTS idx_patients_thai_name;

-- =============================================================================
-- END OF ROLLBACK MIGRATION
-- =============================================================================
