import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';
import { getThailandTime } from '../utils/thailandTime';

interface CreateHistoryTakingRequest {
  patientId: string;
  visitId?: string;
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  drugAllergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  socialHistory?: string;
  pregnancyHistory?: string;
  dietaryHistory?: string;
  lifestyleFactors?: string;
  reviewOfSystems?: string;
  notes?: string;
  recordedBy: string;
  recordedTime?: string;
}

interface UpdateHistoryTakingRequest {
  chiefComplaint?: string;
  presentIllness?: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  drugAllergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  socialHistory?: string;
  pregnancyHistory?: string;
  dietaryHistory?: string;
  lifestyleFactors?: string;
  reviewOfSystems?: string;
  notes?: string;
  recordedBy?: string;
}

/**
 * Create medical history record
 */
export const createHistoryTaking = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    visitId,
    chiefComplaint,
    presentIllness,
    pastMedicalHistory,
    surgicalHistory,
    drugAllergies,
    currentMedications,
    familyHistory,
    socialHistory,
    pregnancyHistory,
    dietaryHistory,
    lifestyleFactors,
    reviewOfSystems,
    notes,
    recordedBy,
    recordedTime
  }: CreateHistoryTakingRequest = req.body;

  // Validate required fields
  if (!patientId || !chiefComplaint || !presentIllness || !recordedBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, chiefComplaint, presentIllness, recordedBy',
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
    const patientQuery = 'SELECT id, thai_name, national_id, hospital_number FROM patients WHERE id = $1';
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

    // Create medical history record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        chief_complaint,
        present_illness,
        past_history,
        family_history,
        social_history,
        pregnancy_history,
        dietary_history,
        lifestyle_factors,
        review_of_systems,
        surgical_history,
        drug_allergies,
        current_medications,
        notes,
        recorded_by,
        recorded_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'history_taking',
      chiefComplaint,
      presentIllness,
      pastMedicalHistory || null,
      familyHistory || null,
      socialHistory || null,
      pregnancyHistory || null,
      dietaryHistory || null,
      lifestyleFactors || null,
      reviewOfSystems || null,
      surgicalHistory || null,
      drugAllergies || null,
      currentMedications || null,
      notes || null,
      recordedBy,
      recordedTime || getThailandTime().toISOString()
    ];

    // Log all received data for debugging
    logger.info('History Taking Data Received:', {
      patientId,
      visitId,
      chiefComplaint,
      presentIllness,
      pastMedicalHistory,
      surgicalHistory,
      drugAllergies,
      currentMedications,
      familyHistory,
      socialHistory,
      pregnancyHistory,
      dietaryHistory,
      lifestyleFactors,
      reviewOfSystems,
      notes,
      recordedBy,
      recordedTime
    });

    const result = await client.query(insertQuery, values);
    const historyRecord = result.rows[0];

    logger.info('Medical history created successfully', {
      patientId,
      recordId: historyRecord.id,
      recordedBy
    });

    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      const user = (req as any).user;
      
      // ดึงข้อมูลผู้ป่วยเพิ่มเติม
      const patientDetailQuery = `
        SELECT p.id, p.hospital_number, p.first_name, p.last_name, p.thai_name, p.phone, p.email
        FROM patients p
        WHERE p.id = $1
      `;
      const patientDetailResult = await client.query(patientDetailQuery, [patientId]);
      
      if (patientDetailResult.rows.length > 0) {
        const patientDetail = patientDetailResult.rows[0];
        
        await NotificationService.sendPatientNotification({
          patientId: patientDetail.id,
          patientHn: patientDetail.hospital_number || '',
          patientName: patientDetail.thai_name || `${patientDetail.first_name} ${patientDetail.last_name}`,
          patientPhone: patientDetail.phone,
          patientEmail: patientDetail.email,
          notificationType: 'history_taking_recorded',
          title: `บันทึกประวัติการซักประวัติ: ${patientDetail.hospital_number || 'HN'}`,
          message: `มีการบันทึกประวัติการซักประวัติใหม่สำหรับคุณ ${patientDetail.thai_name || patientDetail.first_name} โดย ${user?.thai_name || `${user?.first_name} ${user?.last_name}` || 'เจ้าหน้าที่'}`,
          recordType: 'history_taking',
          recordId: historyRecord.id,
          createdBy: user?.id || recordedBy,
          createdByName: user?.thai_name || `${user?.first_name} ${user?.last_name}` || recordedBy,
          metadata: {
            chiefComplaint: historyRecord.chief_complaint,
            presentIllness: historyRecord.present_illness,
            recordedTime: historyRecord.recorded_time,
            recordedBy: historyRecord.recorded_by
          }
        });
        
        console.log('✅ History taking notification sent successfully', {
          patientHn: patientDetail.hospital_number,
          historyRecordId: historyRecord.id
        });
      }
    } catch (notificationError) {
      console.error('❌ Failed to send history taking notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกประวัติ
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Medical history created successfully',
      data: {
        id: historyRecord.id,
        patientId: historyRecord.patient_id,
        visitId: historyRecord.visit_id,
        recordType: historyRecord.record_type,
        chiefComplaint: historyRecord.chief_complaint,
        presentIllness: historyRecord.present_illness,
        pastMedicalHistory: historyRecord.past_medical_history,
        surgicalHistory: historyRecord.surgical_history,
        drugAllergies: historyRecord.drug_allergies,
        currentMedications: historyRecord.current_medications,
        familyHistory: historyRecord.family_history,
        socialHistory: historyRecord.social_history,
        pregnancyHistory: historyRecord.pregnancy_history,
        dietaryHistory: historyRecord.dietary_history,
        lifestyleFactors: historyRecord.lifestyle_factors,
        reviewOfSystems: historyRecord.review_of_systems,
        notes: historyRecord.notes,
        recordedBy: historyRecord.recorded_by,
        recordedTime: historyRecord.recorded_time,
        createdAt: historyRecord.created_at,
        updatedAt: historyRecord.updated_at
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
    logger.error('Error creating medical history:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create medical history record'
      }
    });
  }
});

/**
 * Get medical history by patient ID
 */
export const getHistoryTakingByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT 
        mr.id,
        mr.patient_id,
        mr.visit_id,
        mr.record_type,
        mr.chief_complaint,
        mr.present_illness,
        mr.past_history,
        mr.family_history,
        mr.social_history,
        mr.pregnancy_history,
        mr.dietary_history,
        mr.lifestyle_factors,
        mr.review_of_systems,
        mr.surgical_history,
        mr.drug_allergies,
        mr.current_medications,
        mr.notes,
        mr.recorded_by,
        mr.recorded_time,
        mr.created_at,
        mr.updated_at,
        p.thai_name, 
        p.national_id, 
        p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'history_taking'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const historyRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      recordType: record.record_type,
      chiefComplaint: record.chief_complaint,
      presentIllness: record.present_illness,
      pastMedicalHistory: record.past_history,
      surgicalHistory: record.surgical_history,
      drugAllergies: record.drug_allergies,
      currentMedications: record.current_medications,
      familyHistory: record.family_history,
      socialHistory: record.social_history,
      pregnancyHistory: record.pregnancy_history,
      dietaryHistory: record.dietary_history,
      lifestyleFactors: record.lifestyle_factors,
      reviewOfSystems: record.review_of_systems,
      notes: record.notes,
      recordedBy: record.recorded_by,
      recordedTime: record.recorded_time,
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
      message: 'Medical history retrieved successfully',
      data: historyRecords,
      meta: {
        total: historyRecords.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving medical history:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve medical history'
      }
    });
  }
});

/**
 * Get medical history by ID
 */
export const getHistoryTakingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT 
        mr.id,
        mr.patient_id,
        mr.visit_id,
        mr.record_type,
        mr.chief_complaint,
        mr.present_illness,
        mr.past_history,
        mr.family_history,
        mr.social_history,
        mr.pregnancy_history,
        mr.dietary_history,
        mr.lifestyle_factors,
        mr.review_of_systems,
        mr.surgical_history,
        mr.drug_allergies,
        mr.current_medications,
        mr.notes,
        mr.recorded_by,
        mr.recorded_time,
        mr.created_at,
        mr.updated_at,
        p.thai_name, 
        p.national_id, 
        p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.id = $1 AND mr.record_type = 'history_taking'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Medical history record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Medical history record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Medical history retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        recordType: record.record_type,
        chiefComplaint: record.chief_complaint,
        presentIllness: record.present_illness,
        pastMedicalHistory: record.past_history,
        surgicalHistory: record.surgical_history,
        drugAllergies: record.drug_allergies,
        currentMedications: record.current_medications,
        familyHistory: record.family_history,
        socialHistory: record.social_history,
        pregnancyHistory: record.pregnancy_history,
        dietaryHistory: record.dietary_history,
        lifestyleFactors: record.lifestyle_factors,
        reviewOfSystems: record.review_of_systems,
        notes: record.notes,
        recordedBy: record.recorded_by,
        recordedTime: record.recorded_time,
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
    logger.error('Error retrieving medical history:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve medical history'
      }
    });
  }
});

/**
 * Update medical history record
 */
export const updateHistoryTaking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateHistoryTakingRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'history_taking']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Medical history record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Medical history record with the specified ID does not exist'
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
        updateFields.push(`${dbField} = $${paramCount}`);
        values.push(value);
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
      WHERE id = $${paramCount} AND record_type = 'history_taking'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Medical history updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Medical history updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        visitId: updatedRecord.visit_id,
        recordType: updatedRecord.record_type,
        chiefComplaint: updatedRecord.chief_complaint,
        presentIllness: updatedRecord.present_illness,
        pastMedicalHistory: updatedRecord.past_medical_history,
        surgicalHistory: updatedRecord.surgical_history,
        drugAllergies: updatedRecord.drug_allergies,
        currentMedications: updatedRecord.current_medications,
        familyHistory: updatedRecord.family_history,
        socialHistory: updatedRecord.social_history,
        pregnancyHistory: updatedRecord.pregnancy_history,
        dietaryHistory: updatedRecord.dietary_history,
        lifestyleFactors: updatedRecord.lifestyle_factors,
        reviewOfSystems: updatedRecord.review_of_systems,
        notes: updatedRecord.notes,
        recordedBy: updatedRecord.recorded_by,
        recordedTime: updatedRecord.recorded_time,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating medical history:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update medical history record'
      }
    });
  }
});

/**
 * Delete medical history record
 */
export const deleteHistoryTaking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'history_taking']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Medical history record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Medical history record with the specified ID does not exist'
        }
      });
    }

    logger.info('Medical history deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Medical history deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting medical history:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete medical history record'
      }
    });
  }
});
