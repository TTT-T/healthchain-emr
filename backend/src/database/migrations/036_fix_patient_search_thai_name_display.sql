-- Fix Patient Search Thai Name Display in Registration Page
-- This migration documents the fix for Thai name display in patient search results

-- Problem: Patient search results in registration page only showed Thai first name
-- Root Cause: Frontend UI was using incorrect field names for Thai names

-- Changes made to frontend/src/app/emr/register-patient/page.tsx:
-- 1. Fixed Thai name display in search results (line 1105)
--    - Changed from: user.thaiFirstName
--    - Changed to: user.thaiName || user.thaiFirstName
-- 2. Fixed Thai name display in selected user info (line 1226)
--    - Changed from: selectedUserData.thaiFirstName
--    - Changed to: selectedUserData.thaiName || selectedUserData.thaiFirstName
-- 3. Fixed data mapping in handleLoadUserData (lines 527-528)
--    - Added fallback for thaiName field
--    - Added fallback for thaiLastName field

-- The PatientService.searchPatients returns data with these field names:
-- - thaiName (from patient.personal_info?.thai_name)
-- - thaiLastName (from patient.personal_info?.thai_last_name)

-- This fix ensures that:
-- - Patient search results display full Thai names correctly
-- - Duplicate patient notifications show complete names
-- - Data mapping handles different field name variations
-- - UI consistency across all patient display components

-- No database schema changes required - this is a frontend display fix
-- This migration serves as documentation of the patient search display fix
