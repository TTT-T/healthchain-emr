-- Add support for patient lookup by HN endpoint
-- This migration documents the addition of the /medical/patients/by-hn/:hn endpoint
-- which was added to support patient ID lookup from hospital number

-- Note: This is a documentation migration for the API endpoint addition
-- The endpoint allows looking up patients by hospital number (HN) instead of UUID
-- This is used by the notification service to convert HN to patient ID

-- The endpoint implementation is in:
-- - backend/src/controllers/patientManagementController.ts (getPatientByHn function)
-- - backend/src/routes/medical.ts (route definition)

-- This migration serves as documentation that the endpoint was added
-- to support the notification system's need to convert HN to patient UUID

COMMENT ON TABLE patients IS 'Patients table - supports lookup by both UUID (id) and hospital_number (HN)';
COMMENT ON COLUMN patients.hospital_number IS 'Hospital Number (HN) - used for patient lookup in notification system';
