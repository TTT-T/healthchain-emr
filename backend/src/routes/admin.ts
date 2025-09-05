import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);
router.use(authorize(['admin'])); // Only admins can access these routes

/**
 * Admin Panel Routes
 * ระบบจัดการแอดมิน
 */

// User management
router.get('/users', (req, res) => {
  res.json({ message: 'Get all users' });
});

router.post('/users', (req, res) => {
  res.json({ message: 'Create new user' });
});

router.put('/users/:id', (req, res) => {
  res.json({ message: `Update user ${req.params.id}` });
});

router.delete('/users/:id', (req, res) => {
  res.json({ message: `Delete user ${req.params.id}` });
});

// System monitoring
router.get('/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    services: {
      auth: 'running',
      medical: 'running',
      ai: 'running',
      consent: 'running'
    }
  });
});

// Audit logs
router.get('/audit-logs', (req, res) => {
  res.json({ message: 'Get audit logs' });
});

export default router;
