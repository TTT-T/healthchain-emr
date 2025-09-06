import { Request, Response } from 'express';
import { z } from 'zod';
import { databaseManager } from '../database/connection';
import { 
  successResponse,
  errorResponse
} from '../utils/index';
import { UserRole } from '../types/index';

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
    await db.query(query, [
      logData.userId, logData.action, logData.resource,
      logData.resourceId, JSON.stringify(logData.details || {}),
      logData.ipAddress, logData.userAgent
    ]);
  }
};

// Validation schema สำหรับการอัปเดตโปรไฟล์
const profileSetupSchema = z.object({
  thai_name: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  national_id: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  religion: z.string().optional(),
  race: z.string().optional(),
  occupation: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  education: z.string().optional(),
  blood_group: z.enum(['A', 'B', 'AB', 'O']).optional(),
  blood_type: z.enum(['+', '-']).optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  id_card_address: z.string().optional(),
  current_address: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  drug_allergies: z.string().optional(),
  food_allergies: z.string().optional(),
  environment_allergies: z.string().optional(),
  chronic_diseases: z.string().optional()
});

// Validation schema สำหรับการอัปเดตโปรไฟล์แพทย์
const doctorProfileSchema = z.object({
  // Basic user fields
  first_name: z.string().min(1, 'ชื่อต้องไม่ว่าง').max(100).optional(),
  last_name: z.string().min(1, 'นามสกุลต้องไม่ว่าง').max(100).optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  phone: z.string().optional(),
  
  // Doctor specific fields
  hospital: z.string().optional(),
  department: z.string().optional(),
  specialty: z.string().optional(),
  medical_license: z.string().optional(),
  experience_years: z.string().optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  position: z.string().optional(),
  professional_license: z.string().optional()
});

// Validation schema สำหรับการอัปเดตโปรไฟล์พยาบาล
const nurseProfileSchema = z.object({
  // Basic user fields
  first_name: z.string().min(1, 'ชื่อต้องไม่ว่าง').max(100).optional(),
  last_name: z.string().min(1, 'นามสกุลต้องไม่ว่าง').max(100).optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  phone: z.string().optional(),
  
  // Nurse specific fields
  hospital: z.string().optional(),
  department: z.string().optional(),
  ward: z.string().optional(),
  nursing_license: z.string().optional(),
  experience_years: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
  shift: z.string().optional(),
  bio: z.string().optional(),
  position: z.string().optional(),
  professional_license: z.string().optional()
});

/**
 * อัปเดตข้อมูลโปรไฟล์และสร้าง patient record
 * POST /api/profile/setup
 */
export const setupProfile = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Setup profile called');
    console.log('🔍 req.user:', req.user ? {
      id: req.user.id,
      role: req.user.role,
      profile_completed: req.user.profile_completed
    } : 'null');
    console.log('🔍 Request body:', req.body);
    
    // Temporary: ถ้าไม่มี req.user (เพราะไม่ผ่าน auth middleware) ให้สร้างจำลอง
    if (!req.user) {
      console.log('❌ No req.user found');
      // ในการใช้งานจริง ควรส่ง 401 แต่สำหรับการทดสอบเราจะสร้างจำลอง
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    // ตรวจสอบว่าเป็น patient และยังไม่ได้ทำ profile setup
    if (req.user?.role !== 'patient') {
      return res.status(403).json(
        errorResponse('Only patients can setup profile', 403)
      );
    }

    if (req.user?.profile_completed) {
      return res.status(400).json(
        errorResponse('Profile already completed', 400)
      );
    }

    // Validate input
    const validatedData = profileSetupSchema.parse(req.body);
    
    // เริ่มต้น transaction เพื่ออัปเดตทั้ง user และสร้าง patient record
    const result = await db.transaction(async (client) => {
      // 1. อัปเดต user profile_completed = true
      await client.query(`
        UPDATE users 
        SET 
          profile_completed = TRUE,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [req.user?.id]);

      // 2. ตรวจสอบว่ามี patient record อยู่แล้วหรือไม่
      const existingPatient = await client.query(`
        SELECT id FROM patients WHERE created_by = $1
      `, [req.user?.id]);

      let patientId;
      
      if (existingPatient.rows.length === 0) {
        // 3. สร้าง patient record ใหม่
        const generatePatientNumber = () => {
          const year = new Date().getFullYear().toString().slice(-2);
          const random = Math.floor(Math.random() * 900000) + 100000;
          return `${year}-${random}`;
        };

        const patientNumber = generatePatientNumber();

        const patientResult = await client.query(`
          INSERT INTO patients (
            patient_number, first_name, last_name, thai_first_name, thai_last_name, 
            date_of_birth, gender, phone, email, 
            address, current_address, id_card_address,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
            medical_history, allergies, drug_allergies, food_allergies, environment_allergies,
            current_medications, chronic_diseases,
            national_id, religion, race, occupation, marital_status, education,
            blood_group, blood_type, weight, height,
            created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
          ) RETURNING id
        `, [
          patientNumber,
          req.user?.first_name || 'Unknown',
          req.user?.last_name || 'Unknown',
          validatedData.thai_name || null,
          validatedData.thai_name || null, // use same thai_name for both first and last
          validatedData.birth_date || null,
          validatedData.gender || 'other',
          validatedData.phone || req.user?.phone || null,
          req.user?.email || null,
          validatedData.address || null,
          validatedData.current_address || validatedData.address || null,
          validatedData.id_card_address || null,
          validatedData.emergency_contact || null,
          validatedData.emergency_contact_phone || validatedData.phone || null,
          validatedData.emergency_contact_relation || 'อื่นๆ',
          validatedData.medical_history || null,
          validatedData.allergies || null,
          validatedData.drug_allergies || null,
          validatedData.food_allergies || null,
          validatedData.environment_allergies || null,
          validatedData.medications || null,
          validatedData.chronic_diseases || null,
          validatedData.national_id || null,
          validatedData.religion || null,
          validatedData.race || null,
          validatedData.occupation || null,
          validatedData.marital_status || null,
          validatedData.education || null,
          validatedData.blood_group || null,
          validatedData.blood_type || null,
          validatedData.weight ? parseFloat(validatedData.weight) : null,
          validatedData.height ? parseFloat(validatedData.height) : null,
          req.user?.id,
          new Date(),
          new Date()
        ]);

        patientId = patientResult.rows[0].id;
      } else {
        patientId = existingPatient.rows[0].id;
      }

      return { patientId };
    });

    // Log audit
    await db.createAuditLog({
      userId: req.user?.id,
      action: 'profile_setup',
      resource: 'patient',
      resourceId: result.patientId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      details: {
        profile_setup: true,
        patient_created: result.patientId
      }
    });

    // Return success response
    return res.status(200).json(
      successResponse(
        'Profile setup completed successfully',
        {
          profile_completed: true,
          patient_id: result.patientId
        }
      )
    );

  } catch (error) {
    console.error('Profile setup error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('Invalid input data', 400, error.errors)
      );
    }

    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Get user profile
 * GET /api/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    // Get user profile
    const userResult = await db.query(`
      SELECT 
        id, username, email, first_name, last_name, thai_name, 
        role, phone, phone_number, is_active, is_verified, profile_completed,
        created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    const user = userResult.rows[0];

    // If user is a patient, get patient info too
    let patientInfo = null;
    if (user.role === 'patient') {
      const patientResult = await db.query(`
        SELECT 
          id, patient_number, thai_first_name, thai_last_name, date_of_birth, gender, 
          phone, email, address, current_address, id_card_address,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
          medical_history, allergies, drug_allergies, food_allergies, environment_allergies,
          current_medications, chronic_diseases,
          national_id, religion, race, occupation, marital_status, education,
          blood_group, blood_type, weight, height,
          created_at, updated_at
        FROM patients 
        WHERE created_by = $1
      `, [req.user.id]);

      if (patientResult.rows.length > 0) {
        patientInfo = patientResult.rows[0];
      }
    }

    // Combine user and patient data for easier frontend handling
    const combinedData = {
      ...user,
      ...(patientInfo && {
        // Patient-specific fields
        patient_number: patientInfo.patient_number,
        thai_name: (patientInfo.thai_first_name || '') + (patientInfo.thai_last_name ? ' ' + patientInfo.thai_last_name : ''),
        national_id: patientInfo.national_id,
        birth_date: patientInfo.birth_date || patientInfo.date_of_birth,
        gender: patientInfo.gender,
        phone: patientInfo.phone || user.phone,
        phone_number: patientInfo.phone_number || user.phone_number,
        address: patientInfo.address,
        current_address: patientInfo.current_address,
        id_card_address: patientInfo.id_card_address,
        emergency_contact: patientInfo.emergency_contact_name,
        emergency_contact_phone: patientInfo.emergency_contact_phone,
        emergency_contact_relation: patientInfo.emergency_contact_relation,
        medical_history: patientInfo.medical_history,
        allergies: patientInfo.allergies,
        drug_allergies: patientInfo.drug_allergies,
        food_allergies: patientInfo.food_allergies,
        environment_allergies: patientInfo.environment_allergies,
        medications: patientInfo.current_medications,
        chronic_diseases: patientInfo.chronic_diseases,
        religion: patientInfo.religion,
        race: patientInfo.race,
        occupation: patientInfo.occupation,
        marital_status: patientInfo.marital_status,
        education: patientInfo.education,
        blood_group: patientInfo.blood_group,
        blood_type: patientInfo.blood_type,
        weight: patientInfo.weight,
        height: patientInfo.height
      })
    };

    return res.status(200).json(
      successResponse(
        'Profile retrieved successfully',
        200,
        combinedData
      )
    );

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Update user profile
 * PUT /api/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    const updateSchema = z.object({
      // User fields
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      thai_name: z.string().optional(),
      phone: z.string().optional(),
      phone_number: z.string().optional(),
      email: z.string().email().optional(),
      
      // Patient fields
      national_id: z.string().optional(),
      birth_date: z.string().optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
      address: z.string().optional(),
      current_address: z.string().optional(),
      id_card_address: z.string().optional(),
      emergency_contact: z.string().optional(),
      emergency_contact_phone: z.string().optional(),
      emergency_contact_relation: z.string().optional(),
      medical_history: z.string().optional(),
      allergies: z.string().optional(),
      drug_allergies: z.string().optional(),
      food_allergies: z.string().optional(),
      environment_allergies: z.string().optional(),
      medications: z.string().optional(),
      chronic_diseases: z.string().optional(),
      religion: z.string().optional(),
      race: z.string().optional(),
      occupation: z.string().optional(),
      marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
      education: z.string().optional(),
      blood_group: z.enum(['A', 'B', 'AB', 'O']).optional(),
      blood_type: z.enum(['+', '-']).optional(),
      weight: z.string().optional(),
      height: z.string().optional()
    });

    const validatedData = updateSchema.parse(req.body);

    // Update user table
    const userFields = ['first_name', 'last_name', 'thai_name', 'phone', 'phone_number', 'email'];
    const userUpdates = [];
    const userValues = [];
    let paramIndex = 1;

    for (const field of userFields) {
      if (validatedData[field] !== undefined) {
        userUpdates.push(`${field} = $${paramIndex}`);
        userValues.push(validatedData[field]);
        paramIndex++;
      }
    }

    if (userUpdates.length > 0) {
      userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      userValues.push(req.user.id);
      
      await db.query(`
        UPDATE users 
        SET ${userUpdates.join(', ')} 
        WHERE id = $${paramIndex}
      `, userValues);
    }

    // If user is a patient, update patient table too
    if (req.user.role === 'patient') {
      const patientFields = [
        'national_id', 'birth_date', 'gender', 'address', 'current_address', 'id_card_address',
        'emergency_contact', 'emergency_contact_phone', 'emergency_contact_relation',
        'medical_history', 'allergies', 'drug_allergies', 'food_allergies', 'environment_allergies',
        'medications', 'chronic_diseases', 'religion', 'race', 'occupation', 'marital_status',
        'education', 'blood_group', 'blood_type', 'weight', 'height'
      ];
      const patientUpdates = [];
      const patientValues = [];
      let patientParamIndex = 1;

      for (const field of patientFields) {
        if (validatedData[field] !== undefined) {
          let dbField = field;
          // Map frontend field names to database column names
          if (field === 'emergency_contact') dbField = 'emergency_contact_name';
          else if (field === 'emergency_contact_relation') dbField = 'emergency_contact_relation';
          else if (field === 'medications') dbField = 'current_medications';
          
          patientUpdates.push(`${dbField} = $${patientParamIndex}`);
          patientValues.push(validatedData[field]);
          patientParamIndex++;
        }
      }

      if (patientUpdates.length > 0) {
        patientUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        patientValues.push(req.user.id);
        
        await db.query(`
          UPDATE patients 
          SET ${patientUpdates.join(', ')} 
          WHERE created_by = $${patientParamIndex}
        `, patientValues);
      }
    }

    return res.status(200).json(
      successResponse(
        null,
        'Profile updated successfully'
      )
    );

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('Invalid input data', 400, error.errors)
      );
    }

    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
