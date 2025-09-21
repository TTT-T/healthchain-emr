import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateDoctorVisitRequest {
  patientId: string;
  visitId?: string;
  chiefComplaint: string;
  presentIllness: string;
  physicalExamination: {
    generalAppearance?: string;
    vitalSigns?: string;
    headNeck?: string;
    chest?: string;
    cardiovascular?: string;
    abdomen?: string;
    extremities?: string;
    neurological?: string;
    other?: string;
  };
  diagnosis: {
    primaryDiagnosis: string;
    secondaryDiagnosis?: string[];
    differentialDiagnosis?: string[];
    icd10Code?: string;
  };
  treatmentPlan: {
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    procedures?: Array<{
      name: string;
      description: string;
      scheduledDate?: string;
    }>;
    lifestyleModifications?: string[];
    followUpInstructions?: string;
  };
  advice: string;
  followUp?: {
    scheduledDate?: string;
    interval?: string;
    purpose?: string;
    notes?: string;
  };
  notes?: string;
  examinedBy: string;
  examinedTime?: string;
}

interface UpdateDoctorVisitRequest {
  chiefComplaint?: string;
  presentIllness?: string;
  physicalExamination?: any;
  diagnosis?: any;
  treatmentPlan?: any;
  advice?: string;
  followUp?: any;
  notes?: string;
  examinedBy?: string;
}

/**
 * Create doctor visit record
 */
export const createDoctorVisit = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    visitId,
    chiefComplaint,
    presentIllness,
    physicalExamination,
    diagnosis,
    treatmentPlan,
    advice,
    followUp,
    notes,
    examinedBy,
    examinedTime
  }: CreateDoctorVisitRequest = req.body;

  // Validate required fields
  if (!patientId || !chiefComplaint || !presentIllness || !examinedBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, chiefComplaint, presentIllness, examinedBy',
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

    // Create doctor visit record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        chief_complaint,
        present_illness,
        physical_examination,
        diagnosis,
        treatment_plan,
        advice,
        follow_up,
        notes,
        recorded_by,
        recorded_time,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'doctor_visit',
      chiefComplaint,
      presentIllness,
      JSON.stringify(physicalExamination),
      JSON.stringify(diagnosis),
      JSON.stringify(treatmentPlan),
      advice || null,
      followUp ? JSON.stringify(followUp) : null,
      notes || null,
      examinedBy,
      examinedTime || new Date().toISOString()
    ];

    const result = await client.query(insertQuery, values);
    const visitRecord = result.rows[0];

    logger.info('Doctor visit created successfully', {
      patientId,
      recordId: visitRecord.id,
      examinedBy
    });

    res.status(201).json({
      statusCode: 201,
      message: 'Doctor visit created successfully',
      data: {
        id: visitRecord.id,
        patientId: visitRecord.patient_id,
        visitId: visitRecord.visit_id,
        recordType: visitRecord.record_type,
        chiefComplaint: visitRecord.chief_complaint,
        presentIllness: visitRecord.present_illness,
        physicalExamination: JSON.parse(visitRecord.physical_examination || '{}'),
        diagnosis: JSON.parse(visitRecord.diagnosis || '{}'),
        treatmentPlan: JSON.parse(visitRecord.treatment_plan || '{}'),
        advice: visitRecord.advice,
        followUp: visitRecord.follow_up ? JSON.parse(visitRecord.follow_up) : null,
        notes: visitRecord.notes,
        examinedBy: visitRecord.recorded_by,
        examinedTime: visitRecord.recorded_time,
        createdAt: visitRecord.created_at,
        updatedAt: visitRecord.updated_at
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
    logger.error('Error creating doctor visit:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create doctor visit record'
      }
    });
  }
});

/**
 * Get doctor visits by patient ID
 */
export const getDoctorVisitsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'doctor_visit'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const visitRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      recordType: record.record_type,
      chiefComplaint: record.chief_complaint,
      presentIllness: record.present_illness,
      physicalExamination: JSON.parse(record.physical_examination || '{}'),
      diagnosis: JSON.parse(record.diagnosis || '{}'),
      treatmentPlan: JSON.parse(record.treatment_plan || '{}'),
      advice: record.advice,
      followUp: record.follow_up ? JSON.parse(record.follow_up) : null,
      notes: record.notes,
      examinedBy: record.recorded_by,
      examinedTime: record.recorded_time,
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
      message: 'Doctor visits retrieved successfully',
      data: visitRecords,
      meta: {
        total: visitRecords.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving doctor visits:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve doctor visits'
      }
    });
  }
});

/**
 * Get doctor visit by ID
 */
export const getDoctorVisitById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      WHERE mr.id = $1 AND mr.record_type = 'doctor_visit'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Doctor visit record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Doctor visit record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Doctor visit retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        recordType: record.record_type,
        chiefComplaint: record.chief_complaint,
        presentIllness: record.present_illness,
        physicalExamination: JSON.parse(record.physical_examination || '{}'),
        diagnosis: JSON.parse(record.diagnosis || '{}'),
        treatmentPlan: JSON.parse(record.treatment_plan || '{}'),
        advice: record.advice,
        followUp: record.follow_up ? JSON.parse(record.follow_up) : null,
        notes: record.notes,
        examinedBy: record.recorded_by,
        examinedTime: record.recorded_time,
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
    logger.error('Error retrieving doctor visit:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve doctor visit'
      }
    });
  }
});

/**
 * Update doctor visit record
 */
export const updateDoctorVisit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateDoctorVisitRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'doctor_visit']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Doctor visit record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Doctor visit record with the specified ID does not exist'
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
      WHERE id = $${paramCount} AND record_type = 'doctor_visit'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Doctor visit updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Doctor visit updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        visitId: updatedRecord.visit_id,
        recordType: updatedRecord.record_type,
        chiefComplaint: updatedRecord.chief_complaint,
        presentIllness: updatedRecord.present_illness,
        physicalExamination: JSON.parse(updatedRecord.physical_examination || '{}'),
        diagnosis: JSON.parse(updatedRecord.diagnosis || '{}'),
        treatmentPlan: JSON.parse(updatedRecord.treatment_plan || '{}'),
        advice: updatedRecord.advice,
        followUp: updatedRecord.follow_up ? JSON.parse(updatedRecord.follow_up) : null,
        notes: updatedRecord.notes,
        examinedBy: updatedRecord.recorded_by,
        examinedTime: updatedRecord.recorded_time,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating doctor visit:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update doctor visit record'
      }
    });
  }
});

/**
 * Delete doctor visit record
 */
export const deleteDoctorVisit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'doctor_visit']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Doctor visit record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Doctor visit record with the specified ID does not exist'
        }
      });
    }

    logger.info('Doctor visit deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Doctor visit deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting doctor visit:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete doctor visit record'
      }
    });
  }
});
