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
  rejectDataRequest
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

export default router;
