import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Import external requesters controllers
import {
  createDataRequest,
  getAllDataRequests,
  getDataRequestById,
  updateDataRequest,
  approveDataRequest,
  rejectDataRequest,
  searchPatientsForRequest,
  generateDataRequestReport,
  getExternalRequestersDashboardOverview
} from '../controllers/externalRequestersController';

// Import external requester registration controllers
import {
  registerExternalRequester,
  getRegistrationStatus
} from '../controllers/externalRequesterRegistrationController';

// Import external requester status controllers
import {
  getRegistrationStatus as getStatus,
  updateRegistrationStatus
} from '../controllers/externalRequesterStatusController';

// Import external requesters profile controllers
import {
  getExternalRequesterProfile,
  updateExternalRequesterProfile,
  getExternalRequesterSettings,
  updateExternalRequesterSettings
} from '../controllers/externalRequestersProfileController';

// Import external requesters notifications controllers
import {
  getExternalRequesterNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationStats
} from '../controllers/externalRequestersNotificationsController';

const router = express.Router();

/**
 * Public Registration Routes (No authentication required)
 */
router.post('/register', asyncHandler(registerExternalRequester));
router.get('/register/:requestId', asyncHandler(getRegistrationStatus));

/**
 * Public Status Routes (No authentication required)
 */
router.get('/status', asyncHandler(getStatus));

// Apply authentication to all other routes
router.use(authenticate);

/**
 * Data Request Routes
 */
router.post('/requests', authorize(['external_requester', 'admin']), asyncHandler(createDataRequest));
router.get('/requests', authorize(['admin', 'doctor', 'nurse']), asyncHandler(getAllDataRequests));
router.get('/requests/:id', authorize(['external_requester', 'admin', 'doctor', 'nurse']), asyncHandler(getDataRequestById));
router.put('/requests/:id', authorize(['external_requester', 'admin']), asyncHandler(updateDataRequest));

/**
 * Request Management Routes (Admin only)
 */
router.post('/requests/:id/approve', authorize(['admin']), asyncHandler(approveDataRequest));
router.post('/requests/:id/reject', authorize(['admin']), asyncHandler(rejectDataRequest));

/**
 * Registration Status Management Routes (Admin only)
 */
router.put('/status/:requestId', authorize(['admin']), asyncHandler(updateRegistrationStatus));

/**
 * Search and Report Routes
 */
router.get('/search/patients', authorize(['external_user', 'external_admin', 'admin']), asyncHandler(searchPatientsForRequest));
router.get('/reports/:requestId', authorize(['external_user', 'external_admin', 'admin']), asyncHandler(generateDataRequestReport));

/**
 * Dashboard Routes
 */
router.get('/dashboard/overview', authorize(['external_admin', 'admin']), asyncHandler(getExternalRequestersDashboardOverview));

/**
 * Profile Management Routes
 */
router.get('/profile', authorize(['external_requester', 'external_admin']), asyncHandler(getExternalRequesterProfile));
router.put('/profile', authorize(['external_requester', 'external_admin']), asyncHandler(updateExternalRequesterProfile));

/**
 * Settings Management Routes
 */
router.get('/settings', authorize(['external_requester', 'external_admin']), asyncHandler(getExternalRequesterSettings));
router.put('/settings', authorize(['external_requester', 'external_admin']), asyncHandler(updateExternalRequesterSettings));

/**
 * Notifications Management Routes
 */
router.get('/notifications', authorize(['external_requester', 'external_admin']), asyncHandler(getExternalRequesterNotifications));
router.put('/notifications/:id/read', authorize(['external_requester', 'external_admin']), asyncHandler(markNotificationAsRead));
router.put('/notifications/mark-all-read', authorize(['external_requester', 'external_admin']), asyncHandler(markAllNotificationsAsRead));
router.get('/notifications/stats', authorize(['external_requester', 'external_admin']), asyncHandler(getNotificationStats));

export default router;
