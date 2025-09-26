import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Compliance Management Controller
 * จัดการข้อมูลการปฏิบัติตามกฎเกณฑ์สำหรับ Admin Panel
 */

/**
 * Get compliance reports
 * GET /api/admin/compliance/reports
 */
export const getComplianceReports = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Check if compliance_reports table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_reports'
    `);

    if (tableCheck.rows.length === 0) {
      // Return mock data if table doesn't exist
      const mockReports = [
        {
          id: '1',
          title: 'การตรวจสอบการปฏิบัติตามกฎหมาย PDPA',
          type: 'audit',
          status: 'completed',
          date: '2025-09-10T10:00:00Z',
          score: 85,
          findings: 3,
          recommendations: 5,
          created_by: 'Admin',
          updated_at: '2025-09-10T10:00:00Z'
        },
        {
          id: '2',
          title: 'การประเมินความเสี่ยงด้านความปลอดภัยข้อมูล',
          type: 'assessment',
          status: 'in_progress',
          date: '2025-09-12T14:00:00Z',
          score: 0,
          findings: 0,
          recommendations: 0,
          created_by: 'Admin',
          updated_at: '2025-09-12T14:00:00Z'
        },
        {
          id: '3',
          title: 'การทบทวนนโยบายการให้ความยินยอม',
          type: 'review',
          status: 'scheduled',
          date: '2025-09-15T09:00:00Z',
          score: 0,
          findings: 0,
          recommendations: 0,
          created_by: 'Admin',
          updated_at: '2025-09-15T09:00:00Z'
        }
      ];

      return res.status(200).json({
        success: true,
        data: {
          reports: mockReports
        },
        meta: {
          timestamp: new Date().toISOString(),
          generated_by: 'admin_compliance_controller'
        },
        error: null,
        statusCode: 200
      });
    }

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'date', 'title', 'status', 'score'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get reports with pagination
    const reportsQuery = `
      SELECT 
        id,
        title,
        type,
        status,
        date,
        score,
        findings,
        recommendations,
        created_by,
        updated_at
      FROM compliance_reports
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const reports = await databaseManager.query(reportsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM compliance_reports
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        reports: reports.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_compliance_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get compliance reports error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_COMPLIANCE_REPORTS_ERROR',
        message: 'Failed to get compliance reports'
      },
      statusCode: 500
    });
  }
};

/**
 * Get compliance trends
 * GET /api/admin/compliance/trends
 */
export const getComplianceTrends = async (req: Request, res: Response) => {
  try {
    const { period = 30 } = req.query;

    // Check if compliance_trends table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_trends'
    `);

    if (tableCheck.rows.length === 0) {
      // Return mock trends data
      const mockTrends = [
        {
          period: '2025-09',
          compliance_score: 95,
          total_alerts: 8,
          resolved_alerts: 7,
          new_alerts: 2,
          resolution_rate: 87.5
        },
        {
          period: '2025-08',
          compliance_score: 90,
          total_alerts: 12,
          resolved_alerts: 10,
          new_alerts: 5,
          resolution_rate: 83.3
        },
        {
          period: '2025-07',
          compliance_score: 88,
          total_alerts: 15,
          resolved_alerts: 12,
          new_alerts: 8,
          resolution_rate: 80.0
        }
      ];

      return res.status(200).json({
        success: true,
        data: {
          trends: mockTrends
        },
        meta: {
          timestamp: new Date().toISOString(),
          generated_by: 'admin_compliance_controller'
        },
        error: null,
        statusCode: 200
      });
    }

    const trendsQuery = `
      SELECT 
        period,
        compliance_score,
        total_alerts,
        resolved_alerts,
        new_alerts,
        resolution_rate
      FROM compliance_trends
      WHERE period >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${period} days')
      ORDER BY period DESC
    `;

    const trends = await databaseManager.query(trendsQuery);

    res.status(200).json({
      success: true,
      data: {
        trends: trends.rows
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_compliance_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get compliance trends error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_COMPLIANCE_TRENDS_ERROR',
        message: 'Failed to get compliance trends'
      },
      statusCode: 500
    });
  }
};

/**
 * Get comprehensive compliance statistics
 * GET /api/admin/compliance/stats
 */
export const getComplianceStats = async (req: Request, res: Response) => {
  try {
    // Get compliance alerts from consent dashboard
    const alertsQuery = `
      SELECT 
        action,
        timestamp,
        change_reason
      FROM consent_audit_trail
      WHERE action IN ('consent_violation', 'data_breach', 'unauthorized_access', 'policy_violation')
      AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const alertsResult = await databaseManager.query(alertsQuery);
    const alerts = alertsResult.rows;

    // Calculate stats from alerts (simplified since we don't have severity/resolved columns)
    const totalAlerts = alerts.length;
    const highPriorityAlerts = alerts.filter(alert => 
      alert.action === 'data_breach' || alert.action === 'unauthorized_access'
    ).length;
    const mediumPriorityAlerts = alerts.filter(alert => 
      alert.action === 'consent_violation'
    ).length;
    const lowPriorityAlerts = alerts.filter(alert => 
      alert.action === 'policy_violation'
    ).length;
    const resolvedAlerts = 0; // No resolved column, assume all are pending
    const pendingAlerts = totalAlerts;

    // Calculate compliance score
    const complianceScore = totalAlerts > 0 ? Math.max(0, 100 - (pendingAlerts * 5)) : 100;

    // Get last audit date
    const lastAuditQuery = `
      SELECT MAX(timestamp) as last_audit_date
      FROM consent_audit_trail
      WHERE action = 'compliance_audit'
    `;
    const lastAuditResult = await databaseManager.query(lastAuditQuery);
    const lastAuditDate = lastAuditResult.rows[0]?.last_audit_date || new Date().toISOString();

    // Calculate trends (mock data for now)
    const trends = {
      scoreChange: 5, // +5% from last month
      alertChange: -12, // -12 alerts from last month
      resolutionRate: 95 // 95% resolution rate
    };

    res.status(200).json({
      success: true,
      data: {
        totalAlerts,
        highPriorityAlerts,
        mediumPriorityAlerts,
        lowPriorityAlerts,
        resolvedAlerts,
        pendingAlerts,
        complianceScore,
        lastAuditDate,
        trends
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_compliance_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get compliance stats error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'GET_COMPLIANCE_STATS_ERROR',
        message: 'Failed to get compliance statistics'
      },
      statusCode: 500
    });
  }
};

/**
 * Create compliance report
 * POST /api/admin/compliance/reports
 */
export const createComplianceReport = async (req: Request, res: Response) => {
  try {
    const { title, type, status, date, score, findings, recommendations } = req.body;

    // Check if compliance_reports table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_reports'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'COMPLIANCE_REPORTS_TABLE_NOT_FOUND',
          message: 'Compliance reports table not found'
        },
        statusCode: 404
      });
    }

    const createQuery = `
      INSERT INTO compliance_reports (title, type, status, date, score, findings, recommendations, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const result = await databaseManager.query(createQuery, [
      title, type, status, date, score || 0, findings || 0, recommendations || 0, 'Admin'
    ]);

    res.status(201).json({
      success: true,
      data: {
        report: result.rows[0]
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_compliance_controller'
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Create compliance report error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'CREATE_COMPLIANCE_REPORT_ERROR',
        message: 'Failed to create compliance report'
      },
      statusCode: 500
    });
  }
};

/**
 * Update compliance report
 * PUT /api/admin/compliance/reports/:id
 */
export const updateComplianceReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, status, date, score, findings, recommendations } = req.body;

    // Check if compliance_reports table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'compliance_reports'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'COMPLIANCE_REPORTS_TABLE_NOT_FOUND',
          message: 'Compliance reports table not found'
        },
        statusCode: 404
      });
    }

    const updateQuery = `
      UPDATE compliance_reports 
      SET title = $1, type = $2, status = $3, date = $4, score = $5, findings = $6, recommendations = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [
      title, type, status, date, score, findings, recommendations, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        meta: null,
        error: {
          code: 'COMPLIANCE_REPORT_NOT_FOUND',
          message: 'Compliance report not found'
        },
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      data: {
        report: result.rows[0]
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: 'admin_compliance_controller'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update compliance report error:', error);
    res.status(500).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_COMPLIANCE_REPORT_ERROR',
        message: 'Failed to update compliance report'
      },
      statusCode: 500
    });
  }
};
