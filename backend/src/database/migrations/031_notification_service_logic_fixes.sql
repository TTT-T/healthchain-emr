-- Notification Service Logic Fixes
-- This migration documents the fixes made to the notification service
-- to properly handle patient ID mapping and error handling

-- Changes made to frontend/src/services/notificationService.ts:
-- 1. Fixed patient ID mapping to use recordId (patient.id) instead of patientHn
-- 2. Added proper UUID validation before making API calls
-- 3. Added graceful error handling to skip backend notification if patient ID is invalid
-- 4. Improved error logging and fallback mechanisms

-- Changes made to frontend/src/app/emr/register-patient/page.tsx:
-- 1. Fixed recordId to use patient.id instead of patient.hn
-- 2. Ensured proper patient ID is passed to notification service

-- These changes ensure that:
-- - Patient notifications work correctly with proper UUID patient IDs
-- - System gracefully handles cases where patient ID cannot be resolved
-- - Patient registration is not affected by notification failures
-- - Backend notification API receives valid UUID patient IDs

-- No database schema changes required - this is a code logic fix
-- This migration serves as documentation of the notification service improvements
