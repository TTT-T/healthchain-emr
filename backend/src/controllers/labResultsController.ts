import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

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
    const { page = 1, limit = 10, testCategory, startDate, endDate, status } = req.query;

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

    const patient = patientExists.rows[0];
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for lab results
    let whereClause = 'WHERE lo.patient_id = $1';
    const queryParams: any[] = [patientId];

    if (testCategory) {
      whereClause += ' AND lo.test_category = $2';
      queryParams.push(testCategory);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND lo.order_date >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND lo.order_date <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    if (status) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND lo.status = $${paramIndex}`;
      queryParams.push(status);
    }

    // Get lab orders with results
    const labResultsQuery = `
      SELECT 
        lo.id as lab_order_id,
        lo.order_number,
        lo.order_date,
        lo.order_time,
        lo.test_category,
        lo.test_name,
        lo.test_code,
        lo.clinical_indication,
        lo.specimen_type,
        lo.priority,
        lo.status as order_status,
        lo.requested_completion,
        u1.first_name as ordered_by_first_name,
        u1.last_name as ordered_by_last_name,
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
        u2.first_name as validated_by_first_name,
        u2.last_name as validated_by_last_name
      FROM lab_orders lo
      LEFT JOIN users u1 ON lo.ordered_by = u1.id
      LEFT JOIN lab_results lr ON lo.id = lr.lab_order_id
      LEFT JOIN users u2 ON lr.validated_by = u2.id
      ${whereClause}
      ORDER BY lo.order_date DESC, lo.order_time DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const labResultsResult = await databaseManager.query(labResultsQuery, queryParams);
    const labResults = labResultsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lab_orders lo
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Group results by lab order
    const groupedResults = labResults.reduce((acc: any, result: any) => {
      const orderId = result.lab_order_id;
      if (!acc[orderId]) {
        acc[orderId] = {
          lab_order: {
            id: result.lab_order_id,
            order_number: result.order_number,
            order_date: result.order_date,
            order_time: result.order_time,
            test_category: result.test_category,
            test_name: result.test_name,
            test_code: result.test_code,
            clinical_indication: result.clinical_indication,
            specimen_type: result.specimen_type,
            priority: result.priority,
            status: result.order_status,
            requested_completion: result.requested_completion,
            ordered_by: {
              name: `${result.ordered_by_first_name} ${result.ordered_by_last_name}`
            }
          },
          results: []
        };
      }

      if (result.result_id) {
        acc[orderId].results.push({
          id: result.result_id,
          result_value: result.result_value,
          result_numeric: result.result_numeric,
          result_unit: result.result_unit,
          reference_range: result.reference_range,
          reference_min: result.reference_min,
          reference_max: result.reference_max,
          abnormal_flag: result.abnormal_flag,
          interpretation: result.interpretation,
          validated: result.validated,
          validated_by: result.validated_by ? {
            name: `${result.validated_by_first_name} ${result.validated_by_last_name}`
          } : null,
          validated_at: result.validated_at,
          result_date: result.result_date,
          result_time: result.result_time,
          reported_at: result.reported_at,
          method: result.method,
          instrument: result.instrument,
          technician_notes: result.technician_notes,
          pathologist_notes: result.pathologist_notes
        });
      }

      return acc;
    }, {});

    const formattedResults = Object.values(groupedResults);

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
    const { id: patientId, resultId } = req.params;

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
        lo.test_name,
        lo.test_category,
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

    const result = await databaseManager.query(labResultQuery, [resultId, patientId]);

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
          id: patientId,
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
            test_name: labResult.test_name,
            test_category: labResult.test_category,
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
      lab_order_id,
      result_value,
      result_numeric,
      result_unit,
      reference_range,
      reference_min,
      reference_max,
      abnormal_flag,
      interpretation,
      method,
      instrument,
      technician_notes,
      pathologist_notes
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

    // Validate lab order exists and belongs to patient
    const labOrderExists = await databaseManager.query(`
      SELECT id, test_name, test_code FROM lab_orders 
      WHERE id = $1 AND patient_id = $2
    `, [lab_order_id, patientId]);

    if (labOrderExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Lab order not found' },
        statusCode: 404
      });
    }

    const labOrder = labOrderExists.rows[0];

    // Create lab result
    const resultId = uuidv4();

    await databaseManager.query(`
      INSERT INTO lab_results (
        id, lab_order_id, patient_id, test_name, test_code,
        result_value, result_numeric, result_unit, reference_range,
        reference_min, reference_max, abnormal_flag, interpretation,
        method, instrument, technician_notes, pathologist_notes,
        result_date, result_time, reported_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP)
    `, [
      resultId, lab_order_id, patientId, labOrder.test_name, labOrder.test_code,
      result_value, result_numeric, result_unit, reference_range,
      reference_min, reference_max, abnormal_flag, interpretation,
      method, instrument, technician_notes, pathologist_notes
    ]);

    // Update lab order status to completed
    await databaseManager.query(`
      UPDATE lab_orders 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [lab_order_id]);

    // Get created lab result
    const createdResult = await databaseManager.query(`
      SELECT 
        lr.id, lr.result_value, lr.result_unit, lr.reference_range,
        lr.abnormal_flag, lr.interpretation, lr.result_date, lr.result_time,
        lo.order_number, lo.test_name, lo.test_category
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lr.id = $1
    `, [resultId]);

    res.status(201).json({
      data: {
        lab_result: createdResult.rows[0],
        message: 'Lab result created successfully'
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
    const { id: patientId, resultId } = req.params;
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
    `, [resultId, patientId]);

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
        lo.order_number, lo.test_name, lo.test_category
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
