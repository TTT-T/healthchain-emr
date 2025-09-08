import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import patientRoutes from './patients';

// EMR System Controllers
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  searchUsersByNationalId
} from '../controllers/patientManagementController';
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor
} from '../controllers/doctorsController';
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
  createLabResult,
  getLabResults,
  getLabOrdersByVisit
} from '../controllers/labController';
import {
  createPrescription,
  getPrescriptions,
  updatePrescription,
  completePrescription,
  getPrescriptionById,
  updatePrescriptionStatus
} from '../controllers/prescriptionsController';
import {
  createHistoryTaking,
  getHistoryTakingByPatient,
  getHistoryTakingById,
  updateHistoryTaking,
  deleteHistoryTaking
} from '../controllers/historyTakingController';
import {
  createDoctorVisit,
  getDoctorVisitsByPatient,
  getDoctorVisitById,
  updateDoctorVisit,
  deleteDoctorVisit
} from '../controllers/doctorVisitController';
import {
  createPharmacyDispensing,
  getPharmacyDispensingsByPatient,
  getPharmacyDispensingById,
  updatePharmacyDispensing,
  deletePharmacyDispensing
} from '../controllers/pharmacyController';
import {
  createLabResult,
  getLabResultsByPatient,
  getLabResultById,
  updateLabResult,
  deleteLabResult
} from '../controllers/labResultController';
import {
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointmentController';
import {
  createDocument,
  getDocumentsByPatient,
  getDocumentById,
  updateDocument,
  deleteDocument
} from '../controllers/documentController';
import {
  getPatientSummary,
  getPatientTimeline
} from '../controllers/patientSummaryController';
import {
  getAllQueueHistory,
  getQueueHistoryByPatient,
  getQueueHistoryByDoctor,
  getQueueHistoryById,
  getQueueStatistics,
  downloadQueueReport,
  generateStatisticsReport
} from '../controllers/queueHistoryController';

// Patient Portal Controllers
import { 
  createVisit as createPatientVisit, 
  getVisit as getPatientVisit, 
  updateVisit as updatePatientVisit, 
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
  updateLabOrder as updatePatientLabOrder,
  createLabResult as createPatientLabResult,
  getLabResults as getPatientLabResults,
  getLabOrdersByVisit as getPatientLabOrdersByVisit
} from '../controllers/labController';
import {
  createPrescription as createPatientPrescription,
  getPrescription,
  updatePrescription as updatePatientPrescription,
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
  getPatientLabResults as getPatientLabResultsFromController,
  getPatientLabResult,
  createPatientLabResult as createPatientLabResultFromController,
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

// Apply authentication to all routes
router.use(authenticate);

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

// User Search for Patient Registration
router.get('/users/search', authorize(['doctor', 'nurse', 'admin']), asyncHandler(searchUsersByNationalId));

// Doctor Management
router.get('/doctors', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllDoctors));
router.get('/doctors/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getDoctorById));
router.post('/doctors', authorize(['admin']), asyncHandler(createDoctor));
router.put('/doctors/:id', authorize(['doctor', 'admin']), asyncHandler(updateDoctor));

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
router.post('/prescriptions/:id/complete', authorize(['pharmacist', 'admin']), asyncHandler(completePrescription));
router.get('/prescriptions/:id', authorize(['doctor', 'nurse', 'admin', 'pharmacist']), asyncHandler(getPrescriptionById));
router.patch('/prescriptions/:id/status', authorize(['doctor', 'nurse', 'admin', 'pharmacist']), asyncHandler(updatePrescriptionStatus));
router.get('/patients/:patientId/prescriptions', authorize(['doctor', 'nurse', 'admin', 'pharmacist']), asyncHandler(getPrescriptions));

// =============================================================================
// PATIENT PORTAL APIs
// =============================================================================

// Patient management routes
router.use('/patients', patientRoutes);

// Visit management routes
router.post('/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createVisit));
router.get('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVisitById));
router.put('/visits/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVisit));
router.patch('/visits/:id/complete', authorize(['doctor', 'nurse', 'admin']), asyncHandler(completeVisit));
router.get('/visits/search', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllVisits));
router.get('/patients/:patientId/visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllVisits));

// Vital Signs routes
router.post('/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(recordVitalSigns));
router.get('/visits/:visitId/vital-signs', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getVitalSigns));
router.put('/vital-signs/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateVitalSigns));

// Lab Orders and Results routes
router.post('/lab-orders', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createLabOrder));
router.get('/lab-orders/:id', authorize(['doctor', 'nurse', 'admin', 'lab_tech']), asyncHandler(getLabOrders));
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

// History Taking routes
router.post('/history-taking', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createHistoryTaking));
router.get('/patients/:patientId/history-taking', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getHistoryTakingByPatient));
router.get('/history-taking/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getHistoryTakingById));
router.put('/history-taking/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateHistoryTaking));
router.delete('/history-taking/:id', authorize(['doctor', 'admin']), asyncHandler(deleteHistoryTaking));

// Doctor Visit routes
router.post('/doctor-visit', authorize(['doctor', 'admin']), asyncHandler(createDoctorVisit));
router.get('/patients/:patientId/doctor-visits', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getDoctorVisitsByPatient));
router.get('/doctor-visit/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getDoctorVisitById));
router.put('/doctor-visit/:id', authorize(['doctor', 'admin']), asyncHandler(updateDoctorVisit));
router.delete('/doctor-visit/:id', authorize(['doctor', 'admin']), asyncHandler(deleteDoctorVisit));

// Pharmacy routes
router.post('/pharmacy', authorize(['pharmacist', 'nurse', 'admin']), asyncHandler(createPharmacyDispensing));
router.get('/patients/:patientId/pharmacy', authorize(['pharmacist', 'nurse', 'admin']), asyncHandler(getPharmacyDispensingsByPatient));
router.get('/pharmacy/:id', authorize(['pharmacist', 'nurse', 'admin']), asyncHandler(getPharmacyDispensingById));
router.put('/pharmacy/:id', authorize(['pharmacist', 'admin']), asyncHandler(updatePharmacyDispensing));
router.delete('/pharmacy/:id', authorize(['pharmacist', 'admin']), asyncHandler(deletePharmacyDispensing));

// Lab Results routes
router.post('/lab-results', authorize(['lab_tech', 'doctor', 'admin']), asyncHandler(createLabResult));
router.get('/patients/:patientId/lab-results', authorize(['lab_tech', 'doctor', 'nurse', 'admin']), asyncHandler(getLabResultsByPatient));
router.get('/lab-results/:id', authorize(['lab_tech', 'doctor', 'nurse', 'admin']), asyncHandler(getLabResultById));
router.put('/lab-results/:id', authorize(['lab_tech', 'doctor', 'admin']), asyncHandler(updateLabResult));
router.delete('/lab-results/:id', authorize(['lab_tech', 'admin']), asyncHandler(deleteLabResult));

// Appointments routes
router.post('/appointments', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createAppointment));
router.get('/patients/:patientId/appointments', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAppointmentsByPatient));
router.get('/doctors/:doctorId/appointments', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAppointmentsByDoctor));
router.get('/appointments/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAppointmentById));
router.put('/appointments/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateAppointment));
router.delete('/appointments/:id', authorize(['doctor', 'admin']), asyncHandler(deleteAppointment));

// Documents routes
router.post('/documents', authorize(['doctor', 'nurse', 'admin']), asyncHandler(createDocument));
router.get('/patients/:patientId/documents', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getDocumentsByPatient));
router.get('/documents/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getDocumentById));
router.put('/documents/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(updateDocument));
router.delete('/documents/:id', authorize(['doctor', 'admin']), asyncHandler(deleteDocument));

// Patient Summary routes
router.get('/patients/:patientId/summary', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getPatientSummary));
router.get('/patients/:patientId/timeline', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getPatientTimeline));

// Queue History routes
router.get('/queue-history', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getAllQueueHistory));
router.get('/queue-history/statistics', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getQueueStatistics));
router.get('/queue-history/statistics/report', authorize(['doctor', 'nurse', 'admin']), asyncHandler(generateStatisticsReport));
router.get('/queue-history/patients/:patientId', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getQueueHistoryByPatient));
router.get('/queue-history/doctors/:doctorId', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getQueueHistoryByDoctor));
router.get('/queue-history/:id', authorize(['doctor', 'nurse', 'admin']), asyncHandler(getQueueHistoryById));
router.get('/queue-history/:id/report', authorize(['doctor', 'nurse', 'admin']), asyncHandler(downloadQueueReport));

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
