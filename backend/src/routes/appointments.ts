import { Router } from 'express';
import appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticate);

// Get patient's appointments
router.get('/patient', appointmentController.getPatientAppointments);

// Get available time slots
// Get available time slots
router.get('/available-slots/:doctorId/:date/:typeId', appointmentController.getAvailableTimeSlots);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Cancel appointment
router.post('/:appointmentId/cancel', appointmentController.cancelAppointment);

export default router;
