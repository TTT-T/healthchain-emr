import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * External Requesters Controller
 * จัดการคำขอข้อมูลจากองค์กรภายนอก
 */

/**
 * Create data request
 * POST /api/external-requesters/requests
 */
export const createDataRequest = async (req: Request, res: Response) => {
  try {
    const {
      requester_name,
      requester_organization,
      requester_email,
      requester_phone,
      request_type,
      requested_data_types,
      purpose,
      data_usage_period,
      consent_required,
      patient_ids,
      date_range_start,
      date_range_end,
      additional_requirements
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!requester_name || !requester_organization || !requester_email || !request_type || !purpose) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: requester_name, requester_organization, requester_email, request_type, purpose' },
        statusCode: 400
      });
    }

    // Validate request_type
    const validRequestTypes = ['patient_data', 'aggregated_statistics', 'research_data', 'audit_data'];
    if (!validRequestTypes.includes(request_type)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Invalid request_type. Must be one of: patient_data, aggregated_statistics, research_data, audit_data' },
        statusCode: 400
      });
    }

    // Create data request
    const createRequestQuery = `
      INSERT INTO external_data_requests (
        id, requester_name, requester_organization, requester_email, requester_phone,
        request_type, requested_data_types, purpose, data_usage_period,
        consent_required, patient_ids, date_range_start, date_range_end,
        additional_requirements, status, created_by, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const requestId = uuidv4();
    const requestResult = await databaseManager.query(createRequestQuery, [
      requestId,
      requester_name,
      requester_organization,
      requester_email,
      requester_phone,
      request_type,
      requested_data_types ? JSON.stringify(requested_data_types) : null,
      purpose,
      data_usage_period,
      consent_required !== undefined ? consent_required : true,
      patient_ids ? JSON.stringify(patient_ids) : null,
      date_range_start,
      date_range_end,
      additional_requirements,
      'pending',
      userId,
      new Date()
    ]);

    const newRequest = requestResult.rows[0];

    res.status(201).json({
      data: {
        request: {
          id: newRequest.id,
          requester_name: newRequest.requester_name,
          requester_organization: newRequest.requester_organization,
          requester_email: newRequest.requester_email,
          request_type: newRequest.request_type,
          purpose: newRequest.purpose,
          status: newRequest.status,
          created_at: newRequest.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        created_by: userId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating data request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get all data requests
 * GET /api/external-requesters/requests
 */
export const getAllDataRequests = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      request_type,
      requester_organization,
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
      whereClause += ` AND edr.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (request_type) {
      paramCount++;
      whereClause += ` AND edr.request_type = $${paramCount}`;
      queryParams.push(request_type);
    }

    if (requester_organization) {
      paramCount++;
      whereClause += ` AND edr.requester_organization ILIKE $${paramCount}`;
      queryParams.push(`%${requester_organization}%`);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'status', 'request_type', 'requester_organization'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get data requests with pagination
    const requestsQuery = `
      SELECT 
        edr.id,
        edr.requester_name,
        edr.requester_organization,
        edr.requester_email,
        edr.requester_phone,
        edr.request_type,
        edr.requested_data_types,
        edr.purpose,
        edr.data_usage_period,
        edr.consent_required,
        edr.patient_ids,
        edr.date_range_start,
        edr.date_range_end,
        edr.additional_requirements,
        edr.status,
        edr.approved_by,
        edr.approved_at,
        edr.rejected_reason,
        edr.created_at,
        edr.updated_at,
        u.first_name as created_by_name,
        u.last_name as created_by_last_name,
        approver.first_name as approved_by_name,
        approver.last_name as approved_by_last_name
      FROM external_data_requests edr
      LEFT JOIN users u ON edr.created_by = u.id
      LEFT JOIN users approver ON edr.approved_by = approver.id
      ${whereClause}
      ORDER BY edr.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const requestsResult = await databaseManager.query(requestsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM external_data_requests edr
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format response
    const formattedRequests = requestsResult.rows.map(request => ({
      id: request.id,
      requester: {
        name: request.requester_name,
        organization: request.requester_organization,
        email: request.requester_email,
        phone: request.requester_phone
      },
      request_details: {
        type: request.request_type,
        data_types: request.requested_data_types,
        purpose: request.purpose,
        usage_period: request.data_usage_period,
        consent_required: request.consent_required,
        patient_ids: request.patient_ids,
        date_range: {
          start: request.date_range_start,
          end: request.date_range_end
        },
        additional_requirements: request.additional_requirements
      },
      status: request.status,
      approval: {
        approved_by: request.approved_by ? {
          id: request.approved_by,
          name: `${request.approved_by_name} ${request.approved_by_last_name}`
        } : null,
        approved_at: request.approved_at,
        rejected_reason: request.rejected_reason
      },
      created_by: request.created_by ? {
        name: `${request.created_by_name} ${request.created_by_last_name}`
      } : null,
      created_at: request.created_at,
      updated_at: request.updated_at
    }));

    res.status(200).json({
      data: {
        requests: formattedRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestCount: formattedRequests.length,
        filters: {
          status,
          request_type,
          requester_organization,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting all data requests:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get data request by ID
 * GET /api/external-requesters/requests/{id}
 */
export const getDataRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const requestQuery = `
      SELECT 
        edr.id,
        edr.requester_name,
        edr.requester_organization,
        edr.requester_email,
        edr.requester_phone,
        edr.request_type,
        edr.requested_data_types,
        edr.purpose,
        edr.data_usage_period,
        edr.consent_required,
        edr.patient_ids,
        edr.date_range_start,
        edr.date_range_end,
        edr.additional_requirements,
        edr.status,
        edr.approved_by,
        edr.approved_at,
        edr.rejected_reason,
        edr.created_at,
        edr.updated_at,
        u.first_name as created_by_name,
        u.last_name as created_by_last_name,
        approver.first_name as approved_by_name,
        approver.last_name as approved_by_last_name
      FROM external_data_requests edr
      LEFT JOIN users u ON edr.created_by = u.id
      LEFT JOIN users approver ON edr.approved_by = approver.id
      WHERE edr.id = $1
    `;

    const requestResult = await databaseManager.query(requestQuery, [id]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Data request not found' },
        statusCode: 404
      });
    }

    const request = requestResult.rows[0];

    // Get related consent requests if any
    const consentRequests = await databaseManager.query(`
      SELECT id, patient_id, status, created_at
      FROM consent_requests 
      WHERE external_request_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.status(200).json({
      data: {
        request: {
          id: request.id,
          requester: {
            name: request.requester_name,
            organization: request.requester_organization,
            email: request.requester_email,
            phone: request.requester_phone
          },
          request_details: {
            type: request.request_type,
            data_types: request.requested_data_types,
            purpose: request.purpose,
            usage_period: request.data_usage_period,
            consent_required: request.consent_required,
            patient_ids: request.patient_ids,
            date_range: {
              start: request.date_range_start,
              end: request.date_range_end
            },
            additional_requirements: request.additional_requirements
          },
          status: request.status,
          approval: {
            approved_by: request.approved_by ? {
              id: request.approved_by,
              name: `${request.approved_by_name} ${request.approved_by_last_name}`
            } : null,
            approved_at: request.approved_at,
            rejected_reason: request.rejected_reason
          },
          created_by: request.created_by ? {
            name: `${request.created_by_name} ${request.created_by_last_name}`
          } : null,
          consent_requests: consentRequests.rows,
          created_at: request.created_at,
          updated_at: request.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting data request by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update data request
 * PUT /api/external-requesters/requests/{id}
 */
export const updateDataRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if request exists
    const requestExists = await databaseManager.query('SELECT id, status FROM external_data_requests WHERE id = $1', [id]);
    if (requestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Data request not found' },
        statusCode: 404
      });
    }

    const existingRequest = requestExists.rows[0];

    // Prevent updating approved/rejected requests
    if (existingRequest.status === 'approved' || existingRequest.status === 'rejected') {
      return res.status(403).json({
        data: null,
        meta: null,
        error: { message: 'Cannot update approved or rejected requests' },
        statusCode: 403
      });
    }

    // Build update query
    const allowedFields = [
      'requester_name', 'requester_organization', 'requester_email', 'requester_phone',
      'request_type', 'requested_data_types', 'purpose', 'data_usage_period',
      'consent_required', 'patient_ids', 'date_range_start', 'date_range_end',
      'additional_requirements'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        if (key === 'requested_data_types' || key === 'patient_ids') {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'No valid fields to update' },
        statusCode: 400
      });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add request ID for WHERE clause
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE external_data_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedRequest = updateResult.rows[0];

    res.status(200).json({
      data: {
        request: {
          id: updatedRequest.id,
          requester_name: updatedRequest.requester_name,
          requester_organization: updatedRequest.requester_organization,
          requester_email: updatedRequest.requester_email,
          request_type: updatedRequest.request_type,
          purpose: updatedRequest.purpose,
          status: updatedRequest.status,
          updated_at: updatedRequest.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating data request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Approve data request
 * POST /api/external-requesters/requests/{id}/approve
 */
export const approveDataRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approval_notes } = req.body;
    const userId = (req as any).user.id;

    // Check if request exists
    const requestExists = await databaseManager.query('SELECT id, status FROM external_data_requests WHERE id = $1', [id]);
    if (requestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Data request not found' },
        statusCode: 404
      });
    }

    const existingRequest = requestExists.rows[0];

    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Request is not in pending status' },
        statusCode: 400
      });
    }

    // Update request status
    const approveQuery = `
      UPDATE external_data_requests 
      SET status = 'approved', approved_by = $1, approved_at = $2, approval_notes = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `;

    const approveResult = await databaseManager.query(approveQuery, [
      userId,
      new Date(),
      approval_notes,
      new Date(),
      id
    ]);

    const approvedRequest = approveResult.rows[0];

    res.status(200).json({
      data: {
        request: {
          id: approvedRequest.id,
          status: approvedRequest.status,
          approved_by: userId,
          approved_at: approvedRequest.approved_at,
          approval_notes: approvedRequest.approval_notes
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        approved_by: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error approving data request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Reject data request
 * POST /api/external-requesters/requests/{id}/reject
 */
export const rejectDataRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = (req as any).user.id;

    // Validate required fields
    if (!rejection_reason) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'rejection_reason is required' },
        statusCode: 400
      });
    }

    // Check if request exists
    const requestExists = await databaseManager.query('SELECT id, status FROM external_data_requests WHERE id = $1', [id]);
    if (requestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Data request not found' },
        statusCode: 404
      });
    }

    const existingRequest = requestExists.rows[0];

    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Request is not in pending status' },
        statusCode: 400
      });
    }

    // Update request status
    const rejectQuery = `
      UPDATE external_data_requests 
      SET status = 'rejected', approved_by = $1, approved_at = $2, rejected_reason = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `;

    const rejectResult = await databaseManager.query(rejectQuery, [
      userId,
      new Date(),
      rejection_reason,
      new Date(),
      id
    ]);

    const rejectedRequest = rejectResult.rows[0];

    res.status(200).json({
      data: {
        request: {
          id: rejectedRequest.id,
          status: rejectedRequest.status,
          approved_by: userId,
          approved_at: rejectedRequest.approved_at,
          rejected_reason: rejectedRequest.rejected_reason
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        rejected_by: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error rejecting data request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
