-- Fix Backend Patient API Thai Last Name
-- This migration documents the fix for missing thai_last_name in backend API responses

-- Problem: Backend API responses were missing thai_last_name in formattedPatients
-- Root Cause: Backend controllers were not including thai_last_name in personal_info objects

-- Changes made to backend/src/controllers/patientManagementController.ts:
-- 1. getAllPatients - Added thai_last_name to personal_info (line 336)
-- 2. getPatientById - Added thai_last_name to personal_info (line 519)
-- 3. getPatient - Added thai_last_name to personal_info (line 936)
-- 4. listPatients - Added thai_last_name to personal_info (line 1399)

-- The backend now properly includes thai_last_name in all patient API responses:
-- - GET /api/medical/patients (getAllPatients)
-- - GET /api/medical/patients/:id (getPatientById)
-- - GET /api/patients/:identifier (getPatient)
-- - GET /api/patients (listPatients)

-- This fix ensures that:
-- - Frontend receives complete Thai name information
-- - Checkin page can display full Thai names
-- - Patient search results show complete names
-- - Data consistency across all patient endpoints

-- No database schema changes required - this is a backend API response fix
-- This migration serves as documentation of the backend API fix
