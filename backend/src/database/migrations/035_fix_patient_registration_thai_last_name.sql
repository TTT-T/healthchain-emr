-- Fix Patient Registration Thai Last Name Storage
-- This migration documents the fix for patient registration not storing thai_last_name

-- Problem: Patient registration was not storing thai_last_name in database
-- Root Cause: Backend registration query was missing thai_last_name column

-- Changes made to backend/src/controllers/patientRegistrationController.ts:
-- 1. Added thai_last_name to INSERT query (line 150)
-- 2. Added thai_last_name to VALUES clause (line 173)
-- 3. Added thai_last_name to RETURNING clause (line 160)
-- 4. Fixed response data to include thai_last_name (line 262)
-- 5. Fixed chronicDiseases field mapping (line 272)

-- The registration process now properly:
-- - Stores thai_last_name in database
-- - Returns thai_last_name in response
-- - Maintains data consistency across the system

-- This fix ensures that:
-- - Patient registration stores complete name information
-- - Checkin page can display full Thai names
-- - Data integrity is maintained throughout the system
-- - No data loss during patient registration

-- No database schema changes required - this is a query and response fix
-- This migration serves as documentation of the patient registration fix
