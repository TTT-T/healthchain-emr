import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setupProfile, getProfile, updateProfile } from '../controllers/profileController';
import { updateDoctorProfile } from '../controllers/doctorProfileController';
import { updateNurseProfile } from '../controllers/nurseProfileController';

const router = Router();

/**
 * @route   POST /api/profile/setup
 * @desc    Setup patient profile (complete profile)
 * @access  Private (Patient only)
 */
router.post('/setup', authenticate, setupProfile);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authenticate, getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', authenticate, updateProfile);

/**
 * @route   PUT /api/profile/doctor
 * @desc    Update doctor profile
 * @access  Private (Doctor only)
 */
router.put('/doctor', authenticate, updateDoctorProfile);

/**
 * @route   PUT /api/profile/nurse
 * @desc    Update nurse profile
 * @access  Private (Nurse only)
 */
router.put('/nurse', authenticate, updateNurseProfile);

export default router;
