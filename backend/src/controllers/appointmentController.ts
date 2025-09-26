import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface CreateAppointmentRequest {
  patientId: string;
  doctorId?: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  reason: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  createdBy: string;
  reminderSent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
}

interface UpdateAppointmentRequest {
  doctorId?: string;
  appointmentType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  reason?: string;
  notes?: string;
  status?: string;
  priority?: string;
  location?: string;
  reminderSent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
}

/**
 * Create appointment record
 */
export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    appointmentType,
    appointmentDate,
    appointmentTime,
    duration,
    reason,
    notes,
    status,
    priority,
    location,
    createdBy,
    reminderSent,
    followUpRequired,
    followUpDate
  }: CreateAppointmentRequest = req.body;

  // Validate required fields
  if (!patientId || !appointmentType || !appointmentDate || !appointmentTime || !reason || !createdBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, appointmentType, appointmentDate, appointmentTime, reason, createdBy',
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

    // Check if doctor exists (if provided)
    if (doctorId) {
      const doctorQuery = 'SELECT id, thai_name FROM users WHERE id = $1 AND role = $2';
      const doctorResult = await client.query(doctorQuery, [doctorId, 'doctor']);
      
      if (doctorResult.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: 'Doctor not found',
          data: null,
          error: {
            code: 'DOCTOR_NOT_FOUND',
            message: 'Doctor with the specified ID does not exist'
          }
        });
      }
    }

    // Create appointment record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        doctor_id,
        record_type,
        appointment_type,
        appointment_date,
        appointment_time,
        duration,
        reason,
        notes,
        status,
        priority,
        location,
        recorded_by,
        recorded_time,
        reminder_sent,
        follow_up_required,
        follow_up_date,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      doctorId || null,
      'appointment',
      appointmentType,
      appointmentDate,
      appointmentTime,
      duration || 30,
      reason,
      notes || null,
      status || 'scheduled',
      priority || 'medium',
      location || null,
      createdBy,
      new Date().toISOString(),
      reminderSent || false,
      followUpRequired || false,
      followUpDate || null
    ];

    const result = await client.query(insertQuery, values);
    const appointmentRecord = result.rows[0];

    logger.info('Appointment created successfully', {
      patientId,
      recordId: appointmentRecord.id,
      createdBy
    });

    res.status(201).json({
      statusCode: 201,
      message: 'Appointment created successfully',
      data: {
        id: appointmentRecord.id,
        patientId: appointmentRecord.patient_id,
        doctorId: appointmentRecord.doctor_id,
        recordType: appointmentRecord.record_type,
        appointmentType: appointmentRecord.appointment_type,
        appointmentDate: appointmentRecord.appointment_date,
        appointmentTime: appointmentRecord.appointment_time,
        duration: appointmentRecord.duration,
        reason: appointmentRecord.reason,
        notes: appointmentRecord.notes,
        status: appointmentRecord.status,
        priority: appointmentRecord.priority,
        location: appointmentRecord.location,
        createdBy: appointmentRecord.recorded_by,
        createdAt: appointmentRecord.created_at,
        updatedAt: appointmentRecord.updated_at,
        reminderSent: appointmentRecord.reminder_sent,
        followUpRequired: appointmentRecord.follow_up_required,
        followUpDate: appointmentRecord.follow_up_date
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
    logger.error('Error creating appointment:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create appointment record'
      }
    });
  }
});

/**
 * Get appointments by patient ID
 */
export const getAppointmentsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, 
             u.thai_name as patient_name, u.national_id, u.hospital_number,
             d.thai_name as doctor_name
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'appointment'
      ORDER BY mr.appointment_date DESC, mr.appointment_time DESC
    `;

    const result = await client.query(query, [patientId]);

    const appointmentRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      recordType: record.record_type,
      appointmentType: record.appointment_type,
      appointmentDate: record.appointment_date,
      appointmentTime: record.appointment_time,
      duration: record.duration,
      reason: record.reason,
      notes: record.notes,
      status: record.status,
      priority: record.priority,
      location: record.location,
      createdBy: record.recorded_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      reminderSent: record.reminder_sent,
      followUpRequired: record.follow_up_required,
      followUpDate: record.follow_up_date,
      patient: {
        thaiName: record.patient_name,
        nationalId: record.national_id,
        hospitalNumber: record.hospital_number
      },
      doctor: record.doctor_name ? {
        thaiName: record.doctor_name
      } : null
    }));

    res.status(200).json({
      statusCode: 200,
      message: 'Appointments retrieved successfully',
      data: appointmentRecords,
      meta: {
        total: appointmentRecords.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving appointments:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve appointments'
      }
    });
  }
});

/**
 * Get appointments by doctor ID
 */
export const getAppointmentsByDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  try {
    const client = await databaseManager.getClient();
    
    let query = `
      SELECT mr.*, 
             u.thai_name as patient_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      WHERE mr.doctor_id = $1 AND mr.record_type = 'appointment'
    `;
    
    const values = [doctorId];
    
    if (date) {
      query += ` AND mr.appointment_date = $2`;
      values.push(date as string);
    }
    
    query += ` ORDER BY mr.appointment_date ASC, mr.appointment_time ASC`;

    const result = await client.query(query, values);

    const appointmentRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      recordType: record.record_type,
      appointmentType: record.appointment_type,
      appointmentDate: record.appointment_date,
      appointmentTime: record.appointment_time,
      duration: record.duration,
      reason: record.reason,
      notes: record.notes,
      status: record.status,
      priority: record.priority,
      location: record.location,
      createdBy: record.recorded_by,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      reminderSent: record.reminder_sent,
      followUpRequired: record.follow_up_required,
      followUpDate: record.follow_up_date,
      patient: {
        thaiName: record.patient_name,
        nationalId: record.national_id,
        hospitalNumber: record.hospital_number
      }
    }));

    res.status(200).json({
      statusCode: 200,
      message: 'Appointments retrieved successfully',
      data: appointmentRecords,
      meta: {
        total: appointmentRecords.length,
        date: date || 'all'
      }
    });

  } catch (error) {
    logger.error('Error retrieving doctor appointments:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve doctor appointments'
      }
    });
  }
});

/**
 * Get appointment by ID
 */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, 
             u.thai_name as patient_name, u.national_id, u.hospital_number,
             d.thai_name as doctor_name
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE mr.id = $1 AND mr.record_type = 'appointment'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Appointment record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Appointment record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Appointment retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        recordType: record.record_type,
        appointmentType: record.appointment_type,
        appointmentDate: record.appointment_date,
        appointmentTime: record.appointment_time,
        duration: record.duration,
        reason: record.reason,
        notes: record.notes,
        status: record.status,
        priority: record.priority,
        location: record.location,
        createdBy: record.recorded_by,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        reminderSent: record.reminder_sent,
        followUpRequired: record.follow_up_required,
        followUpDate: record.follow_up_date,
        patient: {
          thaiName: record.patient_name,
          nationalId: record.national_id,
          hospitalNumber: record.hospital_number
        },
        doctor: record.doctor_name ? {
          thaiName: record.doctor_name
        } : null
      }
    });

  } catch (error) {
    logger.error('Error retrieving appointment:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve appointment'
      }
    });
  }
});

/**
 * Update appointment record
 */
export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateAppointmentRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'appointment']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Appointment record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Appointment record with the specified ID does not exist'
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
      WHERE id = $${paramCount} AND record_type = 'appointment'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Appointment updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Appointment updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        doctorId: updatedRecord.doctor_id,
        recordType: updatedRecord.record_type,
        appointmentType: updatedRecord.appointment_type,
        appointmentDate: updatedRecord.appointment_date,
        appointmentTime: updatedRecord.appointment_time,
        duration: updatedRecord.duration,
        reason: updatedRecord.reason,
        notes: updatedRecord.notes,
        status: updatedRecord.status,
        priority: updatedRecord.priority,
        location: updatedRecord.location,
        createdBy: updatedRecord.recorded_by,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at,
        reminderSent: updatedRecord.reminder_sent,
        followUpRequired: updatedRecord.follow_up_required,
        followUpDate: updatedRecord.follow_up_date
      }
    });

  } catch (error) {
    logger.error('Error updating appointment:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update appointment record'
      }
    });
  }
});

/**
 * Delete appointment record
 */
export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'appointment']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Appointment record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Appointment record with the specified ID does not exist'
        }
      });
    }

    logger.info('Appointment deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Appointment deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting appointment:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete appointment record'
      }
    });
  }
});
