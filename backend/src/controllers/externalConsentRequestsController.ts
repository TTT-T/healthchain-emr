import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '../services/emailService';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

/**
 * External Consent Requests Controller
 * จัดการคำขอ consent จาก external requesters ไปยังผู้ป่วย
 */

/**
 * Create consent request from external requester to patient
 * POST /api/external-requesters/consent-requests
 */
export const createExternalConsentRequest = async (req: Request, res: Response) => {
  try {
    const {
      patient_id,
      request_type,
      purpose,
      data_types,
      urgency_level = 'normal',
      expires_in_days = 30,
      additional_notes
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!patient_id || !request_type || !purpose || !data_types || !Array.isArray(data_types)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: patient_id, request_type, purpose, data_types' },
        statusCode: 400
      });
    }

    // Validate request_type
    const validRequestTypes = ['patient_data', 'medical_records', 'lab_results', 'prescriptions', 'appointments', 'research_data'];
    if (!validRequestTypes.includes(request_type)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Invalid request_type' },
        statusCode: 400
      });
    }

    // Get external requester info
    const externalRequesterResult = await databaseManager.query(`
      SELECT 
        edr.requester_name,
        edr.requester_organization,
        edr.requester_email,
        edr.organization_type,
        u.first_name,
        u.last_name
      FROM external_data_requests edr
      JOIN users u ON edr.created_by = u.id
      WHERE edr.created_by = $1 AND edr.request_type = 'organization_registration'
      ORDER BY edr.created_at DESC
      LIMIT 1
    `, [userId]);

    if (externalRequesterResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'External requester not found or not registered' },
        statusCode: 404
      });
    }

    const externalRequester = externalRequesterResult.rows[0];

    // Get patient info
    const patientResult = await databaseManager.query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_first_name,
        p.email,
        p.phone,
        u.email as user_email
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [patient_id]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    // Create consent request
    const consentRequestId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    const createConsentRequestQuery = `
      INSERT INTO consent_requests (
        id, request_id, requester_name, requester_type, patient_name, patient_hn,
        request_type, requested_data_types, purpose, urgency_level, status,
        expires_at, is_compliant, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const requestId = `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const patientName = patient.thai_first_name || `${patient.first_name} ${patient.last_name}`;
    const requesterType = externalRequester.organization_type || 'external_organization';

    const consentRequestResult = await databaseManager.query(createConsentRequestQuery, [
      consentRequestId,
      requestId,
      externalRequester.requester_name,
      requesterType,
      patientName,
      patient.id, // Using patient ID as HN for now
      request_type,
      data_types,
      purpose,
      urgency_level,
      'pending',
      expiresAt,
      true,
      userId
    ]);

    const newConsentRequest = consentRequestResult.rows[0];

    // Send comprehensive notification to patient using NotificationService
    try {
      await NotificationService.sendConsentRequestNotification({
        patientId: patient_id,
        patientHn: patient.hn || 'N/A',
        patientName: patientName,
        patientPhone: patient.phone,
        patientEmail: patient.user_email || patient.email,
        requesterName: externalRequester.requester_name || 'External Requester',
        requesterOrganization: externalRequester.requester_organization,
        requestType: request_type,
        purpose: purpose,
        consentRequestId: consentRequestId,
        expiresAt: expiresAt,
        createdBy: userId
      });
      
      logger.info(`📧 Consent request notification sent to patient: ${patient.user_email || patient.email}`);
    } catch (notificationError) {
      logger.error('❌ Failed to send consent request notification:', notificationError);
      // Don't fail the request if notification sending fails
    }

    res.status(201).json({
      data: {
        consent_request: {
          id: newConsentRequest.id,
          request_id: newConsentRequest.request_id,
          requester_name: newConsentRequest.requester_name,
          requester_organization: externalRequester.requester_organization,
          patient_name: newConsentRequest.patient_name,
          request_type: newConsentRequest.request_type,
          purpose: newConsentRequest.purpose,
          data_types: newConsentRequest.requested_data_types,
          urgency_level: newConsentRequest.urgency_level,
          status: newConsentRequest.status,
          expires_at: newConsentRequest.expires_at,
          created_at: newConsentRequest.created_at
        },
        message: 'Consent request created successfully and notification sent to patient'
      },
      meta: {
        timestamp: new Date().toISOString(),
        consentRequestId: consentRequestId,
        expiresAt: expiresAt
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating external consent request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get consent requests created by external requester
 * GET /api/external-requesters/consent-requests
 */
export const getExternalConsentRequests = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      request_type,
      urgency_level,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const userId = (req as any).user.id;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE cr.created_by = $1';
    const queryParams: any[] = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND cr.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (request_type) {
      paramCount++;
      whereClause += ` AND cr.request_type = $${paramCount}`;
      queryParams.push(request_type);
    }

    if (urgency_level) {
      paramCount++;
      whereClause += ` AND cr.urgency_level = $${paramCount}`;
      queryParams.push(urgency_level);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'status', 'request_type', 'urgency_level', 'expires_at'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get consent requests
    const requestsQuery = `
      SELECT 
        cr.id,
        cr.request_id,
        cr.requester_name,
        cr.requester_type,
        cr.patient_name,
        cr.patient_hn,
        cr.request_type,
        cr.requested_data_types,
        cr.purpose,
        cr.urgency_level,
        cr.status,
        cr.created_at,
        cr.expires_at,
        cr.updated_at,
        cr.is_compliant,
        cr.compliance_notes
      FROM consent_requests cr
      ${whereClause}
      ORDER BY cr.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const requestsResult = await databaseManager.query(requestsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM consent_requests cr
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get status summary
    const statusSummary = await databaseManager.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM consent_requests cr
      WHERE cr.created_by = $1
      GROUP BY status
      ORDER BY status
    `, [userId]);

    // Format consent requests
    const formattedRequests = requestsResult.rows.map(request => ({
      id: request.id,
      request_id: request.request_id,
      requester_name: request.requester_name,
      requester_type: request.requester_type,
      patient_name: request.patient_name,
      patient_hn: request.patient_hn,
      request_type: request.request_type,
      data_types: request.requested_data_types,
      purpose: request.purpose,
      urgency_level: request.urgency_level,
      status: request.status,
      created_at: request.created_at,
      expires_at: request.expires_at,
      updated_at: request.updated_at,
      is_compliant: request.is_compliant,
      compliance_notes: request.compliance_notes,
      is_expired: request.expires_at ? new Date(request.expires_at) < new Date() : false
    }));

    res.json({
      data: {
        consent_requests: formattedRequests,
        status_summary: statusSummary.rows,
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
          urgency_level,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting external consent requests:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get consent request by ID
 * GET /api/external-requesters/consent-requests/{id}
 */
export const getExternalConsentRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const requestQuery = `
      SELECT 
        cr.id,
        cr.request_id,
        cr.requester_name,
        cr.requester_type,
        cr.patient_name,
        cr.patient_hn,
        cr.request_type,
        cr.requested_data_types,
        cr.purpose,
        cr.urgency_level,
        cr.status,
        cr.created_at,
        cr.expires_at,
        cr.updated_at,
        cr.is_compliant,
        cr.compliance_notes
      FROM consent_requests cr
      WHERE cr.id = $1 AND cr.created_by = $2
    `;

    const requestResult = await databaseManager.query(requestQuery, [id, userId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Consent request not found' },
        statusCode: 404
      });
    }

    const request = requestResult.rows[0];

    res.json({
      data: {
        consent_request: {
          id: request.id,
          request_id: request.request_id,
          requester_name: request.requester_name,
          requester_type: request.requester_type,
          patient_name: request.patient_name,
          patient_hn: request.patient_hn,
          request_type: request.request_type,
          data_types: request.requested_data_types,
          purpose: request.purpose,
          urgency_level: request.urgency_level,
          status: request.status,
          created_at: request.created_at,
          expires_at: request.expires_at,
          updated_at: request.updated_at,
          is_compliant: request.is_compliant,
          compliance_notes: request.compliance_notes,
          is_expired: request.expires_at ? new Date(request.expires_at) < new Date() : false
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting external consent request by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update consent request
 * PUT /api/external-requesters/consent-requests/{id}
 */
export const updateExternalConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      purpose,
      data_types,
      expires_in_days,
      additional_notes
    } = req.body;

    const userId = (req as any).user.id;

    // Check if consent request exists and belongs to user
    const requestExists = await databaseManager.query(`
      SELECT id, status FROM consent_requests 
      WHERE id = $1 AND created_by = $2
    `, [id, userId]);

    if (requestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Consent request not found' },
        statusCode: 404
      });
    }

    const existingRequest = requestExists.rows[0];

    // Check if request can be updated
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Only pending consent requests can be updated' },
        statusCode: 400
      });
    }

    // Update consent request
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (purpose !== undefined) {
      updateFields.push(`purpose = $${paramCount++}`);
      updateValues.push(purpose);
    }

    if (data_types !== undefined) {
      updateFields.push(`requested_data_types = $${paramCount++}`);
      updateValues.push(data_types);
    }

    if (expires_in_days !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
      updateFields.push(`expires_at = $${paramCount++}`);
      updateValues.push(expiresAt);
    }

    if (additional_notes !== undefined) {
      updateFields.push(`compliance_notes = $${paramCount++}`);
      updateValues.push(additional_notes);
    }

    updateFields.push(`updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE consent_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated consent request
    const updatedRequest = await databaseManager.query(`
      SELECT 
        cr.id, cr.request_id, cr.requester_name, cr.patient_name,
        cr.request_type, cr.purpose, cr.requested_data_types, cr.status,
        cr.created_at, cr.expires_at, cr.updated_at, cr.compliance_notes
      FROM consent_requests cr
      WHERE cr.id = $1
    `, [id]);

    res.json({
      data: {
        consent_request: {
          ...updatedRequest.rows[0],
          data_types: updatedRequest.rows[0].requested_data_types
        },
        message: 'Consent request updated successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating external consent request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Cancel consent request
 * DELETE /api/external-requesters/consent-requests/{id}
 */
export const cancelExternalConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if consent request exists and belongs to user
    const requestExists = await databaseManager.query(`
      SELECT id, status FROM consent_requests 
      WHERE id = $1 AND created_by = $2
    `, [id, userId]);

    if (requestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Consent request not found' },
        statusCode: 404
      });
    }

    const existingRequest = requestExists.rows[0];

    // Check if request can be cancelled
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Only pending consent requests can be cancelled' },
        statusCode: 400
      });
    }

    // Update status to cancelled
    await databaseManager.query(`
      UPDATE consent_requests 
      SET status = 'cancelled', updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = $1
    `, [id]);

    res.json({
      data: {
        message: 'Consent request cancelled successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        cancelledBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error cancelling external consent request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
