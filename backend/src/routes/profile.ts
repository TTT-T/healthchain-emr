import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setupProfile, getProfile, updateProfile } from '../controllers/profileController';

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

export default router;
