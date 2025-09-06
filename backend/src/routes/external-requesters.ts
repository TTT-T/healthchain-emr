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

const router = express.Router();

// Apply authentication to all routes
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
 * Search and Report Routes
 */
router.get('/search/patients', authorize(['external_user', 'external_admin', 'admin']), asyncHandler(searchPatientsForRequest));
router.get('/reports/:requestId', authorize(['external_user', 'external_admin', 'admin']), asyncHandler(generateDataRequestReport));

/**
 * Dashboard Routes
 */
router.get('/dashboard/overview', authorize(['external_admin', 'admin']), asyncHandler(getExternalRequestersDashboardOverview));

export default router;
