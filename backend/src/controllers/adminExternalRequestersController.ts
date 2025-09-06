import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin External Requesters Management Controller
 * จัดการผู้ใช้ภายนอกสำหรับ Admin Panel
 */

/**
 * Get all external requesters with pagination and filtering
 * GET /api/admin/external-requesters
 */
export const getAllExternalRequesters = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      organizationType, 
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (er.organization_name ILIKE $${paramCount} OR er.primary_contact_name ILIKE $${paramCount} OR er.primary_contact_email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (organizationType) {
      paramCount++;
      whereClause += ` AND er.organization_type = $${paramCount}`;
      queryParams.push(organizationType);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND er.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'organization_name', 'organization_type', 'status', 'last_login'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get external requesters with pagination
    const requestersQuery = `
      SELECT 
        er.id,
        er.organization_name,
        er.organization_type,
        er.registration_number,
        er.license_number,
        er.tax_id,
        er.primary_contact_name,
        er.primary_contact_email,
        er.primary_contact_phone,
        er.address,
        er.is_verified,
        er.verification_date,
        er.verified_by,
        er.allowed_request_types,
        er.data_access_level,
        er.max_concurrent_requests,
        er.status,
        er.suspension_reason,
        er.compliance_certifications,
        er.data_protection_certification,
        er.last_compliance_audit,
        er.created_at,
        er.updated_at,
        er.last_login,
        COUNT(dr.id) as total_requests,
        COUNT(CASE WHEN dr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN dr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN dr.status = 'rejected' THEN 1 END) as rejected_requests
      FROM external_requesters er
      LEFT JOIN data_requests dr ON er.id = dr.requester_id
      ${whereClause}
      GROUP BY er.id
      ORDER BY er.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const requesters = await databaseManager.query(requestersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM external_requesters er
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      data: {
        requesters: requesters.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        totalRequesters: total,
        activeRequesters: requesters.rows.filter(r => r.status === 'active').length,
        pendingRequesters: requesters.rows.filter(r => r.status === 'pending').length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get external requesters error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'EXTERNAL_REQUESTERS_ERROR',
        message: 'Failed to get external requesters'
      },
      statusCode: 500
    });
  }
};

/**
 * Get external requester by ID
 * GET /api/admin/external-requesters/:id
 */
export const getExternalRequesterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requesterQuery = `
      SELECT 
        er.*,
        COUNT(dr.id) as total_requests,
        COUNT(CASE WHEN dr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN dr.status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN dr.status = 'rejected' THEN 1 END) as rejected_requests,
        SUM(CASE WHEN dr.status = 'approved' THEN dr.data_volume ELSE 0 END) as total_data_transferred
      FROM external_requesters er
      LEFT JOIN data_requests dr ON er.id = dr.requester_id
      WHERE er.id = $1
      GROUP BY er.id
    `;

    const requester = await databaseManager.query(requesterQuery, [id]);

    if (requester.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'EXTERNAL_REQUESTER_NOT_FOUND',
          message: 'External requester not found'
        },
        statusCode: 404
      });
    }

    // Get recent requests
    const recentRequestsQuery = `
      SELECT 
        dr.id,
        dr.request_type,
        dr.purpose,
        dr.status,
        dr.requested_data_types,
        dr.data_volume,
        dr.created_at,
        dr.approved_at,
        dr.rejected_at,
        dr.rejection_reason
      FROM data_requests dr
      WHERE dr.requester_id = $1
      ORDER BY dr.created_at DESC
      LIMIT 10
    `;

    const recentRequests = await databaseManager.query(recentRequestsQuery, [id]);

    res.status(200).json({
      data: {
        requester: requester.rows[0],
        recentRequests: recentRequests.rows
      },
      meta: {
        totalRequests: requester.rows[0].total_requests,
        approvedRequests: requester.rows[0].approved_requests,
        pendingRequests: requester.rows[0].pending_requests,
        rejectedRequests: requester.rows[0].rejected_requests
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get external requester error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'EXTERNAL_REQUESTER_ERROR',
        message: 'Failed to get external requester'
      },
      statusCode: 500
    });
  }
};

/**
 * Update external requester status
 * PUT /api/admin/external-requesters/:id/status
 */
export const updateExternalRequesterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, verifiedBy } = req.body;

    // Validate status
    const validStatuses = ['pending', 'active', 'suspended', 'revoked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        },
        statusCode: 400
      });
    }

    const updateQuery = `
      UPDATE external_requesters 
      SET 
        status = $1,
        suspension_reason = $2,
        verified_by = $3,
        verification_date = CASE 
          WHEN $1 = 'active' AND verification_date IS NULL THEN NOW()
          ELSE verification_date
        END,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [status, reason, verifiedBy, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'EXTERNAL_REQUESTER_NOT_FOUND',
          message: 'External requester not found'
        },
        statusCode: 404
      });
    }

    res.status(200).json({
      data: {
        requester: result.rows[0]
      },
      meta: {
        message: 'External requester status updated successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update external requester status error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'Failed to update external requester status'
      },
      statusCode: 500
    });
  }
};

/**
 * Get external requesters statistics
 * GET /api/admin/external-requesters/stats
 */
export const getExternalRequestersStats = async (req: Request, res: Response) => {
  try {
    // Get overall statistics
    const overallStats = await databaseManager.query(`
      SELECT 
        COUNT(*) as total_requesters,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_requesters,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requesters,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_requesters,
        COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_requesters,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_requesters
      FROM external_requesters
    `);

    // Get statistics by organization type
    const orgTypeStats = await databaseManager.query(`
      SELECT 
        organization_type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM external_requesters
      GROUP BY organization_type
      ORDER BY count DESC
    `);

    // Get statistics by data access level
    const accessLevelStats = await databaseManager.query(`
      SELECT 
        data_access_level,
        COUNT(*) as count
      FROM external_requesters
      WHERE status = 'active'
      GROUP BY data_access_level
      ORDER BY count DESC
    `);

    // Get monthly registration trends
    const monthlyTrends = await databaseManager.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as registrations
      FROM external_requesters
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    // Get request statistics
    const requestStats = await databaseManager.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        SUM(CASE WHEN status = 'approved' THEN data_volume ELSE 0 END) as total_data_transferred
      FROM data_requests
    `);

    res.status(200).json({
      data: {
        overall: overallStats.rows[0],
        byOrganizationType: orgTypeStats.rows,
        byAccessLevel: accessLevelStats.rows,
        monthlyTrends: monthlyTrends.rows,
        requests: requestStats.rows[0]
      },
      meta: {
        lastUpdated: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get external requesters stats error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to get external requesters statistics'
      },
      statusCode: 500
    });
  }
};
