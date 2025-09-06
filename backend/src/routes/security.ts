import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getSecuritySettings, 
  updateSecuritySettings, 
  terminateAllSessions 
} from '../controllers/securitySettingsController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/security/settings
 * @desc    Get user security settings
 * @access  Private
 */
router.get('/settings', getSecuritySettings);

/**
 * @route   PUT /api/security/settings
 * @desc    Update user security settings
 * @access  Private
 */
router.put('/settings', updateSecuritySettings);

/**
 * @route   POST /api/security/sessions/terminate-all
 * @desc    Terminate all user sessions
 * @access  Private
 */
router.post('/sessions/terminate-all', terminateAllSessions);

export default router;