import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notificationService';

/**
 * Visit Management Controller
 * จัดการ visits สำหรับระบบ EMR
 */

/**
 * Send notification to patient when visit is created
 */
async function sendPatientVisitNotification(visit: any, doctorId: string, queueCount: number, createdBy: string) {
  try {
    // Get patient information
    const patientQuery = `
      SELECT 
        p.id,
        p.hospital_number,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.phone,
        p.email,
        p.user_id,
        u.username,
        u.email as user_email
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    const patientResult = await databaseManager.query(patientQuery, [visit.patient_id]);
    
    if (patientResult.rows.length === 0) {
      return;
    }
    
    const patient = patientResult.rows[0];
    
    // Get doctor information
    const doctorQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.thai_name,
        d.department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `;
    const doctorResult = await databaseManager.query(doctorQuery, [doctorId]);
    
    if (doctorResult.rows.length === 0) {
      return;
    }
    
    const doctor = doctorResult.rows[0];
    
    // Get creator information
    const creatorQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.thai_name
      FROM users u
      WHERE u.id = $1
    `;
    const creatorResult = await databaseManager.query(creatorQuery, [createdBy]);
    const creator = creatorResult.rows[0];
    
    // Use NotificationService to send notification
    await NotificationService.sendPatientNotification({
      patientId: patient.id,
      patientHn: patient.hospital_number || '',
      patientName: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
      patientPhone: patient.phone,
      patientEmail: patient.email || patient.user_email,
      notificationType: 'queue_created',
      title: `ได้รับหมายเลขคิว ${visit.visit_number}`,
      message: `คุณ ${patient.thai_name || patient.first_name} ได้รับหมายเลขคิว ${visit.visit_number} สำหรับตรวจกับ ${doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`}`,
      recordType: 'visit',
      recordId: visit.id,
      createdBy: createdBy,
      createdByName: creator ? (creator.thai_name || `${creator.first_name} ${creator.last_name}`) : 'ระบบ',
      metadata: {
        visitNumber: visit.visit_number,
        hospitalNumber: patient.hospital_number,
        doctorName: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
        department: doctor.department_name,
        queuePosition: queueCount,
        estimatedWaitTime: queueCount * 15, // 15 minutes per patient
        visitDate: visit.visit_date,
        visitTime: visit.visit_time,
        visitType: visit.visit_type,
        chiefComplaint: visit.chief_complaint
      }
    });
  } catch (error) {
    console.error('❌ Error sending patient visit notification:', error);
    throw error;
  }
}

/**
 * Get all visits
 * GET /api/medical/visits
 */
export const getAllVisits = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      patient_id,
      doctor_id,
      department_id,
      status,
      visit_type,
      start_date,
      end_date,
      sortBy = 'visit_date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (patient_id) {
      paramCount++;
      whereClause += ` AND v.patient_id = $${paramCount}`;
      queryParams.push(patient_id);
    }

    if (doctor_id) {
      paramCount++;
      whereClause += ` AND v.attending_doctor_id = $${paramCount}`;
      queryParams.push(doctor_id);
    }

    if (department_id) {
      paramCount++;
      whereClause += ` AND v.department_id = $${paramCount}`;
      queryParams.push(department_id);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND v.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (visit_type) {
      paramCount++;
      whereClause += ` AND v.visit_type = $${paramCount}`;
      queryParams.push(visit_type);
    }

    if (start_date) {
      paramCount++;
      whereClause += ` AND v.visit_date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND v.visit_date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    // Validate sortBy
    const allowedSortFields = ['visit_date', 'created_at', 'visit_number'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'visit_date';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get visits with pagination
    const visitsQuery = `
      SELECT 
        v.id,
        v.visit_number,
        v.visit_date,
        v.visit_time,
        v.visit_type,
        v.chief_complaint,
        v.present_illness,
        v.physical_examination,
        v.diagnosis,
        v.treatment_plan,
        v.doctor_notes,
        v.status,
        v.priority,
        v.created_at,
        v.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.thai_name as patient_thai_name,
        p.hospital_number,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        dept.department_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users d ON v.attending_doctor_id = d.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      ${whereClause}
      ORDER BY v.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const visitsResult = await databaseManager.query(visitsQuery, queryParams);
    const visits = visitsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users d ON v.attending_doctor_id = d.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format visits data
    const formattedVisits = visits.map(visit => ({
      id: visit.id,
      visit_number: visit.visit_number,
      visit_date: visit.visit_date,
      visit_time: visit.visit_time,
      visit_type: visit.visit_type,
      chief_complaint: visit.chief_complaint,
      present_illness: visit.present_illness,
      physical_examination: visit.physical_examination,
      diagnosis: visit.diagnosis,
      treatment_plan: visit.treatment_plan,
      doctor_notes: visit.doctor_notes,
      status: visit.status,
      priority: visit.priority,
      patient: {
        id: visit.patient_id,
        name: visit.patient_thai_name || `${visit.patient_first_name} ${visit.patient_last_name}`,
        hospital_number: visit.hospital_number
      },
      doctor: {
        id: visit.doctor_id,
        name: `${visit.doctor_first_name} ${visit.doctor_last_name}`
      },
      department: visit.department_name,
      created_at: visit.created_at,
      updated_at: visit.updated_at
    }));

    res.json({
      data: {
        visits: formattedVisits,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        visitCount: formattedVisits.length,
        filters: {
          patient_id,
          doctor_id,
          department_id,
          status,
          visit_type,
          start_date,
          end_date,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting all visits:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new visit
 * POST /api/medical/visits
 */
export const createVisit = async (req: Request, res: Response) => {
  try {
    const {
      patient_id,
      patientId, // Support camelCase from frontend
      doctor_id,
      attendingDoctorId, // Support camelCase from frontend
      department_id,
      departmentId, // Support camelCase from frontend
      visit_type,
      visitType, // Support camelCase from frontend
      visit_time,
      visitTime, // Support camelCase from frontend
      chief_complaint,
      chiefComplaint, // Support camelCase from frontend
      present_illness,
      presentIllness, // Support camelCase from frontend
      physical_examination,
      physicalExamination, // Support camelCase from frontend
      diagnosis,
      treatment_plan,
      treatmentPlan, // Support camelCase from frontend
      doctor_notes,
      doctorNotes, // Support camelCase from frontend
      priority = 'normal'
    } = req.body;
    
    // Normalize field names (prefer snake_case from database, fallback to camelCase from frontend)
    const normalizedData = {
      patient_id: patient_id || patientId,
      doctor_id: doctor_id || attendingDoctorId,
      department_id: department_id || departmentId,
      visit_type: visit_type || visitType,
      visit_time: visit_time || visitTime,
      chief_complaint: chief_complaint || chiefComplaint,
      present_illness: present_illness || presentIllness,
      physical_examination: physical_examination || physicalExamination,
      diagnosis: diagnosis,
      treatment_plan: treatment_plan || treatmentPlan,
      doctor_notes: doctor_notes || doctorNotes,
      priority: priority
    };
    const userId = (req as any).user.id;
    // Validate required fields using normalized data
    if (!normalizedData.patient_id || !normalizedData.doctor_id || !normalizedData.visit_type) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: patient_id, doctor_id, visit_type' },
        statusCode: 400
      });
    }

    // Get a valid user ID if not provided
    let validUserId = normalizedData.doctor_id || userId;
    // Check if validUserId is a doctor_id or user_id
    let isDoctorId = false;
    try {
      // First check if it's a doctor_id
      const doctorCheckQuery = 'SELECT user_id FROM doctors WHERE id = $1';
      const doctorCheckResult = await databaseManager.query(doctorCheckQuery, [validUserId]);
      if (doctorCheckResult.rows.length > 0) {
        validUserId = doctorCheckResult.rows[0].user_id;
        isDoctorId = true;
      } else {
      }
    } catch (error) {
      console.error('Error checking doctor_id:', error);
    }
    
    // Validate user ID exists
    if (validUserId) {
      const userExists = await databaseManager.query('SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true', [validUserId, 'doctor']);
      if (userExists.rows.length === 0) {
        const fallbackUser = await databaseManager.query('SELECT id FROM users WHERE role = $1 AND is_active = true LIMIT 1', ['doctor']);
        if (fallbackUser.rows.length > 0) {
          validUserId = fallbackUser.rows[0].id;
        } else {
          return res.status(404).json({
            data: null,
            meta: null,
            error: { message: 'No active doctors found' },
            statusCode: 404
          });
        }
      } else {
      }
    } else {
      // If no validUserId, get a fallback doctor
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
      validUserId = userResult.rows[0]?.id;
    }
    
    // Final fallback: if still no valid doctor, use the current user (who is a doctor)
    if (!validUserId) {
      validUserId = userId;
    }

    // Get a valid department ID if not provided
    let validDepartmentId = normalizedData.department_id;
    if (!validDepartmentId) {
      const deptResult = await databaseManager.query('SELECT id FROM departments LIMIT 1');
      validDepartmentId = deptResult.rows[0]?.id;
    }

    // Generate visit number
    const visitNumber = await generateVisitNumber();

    // Create visit
    const visitId = uuidv4();
    const createVisitQuery = `
      INSERT INTO visits (
        id, patient_id, attending_doctor_id, department_id, visit_number,
        visit_date, visit_time, visit_type, chief_complaint,
        present_illness, physical_examination, diagnosis,
        treatment_plan, doctor_notes, status, priority, created_by, updated_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `;

    // Parse visit time from frontend or use current time as fallback
    let visitDate, visitTimeStr;
    if (normalizedData.visit_time) {
      const visitDateTime = new Date(normalizedData.visit_time);
      
      // Handle timezone issues - use local date and time
      const year = visitDateTime.getFullYear();
      const month = String(visitDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(visitDateTime.getDate()).padStart(2, '0');
      const hours = String(visitDateTime.getHours()).padStart(2, '0');
      const minutes = String(visitDateTime.getMinutes()).padStart(2, '0');
      const seconds = String(visitDateTime.getSeconds()).padStart(2, '0');
      
      visitDate = `${year}-${month}-${day}`;
      visitTimeStr = `${hours}:${minutes}:${seconds}`;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      visitDate = `${year}-${month}-${day}`;
      visitTimeStr = `${hours}:${minutes}:${seconds}`;
    }
    // Check for duplicate visit (same patient, same day) - ห้ามเช็คอินผู้ป่วยซ้ำ
    try {
      const duplicateCheckQuery = `
        SELECT id, visit_number, status, attending_doctor_id, visit_date
        FROM visits v
        WHERE v.patient_id = $1
          AND DATE(v.visit_date) = $2
          AND v.status IN ('in_progress', 'pending', 'checked_in')
      `;
      const duplicateResult = await databaseManager.query(duplicateCheckQuery, [
        normalizedData.patient_id, 
        visitDate
      ]);
      
      if (duplicateResult.rows.length > 0) {
        const existingVisit = duplicateResult.rows[0];
        return res.status(409).json({
          data: null,
          meta: null,
          error: { 
            message: `ผู้ป่วยนี้ได้เช็คอินแล้วในวันนี้ (หมายเลขคิว: ${existingVisit.visit_number})`,
            code: 'DUPLICATE_VISIT',
            existingVisit: existingVisit
          },
          statusCode: 409
        });
      }
    } catch (error) {
      console.error('Error checking for duplicate visit:', error);
    }

    // Log queue information before creating visit
    try {
      const queueCheckQuery = `
        SELECT COUNT(*) as current_queue
        FROM visits v
        WHERE v.attending_doctor_id = $1
          AND v.status = 'in_progress'
          AND DATE(v.visit_date) = CURRENT_DATE
      `;
      const queueResult = await databaseManager.query(queueCheckQuery, [validUserId]);
      const currentQueue = parseInt(queueResult.rows[0]?.current_queue || '0');
    } catch (error) {
      console.error('Error checking current queue:', error);
    }
    
    const visitResult = await databaseManager.query(createVisitQuery, [
      visitId, normalizedData.patient_id, validUserId, validDepartmentId, visitNumber,
      visitDate, visitTimeStr, normalizedData.visit_type, normalizedData.chief_complaint,
      normalizedData.present_illness, normalizedData.physical_examination, normalizedData.diagnosis,
      normalizedData.treatment_plan, normalizedData.doctor_notes, 'in_progress', normalizedData.priority,
      validUserId, validUserId // created_by, updated_by
    ]);

    const newVisit = visitResult.rows[0];

    // Get updated queue count after creating visit
    let updatedQueueCount = 0;
    try {
      const updatedQueueQuery = `
        SELECT COUNT(*) as updated_queue
        FROM visits v
        WHERE v.attending_doctor_id = $1
          AND v.status = 'in_progress'
          AND DATE(v.visit_date) = CURRENT_DATE
      `;
      const updatedQueueResult = await databaseManager.query(updatedQueueQuery, [validUserId]);
      updatedQueueCount = parseInt(updatedQueueResult.rows[0]?.updated_queue || '0');
    } catch (error) {
      console.error('Error checking updated queue:', error);
    }

    // Send notification to patient
    try {
      await sendPatientVisitNotification(newVisit, validUserId, updatedQueueCount, validUserId);
    } catch (notificationError) {
      console.error('Failed to send patient notification:', notificationError);
      // Don't fail the visit creation if notification fails
    }

    res.status(201).json({
      data: {
        visit: {
          id: newVisit.id,
          visit_number: newVisit.visit_number,
          patient_id: newVisit.patient_id,
          doctor_id: newVisit.doctor_id,
          department_id: newVisit.department_id,
          visit_type: newVisit.visit_type,
          status: newVisit.status,
          created_at: newVisit.created_at
        },
        queueInfo: {
          currentQueue: updatedQueueCount,
          estimatedWaitTime: updatedQueueCount * 15, // 15 minutes per patient
          queuePosition: updatedQueueCount
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: validUserId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('❌ Error creating visit:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get visit by ID
 * GET /api/medical/visits/{id}
 */
export const getVisitById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get visit details
    const visitQuery = `
      SELECT 
        v.id,
        v.visit_number,
        v.visit_date,
        v.visit_time,
        v.visit_type,
        v.chief_complaint,
        v.present_illness,
        v.physical_examination,
        v.diagnosis,
        v.treatment_plan,
        v.doctor_notes,
        v.status,
        v.priority,
        v.created_at,
        v.updated_at,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.thai_name as patient_thai_name,
        p.hospital_number,
        p.birth_date,
        p.gender,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        dept.department_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users d ON v.attending_doctor_id = d.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      WHERE v.id = $1
    `;

    const visitResult = await databaseManager.query(visitQuery, [id]);
    
    if (visitResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Visit not found' },
        statusCode: 404
      });
    }

    const visit = visitResult.rows[0];

    // Get related data
    const [vitalSigns, labOrders, prescriptions] = await Promise.all([
      databaseManager.query(`
        SELECT * FROM vital_signs WHERE visit_id = $1 ORDER BY measurement_time DESC
      `, [id]),
      databaseManager.query(`
        SELECT * FROM lab_orders WHERE visit_id = $1 ORDER BY order_date DESC
      `, [id]),
      databaseManager.query(`
        SELECT * FROM prescriptions WHERE visit_id = $1 ORDER BY prescription_date DESC
      `, [id])
    ]);

    // Format visit data
    const formattedVisit = {
      id: visit.id,
      visit_number: visit.visit_number,
      visit_date: visit.visit_date,
      visit_time: visit.visit_time,
      visit_type: visit.visit_type,
      chief_complaint: visit.chief_complaint,
      present_illness: visit.present_illness,
      physical_examination: visit.physical_examination,
      diagnosis: visit.diagnosis,
      treatment_plan: visit.treatment_plan,
      doctor_notes: visit.doctor_notes,
      status: visit.status,
      priority: visit.priority,
      patient: {
        id: visit.patient_id,
        name: visit.patient_thai_name || `${visit.patient_first_name} ${visit.patient_last_name}`,
        hospital_number: visit.hospital_number,
        birth_date: visit.birth_date,
        gender: visit.gender,
        age: visit.birth_date ? calculateAge(visit.birth_date) : null
      },
      doctor: {
        id: visit.doctor_id,
        name: `${visit.doctor_first_name} ${visit.doctor_last_name}`
      },
      department: visit.department_name,
      vital_signs: vitalSigns.rows,
      lab_orders: labOrders.rows,
      prescriptions: prescriptions.rows,
      created_at: visit.created_at,
      updated_at: visit.updated_at
    };

    res.json({
      data: {
        visit: formattedVisit
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting visit by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update visit
 * PUT /api/medical/visits/{id}
 */
export const updateVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if visit exists
    const visitExists = await databaseManager.query(
      'SELECT id FROM visits WHERE id = $1',
      [id]
    );

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Visit not found' },
        statusCode: 404
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'chief_complaint', 'present_illness', 'physical_examination', 'diagnosis',
      'treatment_plan', 'doctor_notes', 'status', 'priority'
    ];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'No valid fields to update' },
        statusCode: 400
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE visits 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedVisit = updateResult.rows[0];

    res.json({
      data: {
        visit: {
          id: updatedVisit.id,
          visit_number: updatedVisit.visit_number,
          status: updatedVisit.status,
          updated_at: updatedVisit.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedFields: Object.keys(updateData)
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Complete visit
 * POST /api/medical/visits/{id}/complete
 */
export const completeVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { final_diagnosis, treatment_summary, follow_up_instructions } = req.body;

    // Check if visit exists
    const visitExists = await databaseManager.query(
      'SELECT id, status FROM visits WHERE id = $1',
      [id]
    );

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Visit not found' },
        statusCode: 404
      });
    }

    const visit = visitExists.rows[0];

    if (visit.status === 'completed') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Visit is already completed' },
        statusCode: 400
      });
    }

    // Update visit to completed
    const updateQuery = `
      UPDATE visits 
      SET 
        status = 'completed',
        diagnosis = COALESCE($1, diagnosis),
        treatment_plan = COALESCE($2, treatment_plan),
        doctor_notes = COALESCE($3, doctor_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, [
      final_diagnosis, treatment_summary, follow_up_instructions, id
    ]);

    const completedVisit = updateResult.rows[0];

    res.json({
      data: {
        visit: {
          id: completedVisit.id,
          visit_number: completedVisit.visit_number,
          status: completedVisit.status,
          completed_at: completedVisit.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        message: 'Visit completed successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error completing visit:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Helper function to calculate age
 */
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Helper function to generate visit number
 */
async function generateVisitNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await databaseManager.query(`
    SELECT COUNT(*) as count 
    FROM visits 
    WHERE visit_number LIKE $1
  `, [`V${year}%`]);
  
  const count = parseInt(result.rows[0].count) + 1;
  return `V${year}${count.toString().padStart(6, '0')}`;
}
