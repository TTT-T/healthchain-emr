import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticate);

// Get patient's appointments
router.get('/patient', appointmentController.getAppointmentsByPatient);

// Get appointments by doctor
router.get('/doctor', appointmentController.getAppointmentsByDoctor);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Update appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

export default router;
