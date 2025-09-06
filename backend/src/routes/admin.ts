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

import {
  getDatabaseStatus,
  getDatabaseBackups,
  createDatabaseBackup,
  optimizeDatabase,
  getDatabasePerformance
} from '../controllers/adminDatabaseController';

import {
  getAllExternalRequesters,
  getExternalRequesterById,
  updateExternalRequesterStatus,
  getExternalRequestersStats
} from '../controllers/adminExternalRequestersController';

import {
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings,
  getSettingsHistory
} from '../controllers/adminSettingsController';

import {
  getAllNotifications,
  createSystemNotification,
  markNotificationsAsRead,
  archiveNotifications,
  deleteNotifications,
  getNotificationTemplates
} from '../controllers/adminNotificationsController';

import {
  getAllDataRequests,
  getDataRequestById,
  approveDataRequest,
  rejectDataRequest,
  getRequestStatistics
} from '../controllers/adminRequestHistoryController';

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

/**
 * Database Management Routes
 */
router.get('/database/status', asyncHandler(getDatabaseStatus));
router.get('/database/backups', asyncHandler(getDatabaseBackups));
router.post('/database/backup', asyncHandler(createDatabaseBackup));
router.post('/database/optimize', asyncHandler(optimizeDatabase));
router.get('/database/performance', asyncHandler(getDatabasePerformance));

/**
 * External Requesters Management Routes
 */
router.get('/external-requesters', asyncHandler(getAllExternalRequesters));
router.get('/external-requesters/stats', asyncHandler(getExternalRequestersStats));
router.get('/external-requesters/:id', asyncHandler(getExternalRequesterById));
router.put('/external-requesters/:id/status', asyncHandler(updateExternalRequesterStatus));

/**
 * Settings Management Routes
 */
router.get('/settings', asyncHandler(getSystemSettings));
router.put('/settings', asyncHandler(updateSystemSettings));
router.post('/settings/reset', asyncHandler(resetSystemSettings));
router.get('/settings/history', asyncHandler(getSettingsHistory));

/**
 * Notifications Management Routes
 */
router.get('/notifications', asyncHandler(getAllNotifications));
router.post('/notifications', asyncHandler(createSystemNotification));
router.put('/notifications/mark-read', asyncHandler(markNotificationsAsRead));
router.put('/notifications/archive', asyncHandler(archiveNotifications));
router.delete('/notifications', asyncHandler(deleteNotifications));
router.get('/notifications/templates', asyncHandler(getNotificationTemplates));

/**
 * Request History Management Routes
 */
router.get('/request-history', asyncHandler(getAllDataRequests));
router.get('/request-history/statistics', asyncHandler(getRequestStatistics));
router.get('/request-history/:id', asyncHandler(getDataRequestById));
router.put('/request-history/:id/approve', asyncHandler(approveDataRequest));
router.put('/request-history/:id/reject', asyncHandler(rejectDataRequest));

export default router;