import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Consent Contracts Management Controller
 * จัดการสัญญาการยินยอมสำหรับ Admin Panel
 */

/**
 * Get all consent contracts with pagination and filtering
 * GET /api/admin/consent-contracts
 */
export const getAllConsentContracts = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Check if consent_contracts table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_contracts'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          contracts: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          generated_by: 'admin_consent_contracts_controller'
        },
        error: null,
        statusCode: 200
      });
    }

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (cc.contract_id ILIKE $${paramCount} OR p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND cc.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'expires_at', 'contract_id', 'status', 'last_accessed'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get contracts with pagination
    const contractsQuery = `
      SELECT 
        cc.id,
        cc.contract_id,
        cc.patient_id,
        cc.requester_id,
        cc.data_types as allowed_data_types,
        cc.purpose as contract_type,
        cc.created_at as valid_from,
        cc.expires_at as valid_until,
        0 as access_count,
        NULL as max_access_count,
        cc.status,
        cc.updated_at as last_accessed,
        p.first_name || ' ' || p.last_name as patient_name,
        p.hospital_number as patient_hn,
        u.first_name || ' ' || u.last_name as requester_name
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      ${whereClause}
      ORDER BY cc.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const contracts = await databaseManager.query(contractsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        contracts: contracts.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_consent_contracts_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get all consent contracts error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_ALL_CONSENT_CONTRACTS_ERROR',
        message: 'Failed to get consent contracts'
      },
      statusCode: 500
    });
  }
};

/**
 * Get consent contract statistics
 * GET /api/admin/consent-contracts/stats
 */
export const getConsentContractStats = async (req: Request, res: Response) => {
  try {
    // Check if consent_contracts table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_contracts'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalContracts: 0,
          activeContracts: 0,
          expiredContracts: 0,
          pendingContracts: 0
        },
        meta: {
          timestamp: new Date().toISOString(),
          generated_by: 'admin_consent_contracts_controller'
        },
        error: null,
        statusCode: 200
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_contracts,
        COUNT(CASE WHEN status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as active_contracts,
        COUNT(CASE WHEN status = 'approved' AND expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 END) as expired_contracts,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contracts
      FROM consent_contracts
    `;

    const statsResult = await databaseManager.query(statsQuery);
    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        totalContracts: parseInt(stats.total_contracts),
        activeContracts: parseInt(stats.active_contracts),
        expiredContracts: parseInt(stats.expired_contracts),
        pendingContracts: parseInt(stats.pending_contracts)
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_consent_contracts_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get consent contract stats error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_CONSENT_CONTRACT_STATS_ERROR',
        message: 'Failed to get consent contract statistics'
      },
      statusCode: 500
    });
  }
};

/**
 * Get consent contract by ID
 * GET /api/admin/consent-contracts/:id
 */
export const getConsentContractById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if consent_contracts table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_contracts'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'CONSENT_CONTRACT_NOT_FOUND',
          message: 'Consent contract not found'
        },
        statusCode: 404
      });
    }

    const contractQuery = `
      SELECT 
        cc.id,
        cc.contract_id,
        cc.patient_id,
        cc.requester_id,
        cc.data_types as allowed_data_types,
        cc.purpose as contract_type,
        cc.created_at as valid_from,
        cc.expires_at as valid_until,
        0 as access_count,
        NULL as max_access_count,
        cc.status,
        cc.updated_at as last_accessed,
        p.first_name || ' ' || p.last_name as patient_name,
        p.hospital_number as patient_hn,
        u.first_name || ' ' || u.last_name as requester_name
      FROM consent_contracts cc
      LEFT JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.requester_id = u.id
      WHERE cc.id = $1
    `;

    const contractResult = await databaseManager.query(contractQuery, [id]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'CONSENT_CONTRACT_NOT_FOUND',
          message: 'Consent contract not found'
        },
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contract: contractResult.rows[0]
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_consent_contracts_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get consent contract by ID error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_CONSENT_CONTRACT_BY_ID_ERROR',
        message: 'Failed to get consent contract'
      },
      statusCode: 500
    });
  }
};

/**
 * Update consent contract status
 * PUT /api/admin/consent-contracts/:id/status
 */
export const updateConsentContractStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if consent_contracts table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_contracts'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'CONSENT_CONTRACT_NOT_FOUND',
          message: 'Consent contract not found'
        },
        statusCode: 404
      });
    }

    const updateQuery = `
      UPDATE consent_contracts 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, [status, id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'CONSENT_CONTRACT_NOT_FOUND',
          message: 'Consent contract not found'
        },
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contract: updateResult.rows[0]
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_consent_contracts_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update consent contract status error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_CONSENT_CONTRACT_STATUS_ERROR',
        message: 'Failed to update consent contract status'
      },
      statusCode: 500
    });
  }
};
