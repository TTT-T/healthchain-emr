import { Router } from 'express';
import { 
  createPatient,
  getPatient,
  getPatientProfile,
  searchPatients,
  updatePatient,
  deletePatient,
  listPatients
} from '../controllers/patientManagementController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Import additional controllers for patient-specific endpoints
import {
  getPatientConsentRequests,
  respondToConsentRequest,
  createConsentRequest,
  updateConsentRequest
} from '../controllers/consentRequestsController';
import {
  getPatientNotifications,
  markNotificationAsRead,
  deletePatientNotification,
  createPatientNotification
} from '../controllers/notificationsController';
import {
  getPatientAIInsights,
  calculatePatientAIInsights
} from '../controllers/aiInsightsController';
import {
  getPatientRecords,
  createPatientRecord,
  updatePatientRecord,
  deletePatientRecord
} from '../controllers/medicalRecordsController';
import {
  getPatientDocuments,
  uploadPatientDocument,
  deletePatientDocument,
  downloadPatientDocument
} from '../controllers/medicalDocumentsController';
import {
  getPatientLabResults as getPatientLabResultsFromController,
  getPatientLabResult,
  createPatientLabResult,
  updatePatientLabResult
} from '../controllers/labResultsController';
import {
  getPatientMedications,
  addPatientMedication,
  updatePatientMedication
} from '../controllers/medicationsController';
import {
  getPatientAppointments,
  createPatientAppointment,
  updatePatientAppointment,
  cancelPatientAppointment
} from '../controllers/appointmentsController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Patient Management Routes
 */

// Get patient's own profile (for authenticated patients)
router.get('/profile', 
  authorize(['patient']), 
  getPatientProfile
);

// Create new patient
router.post('/', 
  authorize(['doctor', 'nurse', 'admin']), 
  createPatient
);

// List all patients (admin only) or search patients
router.get('/', 
  authorize(['doctor', 'nurse', 'admin']), 
  (req, res) => {
    // If there's a search query, use search function
    if (req.query.query) {
      return searchPatients(req, res);
    }
    // Otherwise, list all patients
    return listPatients(req, res);
  }
);

// Search patients specifically
router.get('/search', 
  authorize(['doctor', 'nurse', 'admin']), 
  searchPatients
);

// Get specific patient by ID or HN
router.get('/:identifier', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  getPatient
);

// Update patient information
router.put('/:id', 
  authorize(['doctor', 'nurse', 'admin']), 
  updatePatient
);

// Delete patient (soft delete)
router.delete('/:id', 
  authorize(['doctor', 'admin']), 
  deletePatient
);

// =============================================================================
// PATIENT-SPECIFIC ENDPOINTS
// =============================================================================

// Consent Requests
router.get('/:id/consent-requests', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientConsentRequests)
);
router.post('/:id/consent-requests', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(createConsentRequest)
);
router.put('/:id/consent-requests/:requestId', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(updateConsentRequest)
);
router.post('/:id/consent-requests/:requestId/respond', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(respondToConsentRequest)
);

// Notifications
router.get('/:id/notifications', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientNotifications)
);
router.post('/:id/notifications', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(createPatientNotification)
);
router.put('/:id/notifications/:notifId/read', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(markNotificationAsRead)
);
router.delete('/:id/notifications/:notifId', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(deletePatientNotification)
);

// AI Insights
router.get('/:id/ai-insights', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientAIInsights)
);
router.post('/:id/ai-insights/calculate', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(calculatePatientAIInsights)
);

// Medical Records
router.get('/:id/records', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientRecords)
);
router.post('/:id/records', 
  authorize(['doctor', 'nurse']), 
  asyncHandler(createPatientRecord)
);
router.put('/:id/records/:recordId', 
  authorize(['doctor', 'nurse']), 
  asyncHandler(updatePatientRecord)
);
router.delete('/:id/records/:recordId', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(deletePatientRecord)
);

// Medical Documents
router.get('/:id/documents', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientDocuments)
);
router.post('/:id/documents', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(uploadPatientDocument)
);
router.delete('/:id/documents/:docId', 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(deletePatientDocument)
);
router.get('/:id/documents/:docId/download', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(downloadPatientDocument)
);

// Lab Results
router.get('/:id/lab-results', 
  authorize(['doctor', 'nurse', 'admin', 'lab_tech', 'patient']), 
  asyncHandler(getPatientLabResultsFromController)
);
router.get('/:id/lab-results/:resultId', 
  authorize(['doctor', 'nurse', 'admin', 'lab_tech', 'patient']), 
  asyncHandler(getPatientLabResult)
);
router.post('/:id/lab-results', 
  authorize(['doctor', 'lab_tech']), 
  asyncHandler(createPatientLabResult)
);
router.put('/:id/lab-results/:resultId', 
  authorize(['doctor', 'lab_tech']), 
  asyncHandler(updatePatientLabResult)
);

// Medications
router.get('/:id/medications', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientMedications)
);
router.post('/:id/medications', 
  authorize(['doctor', 'nurse']), 
  asyncHandler(addPatientMedication)
);
router.put('/:id/medications/:medId', 
  authorize(['doctor', 'nurse', 'pharmacist']), 
  asyncHandler(updatePatientMedication)
);

// Appointments
router.get('/:id/appointments', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(getPatientAppointments)
);
router.post('/:id/appointments', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(createPatientAppointment)
);
router.put('/:id/appointments/:appointmentId', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(updatePatientAppointment)
);
router.delete('/:id/appointments/:appointmentId', 
  authorize(['doctor', 'nurse', 'admin', 'patient']), 
  asyncHandler(cancelPatientAppointment)
);

export default router;
