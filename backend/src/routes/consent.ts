import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all consent routes
router.use(authenticate);

/**
 * 3. Consent Engine (Smart Contract-like Logic)
 * จำลองหลักการ Smart Contract ไม่ใช่ Blockchain จริง
 */

// Create consent contract
router.post('/contracts', authorize(['patient', 'doctor', 'admin']), (req, res) => {
  // Mock Smart Contract-like logic
  const contractData = {
    contractId: `CNT-${Date.now()}`,
    patientId: req.body.patientId,
    requesterId: req.body.requesterId,
    dataTypes: req.body.dataTypes || ['medical_records', 'lab_results'],
    purpose: req.body.purpose,
    duration: req.body.duration || '30 days',
    conditions: {
      accessLevel: req.body.accessLevel || 'read_only',
      timeRestrictions: req.body.timeRestrictions || 'business_hours',
      purposeRestrictions: req.body.purposeRestrictions || ['medical_treatment']
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    smartContractRules: {
      autoExpire: true,
      autoRevoke: {
        onSuspiciousActivity: true,
        onDataBreach: true,
        onPolicyViolation: true
      },
      auditLogging: true,
      encryptionRequired: true
    }
  };
  
  res.json({
    success: true,
    message: 'Consent contract created successfully',
    data: contractData
  });
});

// Get consent contracts
router.get('/contracts', authorize(['patient', 'doctor', 'admin', 'external_user']), (req, res) => {
  // Mock contract data
  const contracts = [
    {
      contractId: 'CNT-1642345678901',
      patientId: 'PAT-001',
      requesterId: 'DOC-001',
      dataTypes: ['medical_records', 'lab_results'],
      purpose: 'Medical consultation',
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-02-15T10:30:00Z'
    },
    {
      contractId: 'CNT-1642345678902',
      patientId: 'PAT-001',
      requesterId: 'INS-001',
      dataTypes: ['medical_records'],
      purpose: 'Insurance claim processing',
      status: 'pending',
      createdAt: '2024-01-20T14:15:00Z',
      expiresAt: '2024-02-20T14:15:00Z'
    }
  ];
  
  res.json({
    success: true,
    message: 'Consent contracts retrieved',
    data: contracts
  });
});

// Approve/Reject consent contract
router.patch('/contracts/:contractId/status', authorize(['patient', 'admin']), (req, res) => {
  const { contractId } = req.params;
  const { status, reason } = req.body; // 'approved', 'rejected', 'revoked'
  
  // Mock Smart Contract execution
  const updateResult = {
    contractId,
    previousStatus: 'pending',
    newStatus: status,
    updatedAt: new Date().toISOString(),
    reason: reason || 'User decision',
    smartContractAction: {
      executed: true,
      conditions: {
        patientConsent: status === 'approved',
        legalCompliance: true,
        dataProtectionCompliance: true
      },
      nextActions: status === 'approved' ? 
        ['grant_access', 'start_audit_logging', 'notify_parties'] : 
        ['deny_access', 'notify_requester', 'archive_request']
    }
  };
  
  res.json({
    success: true,
    message: `Consent contract ${status} successfully`,
    data: updateResult
  });
});

// Execute smart contract conditions
router.post('/contracts/:contractId/execute', authorize(['admin']), (req, res) => {
  const { contractId } = req.params;
  const { action } = req.body; // 'grant_access', 'revoke_access', 'audit_check'
  
  // Mock Smart Contract execution logic
  const executionResult = {
    contractId,
    action,
    executedAt: new Date().toISOString(),
    success: true,
    conditions: {
      contractValid: true,
      patientConsent: true,
      timeWithinLimit: true,
      purposeCompliant: true
    },
    auditLog: {
      action: action,
      executor: req.user?.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    },
    nextExecution: action === 'grant_access' ? 
      { action: 'audit_check', scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } : 
      null
  };
  
  res.json({
    success: true,
    message: 'Smart contract executed successfully',
    data: executionResult
  });
});

// Get contract audit logs
router.get('/contracts/:contractId/audit', authorize(['patient', 'admin']), (req, res) => {
  const { contractId } = req.params;
  
  // Mock audit log data
  const auditLogs = [
    {
      id: 1,
      contractId,
      action: 'contract_created',
      timestamp: '2024-01-15T10:30:00Z',
      actor: 'PAT-001',
      details: 'Patient created consent contract'
    },
    {
      id: 2,
      contractId,
      action: 'contract_approved',
      timestamp: '2024-01-15T10:35:00Z',
      actor: 'PAT-001',
      details: 'Patient approved consent contract'
    },
    {
      id: 3,
      contractId,
      action: 'access_granted',
      timestamp: '2024-01-15T10:36:00Z',
      actor: 'SYSTEM',
      details: 'Smart contract granted data access'
    },
    {
      id: 4,
      contractId,
      action: 'data_accessed',
      timestamp: '2024-01-15T11:00:00Z',
      actor: 'DOC-001',
      details: 'Doctor accessed patient medical records'
    }
  ];
  
  res.json({
    success: true,
    message: 'Contract audit logs retrieved',
    data: auditLogs
  });
});

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
