import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createConsentContract,
  executeConsentContract,
  getConsentContract,
  getPatientConsentContracts,
  revokeConsentContract,
  getConsentAccessLogs,
  logConsentAccess
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

// Smart contract dashboard
router.get('/dashboard', authorize(['admin']), (req, res) => {
  // Mock dashboard data
  const dashboardData = {
    totalContracts: 1547,
    activeContracts: 892,
    pendingContracts: 123,
    expiredContracts: 532,
    recentActivity: [
      { contractId: 'CNT-001', action: 'approved', timestamp: '2024-01-20T10:00:00Z' },
      { contractId: 'CNT-002', action: 'created', timestamp: '2024-01-20T09:30:00Z' }
    ],
    complianceMetrics: {
      gdprCompliance: 98.5,
      dataProtectionCompliance: 99.2,
      auditCompleteness: 100
    },
    smartContractPerformance: {
      averageExecutionTime: '0.5ms',
      successRate: 99.8,
      failureRate: 0.2
    }
  };
  
  res.json({
    success: true,
    message: 'Consent engine dashboard data retrieved',
    data: dashboardData
  });
});

export default router;
