import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Appointments Controller
 * จัดการข้อมูลนัดหมายของผู้ป่วย
 */

/**
 * Get all appointments
 * GET /api/medical/appointments
 */
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, type, patientId, doctorId } = req.query;
    const user = (req as any).user;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND a.appointment_date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND a.appointment_date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    if (type) {
      paramCount++;
      whereClause += ` AND a.appointment_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (patientId) {
      paramCount++;
      whereClause += ` AND a.patient_id = $${paramCount}`;
      queryParams.push(patientId);
    }

    if (doctorId) {
      paramCount++;
      whereClause += ` AND a.doctor_id = $${paramCount}`;
      queryParams.push(doctorId);
    }

    // Get appointments with pagination
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.appointment_type,
        a.status,
        a.priority,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.location,
        a.notes,
        a.preparations,
        a.follow_up_required,
        a.follow_up_notes,
        a.reminder_sent,
        a.reminder_sent_at,
        a.can_reschedule,
        a.can_cancel,
        a.created_at,
        a.updated_at,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        u.phone as doctor_phone,
        u.email as doctor_email
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const appointmentsResult = await databaseManager.query(appointmentsQuery, queryParams);
    const appointments = appointmentsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format appointments data
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      priority: appointment.priority,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      durationMinutes: appointment.duration_minutes,
      location: appointment.location,
      notes: appointment.notes,
      preparations: appointment.preparations,
      followUpRequired: appointment.follow_up_required,
      followUpNotes: appointment.follow_up_notes,
      reminderSent: appointment.reminder_sent,
      reminderSentAt: appointment.reminder_sent_at,
      canReschedule: appointment.can_reschedule,
      canCancel: appointment.can_cancel,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
      doctor: appointment.doctor_first_name ? {
        name: `${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
        phone: appointment.doctor_phone,
        email: appointment.doctor_email
      } : null
    }));

    return res.status(200).json({
      data: formattedAppointments,
      meta: {
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting all appointments:', error);
    return res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Failed to get appointments' },
      statusCode: 500
    });
  }
};

/**
 * Get appointments for a patient
 * GET /api/patients/{id}/appointments
 */
export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate, type } = req.query;
    const user = (req as any).user;

    // For patient role, use the user's ID directly since appointments.patient_id references users.id
    // For other roles, use the patientId from URL
    let actualPatientId = patientId;
    let patient: any;
    
    if (user?.role === 'patient') {
      // For patient role, use the user's ID directly
      actualPatientId = user.id;
      patient = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      };
    } else {
      // For doctors/nurses/admins, first check if it's a patient ID from patients table
      const patientFromPatientsTable = await databaseManager.query(
        'SELECT p.id, p.user_id, u.first_name, u.last_name FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = $1',
        [patientId]
      );

      if (patientFromPatientsTable.rows.length > 0) {
        // It's a patient ID from patients table, use the patient_id directly
        // because appointments are stored with patients.id, not users.id
        const patientData = patientFromPatientsTable.rows[0];
        actualPatientId = patientData.id; // Use patient ID, not user ID
        patient = {
          id: patientData.id,
          first_name: patientData.first_name,
          last_name: patientData.last_name
        };
      } else {
        // Check if it's a user ID directly
        const patientExists = await databaseManager.query(
          'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2',
          [patientId, 'patient']
        );

        if (patientExists.rows.length === 0) {
          return res.status(404).json({
            data: null,
            meta: null,
            error: { message: 'Patient not found' },
            statusCode: 404
          });
        }
        
        patient = patientExists.rows[0];
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Build query for appointments
    let whereClause = 'WHERE a.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (status) {
      whereClause += ' AND a.status = $2';
      queryParams.push(status);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND DATE(a.start_time) >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND DATE(a.start_time) <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    if (type) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND a.type_id = $${paramIndex}`;
      queryParams.push(type);
    }

    // Get appointments
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.type_id,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.reason,
        a.created_at,
        a.updated_at,
        a.cancelled_at,
        a.cancelled_by,
        a.cancellation_reason,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        u.phone as doctor_phone,
        u.email as doctor_email,
        at.name as appointment_type_name,
        at.duration_minutes,
        at.color as appointment_type_color
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      LEFT JOIN appointment_types at ON a.type_id = at.id
      ${whereClause}
      ORDER BY a.start_time DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const appointmentsResult = await databaseManager.query(appointmentsQuery, queryParams);
    const appointments = appointmentsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format appointments
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      appointment_type: appointment.appointment_type,
      status: appointment.status,
      priority: appointment.priority,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      location: appointment.location,
      notes: appointment.notes,
      preparations: appointment.preparations,
      follow_up_required: appointment.follow_up_required,
      follow_up_notes: appointment.follow_up_notes,
      reminder_sent: appointment.reminder_sent,
      reminder_sent_at: appointment.reminder_sent_at,
      can_reschedule: appointment.can_reschedule,
      can_cancel: appointment.can_cancel,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      physician: {
        name: `${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
        phone: appointment.doctor_phone,
        email: appointment.doctor_email
      }
    }));

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        appointments: formattedAppointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        appointmentCount: formattedAppointments.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient appointments:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new appointment
 * POST /api/patients/{id}/appointments
 */
export const createPatientAppointment = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      title,
      description,
      appointment_type,
      priority = 'normal',
      appointment_date,
      appointment_time,
      duration_minutes = 30,
      location,
      notes,
      preparations,
      follow_up_required = false,
      follow_up_notes,
      doctor_id,
      can_reschedule = true,
      can_cancel = true
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

    // Validate physician exists
    const physicianExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND role = $2',
      [doctor_id, 'doctor']
    );

    if (physicianExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Physician not found' },
        statusCode: 404
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await databaseManager.query(`
      SELECT id FROM appointments 
      WHERE doctor_id = $1 
      AND appointment_date = $2 
      AND appointment_time = $3 
      AND status IN ('scheduled', 'confirmed')
    `, [doctor_id, appointment_date, appointment_time]);

    if (conflictingAppointment.rows.length > 0) {
      return res.status(409).json({
        data: null,
        meta: null,
        error: { message: 'Appointment time conflict with existing appointment' },
        statusCode: 409
      });
    }

    // Create appointment
    const appointmentId = uuidv4();

    // Format location as JSON if it's a string
    const locationData = typeof location === 'string' 
      ? JSON.stringify({ name: location, type: 'room' })
      : location ? JSON.stringify(location) : JSON.stringify({ name: 'ห้องตรวจ', type: 'room' });

    // Format preparations as array if it's a string
    const preparationsData = typeof preparations === 'string' 
      ? [preparations]
      : Array.isArray(preparations) ? preparations : [];

    // Map Thai appointment_type to English values for database constraint
    const appointmentTypeMap: { [key: string]: string } = {
      'ตรวจสุขภาพ': 'consultation',
      'ตรวจติดตาม': 'follow_up',
      'ตรวจรักษา': 'procedure',
      'ตรวจเลือด': '',
      'ฉุกเฉิน': 'emergency',
      'ปรึกษา': 'consultation',
      'นัดหมาย': 'consultation'
    };

    const mappedAppointmentType = appointmentTypeMap[appointment_type] || 'consultation';

    await databaseManager.query(`
      INSERT INTO appointments (
        id, patient_id, doctor_id, title, description, appointment_type,
        status, priority, appointment_date, appointment_time, duration_minutes,
        location, notes, preparations, follow_up_required, follow_up_notes,
        can_reschedule, can_cancel, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      appointmentId, patientId, doctor_id, title, description, mappedAppointmentType,
      'scheduled', priority, appointment_date, appointment_time, duration_minutes,
      locationData, notes, preparationsData, follow_up_required, follow_up_notes,
      can_reschedule, can_cancel, userId
    ]);

    // Get created appointment
    const createdAppointment = await databaseManager.query(`
      SELECT 
        a.id, a.title, a.description, a.appointment_type, a.status, a.priority,
        a.appointment_date, a.appointment_time, a.duration_minutes, a.location,
        a.notes, a.preparations, a.follow_up_required, a.follow_up_notes,
        a.can_reschedule, a.can_cancel, a.created_at,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = $1
    `, [appointmentId]);

    res.status(201).json({
      data: {
        appointment: {
          ...createdAppointment.rows[0],
          physician: {
            name: `${createdAppointment.rows[0].doctor_first_name} ${createdAppointment.rows[0].doctor_last_name}`
          }
        },
        message: 'Appointment created successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        appointmentId: appointmentId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating patient appointment:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update appointment
 * PUT /api/patients/{id}/appointments/{appointmentId}
 */
export const updatePatientAppointment = async (req: Request, res: Response) => {
  try {
    const { id: patientId, appointmentId } = req.params;
    const {
      title,
      description,
      appointment_type,
      status,
      priority,
      appointment_date,
      appointment_time,
      duration_minutes,
      location,
      notes,
      preparations,
      follow_up_required,
      follow_up_notes,
      doctor_id,
      can_reschedule,
      can_cancel
    } = req.body;

    const userId = (req as any).user.id;

    // Validate appointment exists and belongs to patient
    const appointmentExists = await databaseManager.query(`
      SELECT id, status FROM appointments 
      WHERE id = $1 AND patient_id = $2
    `, [appointmentId, patientId]);

    if (appointmentExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Appointment not found' },
        statusCode: 404
      });
    }

    const currentAppointment = appointmentExists.rows[0];

    // Check if appointment can be modified
    if (currentAppointment.status === 'completed' || currentAppointment.status === 'cancelled') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Cannot modify completed or cancelled appointment' },
        statusCode: 400
      });
    }

    // If changing physician, date, or time, check for conflicts
    if (doctor_id || appointment_date || appointment_time) {
      const conflictQuery = `
        SELECT id FROM appointments 
        WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status IN ('scheduled', 'confirmed')
        AND id != $4
      `;
      
      const conflictParams = [
        doctor_id || (await databaseManager.query('SELECT doctor_id FROM appointments WHERE id = $1', [appointmentId])).rows[0].doctor_id,
        appointment_date || (await databaseManager.query('SELECT appointment_date FROM appointments WHERE id = $1', [appointmentId])).rows[0].appointment_date,
        appointment_time || (await databaseManager.query('SELECT appointment_time FROM appointments WHERE id = $1', [appointmentId])).rows[0].appointment_time,
        appointmentId
      ];

      const conflictingAppointment = await databaseManager.query(conflictQuery, conflictParams);

      if (conflictingAppointment.rows.length > 0) {
        return res.status(409).json({
          data: null,
          meta: null,
          error: { message: 'Appointment time conflict with existing appointment' },
          statusCode: 409
        });
      }
    }

    // Update appointment
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }
    if (appointment_type !== undefined) {
      updateFields.push(`appointment_type = $${paramCount++}`);
      updateValues.push(appointment_type);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      updateValues.push(priority);
    }
    if (appointment_date !== undefined) {
      updateFields.push(`appointment_date = $${paramCount++}`);
      updateValues.push(appointment_date);
    }
    if (appointment_time !== undefined) {
      updateFields.push(`appointment_time = $${paramCount++}`);
      updateValues.push(appointment_time);
    }
    if (duration_minutes !== undefined) {
      updateFields.push(`duration_minutes = $${paramCount++}`);
      updateValues.push(duration_minutes);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramCount++}`);
      updateValues.push(location);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }
    if (preparations !== undefined) {
      updateFields.push(`preparations = $${paramCount++}`);
      updateValues.push(preparations);
    }
    if (follow_up_required !== undefined) {
      updateFields.push(`follow_up_required = $${paramCount++}`);
      updateValues.push(follow_up_required);
    }
    if (follow_up_notes !== undefined) {
      updateFields.push(`follow_up_notes = $${paramCount++}`);
      updateValues.push(follow_up_notes);
    }
    if (doctor_id !== undefined) {
      updateFields.push(`doctor_id = $${paramCount++}`);
      updateValues.push(doctor_id);
    }
    if (can_reschedule !== undefined) {
      updateFields.push(`can_reschedule = $${paramCount++}`);
      updateValues.push(can_reschedule);
    }
    if (can_cancel !== undefined) {
      updateFields.push(`can_cancel = $${paramCount++}`);
      updateValues.push(can_cancel);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateFields.push(`updated_by = $${paramCount++}`);
    updateValues.push(userId);

    updateValues.push(appointmentId);

    const updateQuery = `
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated appointment
    const updatedAppointment = await databaseManager.query(`
      SELECT 
        a.id, a.title, a.description, a.appointment_type, a.status, a.priority,
        a.appointment_date, a.appointment_time, a.duration_minutes, a.location,
        a.notes, a.preparations, a.follow_up_required, a.follow_up_notes,
        a.can_reschedule, a.can_cancel, a.updated_at,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM appointments a
      LEFT JOIN users u ON a.doctor_id = u.id
      WHERE a.id = $1
    `, [appointmentId]);

    res.json({
      data: {
        appointment: {
          ...updatedAppointment.rows[0],
          physician: {
            name: `${updatedAppointment.rows[0].doctor_first_name} ${updatedAppointment.rows[0].doctor_last_name}`
          }
        },
        message: 'Appointment updated successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating patient appointment:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Cancel appointment
 * DELETE /api/patients/{id}/appointments/{appointmentId}
 */
export const cancelPatientAppointment = async (req: Request, res: Response) => {
  try {
    const { id: patientId, appointmentId } = req.params;
    const { cancellation_reason } = req.body;

    const userId = (req as any).user.id;

    // Validate appointment exists and belongs to patient
    const appointmentExists = await databaseManager.query(`
      SELECT id, status, can_cancel FROM appointments 
      WHERE id = $1 AND patient_id = $2
    `, [appointmentId, patientId]);

    if (appointmentExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Appointment not found' },
        statusCode: 404
      });
    }

    const appointment = appointmentExists.rows[0];

    // Check if appointment can be cancelled
    if (!appointment.can_cancel) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'This appointment cannot be cancelled' },
        statusCode: 400
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Appointment is already cancelled' },
        statusCode: 400
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Cannot cancel completed appointment' },
        statusCode: 400
      });
    }

    // Cancel appointment
    await databaseManager.query(`
      UPDATE appointments 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP, updated_by = $1
      WHERE id = $2
    `, [userId, appointmentId]);

    // Create appointment history record
    await databaseManager.query(`
      INSERT INTO appointment_history (appointment_id, status, changed_at, changed_by, reason)
      VALUES ($1, 'cancelled', CURRENT_TIMESTAMP, $2, $3)
    `, [appointmentId, userId, cancellation_reason || 'Appointment cancelled']);

    res.json({
      data: {
        message: 'Appointment cancelled successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        cancelledBy: userId,
        cancellationReason: cancellation_reason
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error cancelling patient appointment:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
