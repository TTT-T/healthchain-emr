-- Fix Register Patient Search Thai Last Name
-- This migration documents the fix for missing thai_last_name in register-patient search

-- Problem: Register-patient page search by 13-digit national ID not showing Thai last name
-- Root Cause: Backend searchUsersByNationalId API was missing thai_last_name in patients table query

-- Changes made to backend/src/controllers/patientManagementController.ts:
-- 1. searchUsersByNationalId - Added p.thai_last_name to patientCheckQuery (line 35)
--   - This query searches in patients table when patient already exists
--   - Now includes thai_last_name field in SELECT clause

-- Changes made to frontend/src/services/patientService.ts:
-- 2. searchPatients - Fixed data mapping for national ID search (lines 91-92)
--   - Changed from: thai_name: user.thaiName
--   - Changed to: thai_name: user.thai_name || user.thaiName
--   - Changed from: thai_lastName: user.thai_lastName
--   - Changed to: thai_lastName: user.thai_last_name || user.thai_lastName

-- The search flow for 13-digit national ID:
-- 1. Frontend calls PatientService.searchPatients(query, 'name')
-- 2. PatientService calls apiClient.searchUsersByNationalId(query)
-- 3. Backend searchUsersByNationalId checks patients table first
-- 4. If patient exists, returns patient data with thai_last_name
-- 5. Frontend maps data and displays in register-patient page

-- This fix ensures that:
-- - Duplicate patient notifications show complete Thai names
-- - Search results display full Thai names (first + last)
-- - Data consistency between backend and frontend
-- - Proper field mapping for different data sources

-- No database schema changes required - this is a query and mapping fix
-- This migration serves as documentation of the register-patient search fix
