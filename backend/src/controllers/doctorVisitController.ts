import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';

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
  examinedBy: string; // This should be a UUID
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

  // Validate UUID format for examinedBy
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(examinedBy)) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Invalid examinedBy format. Must be a valid UUID.',
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'examinedBy must be a valid UUID'
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

    // Create doctor visit record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        chief_complaint,
        present_illness,
        physical_exam,
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
      physicalExamination ? JSON.stringify(physicalExamination) : null,
      diagnosis ? JSON.stringify(diagnosis) : null,
      treatmentPlan ? JSON.stringify(treatmentPlan) : null,
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

    // Safe JSON parsing with error handling
    let parsedPhysicalExamination = {};
    let parsedDiagnosis = {};
    let parsedTreatmentPlan = {};
    let parsedFollowUp = null;

    try {
      parsedPhysicalExamination = visitRecord.physical_exam ? JSON.parse(visitRecord.physical_exam) : {};
    } catch (parseError) {
      logger.error('Error parsing physical_exam:', { data: visitRecord.physical_exam, error: parseError });
      parsedPhysicalExamination = {};
    }

    try {
      parsedDiagnosis = visitRecord.diagnosis ? JSON.parse(visitRecord.diagnosis) : {};
    } catch (parseError) {
      logger.error('Error parsing diagnosis:', { data: visitRecord.diagnosis, error: parseError });
      parsedDiagnosis = {};
    }

    try {
      parsedTreatmentPlan = visitRecord.treatment_plan ? JSON.parse(visitRecord.treatment_plan) : {};
    } catch (parseError) {
      logger.error('Error parsing treatment_plan:', { data: visitRecord.treatment_plan, error: parseError });
      parsedTreatmentPlan = {};
    }

    try {
      parsedFollowUp = visitRecord.follow_up ? JSON.parse(visitRecord.follow_up) : null;
    } catch (parseError) {
      logger.error('Error parsing follow_up:', { data: visitRecord.follow_up, error: parseError });
      parsedFollowUp = null;
    }

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
        physicalExamination: parsedPhysicalExamination,
        diagnosis: parsedDiagnosis,
        treatmentPlan: parsedTreatmentPlan,
        advice: visitRecord.advice,
        followUp: parsedFollowUp,
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
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'doctor_visit'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const visitRecords = result.rows.map(record => {
      // Safe JSON parsing for each record
      let parsedPhysicalExamination = {};
      let parsedDiagnosis = {};
      let parsedTreatmentPlan = {};
      let parsedFollowUp = null;

      try {
        parsedPhysicalExamination = record.physical_exam ? JSON.parse(record.physical_exam) : {};
      } catch (parseError) {
        logger.error('Error parsing physical_exam in getDoctorVisitsByPatient:', { data: record.physical_exam, error: parseError });
        parsedPhysicalExamination = {};
      }

      try {
        parsedDiagnosis = record.diagnosis ? JSON.parse(record.diagnosis) : {};
      } catch (parseError) {
        logger.error('Error parsing diagnosis in getDoctorVisitsByPatient:', { data: record.diagnosis, error: parseError });
        parsedDiagnosis = {};
      }

      try {
        parsedTreatmentPlan = record.treatment_plan ? JSON.parse(record.treatment_plan) : {};
      } catch (parseError) {
        logger.error('Error parsing treatment_plan in getDoctorVisitsByPatient:', { data: record.treatment_plan, error: parseError });
        parsedTreatmentPlan = {};
      }

      try {
        parsedFollowUp = record.follow_up ? JSON.parse(record.follow_up) : null;
      } catch (parseError) {
        logger.error('Error parsing follow_up in getDoctorVisitsByPatient:', { data: record.follow_up, error: parseError });
        parsedFollowUp = null;
      }

      return {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        recordType: record.record_type,
        chiefComplaint: record.chief_complaint,
        presentIllness: record.present_illness,
        physicalExamination: parsedPhysicalExamination,
        diagnosis: parsedDiagnosis,
        treatmentPlan: parsedTreatmentPlan,
        advice: record.advice,
        followUp: parsedFollowUp,
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
      };
    });

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
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
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

    // Safe JSON parsing
    let parsedPhysicalExamination = {};
    let parsedDiagnosis = {};
    let parsedTreatmentPlan = {};
    let parsedFollowUp = null;

    try {
      parsedPhysicalExamination = record.physical_exam ? JSON.parse(record.physical_exam) : {};
    } catch (parseError) {
      logger.error('Error parsing physical_exam in getDoctorVisitById:', { data: record.physical_exam, error: parseError });
      parsedPhysicalExamination = {};
    }

    try {
      parsedDiagnosis = record.diagnosis ? JSON.parse(record.diagnosis) : {};
    } catch (parseError) {
      logger.error('Error parsing diagnosis in getDoctorVisitById:', { data: record.diagnosis, error: parseError });
      parsedDiagnosis = {};
    }

    try {
      parsedTreatmentPlan = record.treatment_plan ? JSON.parse(record.treatment_plan) : {};
    } catch (parseError) {
      logger.error('Error parsing treatment_plan in getDoctorVisitById:', { data: record.treatment_plan, error: parseError });
      parsedTreatmentPlan = {};
    }

    try {
      parsedFollowUp = record.follow_up ? JSON.parse(record.follow_up) : null;
    } catch (parseError) {
      logger.error('Error parsing follow_up in getDoctorVisitById:', { data: record.follow_up, error: parseError });
      parsedFollowUp = null;
    }

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
        physicalExamination: parsedPhysicalExamination,
        diagnosis: parsedDiagnosis,
        treatmentPlan: parsedTreatmentPlan,
        advice: record.advice,
        followUp: parsedFollowUp,
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
        if (typeof value === 'object' && value !== null) {
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

    // Safe JSON parsing
    let parsedPhysicalExamination = {};
    let parsedDiagnosis = {};
    let parsedTreatmentPlan = {};
    let parsedFollowUp = null;

    try {
      parsedPhysicalExamination = updatedRecord.physical_exam ? JSON.parse(updatedRecord.physical_exam) : {};
    } catch (parseError) {
      logger.error('Error parsing physical_exam in updateDoctorVisit:', { data: updatedRecord.physical_exam, error: parseError });
      parsedPhysicalExamination = {};
    }

    try {
      parsedDiagnosis = updatedRecord.diagnosis ? JSON.parse(updatedRecord.diagnosis) : {};
    } catch (parseError) {
      logger.error('Error parsing diagnosis in updateDoctorVisit:', { data: updatedRecord.diagnosis, error: parseError });
      parsedDiagnosis = {};
    }

    try {
      parsedTreatmentPlan = updatedRecord.treatment_plan ? JSON.parse(updatedRecord.treatment_plan) : {};
    } catch (parseError) {
      logger.error('Error parsing treatment_plan in updateDoctorVisit:', { data: updatedRecord.treatment_plan, error: parseError });
      parsedTreatmentPlan = {};
    }

    try {
      parsedFollowUp = updatedRecord.follow_up ? JSON.parse(updatedRecord.follow_up) : null;
    } catch (parseError) {
      logger.error('Error parsing follow_up in updateDoctorVisit:', { data: updatedRecord.follow_up, error: parseError });
      parsedFollowUp = null;
    }

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
        physicalExamination: parsedPhysicalExamination,
        diagnosis: parsedDiagnosis,
        treatmentPlan: parsedTreatmentPlan,
        advice: updatedRecord.advice,
        followUp: parsedFollowUp,
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
