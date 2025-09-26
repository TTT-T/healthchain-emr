import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  calculateRiskAssessment,
  getRiskAssessment,
  getRiskAssessmentHistory,
  getModelPerformance,
  getAIDashboardOverview
} from '../controllers/aiRiskAssessmentController';

const router = Router();

/**
 * AI Risk Assessment Routes
 * All routes require authentication
 */

// Risk Assessment Routes
router.post('/risk-assessment', 
  authenticate, 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(calculateRiskAssessment)
);

router.get('/risk-assessment/:id', 
  authenticate, 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(getRiskAssessment)
);

router.get('/risk-assessment/history', 
  authenticate, 
  authorize(['doctor', 'nurse', 'admin']), 
  asyncHandler(getRiskAssessmentHistory)
);

// Model Performance Routes
router.get('/model-performance', 
  authenticate, 
  authorize(['admin', 'doctor']), 
  asyncHandler(getModelPerformance)
);

// AI Dashboard Routes
router.get('/dashboard/risk-overview', 
  authenticate, 
  authorize(['admin', 'doctor', 'nurse']), 
  asyncHandler(getAIDashboardOverview)
);

export default router;