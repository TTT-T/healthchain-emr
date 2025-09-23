import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

/**
 * Lab Results Controller
 * จัดการข้อมูลผลตรวจแลปของผู้ป่วย
 */

/**
 * Get lab results for a patient
 * GET /api/patients/{id}/lab-results
 */
export const getPatientLabResults = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, Category, startDate, endDate, status } = req.query;
    const user = (req as any).user;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = `
        SELECT p.*, u.first_name, u.last_name, u.email
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE u.id = $1
      `;
      let patientResult = await databaseManager.query(patientQuery, [user.id]);
      
      // If no patient found with user_id, try to find by email (fallback for old schema)
      if (patientResult.rows.length === 0) {
        patientQuery = `
          SELECT p.*, u.first_name, u.last_name, u.email
          FROM patients p
          JOIN users u ON p.email = u.email
          WHERE u.id = $1 AND u.role = 'patient'
        `;
        patientResult = await databaseManager.query(patientQuery, [user.id]);
      }
      
      // If still no patient found, do not create one automatically
      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { 
            message: 'Patient record not found. Please register through EMR system at /emr/register-patient',
            code: 'PATIENT_NOT_REGISTERED'
          },
          statusCode: 404
        });
      } else {
        patient = patientResult.rows[0];
      }
      
      actualPatientId = patient.id;
    } else {
      // For doctors/nurses/admins, they can access any patient
      actualPatientId = patientId;
      
      // Verify patient exists
      let patientQuery = `
        SELECT p.*, u.first_name, u.last_name, u.email
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
      let patientResult = await databaseManager.query(patientQuery, [patientId]);
      
      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      
      patient = patientResult.rows[0];
    }
    
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for lab results from medical_records
    let whereClause = 'WHERE mr.patient_id = $1 AND mr.record_type = \'lab_result\'';
    const queryParams: any[] = [actualPatientId];

    if (Category) {
      whereClause += ` AND mr._type ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${Category}%`);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND mr.recorded_time >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND mr.recorded_time <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    if (status) {
      whereClause += ` AND mr.overall_result = $${queryParams.length + 1}`;
      queryParams.push(status);
    }

    // Get lab results from medical_records
    const labResultsQuery = `
      SELECT 
        mr.id as lab_result_id,
        mr._type,
        mr._name,
        mr._results,
        mr.overall_result,
        mr.interpretation,
        mr.recommendations,
        mr.attachments,
        mr.notes,
        mr.recorded_time as result_date,
        mr.recorded_by,
        mr.created_at,
        mr.updated_at,
        u.first_name as ed_by_first_name,
        u.last_name as ed_by_last_name,
        v.visit_number,
        v.visit_date,
        v.diagnosis
      FROM medical_records mr
      LEFT JOIN users u ON mr.recorded_by = u.id
      LEFT JOIN visits v ON mr.visit_id = v.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'lab_result'
      ORDER BY mr.recorded_time DESC, mr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);
    const labResultsResult = await databaseManager.query(labResultsQuery, queryParams);
    const labResults = labResultsResult.rows;
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM medical_records mr
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format lab results from medical_records
    const formattedResults = labResults.map((result: any) => {
      // Parse _results JSON
      let Results = [];
      if (result._results) {
        try {
          if (typeof result._results === 'string') {
            Results = JSON.parse(result._results);
          } else if (Array.isArray(result._results)) {
            Results = result._results;
          } else if (typeof result._results === 'object') {
            Results = [result._results];
          }
        } catch (error) {
          console.error('Error parsing _results JSON:', error);
          Results = [];
        }
      }

      // Parse attachments JSON
      let attachments = [];
      if (result.attachments) {
        try {
          if (typeof result.attachments === 'string') {
            attachments = JSON.parse(result.attachments);
          } else if (Array.isArray(result.attachments)) {
            attachments = result.attachments;
          } else if (typeof result.attachments === 'object') {
            attachments = [result.attachments];
          }
        } catch (error) {
          console.error('Error parsing attachments JSON:', error);
          attachments = [];
        }
      }

      return {
        id: result.lab_result_id,
        _type: result._type,
        _name: result._name,
        _results: Results,
        overall_result: result.overall_result,
        interpretation: result.interpretation,
        recommendations: result.recommendations,
        attachments: attachments,
        notes: result.notes,
        result_date: result.result_date,
        ed_by: {
          name: `${result.ed_by_first_name || ''} ${result.ed_by_last_name || ''}`.trim() || 'ไม่ระบุ'
        },
        visit: {
          number: result.visit_number || 'ไม่ระบุ',
          date: result.visit_date || result.result_date,
          diagnosis: result.diagnosis || 'ไม่ระบุ'
        },
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    });
    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        lab_results: formattedResults,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        resultCount: formattedResults.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient lab results:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get specific lab result
 * GET /api/patients/{id}/lab-results/{resultId}
 */
export const getPatientLabResult = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, resultId } = req.params;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [actualPatientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Get specific lab result
    const labResultQuery = `
      SELECT 
        lr.id as result_id,
        lr.result_value,
        lr.result_numeric,
        lr.result_unit,
        lr.reference_range,
        lr.reference_min,
        lr.reference_max,
        lr.abnormal_flag,
        lr.interpretation,
        lr.validated,
        lr.validated_by,
        lr.validated_at,
        lr.result_date,
        lr.result_time,
        lr.reported_at,
        lr.method,
        lr.instrument,
        lr.technician_notes,
        lr.pathologist_notes,
        lo.id as lab_order_id,
        lo.order_number,
        lo.order_date,
        lo._name,
        lo._category,
        lo.clinical_indication,
        u1.first_name as ordered_by_first_name,
        u1.last_name as ordered_by_last_name,
        u2.first_name as validated_by_first_name,
        u2.last_name as validated_by_last_name
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      LEFT JOIN users u1 ON lo.ordered_by = u1.id
      LEFT JOIN users u2 ON lr.validated_by = u2.id
      WHERE lr.id = $1 AND lo.patient_id = $2
    `;

    const result = await databaseManager.query(labResultQuery, [resultId, actualPatientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Lab result not found' },
        statusCode: 404
      });
    }

    const labResult = result.rows[0];

    res.json({
      data: {
        patient: {
          id: actualPatientId,
          name: `${patientExists.rows[0].first_name} ${patientExists.rows[0].last_name}`
        },
        lab_result: {
          id: labResult.result_id,
          result_value: labResult.result_value,
          result_numeric: labResult.result_numeric,
          result_unit: labResult.result_unit,
          reference_range: labResult.reference_range,
          reference_min: labResult.reference_min,
          reference_max: labResult.reference_max,
          abnormal_flag: labResult.abnormal_flag,
          interpretation: labResult.interpretation,
          validated: labResult.validated,
          validated_by: labResult.validated_by ? {
            name: `${labResult.validated_by_first_name} ${labResult.validated_by_last_name}`
          } : null,
          validated_at: labResult.validated_at,
          result_date: labResult.result_date,
          result_time: labResult.result_time,
          reported_at: labResult.reported_at,
          method: labResult.method,
          instrument: labResult.instrument,
          technician_notes: labResult.technician_notes,
          pathologist_notes: labResult.pathologist_notes,
          lab_order: {
            id: labResult.lab_order_id,
            order_number: labResult.order_number,
            order_date: labResult.order_date,
            _name: labResult._name,
            _category: labResult._category,
            clinical_indication: labResult.clinical_indication,
            ordered_by: {
              name: `${labResult.ordered_by_first_name} ${labResult.ordered_by_last_name}`
            }
          }
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient lab result:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new lab result
 * POST /api/patients/{id}/lab-results
 */
export const createPatientLabResult = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      Type,
      Name,
      Results,
      overallResult,
      interpretation,
      recommendations,
      attachments,
      edBy,
      edTime,
      notes
    } = req.body;

    const userId = (req as any).user.id;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name, thai_name, hospital_number FROM patients WHERE id = $1',
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

    const patient = patientExists.rows[0];

    // Create lab result in medical_records table
    const resultId = uuidv4();

    await databaseManager.query(`
      INSERT INTO medical_records (
        id, patient_id, record_type, _type, _name, _results,
        overall_result, interpretation, recommendations, attachments,
        notes, recorded_by, recorded_time, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `, [
      resultId, patientId, 'lab_result', Type, Name, JSON.stringify(Results || []),
      overallResult, interpretation, recommendations, JSON.stringify(attachments || []),
      notes, userId, edTime || new Date().toISOString()
    ]);

    // Get created lab result
    const createdResult = await databaseManager.query(`
      SELECT 
        mr.id, mr.patient_id, mr.record_type, mr._type, mr._name,
        mr._results, mr.overall_result, mr.interpretation, mr.recommendations,
        mr.attachments, mr.notes, mr.recorded_by, mr.recorded_time,
        mr.created_at, mr.updated_at,
        p.thai_name, p.hospital_number, p.national_id
      FROM medical_records mr
      INNER JOIN patients p ON mr.patient_id = p.id
      WHERE mr.id = $1
    `, [resultId]);

    const record = createdResult.rows[0];

    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      const user = (req as any).user;
      
      await NotificationService.sendPatientNotification({
        patientId: patient.id,
        patientHn: patient.hospital_number || '',
        patientName: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        notificationType: 'lab_result_ready',
        title: `ผลแลบพร้อม: ${Name}`,
        message: `ผลการตรวจ "${Name}" ของคุณ ${patient.thai_name || patient.first_name} พร้อมแล้ว`,
        recordType: 'lab_result',
        recordId: resultId,
        createdBy: user?.id,
        createdByName: user?.thai_name || `${user?.first_name} ${user?.last_name}`,
        metadata: {
          Type,
          Name,
          overallResult,
          edTime: edTime || new Date().toISOString()
        }
      });
    } catch (notificationError) {
      logger.error('Failed to send lab result notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างผลแลบ
    }

    res.status(201).json({
      data: {
        id: record.id,
        patientId: record.patient_id,
        recordType: record.record_type,
        Type: record._type,
        Name: record._name,
        Results: typeof record._results === 'string' 
          ? JSON.parse(record._results || '[]') 
          : record._results || [],
        overallResult: record.overall_result,
        interpretation: record.interpretation,
        recommendations: record.recommendations,
        attachments: typeof record.attachments === 'string' 
          ? JSON.parse(record.attachments || '[]') 
          : record.attachments || [],
        notes: record.notes,
        edBy: record.recorded_by,
        edTime: record.recorded_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        patient: {
          thaiName: record.thai_name,
          hospitalNumber: record.hospital_number,
          nationalId: record.national_id
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        resultId: resultId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating patient lab result:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update lab result
 * PUT /api/patients/{id}/lab-results/{resultId}
 */
export const updatePatientLabResult = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, resultId } = req.params;
    const {
      result_value,
      result_numeric,
      result_unit,
      reference_range,
      reference_min,
      reference_max,
      abnormal_flag,
      interpretation,
      validated,
      method,
      instrument,
      technician_notes,
      pathologist_notes
    } = req.body;

    const userId = (req as any).user.id;

    // Validate lab result exists and belongs to patient
    const resultExists = await databaseManager.query(`
      SELECT id FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lr.id = $1 AND lo.patient_id = $2
    `, [resultId, actualPatientId]);

    if (resultExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Lab result not found' },
        statusCode: 404
      });
    }

    // Update lab result
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (result_value !== undefined) {
      updateFields.push(`result_value = $${paramCount++}`);
      updateValues.push(result_value);
    }
    if (result_numeric !== undefined) {
      updateFields.push(`result_numeric = $${paramCount++}`);
      updateValues.push(result_numeric);
    }
    if (result_unit !== undefined) {
      updateFields.push(`result_unit = $${paramCount++}`);
      updateValues.push(result_unit);
    }
    if (reference_range !== undefined) {
      updateFields.push(`reference_range = $${paramCount++}`);
      updateValues.push(reference_range);
    }
    if (reference_min !== undefined) {
      updateFields.push(`reference_min = $${paramCount++}`);
      updateValues.push(reference_min);
    }
    if (reference_max !== undefined) {
      updateFields.push(`reference_max = $${paramCount++}`);
      updateValues.push(reference_max);
    }
    if (abnormal_flag !== undefined) {
      updateFields.push(`abnormal_flag = $${paramCount++}`);
      updateValues.push(abnormal_flag);
    }
    if (interpretation !== undefined) {
      updateFields.push(`interpretation = $${paramCount++}`);
      updateValues.push(interpretation);
    }
    if (validated !== undefined) {
      updateFields.push(`validated = $${paramCount++}`);
      updateValues.push(validated);
      if (validated) {
        updateFields.push(`validated_by = $${paramCount++}`);
        updateValues.push(userId);
        updateFields.push(`validated_at = CURRENT_TIMESTAMP`);
      }
    }
    if (method !== undefined) {
      updateFields.push(`method = $${paramCount++}`);
      updateValues.push(method);
    }
    if (instrument !== undefined) {
      updateFields.push(`instrument = $${paramCount++}`);
      updateValues.push(instrument);
    }
    if (technician_notes !== undefined) {
      updateFields.push(`technician_notes = $${paramCount++}`);
      updateValues.push(technician_notes);
    }
    if (pathologist_notes !== undefined) {
      updateFields.push(`pathologist_notes = $${paramCount++}`);
      updateValues.push(pathologist_notes);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(resultId);

    const updateQuery = `
      UPDATE lab_results 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated lab result
    const updatedResult = await databaseManager.query(`
      SELECT 
        lr.id, lr.result_value, lr.result_unit, lr.reference_range,
        lr.abnormal_flag, lr.interpretation, lr.validated, lr.validated_at,
        lr.result_date, lr.result_time, lr.updated_at,
        lo.order_number, lo._name, lo._category
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lr.id = $1
    `, [resultId]);

    res.json({
      data: {
        lab_result: updatedResult.rows[0],
        message: 'Lab result updated successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating patient lab result:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
