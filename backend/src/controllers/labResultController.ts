import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateLabResultRequest {
  patientId: string;
  visitId?: string;
  labOrderId?: string;
  testType: string;
  testName: string;
  testResults: Array<{
    parameter: string;
    value: string;
    unit?: string;
    normalRange?: string;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
  }>;
  overallResult: 'normal' | 'abnormal' | 'critical';
  interpretation?: string;
  recommendations?: string;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }>;
  testedBy: string;
  testedTime?: string;
  reviewedBy?: string;
  reviewedTime?: string;
  notes?: string;
}

interface UpdateLabResultRequest {
  testResults?: any[];
  overallResult?: string;
  interpretation?: string;
  recommendations?: string;
  attachments?: any[];
  testedBy?: string;
  testedTime?: string;
  reviewedBy?: string;
  reviewedTime?: string;
  notes?: string;
  status?: string;
}

/**
 * Create lab result record
 */
export const createLabResult = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    visitId,
    labOrderId,
    testType,
    testName,
    testResults,
    overallResult,
    interpretation,
    recommendations,
    attachments,
    testedBy,
    testedTime,
    reviewedBy,
    reviewedTime,
    notes
  }: CreateLabResultRequest = req.body;

  // Validate required fields
  if (!patientId || !testType || !testName || !testResults || !overallResult || !testedBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, testType, testName, testResults, overallResult, testedBy',
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Required fields are missing'
      }
    });
  }

  try {
    const client = await databaseManager.getClient();
    
    // Check if patient exists
    const patientQuery = 'SELECT id, thai_name, national_id, hospital_number FROM users WHERE id = $1 AND role = $2';
    const patientResult = await client.query(patientQuery, [patientId, 'patient']);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Patient not found',
        data: null,
        error: {
          code: 'PATIENT_NOT_FOUND',
          message: 'Patient with the specified ID does not exist'
        }
      });
    }

    const patient = patientResult.rows[0];

    // Create lab result record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        lab_order_id,
        test_type,
        test_name,
        test_results,
        overall_result,
        interpretation,
        recommendations,
        attachments,
        notes,
        recorded_by,
        recorded_time,
        reviewed_by,
        reviewed_time,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'lab_result',
      labOrderId || null,
      testType,
      testName,
      JSON.stringify(testResults),
      overallResult,
      interpretation || null,
      recommendations || null,
      attachments ? JSON.stringify(attachments) : null,
      notes || null,
      testedBy,
      testedTime || new Date().toISOString(),
      reviewedBy || null,
      reviewedTime || null
    ];

    const result = await client.query(insertQuery, values);
    const labResultRecord = result.rows[0];

    logger.info('Lab result created successfully', {
      patientId,
      recordId: labResultRecord.id,
      testedBy
    });

    res.status(201).json({
      statusCode: 201,
      message: 'Lab result created successfully',
      data: {
        id: labResultRecord.id,
        patientId: labResultRecord.patient_id,
        visitId: labResultRecord.visit_id,
        labOrderId: labResultRecord.lab_order_id,
        recordType: labResultRecord.record_type,
        testType: labResultRecord.test_type,
        testName: labResultRecord.test_name,
        testResults: JSON.parse(labResultRecord.test_results || '[]'),
        overallResult: labResultRecord.overall_result,
        interpretation: labResultRecord.interpretation,
        recommendations: labResultRecord.recommendations,
        attachments: labResultRecord.attachments ? JSON.parse(labResultRecord.attachments) : [],
        notes: labResultRecord.notes,
        testedBy: labResultRecord.recorded_by,
        testedTime: labResultRecord.recorded_time,
        reviewedBy: labResultRecord.reviewed_by,
        reviewedTime: labResultRecord.reviewed_time,
        createdAt: labResultRecord.created_at,
        updatedAt: labResultRecord.updated_at
      },
      meta: {
        patient: {
          id: patient.id,
          thaiName: patient.thai_name,
          nationalId: patient.national_id,
          hospitalNumber: patient.hospital_number
        }
      }
    });

  } catch (error) {
    logger.error('Error creating lab result:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create lab result record'
      }
    });
  }
});

/**
 * Get lab results by patient ID
 */
export const getLabResultsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'lab_result'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const labResultRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      labOrderId: record.lab_order_id,
      recordType: record.record_type,
      testType: record.test_type,
      testName: record.test_name,
      testResults: JSON.parse(record.test_results || '[]'),
      overallResult: record.overall_result,
      interpretation: record.interpretation,
      recommendations: record.recommendations,
      attachments: record.attachments ? JSON.parse(record.attachments) : [],
      notes: record.notes,
      testedBy: record.recorded_by,
      testedTime: record.recorded_time,
      reviewedBy: record.reviewed_by,
      reviewedTime: record.reviewed_time,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      patient: {
        thaiName: record.thai_name,
        nationalId: record.national_id,
        hospitalNumber: record.hospital_number
      }
    }));

    res.status(200).json({
      statusCode: 200,
      message: 'Lab results retrieved successfully',
      data: labResultRecords,
      meta: {
        total: labResultRecords.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving lab results:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve lab results'
      }
    });
  }
});

/**
 * Get lab result by ID
 */
export const getLabResultById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      WHERE mr.id = $1 AND mr.record_type = 'lab_result'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Lab result record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Lab result record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Lab result retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        labOrderId: record.lab_order_id,
        recordType: record.record_type,
        testType: record.test_type,
        testName: record.test_name,
        testResults: JSON.parse(record.test_results || '[]'),
        overallResult: record.overall_result,
        interpretation: record.interpretation,
        recommendations: record.recommendations,
        attachments: record.attachments ? JSON.parse(record.attachments) : [],
        notes: record.notes,
        testedBy: record.recorded_by,
        testedTime: record.recorded_time,
        reviewedBy: record.reviewed_by,
        reviewedTime: record.reviewed_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        patient: {
          thaiName: record.thai_name,
          nationalId: record.national_id,
          hospitalNumber: record.hospital_number
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving lab result:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve lab result'
      }
    });
  }
});

/**
 * Update lab result record
 */
export const updateLabResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateLabResultRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'lab_result']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Lab result record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Lab result record with the specified ID does not exist'
        }
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (typeof value === 'object') {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'No fields to update',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided for update'
        }
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE medical_records 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND record_type = 'lab_result'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Lab result updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Lab result updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        visitId: updatedRecord.visit_id,
        labOrderId: updatedRecord.lab_order_id,
        recordType: updatedRecord.record_type,
        testType: updatedRecord.test_type,
        testName: updatedRecord.test_name,
        testResults: JSON.parse(updatedRecord.test_results || '[]'),
        overallResult: updatedRecord.overall_result,
        interpretation: updatedRecord.interpretation,
        recommendations: updatedRecord.recommendations,
        attachments: updatedRecord.attachments ? JSON.parse(updatedRecord.attachments) : [],
        notes: updatedRecord.notes,
        testedBy: updatedRecord.recorded_by,
        testedTime: updatedRecord.recorded_time,
        reviewedBy: updatedRecord.reviewed_by,
        reviewedTime: updatedRecord.reviewed_time,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating lab result:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update lab result record'
      }
    });
  }
});

/**
 * Delete lab result record
 */
export const deleteLabResult = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'lab_result']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Lab result record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Lab result record with the specified ID does not exist'
        }
      });
    }

    logger.info('Lab result deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Lab result deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting lab result:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete lab result record'
      }
    });
  }
});
