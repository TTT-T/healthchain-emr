import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { databaseManager } from '../database/connection';
import {
  createConsentContract,
  executeConsentContract,
  getConsentContract,
  getPatientConsentContracts,
  revokeConsentContract,
  getConsentAccessLogs,
  logConsentAccess,
  getConsentDashboardOverview
} from '../controllers/consentEngineController';

const router = Router();

// Apply authentication to all consent routes
router.use(authenticate);

/**
 * 3. Consent Engine (Smart Contract-like Logic)
 * จำลองหลักการ Smart Contract ไม่ใช่ Blockchain จริง
 */

// Create consent contract
router.post('/contracts', 
  authorize(['patient', 'doctor', 'admin', 'external_user']), 
  asyncHandler(createConsentContract)
);

// Get consent contract by ID
router.get('/contracts/:id', 
  authorize(['patient', 'doctor', 'admin', 'external_user']), 
  asyncHandler(getConsentContract)
);

// Get patient consent contracts
router.get('/contracts/patient/:patientId', 
  authorize(['patient', 'doctor', 'admin']), 
  asyncHandler(getPatientConsentContracts)
);

// Revoke consent contract
router.post('/contracts/:id/revoke', 
  authorize(['patient', 'admin']), 
  asyncHandler(revokeConsentContract)
);

// Execute smart contract conditions
router.post('/contracts/:id/execute', 
  authorize(['admin', 'doctor']), 
  asyncHandler(executeConsentContract)
);

// Get consent access logs
router.get('/contracts/:id/access-logs', 
  authorize(['patient', 'admin', 'doctor']), 
  asyncHandler(getConsentAccessLogs)
);

// Log consent access
router.post('/contracts/:id/access-logs', 
  authorize(['admin', 'doctor', 'external_user']), 
  asyncHandler(logConsentAccess)
);

// Get consent requests
router.get('/requests', 
  authorize(['admin', 'consent_admin', 'compliance_officer']), 
  asyncHandler(async (req, res) => {
    try {
      // Get consent requests from database
      const result = await databaseManager.query(`
        SELECT 
          cr.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.hn as patient_hn
        FROM consent_requests cr
        LEFT JOIN patients p ON cr.patient_id = p.id
        ORDER BY cr.created_at DESC
        LIMIT 100
      `);
      
      res.json({
        success: true,
        data: result.rows,
        meta: { total: result.rows.length }
      });
    } catch (error) {
      console.error('Get consent requests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get consent requests'
      });
    }
  })
);

// Smart contract dashboard - use real data from controller
router.get('/dashboard', authorize(['admin']), asyncHandler(getConsentDashboardOverview));

// Consent dashboard overview
router.get('/dashboard/overview', 
  authorize(['admin', 'consent_admin', 'compliance_officer']), 
  asyncHandler(getConsentDashboardOverview)
);

export default router;
