import { Request, Response } from 'express';
import { z } from 'zod';
import { databaseManager } from '../database/connection';

// Create a database helper that combines databaseManager and DatabaseSchema
const db = {
  ...databaseManager,
  query: databaseManager.query.bind(databaseManager),
  transaction: databaseManager.transaction.bind(databaseManager),
  createAuditLog: async (logData: any) => {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await databaseManager.query(query, [
      logData.userId, logData.action, logData.resource,
      logData.resourceId, JSON.stringify(logData.details || {}),
      logData.ipAddress, logData.userAgent
    ]);
  }
};
import { 
  successResponse, 
  errorResponse
} from '../utils';

// Validation schemas
const createVisitSchema = z.object({
  patientId: z.string().uuid("Patient ID ต้องเป็น UUID"),
  visitType: z.enum(['walk_in', 'appointment', 'emergency', 'follow_up', 'referral'], {
    errorMap: () => ({ message: "ประเภทการมาพบไม่ถูกต้อง" })
  }).default('walk_in'),
  chiefComplaint: z.string().min(1, "กรุณากรอกอาการสำคัญ").max(1000),
  presentIllness: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    errorMap: () => ({ message: "ระดับความสำคัญไม่ถูกต้อง" })
  }).default('normal'),
  attendingDoctorId: z.string().uuid("Doctor ID ต้องเป็น UUID").optional(),
  assignedNurseId: z.string().uuid("Nurse ID ต้องเป็น UUID").optional(),
  departmentId: z.string().uuid("Department ID ต้องเป็น UUID").optional()
});

const updateVisitSchema = z.object({
  physicalExamination: z.string().optional(),
  diagnosis: z.string().optional(), 
  treatmentPlan: z.string().optional(),
  doctorNotes: z.string().optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)").optional(),
  followUpNotes: z.string().optional()
});

const visitSearchSchema = z.object({
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)).default("1"),
  limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().min(1).max(100)).default("20")
});

/**
 * สร้างการมาพบแพทย์ใหม่
 * POST /api/medical/visits
 */
export const createVisit = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Create visit request body:', req.body);
    console.log('🔍 User from request:', req.user);
    
    // Validate input
    const validatedData = createVisitSchema.parse(req.body);
    console.log('✅ Validated data:', validatedData);
    
    // Verify patient exists
    const patientResult = await db.query(
      'SELECT id FROM patients WHERE id = $1 AND is_active = true',
      [validatedData.patientId]
    );
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }

    // Generate visit number using database function
    const visitNumberResult = await db.query('SELECT generate_visit_number() as visit_number');
    const visitNumber = visitNumberResult.rows[0].visit_number;

    // Create visit in transaction
    const result = await db.transaction(async (client) => {
      // Insert visit
      const visitResult = await client.query(`
        INSERT INTO visits (
          patient_id, visit_number, visit_type, chief_complaint, 
          present_illness, priority, attending_doctor_id, 
          assigned_nurse_id, department_id, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
        RETURNING *
      `, [
        validatedData.patientId,
        visitNumber,
        validatedData.visitType,
        validatedData.chiefComplaint,
        validatedData.presentIllness || null,
        validatedData.priority,
        validatedData.attendingDoctorId || null,
        validatedData.assignedNurseId || null,
        validatedData.departmentId || null,
        req.user?.id
      ]);
      
      return visitResult.rows[0];
    });

    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'CREATE_VISIT',
      resource: 'VISIT',
      resourceId: result.id,
      details: { 
        visitNumber: result.visit_number, 
        patientId: validatedData.patientId,
        visitType: validatedData.visitType 
      },
      ipAddress: req.ip || 'unknown'
    });

    // Return visit data (mapped to camelCase)
    const visitData = {
      id: result.id,
      patientId: result.patient_id,
      visitNumber: result.visit_number,
      visitDate: result.visit_date,
      visitTime: result.visit_time,
      visitType: result.visit_type,
      chiefComplaint: result.chief_complaint,
      presentIllness: result.present_illness,
      physicalExamination: result.physical_examination,
      diagnosis: result.diagnosis,
      treatmentPlan: result.treatment_plan,
      doctorNotes: result.doctor_notes,
      status: result.status,
      priority: result.priority,
      attendingDoctorId: result.attending_doctor_id,
      assignedNurseId: result.assigned_nurse_id,
      departmentId: result.department_id,
      followUpRequired: result.follow_up_required,
      followUpDate: result.follow_up_date,
      followUpNotes: result.follow_up_notes,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };

    res.status(201).json(
      successResponse('สร้างการมาพบแพทย์สำเร็จ', visitData)
    );

  } catch (error) {
    console.error('❌ Create visit error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.errors);
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ดูข้อมูลการมาพบแพทย์
 * GET /api/medical/visits/:id
 */
export const getVisit = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    // Get visit with related data
    const result = await db.query(`
      SELECT 
        v.*,
        p.hospital_number, p.first_name, p.last_name, p.thai_name,
        d_doctor.first_name as doctor_first_name, d_doctor.last_name as doctor_last_name,
        d_nurse.first_name as nurse_first_name, d_nurse.last_name as nurse_last_name,
        dept.department_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users d_doctor ON v.attending_doctor_id = d_doctor.id
      LEFT JOIN users d_nurse ON v.assigned_nurse_id = d_nurse.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      WHERE v.id = $1
    `, [visitId]);

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลการมาพบแพทย์', 404)
      );
    }

    const visit = result.rows[0];

    // Format response data
    const visitData = {
      id: visit.id,
      patientId: visit.patient_id,
      visitNumber: visit.visit_number,
      visitDate: visit.visit_date,
      visitTime: visit.visit_time,
      visitType: visit.visit_type,
      chiefComplaint: visit.chief_complaint,
      presentIllness: visit.present_illness,
      physicalExamination: visit.physical_examination,
      diagnosis: visit.diagnosis,
      treatmentPlan: visit.treatment_plan,
      doctorNotes: visit.doctor_notes,
      status: visit.status,
      priority: visit.priority,
      followUpRequired: visit.follow_up_required,
      followUpDate: visit.follow_up_date,
      followUpNotes: visit.follow_up_notes,
      createdAt: visit.created_at,
      updatedAt: visit.updated_at,
      // Related data
      patient: {
        hospitalNumber: visit.hospital_number,
        firstName: visit.first_name,
        lastName: visit.last_name,
        thaiName: visit.thai_name
      },
      attendingDoctor: visit.doctor_first_name ? {
        firstName: visit.doctor_first_name,
        lastName: visit.doctor_last_name
      } : null,
      assignedNurse: visit.nurse_first_name ? {
        firstName: visit.nurse_first_name,
        lastName: visit.nurse_last_name
      } : null,
      department: visit.department_name ? {
        name: visit.department_name
      } : null
    };

    res.json(
      successResponse('ดึงข้อมูลการมาพบแพทย์สำเร็จ', visitData)
    );

  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * อัปเดตข้อมูลการมาพบแพทย์
 * PUT /api/medical/visits/:id
 */
export const updateVisit = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    // Validate input
    const validatedData = updateVisitSchema.parse(req.body);
    
    // Check if visit exists
    const existingVisit = await db.query('SELECT id FROM visits WHERE id = $1', [visitId]);
    if (existingVisit.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลการมาพบแพทย์', 404)
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      physicalExamination: 'physical_examination',
      diagnosis: 'diagnosis',
      treatmentPlan: 'treatment_plan',
      doctorNotes: 'doctor_notes',
      status: 'status',
      followUpRequired: 'follow_up_required',
      followUpDate: 'follow_up_date',
      followUpNotes: 'follow_up_notes'
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(validatedData[key as keyof typeof validatedData]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่มีข้อมูลที่ต้องอัปเดต', 400)
      );
    }

    // Add updated_by and updated_at
    updates.push(`updated_by = $${paramIndex}`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user?.id, visitId);

    const result = await db.query(`
      UPDATE visits 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `, values);

    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_VISIT',
      resource: 'VISIT',
      resourceId: visitId,
      details: validatedData,
      ipAddress: req.ip || 'unknown'
    });

    const updatedVisit = result.rows[0];

    // Format response data
    const visitData = {
      id: updatedVisit.id,
      patientId: updatedVisit.patient_id,
      visitNumber: updatedVisit.visit_number,
      visitDate: updatedVisit.visit_date,
      visitTime: updatedVisit.visit_time,
      visitType: updatedVisit.visit_type,
      chiefComplaint: updatedVisit.chief_complaint,
      presentIllness: updatedVisit.present_illness,
      physicalExamination: updatedVisit.physical_examination,
      diagnosis: updatedVisit.diagnosis,
      treatmentPlan: updatedVisit.treatment_plan,
      doctorNotes: updatedVisit.doctor_notes,
      status: updatedVisit.status,
      priority: updatedVisit.priority,
      followUpRequired: updatedVisit.follow_up_required,
      followUpDate: updatedVisit.follow_up_date,
      followUpNotes: updatedVisit.follow_up_notes,
      createdAt: updatedVisit.created_at,
      updatedAt: updatedVisit.updated_at
    };

    res.json(
      successResponse('อัปเดตการมาพบแพทย์สำเร็จ', visitData)
    );

  } catch (error) {
    console.error('Update visit error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ดูประวัติการมาพบแพทย์ของผู้ป่วย
 * GET /api/medical/patients/:patientId/visits
 */
export const getPatientVisits = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Validate UUID
    if (!patientId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Patient ID ไม่ถูกต้อง', 400)
      );
    }

    // Check if patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }

    // Build query
    let query = `
      SELECT 
        v.*,
        d_doctor.first_name as doctor_first_name, d_doctor.last_name as doctor_last_name,
        dept.department_name
      FROM visits v
      LEFT JOIN users d_doctor ON v.attending_doctor_id = d_doctor.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      WHERE v.patient_id = $1
    `;
    
    const queryParams: any[] = [patientId];
    let paramIndex = 2;

    if (status) {
      query += ` AND v.status = $${paramIndex}`;
      queryParams.push(status as string);
      paramIndex++;
    }

    query += ` ORDER BY v.visit_date DESC, v.visit_time DESC`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM visits WHERE patient_id = $1';
    let countParams = [patientId];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status as string);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].count);

    // Format response data
    const visits = result.rows.map(visit => ({
      id: visit.id,
      visitNumber: visit.visit_number,
      visitDate: visit.visit_date,
      visitTime: visit.visit_time,
      visitType: visit.visit_type,
      chiefComplaint: visit.chief_complaint,
      diagnosis: visit.diagnosis,
      status: visit.status,
      priority: visit.priority,
      attendingDoctor: visit.doctor_first_name ? {
        firstName: visit.doctor_first_name,
        lastName: visit.doctor_last_name
      } : null,
      department: visit.department_name ? {
        name: visit.department_name
      } : null,
      createdAt: visit.created_at
    }));

    const metadata = {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / Number(limit))
    };

    res.json(
      successResponse('ดึงประวัติการมาพบแพทย์สำเร็จ', visits, metadata)
    );

  } catch (error) {
    console.error('Get patient visits error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ค้นหาการมาพบแพทย์
 * GET /api/medical/visits/search
 */
export const searchVisits = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedQuery = visitSearchSchema.parse({
      patientId: req.query.patientId,
      doctorId: req.query.doctorId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status,
      page: req.query.page || "1",
      limit: req.query.limit || "20"
    });

    // Build search query
    let query = `
      SELECT 
        v.*,
        p.hospital_number, p.first_name, p.last_name, p.thai_name,
        d_doctor.first_name as doctor_first_name, d_doctor.last_name as doctor_last_name,
        dept.department_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users d_doctor ON v.attending_doctor_id = d_doctor.id
      LEFT JOIN departments dept ON v.department_id = dept.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (validatedQuery.patientId) {
      query += ` AND v.patient_id = $${paramIndex}`;
      queryParams.push(validatedQuery.patientId);
      paramIndex++;
    }

    if (validatedQuery.doctorId) {
      query += ` AND v.attending_doctor_id = $${paramIndex}`;
      queryParams.push(validatedQuery.doctorId);
      paramIndex++;
    }

    if (validatedQuery.dateFrom) {
      query += ` AND v.visit_date >= $${paramIndex}`;
      queryParams.push(validatedQuery.dateFrom);
      paramIndex++;
    }

    if (validatedQuery.dateTo) {
      query += ` AND v.visit_date <= $${paramIndex}`;
      queryParams.push(validatedQuery.dateTo);
      paramIndex++;
    }

    if (validatedQuery.status) {
      query += ` AND v.status = $${paramIndex}`;
      queryParams.push(validatedQuery.status);
      paramIndex++;
    }

    query += ` ORDER BY v.visit_date DESC, v.visit_time DESC`;

    // Pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(validatedQuery.limit, offset);

    const result = await db.query(query, queryParams);

    // Format response data
    const visits = result.rows.map(visit => ({
      id: visit.id,
      visitNumber: visit.visit_number,
      visitDate: visit.visit_date,
      visitTime: visit.visit_time,
      visitType: visit.visit_type,
      chiefComplaint: visit.chief_complaint,
      diagnosis: visit.diagnosis,
      status: visit.status,
      priority: visit.priority,
      patient: {
        hospitalNumber: visit.hospital_number,
        firstName: visit.first_name,
        lastName: visit.last_name,
        thaiName: visit.thai_name
      },
      attendingDoctor: visit.doctor_first_name ? {
        firstName: visit.doctor_first_name,
        lastName: visit.doctor_last_name
      } : null,
      department: visit.department_name ? {
        name: visit.department_name
      } : null,
      createdAt: visit.created_at
    }));

    const metadata = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalItems: visits.length
    };

    res.json(
      successResponse('ค้นหาการมาพบแพทย์สำเร็จ', visits, metadata)
    );

  } catch (error) {
    console.error('Search visits error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลการค้นหาไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * จบการมาพบแพทย์
 * PUT /api/medical/visits/:id/complete
 */
export const completeVisit = async (req: Request, res: Response) => {
  try {
    const visitId = req.params.id;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    // Update visit status to completed
    const result = await db.query(`
      UPDATE visits 
      SET status = 'completed', updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status IN ('in_progress', 'checked_in')
      RETURNING *
    `, [req.user?.id, visitId]);

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบการมาพบแพทย์ที่สามารถจบได้', 404)
      );
    }

    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'COMPLETE_VISIT',
      resource: 'VISIT',
      resourceId: visitId,
      details: { previousStatus: 'in_progress', newStatus: 'completed' },
      ipAddress: req.ip || 'unknown'
    });

    const visit = result.rows[0];

    // Format response data
    const visitData = {
      id: visit.id,
      visitNumber: visit.visit_number,
      status: visit.status,
      updatedAt: visit.updated_at
    };

    res.json(
      successResponse('จบการมาพบแพทย์สำเร็จ', visitData)
    );

  } catch (error) {
    console.error('Complete visit error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};
