import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Import admin controllers
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/adminUserManagementController';

import {
  getSystemHealth,
  getSystemStats
} from '../controllers/adminSystemMonitoringController';

import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats
} from '../controllers/adminAuditLogsController';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * User Management Routes
 */
router.get('/users', asyncHandler(getAllUsers));
router.get('/users/:id', asyncHandler(getUserById));
router.post('/users', asyncHandler(createUser));
router.put('/users/:id', asyncHandler(updateUser));
router.delete('/users/:id', asyncHandler(deleteUser));

/**
 * System Monitoring Routes
 */
router.get('/system/health', asyncHandler(getSystemHealth));
router.get('/system/stats', asyncHandler(getSystemStats));

/**
 * Audit Logs Routes
 */
router.get('/audit-logs', asyncHandler(getAuditLogs));
router.get('/audit-logs/stats', asyncHandler(getAuditLogStats));
router.get('/audit-logs/:id', asyncHandler(getAuditLogById));

export default router;