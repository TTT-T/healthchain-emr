import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import patientRoutes from './patients';
import { 
  createVisit, 
  getVisit, 
  updateVisit, 
  getPatientVisits, 
  searchVisits, 
  completeVisit 
} from '../controllers/visitController';
import {
  createVitalSigns,
  getVitalSignsByVisit,
  updateVitalSigns,
  deleteVitalSigns
} from '../controllers/vitalSignsController';
import {
  createLabOrder,
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

const router = Router();

// Apply authentication to all medical routes
router.use(authenticate);

/**
 * Medical API Routes
 * Base path: /api/medical
 * สำหรับ แพทย์, พยาบาล, ผู้ป่วย, ตัวแทนประกัน
 */

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
router.get('/patients/:id/records', authorize(['doctor', 'nurse', 'admin']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Get medical records for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/patients/:id/records', authorize(['doctor', 'nurse']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Create medical record for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

// Appointments
router.get('/appointments', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: 'Get appointments' },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/appointments', authorize(['doctor', 'nurse', 'admin', 'patient']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: 'Create new appointment' },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

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
router.get('/patients/:id/labs', authorize(['doctor', 'nurse', 'admin', 'lab_tech']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Get lab results for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 200
  });
}));

router.post('/patients/:id/labs', authorize(['doctor', 'lab_tech']), asyncHandler(async (req, res) => {
  res.json({ 
    data: { message: `Record lab results for patient ${req.params.id}` },
    meta: null,
    error: null,
    statusCode: 201
  });
}));

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
