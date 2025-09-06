import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setupProfile, getProfile, updateProfile } from '../controllers/profileController';
import { updateDoctorProfile, getDoctorProfile } from '../controllers/doctorProfileController';
import { updateNurseProfile, getNurseProfile } from '../controllers/nurseProfileController';

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
 * @route   GET /api/profile/doctor
 * @desc    Get doctor profile
 * @access  Private (Doctor only)
 */
router.get('/doctor', authenticate, getDoctorProfile);

/**
 * @route   PUT /api/profile/doctor
 * @desc    Update doctor profile
 * @access  Private (Doctor only)
 */
router.put('/doctor', authenticate, updateDoctorProfile);

/**
 * @route   GET /api/profile/nurse
 * @desc    Get nurse profile
 * @access  Private (Nurse only)
 */
router.get('/nurse', authenticate, getNurseProfile);

/**
 * @route   PUT /api/profile/nurse
 * @desc    Update nurse profile
 * @access  Private (Nurse only)
 */
router.put('/nurse', authenticate, updateNurseProfile);

export default router;
