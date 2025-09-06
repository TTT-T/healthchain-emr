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
 * Search patients for data request
 * GET /api/external-requesters/search/patients
 */
export const searchPatientsForRequest = async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      age_min, 
      age_max, 
      gender, 
      diagnosis,
      date_range_start,
      date_range_end,
      limit = 50
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Search by name or HN
    if (query) {
      paramCount++;
      whereClause += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.hn ILIKE $${paramCount})`;
      queryParams.push(`%${query}%`);
    }

    // Age range filter
    if (age_min) {
      paramCount++;
      whereClause += ` AND p.age >= $${paramCount}`;
      queryParams.push(parseInt(age_min as string));
    }

    if (age_max) {
      paramCount++;
      whereClause += ` AND p.age <= $${paramCount}`;
      queryParams.push(parseInt(age_max as string));
    }

    // Gender filter
    if (gender) {
      paramCount++;
      whereClause += ` AND p.gender = $${paramCount}`;
      queryParams.push(gender);
    }

    // Diagnosis filter
    if (diagnosis) {
      paramCount++;
      whereClause += ` AND EXISTS (
        SELECT 1 FROM medical_records mr 
        WHERE mr.patient_id = p.id 
        AND mr.diagnosis ILIKE $${paramCount}
      )`;
      queryParams.push(`%${diagnosis}%`);
    }

    // Date range filter
    if (date_range_start) {
      paramCount++;
      whereClause += ` AND p.created_at >= $${paramCount}`;
      queryParams.push(date_range_start);
    }

    if (date_range_end) {
      paramCount++;
      whereClause += ` AND p.created_at <= $${paramCount}`;
      queryParams.push(date_range_end);
    }

    const searchQuery = `
      SELECT 
        p.id,
        p.hn,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.age,
        p.gender,
        p.created_at,
        COUNT(mr.id) as record_count
      FROM patients p
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      ${whereClause}
      GROUP BY p.id, p.hn, p.first_name, p.last_name, p.thai_name, p.age, p.gender, p.created_at
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit as string));
    const result = await databaseManager.query(searchQuery, queryParams);

    const patients = result.rows.map(patient => ({
      id: patient.id,
      hn: patient.hn,
      name: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
      age: patient.age,
      gender: patient.gender,
      recordCount: parseInt(patient.record_count),
      createdAt: patient.created_at
    }));

    res.status(200).json({
      data: {
        patients,
        total: patients.length
      },
      meta: {
        timestamp: new Date().toISOString(),
        searchParams: {
          query,
          age_min,
          age_max,
          gender,
          diagnosis,
          date_range_start,
          date_range_end
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Generate data request report
 * GET /api/external-requesters/reports/{requestId}
 */
export const generateDataRequestReport = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { format = 'json' } = req.query;

    // Get data request details
    const requestResult = await databaseManager.query(`
      SELECT * FROM external_data_requests WHERE id = $1
    `, [requestId]);

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Data request not found' },
        statusCode: 404
      });
    }

    const request = requestResult.rows[0];

    // Get patient data based on request criteria
    let patientQuery = `
      SELECT 
        p.id,
        p.hn,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.age,
        p.gender,
        p.phone,
        p.email,
        p.created_at
      FROM patients p
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

    // Filter by patient IDs if specified
    if (request.patient_ids) {
      const patientIds = JSON.parse(request.patient_ids);
      if (patientIds.length > 0) {
        paramCount++;
        patientQuery += ` AND p.id = ANY($${paramCount})`;
        queryParams.push(patientIds);
      }
    }

    // Filter by date range if specified
    if (request.date_range_start) {
      paramCount++;
      patientQuery += ` AND p.created_at >= $${paramCount}`;
      queryParams.push(request.date_range_start);
    }

    if (request.date_range_end) {
      paramCount++;
      patientQuery += ` AND p.created_at <= $${paramCount}`;
      queryParams.push(request.date_range_end);
    }

    patientQuery += ` ORDER BY p.created_at DESC`;

    const patientsResult = await databaseManager.query(patientQuery, queryParams);

    // Get medical records for these patients
    const patientIds = patientsResult.rows.map(p => p.id);
    let medicalRecords: any[] = [];

    if (patientIds.length > 0) {
      const recordsResult = await databaseManager.query(`
        SELECT 
          mr.*,
          p.hn,
          p.first_name,
          p.last_name,
          p.thai_name
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.id
        WHERE mr.patient_id = ANY($1)
        ORDER BY mr.created_at DESC
      `, [patientIds]);

      medicalRecords = recordsResult.rows;
    }

    // Generate report data
    const reportData = {
      request: {
        id: request.id,
        requester_name: request.requester_name,
        requester_organization: request.requester_organization,
        request_type: request.request_type,
        purpose: request.purpose,
        status: request.status,
        created_at: request.created_at
      },
      summary: {
        total_patients: patientsResult.rows.length,
        total_records: medicalRecords.length,
        date_range: {
          start: request.date_range_start,
          end: request.date_range_end
        }
      },
      patients: patientsResult.rows.map(patient => ({
        id: patient.id,
        hn: patient.hn,
        name: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        created_at: patient.created_at
      })),
      medical_records: medicalRecords.map(record => ({
        id: record.id,
        patient_hn: record.hn,
        patient_name: record.thai_name || `${record.first_name} ${record.last_name}`,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        created_at: record.created_at
      }))
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = generateCSVReport(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="data_request_${requestId}.csv"`);
      res.send(csvData);
    } else {
      // Return JSON format
      res.status(200).json({
        data: reportData,
        meta: {
          timestamp: new Date().toISOString(),
          format: 'json',
          generated_by: (req as any).user?.id
        },
        error: null,
        statusCode: 200
      });
    }

  } catch (error) {
    console.error('Error generating data request report:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get external requesters dashboard overview
 * GET /api/external-requesters/dashboard/overview
 */
export const getExternalRequestersDashboardOverview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get total requests count
    const totalRequestsResult = await databaseManager.query(`
      SELECT COUNT(*) as total
      FROM external_data_requests
    `);

    // Get requests by status
    const requestsByStatusResult = await databaseManager.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM external_data_requests
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get requests by type
    const requestsByTypeResult = await databaseManager.query(`
      SELECT 
        request_type,
        COUNT(*) as count
      FROM external_data_requests
      GROUP BY request_type
      ORDER BY count DESC
    `);

    // Get recent requests
    const recentRequestsResult = await databaseManager.query(`
      SELECT 
        edr.*,
        u.first_name as created_by_name,
        u.last_name as created_by_last_name
      FROM external_data_requests edr
      LEFT JOIN users u ON edr.created_by = u.id
      ORDER BY edr.created_at DESC
      LIMIT 10
    `);

    // Get requests by organization
    const requestsByOrganizationResult = await databaseManager.query(`
      SELECT 
        requester_organization,
        COUNT(*) as count
      FROM external_data_requests
      GROUP BY requester_organization
      ORDER BY count DESC
      LIMIT 10
    `);

    const dashboardData = {
      summary: {
        totalRequests: parseInt(totalRequestsResult.rows[0].total),
        requestsByStatus: requestsByStatusResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        requestsByType: requestsByTypeResult.rows.map(row => ({
          type: row.request_type,
          count: parseInt(row.count)
        }))
      },
      recentRequests: recentRequestsResult.rows.map(request => ({
        id: request.id,
        requesterName: request.requester_name,
        requesterOrganization: request.requester_organization,
        requestType: request.request_type,
        purpose: request.purpose,
        status: request.status,
        createdAt: request.created_at,
        createdBy: request.created_by_name && request.created_by_last_name 
          ? `${request.created_by_name} ${request.created_by_last_name}` 
          : 'System'
      })),
      topOrganizations: requestsByOrganizationResult.rows.map(row => ({
        organization: row.requester_organization,
        count: parseInt(row.count)
      }))
    };

    res.status(200).json({
      data: dashboardData,
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting external requesters dashboard overview:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Generate CSV report helper function
 */
function generateCSVReport(reportData: any): string {
  const headers = [
    'Patient ID',
    'HN',
    'Name',
    'Age',
    'Gender',
    'Phone',
    'Email',
    'Created At',
    'Record ID',
    'Diagnosis',
    'Treatment',
    'Record Created At'
  ];

  const rows: string[] = [headers.join(',')];

  reportData.patients.forEach((patient: any) => {
    const patientRecords = reportData.medical_records.filter((record: any) => 
      record.patient_hn === patient.hn
    );

    if (patientRecords.length === 0) {
      // Patient with no records
      rows.push([
        patient.id,
        patient.hn,
        `"${patient.name}"`,
        patient.age,
        patient.gender,
        patient.phone || '',
        patient.email || '',
        patient.created_at,
        '',
        '',
        '',
        ''
      ].join(','));
    } else {
      // Patient with records
      patientRecords.forEach((record: any) => {
        rows.push([
          patient.id,
          patient.hn,
          `"${patient.name}"`,
          patient.age,
          patient.gender,
          patient.phone || '',
          patient.email || '',
          patient.created_at,
          record.id,
          `"${record.diagnosis || ''}"`,
          `"${record.treatment || ''}"`,
          record.created_at
        ].join(','));
      });
    }
  });

  return rows.join('\n');
}

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
