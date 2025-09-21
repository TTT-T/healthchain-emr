import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * GET /api/admin/consent-requests
 * Get all consent requests with filtering and pagination
 */
export const getAllConsentRequests = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      urgency,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

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
          requests: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND cr.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (type) {
      whereClause += ` AND cr.request_type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (urgency) {
      whereClause += ` AND 'normal' = $${paramIndex}`; // Default urgency for now
      queryParams.push(urgency);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex} OR 
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR 
        p.hospital_number ILIKE $${paramIndex} OR 
        cr.id::text ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      LEFT JOIN patients p ON cr.patient_id = p.id
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get requests
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
      ${whereClause}
      ORDER BY cr.requested_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const requests = await databaseManager.query(requestsQuery, queryParams);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      success: true,
      data: {
        requests: requests.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get all consent requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch consent requests'
      }
    });
  }
};

/**
 * GET /api/admin/consent-requests/stats
 * Get consent request statistics
 */
export const getConsentRequestStats = async (req: Request, res: Response) => {
  try {
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
          totalRequests: 0,
          pendingRequests: 0,
          reviewingRequests: 0,
          emergencyRequests: 0
        }
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as reviewing_requests,
        0 as emergency_requests
      FROM consent_requests
    `;

    const stats = await databaseManager.query(statsQuery);

    res.status(200).json({
      success: true,
      data: {
        totalRequests: parseInt(stats.rows[0]?.total_requests || '0'),
        pendingRequests: parseInt(stats.rows[0]?.pending_requests || '0'),
        reviewingRequests: parseInt(stats.rows[0]?.reviewing_requests || '0'),
        emergencyRequests: parseInt(stats.rows[0]?.emergency_requests || '0')
      }
    });
  } catch (error) {
    console.error('Get consent request stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch consent request statistics'
      }
    });
  }
};

/**
 * GET /api/admin/consent-requests/:id
 * Get consent request by ID
 */
export const getConsentRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    const requestQuery = `
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
      WHERE cr.id = $1
    `;

    const request = await databaseManager.query(requestQuery, [id]);

    if (request.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: request.rows[0]
    });
  } catch (error) {
    console.error('Get consent request by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch consent request'
      }
    });
  }
};

/**
 * PUT /api/admin/consent-requests/:id/approve
 * Approve consent request
 */
export const approveConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    const updateQuery = `
      UPDATE consent_requests 
      SET 
        status = 'approved',
        response_reason = $2,
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [id, notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Consent request approved successfully'
    });
  } catch (error) {
    console.error('Approve consent request error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve consent request'
      }
    });
  }
};

/**
 * PUT /api/admin/consent-requests/:id/reject
 * Reject consent request
 */
export const rejectConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    const updateQuery = `
      UPDATE consent_requests 
      SET 
        status = 'rejected',
        response_reason = $2,
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [id, reason]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Consent request rejected successfully'
    });
  } catch (error) {
    console.error('Reject consent request error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject consent request'
      }
    });
  }
};

/**
 * PUT /api/admin/consent-requests/:id/status
 * Update consent request status
 */
export const updateConsentRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    const updateQuery = `
      UPDATE consent_requests 
      SET 
        status = $2,
        response_reason = $3,
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [id, status, notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Consent request not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Consent request status updated successfully'
    });
  } catch (error) {
    console.error('Update consent request status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update consent request status'
      }
    });
  }
};
