import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Visit Management Controller
 * จัดการ visits สำหรับระบบ EMR
 */

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
      whereClause += ` AND v.doctor_id = $${paramCount}`;
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
      LEFT JOIN users d ON v.doctor_id = d.id
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
      LEFT JOIN users d ON v.doctor_id = d.id
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
      doctor_id,
      department_id,
      visit_type,
      chief_complaint,
      present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      doctor_notes,
      priority = 'normal'
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!patient_id || !doctor_id || !department_id || !visit_type) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: patient_id, doctor_id, department_id, visit_type' },
        statusCode: 400
      });
    }

    // Get a valid user ID if not provided
    let validUserId = doctor_id || userId;
    if (!validUserId || validUserId === '1') {
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
      validUserId = userResult.rows[0]?.id;
    }
    
    // Validate user ID exists
    if (validUserId) {
      const userExists = await databaseManager.query('SELECT id FROM users WHERE id = $1', [validUserId]);
      if (userExists.rows.length === 0) {
        const fallbackUser = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
        validUserId = fallbackUser.rows[0]?.id;
      }
    }

    // Get a valid department ID if not provided
    let validDepartmentId = department_id;
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
        id, patient_id, doctor_id, department_id, visit_number,
        visit_date, visit_time, visit_type, chief_complaint,
        present_illness, physical_examination, diagnosis,
        treatment_plan, doctor_notes, status, priority
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const now = new Date();
    const visitResult = await databaseManager.query(createVisitQuery, [
      visitId, patient_id, validUserId, validDepartmentId, visitNumber,
      now.toISOString().split('T')[0], now.toTimeString().split(' ')[0], visit_type, chief_complaint,
      present_illness, physical_examination, diagnosis,
      treatment_plan, doctor_notes, 'in_progress', priority
    ]);

    const newVisit = visitResult.rows[0];

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
    console.error('Error creating visit:', error);
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
      LEFT JOIN users d ON v.doctor_id = d.id
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
