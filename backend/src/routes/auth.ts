import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile, 
  updateProfile,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.use(authenticate); // Apply authentication middleware to all routes below

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
