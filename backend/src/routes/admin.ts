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
  getPendingUsers,
  approveUser,
  rejectUser,
  getApprovalStats
} from '../controllers/adminApprovalController';

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
  getConsentDashboardStats,
  getRecentConsentRequests,
  getActiveConsentContracts,
  getComplianceAlerts,
  getConsentDashboardOverview
} from '../controllers/adminConsentDashboardController';

import {
  getAllConsentRequests,
  getConsentRequestStats,
  getConsentRequestById,
  approveConsentRequest,
  rejectConsentRequest,
  updateConsentRequestStatus
} from '../controllers/adminConsentRequestsController';

import {
  getAllConsentContracts,
  getConsentContractStats,
  getConsentContractById,
  updateConsentContractStatus
} from '../controllers/adminConsentContractsController';

import {
  getComplianceReports,
  getComplianceTrends,
  getComplianceStats,
  createComplianceReport,
  updateComplianceReport
} from '../controllers/adminComplianceController';

import {
  getAuditSummary,
  getViolationAlerts,
  getUsageByUserType,
  getMonthlyTrends,
  getAllAuditData
} from '../controllers/adminConsentAuditController';

import {
  getSystemOverview,
  getSystemMetrics,
  getServiceStatus,
  getSystemAlerts,
  getAllSystemData,
  resolveAlert
} from '../controllers/adminSystemMonitoringController';

import {
  getComplianceReports,
  getComplianceTrends,
  getComplianceStats,
  createComplianceReport,
  updateComplianceReport
} from '../controllers/adminComplianceController';

import {
  getRolePermissions,
  updateRolePermissions
} from '../controllers/adminRolePermissionsController';

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

// Role Permissions Routes
router.get('/role-permissions', asyncHandler(getRolePermissions));
router.post('/role-permissions', asyncHandler(updateRolePermissions));

/**
 * System Monitoring Routes
 */
router.get('/system/health', asyncHandler(getSystemHealth));
router.get('/system/stats', asyncHandler(getSystemStats));
router.get('/dashboard/stats', asyncHandler(getSystemStats)); // Dashboard stats endpoint

/**
 * Audit Logs Routes
 */
router.get('/audit-logs', asyncHandler(getAuditLogs));
router.get('/audit-logs/stats', asyncHandler(getAuditLogStats));
router.get('/audit-logs/:id', asyncHandler(getAuditLogById));

/**
 * Consent Dashboard Routes
 */
router.get('/consent-dashboard/stats', asyncHandler(getConsentDashboardStats));
router.get('/consent-dashboard/recent-requests', asyncHandler(getRecentConsentRequests));
router.get('/consent-dashboard/active-contracts', asyncHandler(getActiveConsentContracts));
router.get('/consent-dashboard/compliance-alerts', asyncHandler(getComplianceAlerts));
router.get('/consent-dashboard/overview', asyncHandler(getConsentDashboardOverview));

/**
 * Consent Requests Routes
 */
router.get('/consent-requests', asyncHandler(getAllConsentRequests));
router.get('/consent-requests/stats', asyncHandler(getConsentRequestStats));
router.get('/consent-requests/:id', asyncHandler(getConsentRequestById));
router.put('/consent-requests/:id/approve', asyncHandler(approveConsentRequest));
router.put('/consent-requests/:id/reject', asyncHandler(rejectConsentRequest));
router.put('/consent-requests/:id/status', asyncHandler(updateConsentRequestStatus));

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
 * Consent Contracts Management Routes
 */
router.get('/consent-contracts', asyncHandler(getAllConsentContracts));
router.get('/consent-contracts/stats', asyncHandler(getConsentContractStats));
router.get('/consent-contracts/:id', asyncHandler(getConsentContractById));
router.put('/consent-contracts/:id/status', asyncHandler(updateConsentContractStatus));

/**
 * Compliance Management Routes
 */
router.get('/compliance/reports', asyncHandler(getComplianceReports));
router.get('/compliance/trends', asyncHandler(getComplianceTrends));
router.get('/compliance/stats', asyncHandler(getComplianceStats));
router.post('/compliance/reports', asyncHandler(createComplianceReport));
router.put('/compliance/reports/:id', asyncHandler(updateComplianceReport));

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

/**
 * User Approval Management Routes
 */
router.get('/pending-users', asyncHandler(getPendingUsers));
router.get('/approval-stats', asyncHandler(getApprovalStats));
router.post('/pending-users/:id/approve', asyncHandler(approveUser));
router.post('/pending-users/:id/reject', asyncHandler(rejectUser));

/**
 * Consent Audit Management Routes
 */
router.get('/consent-audit/summary', authenticate, asyncHandler(getAuditSummary));
router.get('/consent-audit/violations', authenticate, asyncHandler(getViolationAlerts));
router.get('/consent-audit/usage-by-type', authenticate, asyncHandler(getUsageByUserType));
router.get('/consent-audit/monthly-trends', authenticate, asyncHandler(getMonthlyTrends));
router.get('/consent-audit/all', authenticate, asyncHandler(getAllAuditData));

/**
 * System Monitoring Routes
 */
router.get('/system-monitoring/overview', authenticate, asyncHandler(getSystemOverview));
router.get('/system-monitoring/metrics', authenticate, asyncHandler(getSystemMetrics));
router.get('/system-monitoring/services', authenticate, asyncHandler(getServiceStatus));
router.get('/system-monitoring/alerts', authenticate, asyncHandler(getSystemAlerts));
router.get('/system-monitoring/all', authenticate, asyncHandler(getAllSystemData));
router.post('/system-monitoring/alerts/:alertId/resolve', authenticate, asyncHandler(resolveAlert));

export default router;