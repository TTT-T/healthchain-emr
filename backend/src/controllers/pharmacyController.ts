import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';

interface CreatePharmacyRequest {
  patientId: string;
  visitId?: string;
  prescriptionId?: string;
  medications: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    unit: string;
    instructions?: string;
    dispensedQuantity?: number;
    dispensedBy?: string;
    dispensedTime?: string;
  }>;
  totalAmount?: number;
  paymentMethod?: string;
  dispensedBy: string;
  dispensedTime?: string;
  notes?: string;
}

interface UpdatePharmacyRequest {
  medications?: any[];
  totalAmount?: number;
  paymentMethod?: string;
  dispensedBy?: string;
  dispensedTime?: string;
  notes?: string;
  status?: string;
}

/**
 * Create pharmacy dispensing record
 */
export const createPharmacyDispensing = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    visitId,
    prescriptionId,
    medications,
    totalAmount,
    paymentMethod,
    dispensedBy,
    dispensedTime,
    notes
  }: CreatePharmacyRequest = req.body;

  // Validate required fields
  if (!patientId || !medications || medications.length === 0 || !dispensedBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, medications, dispensedBy',
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

    // Create pharmacy dispensing record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        medications,
        total_amount,
        payment_method,
        notes,
        recorded_by,
        recorded_time,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'pharmacy_dispensing',
      JSON.stringify(medications),
      totalAmount || 0,
      paymentMethod || 'cash',
      notes || null,
      dispensedBy,
      dispensedTime || new Date().toISOString()
    ];

    const result = await client.query(insertQuery, values);
    const dispensingRecord = result.rows[0];

    logger.info('Pharmacy dispensing created successfully', {
      patientId,
      recordId: dispensingRecord.id,
      dispensedBy
    });

    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      const user = (req as any).user;
      
      await NotificationService.sendPatientNotification({
        patientId: patient.id,
        patientHn: patient.hospital_number || '',
        patientName: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        notificationType: 'prescription_ready',
        title: `ยาเตรียมพร้อม: ${medications[0]?.medication_name || 'ยาตามใบสั่ง'}`,
        message: `ยาเตรียมพร้อมสำหรับคุณ ${patient.thai_name || patient.first_name} แล้ว กรุณามารับยาได้ที่แผนกเภสัชกรรม`,
        recordType: 'pharmacy_dispensing',
        recordId: dispensingRecord.id,
        createdBy: user?.id,
        createdByName: user?.thai_name || `${user?.first_name} ${user?.last_name}`,
        metadata: {
          medications: medications.map((med: any) => med.medication_name),
          totalAmount,
          paymentMethod,
          dispensedTime: dispensedTime || new Date().toISOString()
        }
      });
    } catch (notificationError) {
      logger.error('Failed to send pharmacy notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการจ่ายยา
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Pharmacy dispensing created successfully',
      data: {
        id: dispensingRecord.id,
        patientId: dispensingRecord.patient_id,
        visitId: dispensingRecord.visit_id,
        recordType: dispensingRecord.record_type,
        medications: typeof dispensingRecord.medications === 'string' 
          ? JSON.parse(dispensingRecord.medications || '[]') 
          : dispensingRecord.medications || [],
        totalAmount: dispensingRecord.total_amount,
        paymentMethod: dispensingRecord.payment_method,
        notes: dispensingRecord.notes,
        dispensedBy: dispensingRecord.recorded_by,
        dispensedTime: dispensingRecord.recorded_time,
        createdAt: dispensingRecord.created_at,
        updatedAt: dispensingRecord.updated_at
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
    logger.error('Error creating pharmacy dispensing:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create pharmacy dispensing record'
      }
    });
  }
});

/**
 * Get pharmacy dispensings by patient ID
 */
export const getPharmacyDispensingsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'pharmacy_dispensing'
      ORDER BY mr.recorded_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const dispensingRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      recordType: record.record_type,
      medications: typeof record.medications === 'string' 
        ? JSON.parse(record.medications || '[]') 
        : record.medications || [],
      totalAmount: record.total_amount,
      paymentMethod: record.payment_method,
      notes: record.notes,
      dispensedBy: record.recorded_by,
      dispensedTime: record.recorded_time,
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
      message: 'Pharmacy dispensings retrieved successfully',
      data: dispensingRecords,
      meta: {
        total: dispensingRecords.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving pharmacy dispensings:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve pharmacy dispensings'
      }
    });
  }
});

/**
 * Get pharmacy dispensing by ID
 */
export const getPharmacyDispensingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.id = $1 AND mr.record_type = 'pharmacy_dispensing'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Pharmacy dispensing record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Pharmacy dispensing record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Pharmacy dispensing retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        recordType: record.record_type,
        medications: typeof record.medications === 'string' 
          ? JSON.parse(record.medications || '[]') 
          : record.medications || [],
        totalAmount: record.total_amount,
        paymentMethod: record.payment_method,
        notes: record.notes,
        dispensedBy: record.recorded_by,
        dispensedTime: record.recorded_time,
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
    logger.error('Error retrieving pharmacy dispensing:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve pharmacy dispensing'
      }
    });
  }
});

/**
 * Update pharmacy dispensing record
 */
export const updatePharmacyDispensing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdatePharmacyRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'pharmacy_dispensing']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Pharmacy dispensing record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Pharmacy dispensing record with the specified ID does not exist'
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
      WHERE id = $${paramCount} AND record_type = 'pharmacy_dispensing'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Pharmacy dispensing updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Pharmacy dispensing updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        visitId: updatedRecord.visit_id,
        recordType: updatedRecord.record_type,
        medications: typeof updatedRecord.medications === 'string' 
          ? JSON.parse(updatedRecord.medications || '[]') 
          : updatedRecord.medications || [],
        totalAmount: updatedRecord.total_amount,
        paymentMethod: updatedRecord.payment_method,
        notes: updatedRecord.notes,
        dispensedBy: updatedRecord.recorded_by,
        dispensedTime: updatedRecord.recorded_time,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating pharmacy dispensing:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update pharmacy dispensing record'
      }
    });
  }
});

/**
 * Delete pharmacy dispensing record
 */
export const deletePharmacyDispensing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'pharmacy_dispensing']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Pharmacy dispensing record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Pharmacy dispensing record with the specified ID does not exist'
        }
      });
    }

    logger.info('Pharmacy dispensing deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Pharmacy dispensing deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting pharmacy dispensing:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete pharmacy dispensing record'
      }
    });
  }
});