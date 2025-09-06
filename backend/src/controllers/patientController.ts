import { Request, Response, NextFunction } from 'express';
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
  errorResponse,
  generateHospitalNumber
} from '../utils';
import { DatabaseSerializer, FieldTransformer } from '../utils/serializer';
import { 
  CreatePatientRequestSchema, 
  UpdatePatientRequestSchema, 
  PatientQuerySchema,
  AppError,
  ErrorTypes
} from '../schemas/common';

// Validation schemas - using shared schemas
const createPatientSchema = CreatePatientRequestSchema;
const updatePatientSchema = UpdatePatientRequestSchema;
const searchPatientSchema = PatientQuerySchema;

/**
 * สร้างผู้ป่วยใหม่
 * POST /api/medical/patients
 */
export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validatedData = createPatientSchema.parse(req.body);
    
    // Check if patient already exists with this national ID
    const existingPatient = await db.query(
      'SELECT id FROM patients WHERE email = $1',
      [validatedData.nationalId]
    );
    
    if (existingPatient.rows.length > 0) {
      throw ErrorTypes.CONFLICT('ผู้ป่วยที่มีเลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว');
    }
    
    // Generate Hospital Number (HN)
    const hn = await generateHospitalNumber();
    
    // Transform request data to database format
    const dbData = FieldTransformer.transformRequestToDb(validatedData, 'patient');
    
    // Create patient in transaction
    const result = await db.transaction(async (client) => {
      // Parse Thai name to extract first and last names
      const nameParts = (dbData.thai_name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';
      
      // Insert patient (using actual database schema)
      const patientResult = await client.query(`
        INSERT INTO patients (
          hospital_number, first_name, last_name, 
          gender, date_of_birth, phone, email, address,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        validatedData.hospitalNumber, // Use the hospital number from request
        validatedData.firstName,
        validatedData.lastName,
        validatedData.gender,
        validatedData.dateOfBirth,
        validatedData.phone || null,
        validatedData.email || null,
        validatedData.address || null,
        req.user?.id
      ]);
      
      const patient = patientResult.rows[0];
      
      // Insert emergency contact if provided
      if (dbData.emergency_contact) {
        await client.query(`
          UPDATE patients SET 
            emergency_contact_name = $1,
            emergency_contact_phone = $2,
            emergency_contact_relationship = $3
          WHERE id = $4
        `, [
          validatedData.emergencyContactName,
          validatedData.emergencyContactPhone,
          validatedData.emergencyContactRelation,
          patient.id
        ]);
      }
      
      return patient;
    });
    
    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'CREATE_PATIENT',
      resource: 'PATIENT',
      resourceId: result.id,
      details: { hospitalNumber: result.hospital_number },
      ipAddress: req.ip || 'unknown'
    });
    
    // Return patient data (mapped to camelCase)
    const patientData = {
      id: result.id,
      hospitalNumber: result.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: result.first_name,
      lastName: result.last_name,
      thaiName: null, // Not available in current schema
      gender: result.gender,
      birthDate: result.date_of_birth,
      phone: result.phone,
      email: result.email,
      address: result.address || null,
      emergencyContact: null, // Not available in current schema
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
    
    // Transform response to camelCase
    const transformedResult = FieldTransformer.transformPatient(result);
    
    // Return success response using serializer
    const response = DatabaseSerializer.toApiResponse(transformedResult, null);
    response.statusCode = 201;
    
    return res.status(201).json(response);
  } catch (error) {
    next(error); // Pass to error handler
  }
};

/**
 * ดึงข้อมูลผู้ป่วยตาม ID หรือ HN
 * GET /api/patients/:identifier
 */
export const getPatient = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is UUID (ID) or hospital number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const field = isUUID ? 'id' : 'hospital_number';
    
    // Get patient
    const result = await db.query(`
      SELECT *
      FROM patients 
      WHERE ${field} = $1
    `, [identifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }
    
    const patient = result.rows[0];
    
    // Map to camelCase
    const patientData = {
      id: patient.id,
      hospitalNumber: patient.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: patient.first_name,
      lastName: patient.last_name,
      thaiName: null, // Not available in current schema
      gender: patient.gender,
      birthDate: patient.date_of_birth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address || null,
      emergencyContact: null, // Not available in current schema
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    };
    
    res.json(successResponse('ดึงข้อมูลผู้ป่วยสำเร็จ', patientData));
    
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย', 500)
    );
  }
};

/**
 * ค้นหาผู้ป่วย
 * GET /api/patients/search
 */
export const searchPatients = async (req: Request, res: Response) => {
  try {
    const { search, page, pageSize } = searchPatientSchema.parse({
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20
    });
    
    const offset = (page - 1) * pageSize;
    
    let searchQuery = '';
    let searchParams: any[] = [];
    
    if (search) {
      // Simple search across multiple fields
      searchQuery = 'WHERE (phone ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)';
      searchParams = [`%${search}%`];
    }
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM patients 
      ${searchQuery}
    `, searchParams);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Get patients
    const result = await db.query(`
      SELECT 
        id, first_name, last_name, 
        gender, date_of_birth, phone, email,
        created_at, updated_at
      FROM patients 
      ${searchQuery}
      ORDER BY created_at DESC
      LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2}
    `, [...searchParams, pageSize, offset]);
    
    const patients = result.rows.map(row => ({
      id: row.id,
      hospitalNumber: row.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: row.first_name,
      lastName: row.last_name,
      thaiName: row.thai_name,
      gender: row.gender,
      birthDate: row.date_of_birth,
      phone: row.phone,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    const totalPages = Math.ceil(total / pageSize);
    
    res.json(successResponse('ค้นหาผู้ป่วยสำเร็จ', patients, {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }));
    
  } catch (error) {
    console.error('Search patients error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลการค้นหาไม่ถูกต้อง', 400, error.errors.map(e => e.message))
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการค้นหาผู้ป่วย', 500)
    );
  }
};

/**
 * อัปเดตข้อมูลผู้ป่วย
 * PUT /api/patients/:id
 */
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updatePatientSchema.parse(req.body);
    
    // Check if patient exists
    const existingPatient = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    
    if (existingPatient.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;
    
    if (validatedData.thaiName) {
      updateFields.push(`thai_name = $${paramCount++}`);
      updateValues.push(validatedData.thaiName);
    }
    
    if (validatedData.phone) {
      updateFields.push(`phone = $${paramCount++}`);
      updateValues.push(validatedData.phone);
    }
    
    if (validatedData.email) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(validatedData.email);
    }
    
    if (validatedData.address) {
      updateFields.push(`address = $${paramCount++}`);
      updateValues.push(validatedData.address);
    }
    
    if (validatedData.district) {
      updateFields.push(`district = $${paramCount++}`);
      updateValues.push(validatedData.district);
    }
    
    if (validatedData.province) {
      updateFields.push(`province = $${paramCount++}`);
      updateValues.push(validatedData.province);
    }
    
    if (validatedData.postalCode) {
      updateFields.push(`postal_code = $${paramCount++}`);
      updateValues.push(validatedData.postalCode);
    }
    
    updateFields.push(`updated_at = NOW()`);
    
    updateValues.push(id); // WHERE condition
    
    const result = await db.query(`
      UPDATE patients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);
    
    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_PATIENT',
      resource: 'PATIENT',
      resourceId: id,
      details: validatedData,
      ipAddress: req.ip || 'unknown'
    });
    
    const patient = result.rows[0];
    const patientData = {
      id: patient.id,
      hospitalNumber: patient.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: patient.first_name,
      lastName: patient.last_name,
      thaiName: patient.thai_name,
      gender: patient.gender,
      birthDate: patient.date_of_birth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      district: patient.district,
      province: patient.province,
      postalCode: patient.postal_code,
      emergencyContact: patient.emergency_contact_name ? {
        name: patient.emergency_contact_name,
        phone: patient.emergency_contact_phone,
        relationship: patient.emergency_contact_relationship
      } : null,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    };
    
    res.json(successResponse('อัปเดตข้อมูลผู้ป่วยสำเร็จ', patientData));
    
  } catch (error) {
    console.error('Update patient error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors.map(e => e.message))
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ป่วย', 500)
    );
  }
};

/**
 * รายการผู้ป่วยทั้งหมด (สำหรับ admin)
 * GET /api/patients
 */
export const listPatients = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM patients');
    const total = parseInt(countResult.rows[0].total);
    
    // Get patients
    const result = await db.query(`
      SELECT 
        id, hospital_number, first_name, last_name, 
        gender, date_of_birth, phone, email,
        created_at, updated_at
      FROM patients 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const patients = result.rows.map(row => ({
      id: row.id,
      hospitalNumber: row.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: row.first_name,
      lastName: row.last_name,
      thaiName: null, // Not available in current schema
      gender: row.gender,
      birthDate: row.date_of_birth,
      phone: row.phone,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    res.json(successResponse('ดึงรายการผู้ป่วยสำเร็จ', patients, {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }));
    
  } catch (error) {
    console.error('List patients error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการดึงรายการผู้ป่วย', 500)
    );
  }
};

/**
 * ลบผู้ป่วย (Soft Delete)
 * DELETE /api/patients/:id
 */
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if patient exists
    const checkResult = await db.query(`
      SELECT id FROM patients WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }
    
    // Soft delete by setting is_active to false
    const result = await db.query(`
      UPDATE patients 
      SET 
        is_active = FALSE, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, hospital_number, first_name, last_name
    `, [id]);
    
    const patient = result.rows[0];
    
    // Log audit
    await db.createAuditLog({
      userId: req.user?.id!,
      action: 'DELETE',
      resource: 'patients',
      resourceId: id,
      details: {
        patientInfo: {
          id: patient.id,
          hospitalNumber: patient.hospital_number,
          thaiName: `${patient.first_name} ${patient.last_name}`
        },
        method: 'soft_delete'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(200).json(
      successResponse(
        'Patient deleted successfully',
        {
          message: 'Patient deleted successfully',
          id: patient.id,
          hospitalNumber: patient.hospital_number,
          thaiName: `${patient.first_name} ${patient.last_name}`,
          deletedAt: new Date().toISOString()
        }
      )
    );
    
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการลบข้อมูลผู้ป่วย', 500)
    );
  }
};

/**
 * ดึงข้อมูลผู้ป่วยของตัวเอง (สำหรับ patient ที่ login แล้ว)
 * GET /api/patients/profile
 */
export const getPatientProfile = async (req: Request, res: Response) => {
  try {
    // Get user ID from authentication
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(
        errorResponse('Unauthorized', 401)
      );
    }
    
    // Find patient record by user's email
    const result = await db.query(`
      SELECT *
      FROM patients 
      WHERE email = $1
    `, [req.user.email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลผู้ป่วย', 404)
      );
    }
    
    const patient = result.rows[0];
    
    // Map to camelCase
    const patientData = {
      id: patient.id,
      hospitalNumber: patient.hospital_number,
      nationalId: null, // Not available in current schema
      firstName: patient.first_name,
      lastName: patient.last_name,
      thaiName: patient.thai_name,
      gender: patient.gender,
      birthDate: patient.date_of_birth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      district: patient.district,
      province: patient.province,
      postalCode: patient.postal_code,
      emergencyContact: patient.emergency_contact_name ? {
        name: patient.emergency_contact_name,
        phone: patient.emergency_contact_phone,
        relationship: patient.emergency_contact_relationship
      } : null,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    };
    
    res.json(successResponse('ดึงข้อมูลผู้ป่วยสำเร็จ', patientData));
    
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย', 500)
    );
  }
};
