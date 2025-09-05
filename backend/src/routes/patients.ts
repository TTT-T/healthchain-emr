import { Router } from 'express';
import { 
  createPatient,
  getPatient,
  getPatientProfile,
  searchPatients,
  updatePatient,
  deletePatient,
  listPatients
} from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';

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

export default router;
