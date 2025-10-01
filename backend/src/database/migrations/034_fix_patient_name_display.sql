-- Fix Patient Name Display in Checkin Page
-- This migration documents the fix for patient name display issue

-- Problem: Checkin page was only showing first name (e.g., "เอ") instead of full name
-- Root Cause: Backend queries were not selecting thai_last_name column

-- Changes made to backend/src/controllers/patientManagementController.ts:
-- 1. Added p.thai_last_name to getAllPatients query (line 255)
-- 2. Added p.thai_last_name to searchPatients query (line 1198) 
-- 3. Added p.thai_last_name to listPatients query (line 1358)
-- 4. Added thai_last_name to formattedPatients mapping (line 1253)

-- The frontend checkin page already has logic to combine thai_name and thai_last_name:
-- - If thai_name contains both first and last name, use it as is
-- - If we have separate thai_name and thai_last_name, combine them
-- - If we only have thai_name, use it alone

-- This fix ensures that:
-- - Patient names are displayed correctly in checkin page
-- - Other systems are not affected (only backend data retrieval improved)
-- - Existing frontend logic continues to work as expected

-- No database schema changes required - this is a query improvement
-- This migration serves as documentation of the patient name display fix
