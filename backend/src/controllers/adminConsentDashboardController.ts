import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * GET /api/admin/consent-dashboard/stats
 * Get consent dashboard statistics
 */
export const getConsentDashboardStats = async (req: Request, res: Response) => {
  try {
    // Check if consent tables exist, if not return default values
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('consent_requests', 'consent_contracts', 'consent_access_logs', 'consent_audit_trail', 'compliance_alerts')
    `;
    
    const tableCheck = await databaseManager.query(tableCheckQuery);
    const existingTables = tableCheck.rows.map(row => row.table_name);
    
    // If no consent tables exist, return default values
    if (existingTables.length === 0) {
      const defaultStats = {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        activeContracts: 0,
        expiredContracts: 0,
        dailyAccess: 0,
        violationAlerts: 0
      };

      return res.status(200).json({
        success: true,
        data: defaultStats
      });
    }

    // Get overall statistics with safe queries
    const queries = [];
    
    if (existingTables.includes('consent_requests')) {
      queries.push(
        // Total consent requests
        databaseManager.query(`
          SELECT COUNT(*) as total_requests
          FROM consent_requests
        `),
        
        // Pending requests
        databaseManager.query(`
          SELECT COUNT(*) as pending_requests
          FROM consent_requests
          WHERE status = 'pending'
        `),
        
        // Approved requests
        databaseManager.query(`
          SELECT COUNT(*) as approved_requests
          FROM consent_requests
          WHERE status = 'approved'
        `),
        
        // Rejected requests
        databaseManager.query(`
          SELECT COUNT(*) as rejected_requests
          FROM consent_requests
          WHERE status = 'rejected'
        `)
      );
    } else {
      // Add default values for missing tables
      queries.push(
        Promise.resolve({ rows: [{ total_requests: '0' }] }),
        Promise.resolve({ rows: [{ pending_requests: '0' }] }),
        Promise.resolve({ rows: [{ approved_requests: '0' }] }),
        Promise.resolve({ rows: [{ rejected_requests: '0' }] })
      );
    }

    if (existingTables.includes('consent_contracts')) {
      queries.push(
        // Active contracts
        databaseManager.query(`
          SELECT COUNT(*) as active_contracts
          FROM consent_contracts
          WHERE status = 'active' AND valid_until > NOW()
        `),
        
        // Expired contracts
        databaseManager.query(`
          SELECT COUNT(*) as expired_contracts
          FROM consent_contracts
          WHERE status = 'expired' OR valid_until <= NOW()
        `)
      );
    } else {
      queries.push(
        Promise.resolve({ rows: [{ active_contracts: '0' }] }),
        Promise.resolve({ rows: [{ expired_contracts: '0' }] })
      );
    }

    if (existingTables.includes('consent_access_logs')) {
      queries.push(
        // Daily access count
        databaseManager.query(`
          SELECT COUNT(*) as daily_access
          FROM consent_access_logs
          WHERE DATE(timestamp) = CURRENT_DATE
        `)
      );
    } else {
      queries.push(
        Promise.resolve({ rows: [{ daily_access: '0' }] })
      );
    }

    if (existingTables.includes('consent_audit_trail')) {
      queries.push(
        // Violation alerts
        databaseManager.query(`
          SELECT COUNT(*) as violation_alerts
          FROM consent_audit_trail
          WHERE action = 'violation'
        `)
      );
    } else {
      queries.push(
        Promise.resolve({ rows: [{ violation_alerts: '0' }] })
      );
    }

    const results = await Promise.all(queries);

    const stats = {
      totalRequests: parseInt(results[0].rows[0]?.total_requests || '0'),
      pendingRequests: parseInt(results[1].rows[0]?.pending_requests || '0'),
      approvedRequests: parseInt(results[2].rows[0]?.approved_requests || '0'),
      rejectedRequests: parseInt(results[3].rows[0]?.rejected_requests || '0'),
      activeContracts: parseInt(results[4].rows[0]?.active_contracts || '0'),
      expiredContracts: parseInt(results[5].rows[0]?.expired_contracts || '0'),
      dailyAccess: parseInt(results[6].rows[0]?.daily_access || '0'),
      violationAlerts: parseInt(results[7].rows[0]?.violation_alerts || '0')
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get consent dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch consent dashboard statistics'
      }
    });
  }
};

/**
 * GET /api/admin/consent-dashboard/recent-requests
 * Get recent consent requests
 */
export const getRecentConsentRequests = async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;

    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          requests: []
        }
      });
    }

    const requestsQuery = `
      SELECT 
        cr.id,
        cr.id as request_id,
        u.first_name || ' ' || u.last_name as requester_name,
        'hospital' as requester_type,
        p.first_name || ' ' || p.last_name as patient_name,
        p.hospital_number as patient_hn,
        cr.request_type,
        cr.data_types as requested_data_types,
        cr.purpose,
        'normal' as urgency_level,
        cr.status,
        cr.requested_at as created_at,
        cr.expires_at,
        true as is_compliant,
        cr.response_reason as compliance_notes
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      LEFT JOIN patients p ON cr.patient_id = p.id
      ORDER BY cr.requested_at DESC
      LIMIT $1
    `;

    const requests = await databaseManager.query(requestsQuery, [Number(limit)]);

    res.status(200).json({
      success: true,
      data: {
        requests: requests.rows
      }
    });
  } catch (error) {
    console.error('Get recent consent requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch recent consent requests'
      }
    });
  }
};

/**
 * GET /api/admin/consent-dashboard/active-contracts
 * Get active consent contracts
 */
export const getActiveConsentContracts = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

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
          contracts: []
        }
      });
    }

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
      WHERE cc.status = 'approved' AND (cc.expires_at IS NULL OR cc.expires_at > NOW())
      ORDER BY cc.expires_at ASC NULLS LAST
      LIMIT $1
    `;

    const contracts = await databaseManager.query(contractsQuery, [Number(limit)]);

    res.status(200).json({
      success: true,
      data: {
        contracts: contracts.rows
      }
    });
  } catch (error) {
    console.error('Get active consent contracts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch active consent contracts'
      }
    });
  }
};

/**
 * GET /api/admin/consent-dashboard/compliance-alerts
 * Get compliance alerts
 */
export const getComplianceAlerts = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    // Check if consent_audit_trail table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_audit_trail'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          alerts: []
        }
      });
    }

    const alertsQuery = `
      SELECT 
        cat.id,
        cat.action as type,
        'System Alert' as title,
        cat.change_reason as description,
        cat.contract_id,
        CASE 
          WHEN cat.action = 'violation' THEN 'high'
          WHEN cat.action = 'warning' THEN 'medium'
          ELSE 'low'
        END as severity,
        cat.timestamp as created_at,
        false as is_read,
        false as is_resolved
      FROM consent_audit_trail cat
      ORDER BY 
        CASE 
          WHEN cat.action = 'violation' THEN 1 
          WHEN cat.action = 'warning' THEN 2 
          ELSE 3 
        END,
        cat.timestamp DESC
      LIMIT $1
    `;

    const alerts = await databaseManager.query(alertsQuery, [Number(limit)]);

    res.status(200).json({
      success: true,
      data: {
        alerts: alerts.rows
      }
    });
  } catch (error) {
    console.error('Get compliance alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch compliance alerts'
      }
    });
  }
};

/**
 * GET /api/admin/consent-dashboard/overview
 * Get complete consent dashboard overview
 */
export const getConsentDashboardOverview = async (req: Request, res: Response) => {
  try {
    // Check if consent tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('consent_requests', 'consent_contracts', 'consent_access_logs', 'consent_audit_trail', 'compliance_alerts')
    `;
    
    const tableCheck = await databaseManager.query(tableCheckQuery);
    const existingTables = tableCheck.rows.map(row => row.table_name);
    
    // If no consent tables exist, return default overview
    if (existingTables.length === 0) {
      const defaultOverview = {
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          activeContracts: 0,
          expiredContracts: 0,
          dailyAccess: 0,
          violationAlerts: 0
        },
        recentRequests: [],
        activeContracts: [],
        complianceAlerts: []
      };

      return res.status(200).json({
        success: true,
        data: defaultOverview
      });
    }

    // Get all data in parallel with safe queries
    const queries = [];
    
    // Stats query
    let statsQuery = 'SELECT ';
    if (existingTables.includes('consent_requests')) {
      statsQuery += `
        (SELECT COUNT(*) FROM consent_requests) as total_requests,
        (SELECT COUNT(*) FROM consent_requests WHERE status = 'pending') as pending_requests,
        (SELECT COUNT(*) FROM consent_requests WHERE status = 'approved') as approved_requests,
        (SELECT COUNT(*) FROM consent_requests WHERE status = 'rejected') as rejected_requests,
      `;
    } else {
      statsQuery += '0 as total_requests, 0 as pending_requests, 0 as approved_requests, 0 as rejected_requests, ';
    }
    
    if (existingTables.includes('consent_contracts')) {
      statsQuery += `
        (SELECT COUNT(*) FROM consent_contracts WHERE status = 'approved' AND (expires_at IS NULL OR expires_at > NOW())) as active_contracts,
        (SELECT COUNT(*) FROM consent_contracts WHERE status = 'expired' OR expires_at <= NOW()) as expired_contracts,
      `;
    } else {
      statsQuery += '0 as active_contracts, 0 as expired_contracts, ';
    }
    
    if (existingTables.includes('consent_access_logs')) {
      statsQuery += `
        (SELECT COUNT(*) FROM consent_access_logs WHERE DATE(timestamp) = CURRENT_DATE) as daily_access,
      `;
    } else {
      statsQuery += '0 as daily_access, ';
    }
    
    if (existingTables.includes('consent_audit_trail')) {
      statsQuery += `
        (SELECT COUNT(*) FROM consent_audit_trail WHERE action = 'violation') as violation_alerts
      `;
    } else {
      statsQuery += '0 as violation_alerts';
    }
    
    queries.push(databaseManager.query(statsQuery));
    
    // Recent requests
    if (existingTables.includes('consent_requests')) {
      queries.push(databaseManager.query(`
        SELECT 
          cr.id,
          cr.id as request_id,
          u.first_name || ' ' || u.last_name as requester_name,
          'hospital' as requester_type,
          p.first_name || ' ' || p.last_name as patient_name,
          p.hospital_number as patient_hn,
          cr.request_type,
          cr.data_types as requested_data_types,
          cr.purpose,
          'normal' as urgency_level,
          cr.status,
          cr.requested_at as created_at,
          cr.expires_at,
          true as is_compliant,
          cr.response_reason as compliance_notes
        FROM consent_requests cr
        LEFT JOIN users u ON cr.requester_id = u.id
        LEFT JOIN patients p ON cr.patient_id = p.id
        ORDER BY cr.requested_at DESC
        LIMIT 5
      `));
    } else {
      queries.push(Promise.resolve({ rows: [] }));
    }
    
    // Active contracts
    if (existingTables.includes('consent_contracts')) {
      queries.push(databaseManager.query(`
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
        WHERE cc.status = 'approved' AND (cc.expires_at IS NULL OR cc.expires_at > NOW())
        ORDER BY cc.expires_at ASC NULLS LAST
        LIMIT 10
      `));
    } else {
      queries.push(Promise.resolve({ rows: [] }));
    }
    
    // Compliance alerts
    if (existingTables.includes('consent_audit_trail')) {
      queries.push(databaseManager.query(`
        SELECT 
          cat.id,
          cat.action as type,
          'System Alert' as title,
          cat.change_reason as description,
          cat.contract_id,
          CASE 
            WHEN cat.action = 'violation' THEN 'high'
            WHEN cat.action = 'warning' THEN 'medium'
            ELSE 'low'
          END as severity,
          cat.timestamp as created_at,
          false as is_read,
          false as is_resolved
        FROM consent_audit_trail cat
        ORDER BY 
          CASE 
            WHEN cat.action = 'violation' THEN 1 
            WHEN cat.action = 'warning' THEN 2 
            ELSE 3 
          END,
          cat.timestamp DESC
        LIMIT 10
      `));
    } else {
      queries.push(Promise.resolve({ rows: [] }));
    }

    const [statsResult, recentRequestsResult, activeContractsResult, complianceAlertsResult] = await Promise.all(queries);

    const stats = statsResult.rows[0];
    const overview = {
      stats: {
        totalRequests: parseInt(stats?.total_requests || '0'),
        pendingRequests: parseInt(stats?.pending_requests || '0'),
        approvedRequests: parseInt(stats?.approved_requests || '0'),
        rejectedRequests: parseInt(stats?.rejected_requests || '0'),
        activeContracts: parseInt(stats?.active_contracts || '0'),
        expiredContracts: parseInt(stats?.expired_contracts || '0'),
        dailyAccess: parseInt(stats?.daily_access || '0'),
        violationAlerts: parseInt(stats?.violation_alerts || '0')
      },
      recentRequests: recentRequestsResult.rows,
      activeContracts: activeContractsResult.rows,
      complianceAlerts: complianceAlertsResult.rows
    };

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Get consent dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch consent dashboard overview'
      }
    });
  }
};
