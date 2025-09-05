import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import patientRoutes from './patients';

// EMR System Controllers
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient
} from '../controllers/patientManagementController';
import {
  getAllVisits,
  createVisit,
  getVisitById,
  updateVisit,
  completeVisit
} from '../controllers/visitManagementController';
import {
  recordVitalSigns,
  getVitalSigns,
  updateVitalSigns
} from '../controllers/vitalSignsController';
import {
  createLabOrder,
  getLabOrders,
  updateLabOrder
} from '../controllers/labOrdersController';
import {
  createPrescription,
  getPrescriptions,
  updatePrescription
} from '../controllers/prescriptionsController';

// Patient Portal Controllers
import { 
  createVisit as createPatientVisit, 
  getVisit as getPatientVisit, 
  updateVisit as updatePatientVisit, 
  getPatientVisits, 
  searchVisits, 
  completeVisit as completePatientVisit 
} from '../controllers/visitController';
import {
  createVitalSigns as createPatientVitalSigns,
  getVitalSignsByVisit as getPatientVitalSignsByVisit,
  updateVitalSigns as updatePatientVitalSigns,
  deleteVitalSigns
} from '../controllers/vitalSignsController';
import {
  createLabOrder as createPatientLabOrder,
  getLabOrder,
  updateLabOrder,
  createLabResult,
  getLabResults,
  getLabOrdersByVisit
} from '../controllers/labController';
import {
  createPrescription,
  getPrescription,
  updatePrescription,
  updatePrescriptionItem,
  getPrescriptionsByVisit
} from '../controllers/pharmacyController';
import {
  getPatientRecords,
  createPatientRecord,
  updatePatientRecord,
  deletePatientRecord
} from '../controllers/medicalRecordsController';
import {
  getPatientLabResults,
  getPatientLabResult,
  createPatientLabResult,
  updatePatientLabResult
} from '../controllers/labResultsController';
import {
  getPatientAppointments,
  createPatientAppointment,
  updatePatientAppointment,
  cancelPatientAppointment
} from '../controllers/appointmentsController';
import {
  getPatientDocuments,
  uploadPatientDocument,
  deletePatientDocument,
  downloadPatientDocument
} from '../controllers/medicalDocumentsController';
import {
  getPatientMedications,
  addPatientMedication,
  updatePatientMedication
} from '../controllers/medicationsController';
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
  getPatientConsentRequests,
  respondToConsentRequest,
  createConsentRequest,
  updateConsentRequest
} from '../controllers/consentRequestsController';

const router = Router();

// Authentication is handled by individual route modules

/**
 * Medical API Routes
 * Base path: /api/medical
 * สำหรับ แพทย์, พยาบาล, ผู้ป่วย, ตัวแทนประกัน
 */

// =============================================================================
// EMR SYSTEM APIs
// =============================================================================

// Patient Management
router.get('/patients', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllPatients));
router.get('/patients/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getPatientById));
router.post('/patients', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createPatient));
router.put('/patients/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updatePatient));

// Visit Management
router.get('/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllVisits));
router.post('/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createVisit));
router.get('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVisitById));
router.put('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVisit));
router.post('/visits/:id/complete', authorize(['doctor', 'nurse', 'admin']), asyncHandler(completeVisit));

// Vital Signs
router.post('/visits/:id/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(recordVitalSigns));
router.get('/visits/:id/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVitalSigns));
router.put('/vital-signs/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVitalSigns));

// Lab Orders
router.post('/visits/:id/lab-orders', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createLabOrder));
router.get('/visits/:id/lab-orders', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getLabOrders));
router.put('/lab-orders/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateLabOrder));

// Prescriptions
router.post('/visits/:id/prescriptions', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createPrescription));
router.get('/visits/:id/prescriptions', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getPrescriptions));
router.put('/prescriptions/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updatePrescription));

// =============================================================================
// PATIENT PORTAL APIs
// =============================================================================

// Patient management routes
router.use('/patients', patientRoutes);

// Visit management routes
router.post('/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createVisit));
router.get('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVisit));
router.put('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVisit));
router.patch('/visits/:id/complete', authorize(['doctor', 'nurse', 'admin']), asyncHandler(completeVisit));
router.get('/visits/search', authorize(['doctor', 'nurse', 'admin']), asyncHandler(searchVisits));
router.get('/patients/:patientId/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getPatientVisits));

// Vital Signs routes
router.post('/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createVitalSigns));
router.get('/visits/:visitId/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVitalSignsByVisit));
router.put('/vital-signs/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVitalSigns));
router.delete('/vital-signs/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(deleteVitalSigns));

// Lab Orders and Results routes
router.post('/lab-orders', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createLabOrder));
router.get('/lab-orders/:id', authorize(['doctor', 'nurse', 'admin', 'lab_tech']), asyncHandler(getLabOrder));
router.put('/lab-orders/:id', authorize(['doctor', 'nurse', 'admin', 'lab_tech']), asyncHandler(updateLabOrder));
router.get('/visits/:visitId/lab-orders', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getLabOrdersByVisit));
router.post('/lab-results', authorize(['lab_tech', 'doctor', 'admin']), asyncHandler(createLabResult));
router.get('/lab-orders/:labOrderId/results', authorize(['doctor', 'nurse', 'admin', 'lab_tech']), asyncHandler(getLabResults));

// Prescription routes
router.post('/prescriptions', authorize(['doctor', 'admin']), asyncHandler(createPrescription));
router.get('/prescriptions/:id', authorize(['doctor', 'nurse', 'admin', 'pharmacist']), asyncHandler(getPrescription));
router.put('/prescriptions/:id', authorize(['doctor', 'pharmacist', 'admin']), asyncHandler(updatePrescription));
router.put('/prescription-items/:id', authorize(['pharmacist', 'admin']), asyncHandler(updatePrescriptionItem));
router.get('/visits/:visitId/prescriptions', authorize(['doctor', 'nurse', 'admin', 'pharmacist']), asyncHandler(getPrescriptionsByVisit));

// Medical records
router.get('/patients/:id/records', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientRecords));
router.post('/patients/:id/records', authorize(['doctor', 'nurse']), asyncHandler(createPatientRecord));
router.put('/patients/:id/records/:recordId', authorize(['doctor', 'nurse']), asyncHandler(updatePatientRecord));
router.delete('/patients/:id/records/:recordId', authorize(['doctor', 'nurse', 'admin']), asyncHandler(deletePatientRecord));

// Appointments
router.get('/patients/:id/appointments', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientAppointments));
router.post('/patients/:id/appointments', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(createPatientAppointment));
router.put('/patients/:id/appointments/:appointmentId', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(updatePatientAppointment));
router.delete('/patients/:id/appointments/:appointmentId', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(cancelPatientAppointment));

// Vital signs
router.get('/patients/:id/vitals', authorize(['doctor', 'nurse', 'admin']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Get vital signs for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/patients/:id/vitals', authorize(['doctor', 'nurse']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Record vital signs for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

// Lab results
router.get('/patients/:id/lab-results', authorize(['doctor', 'nurse', 'admin', 'lab_tech', 'patient']), asyncHandler(getPatientLabResults));
router.get('/patients/:id/lab-results/:resultId', authorize(['doctor', 'nurse', 'admin', 'lab_tech', 'patient']), asyncHandler(getPatientLabResult));
router.post('/patients/:id/lab-results', authorize(['doctor', 'lab_tech']), asyncHandler(createPatientLabResult));
router.put('/patients/:id/lab-results/:resultId', authorize(['doctor', 'lab_tech']), asyncHandler(updatePatientLabResult));

// Prescriptions
router.get('/patients/:id/prescriptions', authorize(['doctor', 'nurse', 'pharmacist']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Get prescriptions for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/patients/:id/prescriptions', authorize(['doctor']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Create prescription for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

// Medical Documents
router.get('/patients/:id/documents', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientDocuments));
router.post('/patients/:id/documents', authorize(['doctor', 'nurse', 'admin']), asyncHandler(uploadPatientDocument));
router.delete('/patients/:id/documents/:docId', authorize(['doctor', 'nurse', 'admin']), asyncHandler(deletePatientDocument));
router.get('/patients/:id/documents/:docId/download', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(downloadPatientDocument));

// Medications
router.get('/patients/:id/medications', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientMedications));
router.post('/patients/:id/medications', authorize(['doctor', 'nurse']), asyncHandler(addPatientMedication));
router.put('/patients/:id/medications/:medId', authorize(['doctor', 'nurse', 'pharmacist']), asyncHandler(updatePatientMedication));

// Notifications
router.get('/patients/:id/notifications', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientNotifications));
router.post('/patients/:id/notifications', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createPatientNotification));
router.put('/patients/:id/notifications/:notifId/read', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(markNotificationAsRead));
router.delete('/patients/:id/notifications/:notifId', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(deletePatientNotification));

// AI Insights
router.get('/patients/:id/ai-insights', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientAIInsights));
router.post('/patients/:id/ai-insights/calculate', authorize(['doctor', 'nurse', 'admin']), asyncHandler(calculatePatientAIInsights));

// Consent Requests
router.get('/patients/:id/consent-requests', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(getPatientConsentRequests));
router.post('/patients/:id/consent-requests', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createConsentRequest));
router.put('/patients/:id/consent-requests/:requestId', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateConsentRequest));
router.post('/patients/:id/consent-requests/:requestId/respond', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(respondToConsentRequest));

// Insurance claims (for ตัวแทนประกัน)
router.get('/insurance/claims', authorize(['external_user', 'admin']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: 'Get insurance claims' },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/insurance/claims', authorize(['external_user']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: 'Submit insurance claim' },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

export default router;
