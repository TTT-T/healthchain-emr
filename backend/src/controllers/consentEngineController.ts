import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Consent Engine Controller
 * จัดการ Smart Contract-like Logic สำหรับ Consent Management
 */

interface SmartContractRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  parameters: Record<string, any>;
  priority: number;
  isActive: boolean;
}

interface ConsentContract {
  id: string;
  contractId: string;
  patientId: string;
  requesterId: string;
  dataTypes: string[];
  purpose: string;
  duration: string;
  conditions: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  smartContractRules: SmartContractRule[];
  expiresAt: Date;
}

/**
 * Create consent contract with smart contract rules
 * POST /api/consent/contracts
 */
export const createConsentContract = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      requesterId,
      dataTypes,
      purpose,
      duration,
      conditions = {},
      smartContractRules = []
    } = req.body;

    const userId = (req as any).user?.id;

    if (!patientId || !requesterId || !dataTypes || !purpose || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientId, requesterId, dataTypes, purpose, duration',
        data: null
      });
    }

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        data: null
      });
    }

    // Validate requester exists
    const requesterExists = await databaseManager.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [requesterId]
    );

    if (requesterExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found',
        data: null
      });
    }

    // Generate contract ID
    const contractId = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(duration);

    // Create consent contract
    const contractUuid = uuidv4();
    await databaseManager.query(`
      INSERT INTO consent_contracts (
        id, contract_id, patient_id, requester_id, data_types, purpose,
        duration, conditions, status, expires_at, smart_contract_rules, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      contractUuid,
      contractId,
      patientId,
      requesterId,
      dataTypes,
      purpose,
      duration,
      JSON.stringify(conditions),
      'pending',
      expiresAt,
      JSON.stringify(smartContractRules),
      userId || 'system'
    ]);

    // Create audit trail
    await createAuditTrail(contractUuid, 'created', null, {
      contractId,
      patientId,
      requesterId,
      dataTypes,
      purpose,
      duration,
      conditions,
      smartContractRules
    }, userId || 'system', 'Contract created');

    res.status(201).json({
      success: true,
      message: 'Consent contract created successfully',
      data: {
        id: contractUuid,
        contractId,
        patientId,
        requesterId,
        dataTypes,
        purpose,
        duration,
        conditions,
        smartContractRules,
        status: 'pending',
        expiresAt,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating consent contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Execute smart contract rules for consent contract
 * POST /api/consent/contracts/{id}/execute
 */
export const executeConsentContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, parameters = {} } = req.body;

    const userId = (req as any).user?.id;

    // Get consent contract
    const contractResult = await databaseManager.query(`
      SELECT 
        cc.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      WHERE cc.id = $1
    `, [id]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consent contract not found',
        data: null
      });
    }

    const contract = contractResult.rows[0];
    const smartContractRules = JSON.parse(contract.smart_contract_rules || '[]');

    // Execute smart contract rules
    const executionResults = await executeSmartContractRules(
      contract,
      smartContractRules,
      action,
      parameters,
      userId
    );

    // Update contract status if needed
    if (executionResults.statusChanged) {
      await databaseManager.query(`
        UPDATE consent_contracts 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [executionResults.newStatus, id]);

      // Create audit trail
      await createAuditTrail(
        id,
        'status_changed',
        { status: contract.status },
        { status: executionResults.newStatus },
        userId || 'system',
        `Status changed to ${executionResults.newStatus} by smart contract execution`
      );
    }

    res.json({
      success: true,
      message: 'Smart contract executed successfully',
      data: {
        contractId: contract.contract_id,
        action,
        executionResults,
        executedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error executing consent contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get consent contract by ID
 * GET /api/consent/contracts/{id}
 */
export const getConsentContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await databaseManager.query(`
      SELECT 
        cc.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      WHERE cc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consent contract not found',
        data: null
      });
    }

    const contract = result.rows[0];
    contract.conditions = JSON.parse(contract.conditions || '{}');
    contract.smart_contract_rules = JSON.parse(contract.smart_contract_rules || '[]');

    res.json({
      success: true,
      message: 'Consent contract retrieved successfully',
      data: contract
    });

  } catch (error) {
    console.error('Error getting consent contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get consent contracts for a patient
 * GET /api/consent/contracts/patient/{patientId}
 */
export const getPatientConsentContracts = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    let whereClause = 'WHERE cc.patient_id = $1';
    const queryParams: any[] = [patientId];

    if (status) {
      whereClause += ' AND cc.status = $2';
      queryParams.push(status);
    }

    const result = await databaseManager.query(`
      SELECT 
        cc.id,
        cc.contract_id,
        cc.patient_id,
        cc.requester_id,
        cc.data_types,
        cc.purpose,
        cc.duration,
        cc.conditions,
        cc.status,
        cc.created_at,
        cc.approved_at,
        cc.expires_at,
        cc.revoked_at,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email
      FROM consent_contracts cc
      LEFT JOIN users u ON cc.requester_id = u.id
      ${whereClause}
      ORDER BY cc.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    // Parse JSON fields
    const contracts = result.rows.map(contract => ({
      ...contract,
      conditions: JSON.parse(contract.conditions || '{}'),
      data_types: contract.data_types
    }));

    res.json({
      success: true,
      message: 'Patient consent contracts retrieved successfully',
      data: {
        contracts,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: contracts.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting patient consent contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Revoke consent contract
 * POST /api/consent/contracts/{id}/revoke
 */
export const revokeConsentContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userId = (req as any).user?.id;

    // Get consent contract
    const contractResult = await databaseManager.query(`
      SELECT id, status, contract_id FROM consent_contracts WHERE id = $1
    `, [id]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consent contract not found',
        data: null
      });
    }

    const contract = contractResult.rows[0];

    if (contract.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Consent contract is already revoked',
        data: null
      });
    }

    // Revoke contract
    await databaseManager.query(`
      UPDATE consent_contracts 
      SET 
        status = 'revoked',
        revoked_at = CURRENT_TIMESTAMP,
        revocation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [reason || 'No reason provided', id]);

    // Create audit trail
    await createAuditTrail(
      id,
      'revoked',
      { status: contract.status },
      { status: 'revoked', revocation_reason: reason },
      userId || 'system',
      `Contract revoked: ${reason || 'No reason provided'}`
    );

    res.json({
      success: true,
      message: 'Consent contract revoked successfully',
      data: {
        contractId: contract.contract_id,
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        reason
      }
    });

  } catch (error) {
    console.error('Error revoking consent contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get consent access logs
 * GET /api/consent/contracts/{id}/access-logs
 */
export const getConsentAccessLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await databaseManager.query(`
      SELECT 
        cal.*,
        u.first_name,
        u.last_name,
        u.email
      FROM consent_access_logs cal
      LEFT JOIN users u ON cal.user_id = u.id
      WHERE cal.contract_id = $1
      ORDER BY cal.timestamp DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    res.json({
      success: true,
      message: 'Consent access logs retrieved successfully',
      data: {
        logs: result.rows,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: result.rows.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting consent access logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Log consent access
 * POST /api/consent/contracts/{id}/access-logs
 */
export const logConsentAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, dataType, resourceId } = req.body;

    const userId = (req as any).user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log access
    await databaseManager.query(`
      INSERT INTO consent_access_logs (
        contract_id, user_id, action, data_type, resource_id,
        ip_address, user_agent, timestamp, success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
    `, [id, userId, action, dataType, resourceId, ipAddress, userAgent, true]);

    res.status(201).json({
      success: true,
      message: 'Access logged successfully',
      data: {
        contractId: id,
        action,
        dataType,
        resourceId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error logging consent access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Execute smart contract rules
 */
async function executeSmartContractRules(
  contract: any,
  rules: SmartContractRule[],
  action: string,
  parameters: Record<string, any>,
  userId: string
): Promise<{
  executedRules: string[];
  statusChanged: boolean;
  newStatus?: string;
  actions: string[];
}> {
  const executedRules: string[] = [];
  const actions: string[] = [];
  let statusChanged = false;
  let newStatus: string | undefined;

  // Sort rules by priority
  const sortedRules = rules
    .filter(rule => rule.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    try {
      // Check if rule condition is met
      if (evaluateRuleCondition(rule.condition, contract, action, parameters)) {
        // Execute rule action
        const ruleResult = await executeRuleAction(rule, contract, parameters, userId);
        
        executedRules.push(rule.id);
        actions.push(ruleResult.action);

        // Check if rule changes contract status
        if (ruleResult.statusChange) {
          statusChanged = true;
          newStatus = ruleResult.newStatus;
        }
      }
    } catch (error) {
      console.error(`Error executing rule ${rule.id}:`, error);
    }
  }

  return {
    executedRules,
    statusChanged,
    newStatus,
    actions
  };
}

/**
 * Evaluate rule condition
 */
function evaluateRuleCondition(
  condition: string,
  contract: any,
  action: string,
  parameters: Record<string, any>
): boolean {
  try {
    // Simple condition evaluation (in real implementation, use a proper expression evaluator)
    const context = {
      contract,
      action,
      parameters,
      now: new Date(),
      isExpired: contract.expires_at && new Date(contract.expires_at) < new Date(),
      isPending: contract.status === 'pending',
      isApproved: contract.status === 'approved'
    };

    // Replace variables in condition
    let evaluatedCondition = condition;
    evaluatedCondition = evaluatedCondition.replace(/\$action/g, `"${action}"`);
    evaluatedCondition = evaluatedCondition.replace(/\$isExpired/g, context.isExpired.toString());
    evaluatedCondition = evaluatedCondition.replace(/\$isPending/g, context.isPending.toString());
    evaluatedCondition = evaluatedCondition.replace(/\$isApproved/g, context.isApproved.toString());

    // Simple evaluation (in production, use a safe expression evaluator)
    return eval(evaluatedCondition);
  } catch (error) {
    console.error('Error evaluating rule condition:', error);
    return false;
  }
}

/**
 * Execute rule action
 */
async function executeRuleAction(
  rule: SmartContractRule,
  contract: any,
  parameters: Record<string, any>,
  userId: string
): Promise<{
  action: string;
  statusChange: boolean;
  newStatus?: string;
}> {
  const action = rule.action;
  let statusChange = false;
  let newStatus: string | undefined;

  switch (action) {
    case 'auto_approve':
      if (contract.status === 'pending') {
        statusChange = true;
        newStatus = 'approved';
        
        // Update contract status
        await databaseManager.query(`
          UPDATE consent_contracts 
          SET status = 'approved', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [contract.id]);
      }
      break;

    case 'auto_reject':
      if (contract.status === 'pending') {
        statusChange = true;
        newStatus = 'rejected';
        
        // Update contract status
        await databaseManager.query(`
          UPDATE consent_contracts 
          SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [contract.id]);
      }
      break;

    case 'expire_contract':
      if (contract.status === 'approved') {
        statusChange = true;
        newStatus = 'expired';
        
        // Update contract status
        await databaseManager.query(`
          UPDATE consent_contracts 
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [contract.id]);
      }
      break;

    case 'log_access':
      // Log access attempt
      await databaseManager.query(`
        INSERT INTO consent_access_logs (
          contract_id, user_id, action, data_type, timestamp, success
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      `, [contract.id, userId, 'smart_contract_action', 'contract_execution', true]);
      break;

    case 'send_notification':
      // In a real implementation, send notification
      break;
  }

  return {
    action,
    statusChange,
    newStatus
  };
}

/**
 * Create audit trail entry
 */
async function createAuditTrail(
  contractId: string,
  action: string,
  oldValues: any,
  newValues: any,
  changedBy: string,
  changeReason: string
): Promise<void> {
  try {
    await databaseManager.query(`
      INSERT INTO consent_audit_trail (
        contract_id, action, old_values, new_values, changed_by, change_reason, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [
      contractId,
      action,
      JSON.stringify(oldValues),
      JSON.stringify(newValues),
      changedBy,
      changeReason
    ]);
  } catch (error) {
    console.error('Error creating audit trail:', error);
  }
}

/**
 * Calculate expiration date based on duration
 */
function calculateExpirationDate(duration: string): Date {
  const now = new Date();
  
  switch (duration) {
    case '1_day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '1_week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1_month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '3_months':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '6_months':
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    case '1_year':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case '2_years':
      return new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000);
    case '5_years':
      return new Date(now.getTime() + 1825 * 24 * 60 * 60 * 1000);
    case 'indefinite':
      return new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years as max
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 1 month
  }
}

/**
 * Get consent dashboard overview
 * GET /api/consent/dashboard/overview
 */
export const getConsentDashboardOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get total contracts count
    const totalContractsResult = await databaseManager.query(`
      SELECT COUNT(*) as total
      FROM consent_contracts
    `);

    // Get contracts by status
    const contractsByStatusResult = await databaseManager.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM consent_contracts
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get contracts by data type
    const contractsByDataTypeResult = await databaseManager.query(`
      SELECT 
        data_types,
        COUNT(*) as count
      FROM consent_contracts
      GROUP BY data_types
      ORDER BY count DESC
    `);

    // Get recent contracts
    const recentContractsResult = await databaseManager.query(`
      SELECT 
        cc.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      ORDER BY cc.created_at DESC
      LIMIT 10
    `);

    // Get audit trail summary
    const auditTrailResult = await databaseManager.query(`
      SELECT 
        action,
        COUNT(*) as count
      FROM consent_audit_trail
      WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    const dashboardData = {
      summary: {
        totalContracts: parseInt(totalContractsResult.rows[0].total),
        contractsByStatus: contractsByStatusResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        contractsByDataType: contractsByDataTypeResult.rows.map(row => ({
          dataType: row.data_types,
          count: parseInt(row.count)
        }))
      },
      recentContracts: recentContractsResult.rows.map(contract => ({
        id: contract.id,
        contractId: contract.contract_id,
        patientName: `${contract.patient_first_name} ${contract.patient_last_name}`,
        requesterName: `${contract.requester_first_name} ${contract.requester_last_name}`,
        dataTypes: contract.data_types,
        purpose: contract.purpose,
        status: contract.status,
        createdAt: contract.created_at,
        expiresAt: contract.expires_at
      })),
      auditTrail: auditTrailResult.rows.map(row => ({
        action: row.action,
        count: parseInt(row.count)
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Consent dashboard overview retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Error getting consent dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};