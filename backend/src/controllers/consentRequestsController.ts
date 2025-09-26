import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Consent Requests Controller
 * จัดการคำขอ consent สำหรับการเข้าถึงข้อมูลผู้ป่วย
 */

/**
 * Get consent requests for a patient
 * GET /api/patients/{id}/consent-requests
 */
export const getPatientConsentRequests = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, status, requestType, startDate, endDate } = req.query;
    const user = (req as any).user;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientQuery.rows.length === 0) {
        // If no patient found by user_id, try by email
        patientQuery = await databaseManager.query(
          'SELECT id, first_name, last_name, user_id, email FROM patients WHERE email = $1',
          [user.email]
        );
      }
      
      if (patientQuery.rows.length === 0) {
        // If still no patient found, create a virtual patient record from user data
        patient = {
          id: user.id, // Use user ID as patient ID
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
        };
        actualPatientId = user.id;
      } else {
        patient = patientQuery.rows[0];
        actualPatientId = patient.id;
      }
    } else {
      // For doctors/admins, use the provided patient ID
      const patientResult = await databaseManager.query(
        'SELECT id, first_name, last_name, email FROM patients WHERE id = $1',
        [patientId]
      );
      patient = patientResult.rows[0];
      
      if (!patient) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      actualPatientId = patientId;
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Build query for consent requests
    let whereClause = 'WHERE cr.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (status) {
      whereClause += ' AND cr.status = $2';
      queryParams.push(status);
    }

    if (requestType) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND cr.request_type = $${paramIndex}`;
      queryParams.push(requestType);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND cr.requested_at >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND cr.requested_at <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get consent requests
    const consentRequestsQuery = `
      SELECT 
        cr.id,
        cr.request_type,
        cr.purpose,
        cr.data_types,
        cr.status,
        cr.requested_at,
        cr.expires_at,
        cr.responded_at,
        cr.response_reason,
        cr.created_at,
        cr.updated_at,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.role as requester_role,
        u.email as requester_email
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      ${whereClause}
      ORDER BY cr.requested_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const consentRequestsResult = await databaseManager.query(consentRequestsQuery, queryParams);
    const consentRequests = consentRequestsResult.rows;

    // Get total count for pagination
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
      WHERE cr.patient_id = $1
      GROUP BY status
      ORDER BY status
    `, [actualPatientId]);

    // Format consent requests
    const formattedConsentRequests = consentRequests.map(request => ({
      id: request.id,
      request_type: request.request_type,
      purpose: request.purpose,
      data_types: request.data_types,
      status: request.status,
      requested_at: request.requested_at,
      expires_at: request.expires_at,
      responded_at: request.responded_at,
      response_reason: request.response_reason,
      created_at: request.created_at,
      updated_at: request.updated_at,
      requester: {
        name: `${request.requester_first_name} ${request.requester_last_name}`,
        role: request.requester_role,
        email: request.requester_email
      },
      is_expired: request.expires_at ? new Date(request.expires_at) < new Date() : false
    }));

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        consent_requests: formattedConsentRequests,
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
        requestCount: formattedConsentRequests.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient consent requests:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Respond to consent request
 * POST /api/patients/{id}/consent-requests/{requestId}/respond
 */
export const respondToConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, requestId } = req.params;
    const { response, reason } = req.body;

    const userId = (req as any).user.id;

    // Validate consent request exists and belongs to patient
    const consentRequestExists = await databaseManager.query(`
      SELECT id, status, expires_at FROM consent_requests 
      WHERE id = $1 AND patient_id = $2
    `, [requestId, actualPatientId]);

    if (consentRequestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Consent request not found' },
        statusCode: 404
      });
    }

    const consentRequest = consentRequestExists.rows[0];

    // Check if request is already responded
    if (consentRequest.status !== 'pending') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Consent request has already been responded to' },
        statusCode: 400
      });
    }

    // Check if request is expired
    if (consentRequest.expires_at && new Date(consentRequest.expires_at) < new Date()) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Consent request has expired' },
        statusCode: 400
      });
    }

    // Validate response
    if (!response || !['approved', 'rejected'].includes(response)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Invalid response. Must be "approved" or "rejected"' },
        statusCode: 400
      });
    }

    // Update consent request
    await databaseManager.query(`
      UPDATE consent_requests 
      SET status = $1, responded_at = NOW() AT TIME ZONE 'Asia/Bangkok', response_reason = $2, updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = $3
    `, [response, reason, requestId]);

    // Get updated consent request
    const updatedConsentRequest = await databaseManager.query(`
      SELECT 
        cr.id, cr.request_type, cr.purpose, cr.data_types, cr.status,
        cr.requested_at, cr.expires_at, cr.responded_at, cr.response_reason,
        cr.updated_at,
        u.first_name as requester_first_name, u.last_name as requester_last_name
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      WHERE cr.id = $1
    `, [requestId]);

    // Create notification for requester
    if (response === 'approved') {
      await databaseManager.query(`
        INSERT INTO notifications (
          patient_id, title, message, notification_type, priority, 
          action_required, action_url, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        actualPatientId,
        'คำขอเข้าถึงข้อมูลได้รับการอนุมัติ',
        `คำขอเข้าถึงข้อมูลของคุณได้รับการอนุมัติแล้ว`,
        'consent_approved',
        'normal',
        true,
        '/consent-requests',
        userId
      ]);
    } else {
      await databaseManager.query(`
        INSERT INTO notifications (
          patient_id, title, message, notification_type, priority, 
          action_required, action_url, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        actualPatientId,
        'คำขอเข้าถึงข้อมูลถูกปฏิเสธ',
        `คำขอเข้าถึงข้อมูลของคุณถูกปฏิเสธ: ${reason || 'ไม่มีเหตุผลระบุ'}`,
        'consent_rejected',
        'normal',
        false,
        null,
        userId
      ]);
    }

    res.json({
      data: {
        consent_request: {
          ...updatedConsentRequest.rows[0],
          requester: {
            name: `${updatedConsentRequest.rows[0].requester_first_name} ${updatedConsentRequest.rows[0].requester_last_name}`
          }
        },
        message: `Consent request ${response} successfully`
      },
      meta: {
        timestamp: new Date().toISOString(),
        respondedBy: userId,
        response: response
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error responding to consent request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new consent request
 * POST /api/patients/{id}/consent-requests
 */
export const createConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      request_type,
      purpose,
      data_types,
      expires_in_days = 30
    } = req.body;

    const userId = (req as any).user.id;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Validate required fields
    if (!request_type || !purpose || !data_types || !Array.isArray(data_types)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: request_type, purpose, data_types' },
        statusCode: 400
      });
    }

    // Get a valid user ID if not provided
    let validUserId = userId;
    if (!validUserId || validUserId === '1') {
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
      validUserId = userResult.rows[0]?.id;
    }

    // Create consent request
    const consentRequestId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    await databaseManager.query(`
      INSERT INTO consent_requests (
        id, patient_id, requester_id, request_type, purpose, data_types, 
        status, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      consentRequestId, patientId, validUserId, request_type, purpose, data_types,
      'pending', expiresAt
    ]);

    // Create notification for patient
    await databaseManager.query(`
      INSERT INTO notifications (
        patient_id, title, message, notification_type, priority, 
        action_required, action_url, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      patientId,
      'คำขอเข้าถึงข้อมูลใหม่',
      `มีคำขอเข้าถึงข้อมูลของคุณ: ${purpose}`,
      'consent_request',
      'high',
      true,
      '/consent-requests',
      validUserId
    ]);

    // Get created consent request
    const createdConsentRequest = await databaseManager.query(`
      SELECT 
        cr.id, cr.request_type, cr.purpose, cr.data_types, cr.status,
        cr.requested_at, cr.expires_at, cr.created_at,
        u.first_name as requester_first_name, u.last_name as requester_last_name
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      WHERE cr.id = $1
    `, [consentRequestId]);

    res.status(201).json({
      data: {
        consent_request: {
          ...createdConsentRequest.rows[0],
          requester: {
            name: `${createdConsentRequest.rows[0].requester_first_name} ${createdConsentRequest.rows[0].requester_last_name}`
          }
        },
        message: 'Consent request created successfully'
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
    console.error('Error creating consent request:', error);
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
 * PUT /api/patients/{id}/consent-requests/{requestId}
 */
export const updateConsentRequest = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, requestId } = req.params;
    const {
      purpose,
      data_types,
      expires_in_days
    } = req.body;

    const userId = (req as any).user.id;

    // Validate consent request exists and belongs to patient
    const consentRequestExists = await databaseManager.query(`
      SELECT id, status FROM consent_requests 
      WHERE id = $1 AND patient_id = $2
    `, [requestId, actualPatientId]);

    if (consentRequestExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Consent request not found' },
        statusCode: 404
      });
    }

    const consentRequest = consentRequestExists.rows[0];

    // Check if request can be updated
    if (consentRequest.status !== 'pending') {
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
      updateFields.push(`data_types = $${paramCount++}`);
      updateValues.push(data_types);
    }

    if (expires_in_days !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
      updateFields.push(`expires_at = $${paramCount++}`);
      updateValues.push(expiresAt);
    }

    updateFields.push(`updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'`);
    updateValues.push(requestId);

    const updateQuery = `
      UPDATE consent_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated consent request
    const updatedConsentRequest = await databaseManager.query(`
      SELECT 
        cr.id, cr.request_type, cr.purpose, cr.data_types, cr.status,
        cr.requested_at, cr.expires_at, cr.updated_at,
        u.first_name as requester_first_name, u.last_name as requester_last_name
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      WHERE cr.id = $1
    `, [requestId]);

    res.json({
      data: {
        consent_request: {
          ...updatedConsentRequest.rows[0],
          requester: {
            name: `${updatedConsentRequest.rows[0].requester_first_name} ${updatedConsentRequest.rows[0].requester_last_name}`
          }
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
    console.error('Error updating consent request:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
