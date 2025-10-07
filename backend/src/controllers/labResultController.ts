import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';

interface CreateLabResultRequest {
  patientId: string;
  visitId?: string;
  labOrderId?: string;
  Type: string;
  Name: string;
  Results: Array<{
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
  edBy: string;
  edTime?: string;
  reviewedBy?: string;
  reviewedTime?: string;
  notes?: string;
}

interface UpdateLabResultRequest {
  Results?: any[];
  overallResult?: string;
  interpretation?: string;
  recommendations?: string;
  attachments?: any[];
  edBy?: string;
  edTime?: string;
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
    Type,
    Name,
    Results,
    overallResult,
    interpretation,
    recommendations,
    attachments,
    edBy,
    edTime,
    reviewedBy,
    reviewedTime,
    notes
  }: CreateLabResultRequest = req.body;

  // Validate required fields
  if (!patientId || !Type || !Name || !Results || !overallResult || !edBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, Type, Name, Results, overallResult, edBy',
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
    const patientQuery = 'SELECT id, thai_first_name, national_id, hn FROM patients WHERE id = $1';
    const patientResult = await client.query(patientQuery, [patientId]);
    
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
        title,
        content,
        notes,
        recorded_by,
        recorded_time,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'lab_result',
      `${Type} - ${Name}`, // title
      JSON.stringify({
        results: Results,
        overallResult,
        interpretation,
        recommendations,
        attachments
      }), // content
      notes || null,
      edBy,
      edTime || new Date().toISOString()
    ];

    const result = await client.query(insertQuery, values);
    const labResultRecord = result.rows[0];

    logger.info('Lab result created successfully', {
      patientId,
      recordId: labResultRecord.id,
      edBy
    });

    // Send notification to patient
    try {
      console.log('🔔 Attempting to send patient notification for lab result:', labResultRecord.id);
      await sendPatientLabResultNotification(labResultRecord, patient, edBy);
      console.log('✅ Patient notification sent successfully for lab result');
    } catch (notificationError) {
      console.error('❌ Failed to send patient notification for lab result:', notificationError);
      // Don't fail the lab result creation if notification fails
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Lab result created successfully',
      data: {
        id: labResultRecord.id,
        patientId: labResultRecord.patient_id,
        visitId: labResultRecord.visit_id,
        recordType: labResultRecord.record_type,
        Type: labResultRecord.record_type,
        Name: labResultRecord.test_name,
        Results: typeof labResultRecord.test_results === 'string' ? JSON.parse(labResultRecord.test_results || '[]') : labResultRecord.test_results || [],
        overallResult: labResultRecord.overall_result,
        interpretation: labResultRecord.interpretation,
        recommendations: labResultRecord.recommendations,
        attachments: labResultRecord.attachments ? (typeof labResultRecord.attachments === 'string' ? JSON.parse(labResultRecord.attachments) : labResultRecord.attachments) : [],
        notes: labResultRecord.notes,
        edBy: labResultRecord.recorded_by,
        edTime: labResultRecord.recorded_time,
        createdAt: labResultRecord.created_at,
        updatedAt: labResultRecord.updated_at
      },
      meta: {
        patient: {
          id: patient.id,
          thaiName: patient.thai_first_name,
          nationalId: patient.national_id,
          hospitalNumber: patient.hn
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
      SELECT mr.*, p.thai_first_name, p.national_id, p.hn
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'lab_result'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const labResultRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      recordType: record.record_type,
      Type: record.record_type,
      Name: record.test_name,
      Results: typeof record.test_results === 'string' ? JSON.parse(record.test_results || '[]') : record.test_results || [],
      overallResult: record.overall_result,
      interpretation: record.interpretation,
      recommendations: record.recommendations,
      attachments: record.attachments ? (typeof record.attachments === 'string' ? JSON.parse(record.attachments) : record.attachments) : [],
      notes: record.notes,
      edBy: record.recorded_by,
      edTime: record.recorded_time,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      patient: {
        thaiName: record.thai_first_name,
        nationalId: record.national_id,
        hospitalNumber: record.hn
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
      SELECT mr.*, p.thai_first_name, p.national_id, p.hn
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
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
        recordType: record.record_type,
        Type: record.record_type,
        Name: record.test_name,
        Results: typeof record.test_results === 'string' ? JSON.parse(record.test_results || '[]') : record.test_results || [],
        overallResult: record.overall_result,
        interpretation: record.interpretation,
        recommendations: record.recommendations,
        attachments: record.attachments ? (typeof record.attachments === 'string' ? JSON.parse(record.attachments) : record.attachments) : [],
        notes: record.notes,
        edBy: record.recorded_by,
        edTime: record.recorded_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        patient: {
          thaiName: record.thai_first_name,
          nationalId: record.national_id,
          hospitalNumber: record.hn
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
        recordType: updatedRecord.record_type,
        Type: updatedRecord.record_type,
        Name: updatedRecord.test_name,
        Results: typeof updatedRecord.test_results === 'string' ? JSON.parse(updatedRecord.test_results || '[]') : updatedRecord.test_results || [],
        overallResult: updatedRecord.overall_result,
        interpretation: updatedRecord.interpretation,
        recommendations: updatedRecord.recommendations,
        attachments: updatedRecord.attachments ? (typeof updatedRecord.attachments === 'string' ? JSON.parse(updatedRecord.attachments) : updatedRecord.attachments) : [],
        notes: updatedRecord.notes,
        edBy: updatedRecord.recorded_by,
        edTime: updatedRecord.recorded_time,
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

/**
 * Send notification to patient when lab result is created
 */
async function sendPatientLabResultNotification(labResultRecord: any, patient: any, recordedBy: string) {
  try {
    // Get patient contact information
    const patientQuery = `
      SELECT 
        p.id, p.thai_first_name, p.first_name, p.last_name, p.hn, 
        p.national_id, p.phone, p.email
      FROM patients p 
      WHERE p.id = $1
    `;
    const patientResult = await databaseManager.query(patientQuery, [patient.id]);
    
    if (patientResult.rows.length === 0) {
      logger.warn('Patient not found for notification', { patientId: patient.id });
      return;
    }
    
    const patientData = patientResult.rows[0];
    
    // Get user information for recordedBy
    const userQuery = 'SELECT thai_first_name, first_name, last_name FROM users WHERE id = $1';
    const userResult = await databaseManager.query(userQuery, [recordedBy]);
    const userData = userResult.rows[0] || { thai_first_name: null, first_name: 'เจ้าหน้าที่', last_name: 'แลบ' };
    
    const recordedByName = userData.thai_first_name || `${userData.first_name} ${userData.last_name}`;
    const patientName = patientData.thai_first_name || `${patientData.first_name} ${patientData.last_name}`;
    
    // Prepare notification data
    const notificationData = {
      patientId: patientData.id,
      patientHn: patientData.hn,
      patientName: patientName,
      patientPhone: patientData.phone,
      patientEmail: patientData.email,
      notificationType: 'lab_result_ready' as const,
      title: 'ผลแลบพร้อม',
      message: `มีผลแลบใหม่สำหรับคุณ ${patientName} โดย ${recordedByName}`,
      recordType: 'lab_result',
      recordId: labResultRecord.id,
      createdBy: recordedBy,
      createdByName: recordedByName,
      metadata: {
        testType: labResultRecord.record_type,
        testName: labResultRecord.test_name,
        overallResult: labResultRecord.overall_result,
        recordedTime: labResultRecord.recorded_time
      }
    };
    
    // Send notification
    await NotificationService.sendPatientNotification(notificationData);
    
    logger.info('Lab result notification sent successfully', {
      patientId: patientData.id,
      patientHn: patientData.hn,
      recordId: labResultRecord.id
    });
    
  } catch (error) {
    logger.error('Failed to send lab result notification:', error);
    throw error;
  }
}
