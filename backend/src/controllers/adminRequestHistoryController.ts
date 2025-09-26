import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Request History Management Controller
 * จัดการประวัติคำขอสำหรับ Admin Panel
 */

/**
 * Get all data requests with pagination and filtering
 * GET /api/admin/request-history
 */
export const getAllDataRequests = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      requesterId,
      requestType,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND dr.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (requesterId) {
      paramCount++;
      whereClause += ` AND dr.requester_id = $${paramCount}`;
      queryParams.push(requesterId);
    }

    if (requestType) {
      paramCount++;
      whereClause += ` AND dr.request_type = $${paramCount}`;
      queryParams.push(requestType);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND dr.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND dr.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'status', 'request_type', 'approved_at', 'rejected_at'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get data requests with pagination
    const requestsQuery = `
      SELECT 
        dr.id,
        dr.requester_id,
        dr.request_type,
        dr.purpose,
        dr.requested_data_types,
        dr.data_volume,
        dr.status,
        dr.approved_by,
        dr.rejected_by,
        dr.approval_notes,
        dr.rejection_reason,
        dr.created_at,
        dr.updated_at,
        dr.approved_at,
        dr.rejected_at,
        er.organization_name,
        er.organization_type,
        er.primary_contact_name,
        er.primary_contact_email,
        er.data_access_level,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name,
        rejector.first_name as rejector_first_name,
        rejector.last_name as rejector_last_name
      FROM data_requests dr
      LEFT JOIN external_requesters er ON dr.requester_id = er.id
      LEFT JOIN users approver ON dr.approved_by = approver.id
      LEFT JOIN users rejector ON dr.rejected_by = rejector.id
      ${whereClause}
      ORDER BY dr.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const requests = await databaseManager.query(requestsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM data_requests dr
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get request statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN request_type = 'patient_data' THEN 1 END) as patient_data,
        COUNT(CASE WHEN request_type = 'medical_records' THEN 1 END) as medical_records,
        COUNT(CASE WHEN request_type = 'lab_results' THEN 1 END) as lab_results,
        COUNT(CASE WHEN request_type = 'statistics' THEN 1 END) as statistics,
        SUM(CASE WHEN status = 'approved' THEN data_volume ELSE 0 END) as total_data_transferred
      FROM data_requests dr
      ${whereClause.replace('WHERE 1=1', 'WHERE 1=1').replace(/AND dr\.(status|requester_id|request_type|created_at)/g, 'AND dr.$1')}
    `;

    const stats = await databaseManager.query(statsQuery, queryParams.slice(0, -2));

    res.status(200).json({
      data: {
        requests: requests.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        statistics: stats.rows[0]
      },
      meta: {
        totalRequests: total,
        pendingCount: stats.rows[0].pending,
        approvedCount: stats.rows[0].approved,
        rejectedCount: stats.rows[0].rejected,
        expiredCount: stats.rows[0].expired
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get data requests error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'REQUESTS_ERROR',
        message: 'Failed to get data requests'
      },
      statusCode: 500
    });
  }
};

/**
 * Get data request by ID
 * GET /api/admin/request-history/:id
 */
export const getDataRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requestQuery = `
      SELECT 
        dr.*,
        er.organization_name,
        er.organization_type,
        er.primary_contact_name,
        er.primary_contact_email,
        er.primary_contact_phone,
        er.data_access_level,
        er.allowed_request_types,
        er.compliance_certifications,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name,
        approver.email as approver_email,
        rejector.first_name as rejector_first_name,
        rejector.last_name as rejector_last_name,
        rejector.email as rejector_email
      FROM data_requests dr
      LEFT JOIN external_requesters er ON dr.requester_id = er.id
      LEFT JOIN users approver ON dr.approved_by = approver.id
      LEFT JOIN users rejector ON dr.rejected_by = rejector.id
      WHERE dr.id = $1
    `;

    const request = await databaseManager.query(requestQuery, [id]);

    if (request.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Data request not found'
        },
        statusCode: 404
      });
    }

    // Get request activity log
    const activityQuery = `
      SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.resource = 'data_request' AND al.resource_id = $1
      ORDER BY al.created_at DESC
    `;

    const activity = await databaseManager.query(activityQuery, [id]);

    res.status(200).json({
      data: {
        request: request.rows[0],
        activity: activity.rows
      },
      meta: {
        totalActivity: activity.rows.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get data request error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'REQUEST_ERROR',
        message: 'Failed to get data request'
      },
      statusCode: 500
    });
  }
};

/**
 * Approve data request
 * PUT /api/admin/request-history/:id/approve
 */
export const approveDataRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalNotes, dataAccessLevel, expirationDate } = req.body;
    const approvedBy = req.user?.id;

    if (!approvedBy) {
      return res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        },
        statusCode: 401
      });
    }

    // Check if request exists and is pending
    const checkQuery = `
      SELECT id, status, requester_id FROM data_requests 
      WHERE id = $1
    `;
    const checkResult = await databaseManager.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Data request not found'
        },
        statusCode: 404
      });
    }

    if (checkResult.rows[0].status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_STATUS',
          message: 'Request is not in pending status'
        },
        statusCode: 400
      });
    }

    // Update request status
    const updateQuery = `
      UPDATE data_requests 
      SET 
        status = 'approved',
        approved_by = $1,
        approval_notes = $2,
        data_access_level = $3,
        expiration_date = $4,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [
      approvedBy,
      approvalNotes,
      dataAccessLevel,
      expirationDate,
      id
    ]);

    // Log the approval action
    const logQuery = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'approve', 'data_request', $2, $3, $4, $5, true)
    `;

    await databaseManager.query(logQuery, [
      approvedBy,
      id,
      JSON.stringify({
        approvalNotes,
        dataAccessLevel,
        expirationDate,
        requesterId: checkResult.rows[0].requester_id
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.status(200).json({
      data: {
        request: result.rows[0],
        message: 'Data request approved successfully'
      },
      meta: {
        approvedBy,
        approvedAt: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Approve data request error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'APPROVAL_ERROR',
        message: 'Failed to approve data request'
      },
      statusCode: 500
    });
  }
};

/**
 * Reject data request
 * PUT /api/admin/request-history/:id/reject
 */
export const rejectDataRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = req.user?.id;

    if (!rejectedBy) {
      return res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        },
        statusCode: 401
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REJECTION_REASON',
          message: 'Rejection reason is required'
        },
        statusCode: 400
      });
    }

    // Check if request exists and is pending
    const checkQuery = `
      SELECT id, status, requester_id FROM data_requests 
      WHERE id = $1
    `;
    const checkResult = await databaseManager.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Data request not found'
        },
        statusCode: 404
      });
    }

    if (checkResult.rows[0].status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_STATUS',
          message: 'Request is not in pending status'
        },
        statusCode: 400
      });
    }

    // Update request status
    const updateQuery = `
      UPDATE data_requests 
      SET 
        status = 'rejected',
        rejected_by = $1,
        rejection_reason = $2,
        rejected_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [
      rejectedBy,
      rejectionReason,
      id
    ]);

    // Log the rejection action
    const logQuery = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'reject', 'data_request', $2, $3, $4, $5, true)
    `;

    await databaseManager.query(logQuery, [
      rejectedBy,
      id,
      JSON.stringify({
        rejectionReason,
        requesterId: checkResult.rows[0].requester_id
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.status(200).json({
      data: {
        request: result.rows[0],
        message: 'Data request rejected successfully'
      },
      meta: {
        rejectedBy,
        rejectedAt: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Reject data request error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'REJECTION_ERROR',
        message: 'Failed to reject data request'
      },
      statusCode: 500
    });
  }
};

/**
 * Get request statistics
 * GET /api/admin/request-history/statistics
 */
export const getRequestStatistics = async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query; // days

    // Get overall statistics
    const overallStats = await databaseManager.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_requests,
        SUM(CASE WHEN status = 'approved' THEN data_volume ELSE 0 END) as total_data_transferred,
        AVG(CASE WHEN status = 'approved' THEN EXTRACT(EPOCH FROM (approved_at - created_at))/3600 ELSE NULL END) as avg_approval_time_hours
      FROM data_requests
    `);

    // Get statistics by request type
    const typeStats = await databaseManager.query(`
      SELECT 
        request_type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM data_requests
      GROUP BY request_type
      ORDER BY count DESC
    `);

    // Get statistics by organization type
    const orgStats = await databaseManager.query(`
      SELECT 
        er.organization_type,
        COUNT(*) as count,
        COUNT(CASE WHEN dr.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN dr.status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN dr.status = 'pending' THEN 1 END) as pending
      FROM data_requests dr
      LEFT JOIN external_requesters er ON dr.requester_id = er.id
      GROUP BY er.organization_type
      ORDER BY count DESC
    `);

    // Get monthly trends
    const monthlyTrends = await databaseManager.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
      FROM data_requests
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    // Get top requesters
    const topRequesters = await databaseManager.query(`
      SELECT 
        er.organization_name,
        er.organization_type,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN dr.status = 'approved' THEN 1 END) as approved_requests,
        SUM(CASE WHEN dr.status = 'approved' THEN dr.data_volume ELSE 0 END) as total_data_transferred
      FROM data_requests dr
      LEFT JOIN external_requesters er ON dr.requester_id = er.id
      GROUP BY er.id, er.organization_name, er.organization_type
      ORDER BY total_requests DESC
      LIMIT 10
    `);

    res.status(200).json({
      data: {
        overall: overallStats.rows[0],
        byType: typeStats.rows,
        byOrganization: orgStats.rows,
        monthlyTrends: monthlyTrends.rows,
        topRequesters: topRequesters.rows
      },
      meta: {
        period: `${period} days`,
        lastUpdated: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get request statistics error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'STATISTICS_ERROR',
        message: 'Failed to get request statistics'
      },
      statusCode: 500
    });
  }
};
