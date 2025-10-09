import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  successResponse,
  errorResponse
} from '../utils/index';
import { databaseManager } from '../database/connection';
import { NotificationService } from '../services/notificationService';
import { BloodTypes } from '../schemas/profile';
import { HnGenerationService } from '../services/hnGenerationService';
import { logger } from '../utils/logger';

// Create a database helper
const db = {
  ...databaseManager,
  query: databaseManager.query.bind(databaseManager),
  transaction: databaseManager.transaction.bind(databaseManager),
};

// Schema for EMR patient registration
const emrPatientRegistrationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  title: z.string().max(50).optional(),
  thaiFirstName: z.string().max(100).optional(),
  thaiLastName: z.string().max(100).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' })
  }),
  nationalId: z.string().length(13, 'National ID must be 13 digits').optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().max(500).optional(),
  bloodType: z.enum([...BloodTypes, 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().max(1000).optional(),
  medicalHistory: z.string().max(2000).optional(),
  currentMedications: z.string().max(1000).optional(),
  chronicDiseases: z.string().max(1000).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  drugAllergies: z.string().max(1000).optional(),
  foodAllergies: z.string().max(1000).optional(),
  environmentAllergies: z.string().max(1000).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  religion: z.string().max(50).optional(),
  race: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  currentAddress: z.string().max(500).optional(),
  insuranceType: z.string().max(50).optional(),
  insuranceNumber: z.string().max(50).optional(),
  insuranceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

/**
 * Generate unique hospital number using centralized service
 * Format: HN + YY + 6-digit sequential number (e.g., HN250001, HN250002, ...)
 */
const generateHospitalNumber = async (): Promise<string> => {
  try {
    const result = await HnGenerationService.generateHospitalNumber();
    logger.info('Hospital number generated', { hn: result.hn, sequenceNumber: result.sequenceNumber });
    return result.hn;
  } catch (error) {
    logger.error('Failed to generate hospital number', { error: error.message });
    throw error;
  }
};

/**
 * Register patient in EMR system
 * This creates a patient record with HR number after user registration
 */
export const registerPatientInEMR = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = emrPatientRegistrationSchema.parse(req.body);
    
    // Check if user exists (any role)
    const userResult = await db.query(`
      SELECT id, username, email, first_name, last_name, role, is_active
      FROM users 
      WHERE id = $1
    `, [validatedData.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }
    
    const user = userResult.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json(
        errorResponse('User account is not active', 400)
      );
    }
    
    // Check if patient already exists for this user
    const existingPatient = await db.query(`
      SELECT id, hn 
      FROM patients 
      WHERE user_id = $1
    `, [validatedData.userId]);
    
    if (existingPatient.rows.length > 0) {
      return res.status(409).json(
        errorResponse('Patient already registered in EMR system', 409, {
          hospitalNumber: existingPatient.rows[0].hn
        })
      );
    }
    
    // Check if national ID is already used by another patient
    if (validatedData.nationalId) {
      const nationalIdCheck = await db.query(`
        SELECT p.id, p.hn, p.first_name, p.last_name
        FROM patients p
        WHERE p.national_id = $1
      `, [validatedData.nationalId]);
      
      if (nationalIdCheck.rows.length > 0) {
        const existingPatient = nationalIdCheck.rows[0];
        return res.status(409).json(
          errorResponse('เลขบัตรประชาชนนี้ลงทะเบียนในระบบ EMR ไปแล้ว', 409, {
            existingPatient: {
              hospitalNumber: existingPatient.hn,
              name: `${existingPatient.first_name} ${existingPatient.last_name}`
            }
          })
        );
      }
    }
    
    // Generate unique hospital number
    const hospitalNumber = await generateHospitalNumber();
    
    // Create patient record in EMR system
    const patientResult = await db.query(`
      INSERT INTO patients (
        user_id, patient_number, hn, first_name, last_name, thai_first_name, thai_last_name,
        date_of_birth, gender, national_id, phone, email, address, blood_type,
        allergies, medical_history, current_medications, chronic_diseases,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        drug_allergies, food_allergies, environment_allergies,
        weight, height, race, occupation, education, marital_status,
        current_address, title, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      )
      RETURNING id, patient_number, hn, first_name, last_name, thai_first_name, thai_last_name,
                date_of_birth, gender, national_id, phone, email, address, blood_type,
                allergies, medical_history, current_medications, chronic_diseases,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                drug_allergies, food_allergies, environment_allergies,
                weight, height, race, occupation, education, marital_status,
                current_address, title, created_at, updated_at
    `, [
      validatedData.userId,
      `P${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`, // patient_number
      hospitalNumber,
      validatedData.firstName,
      validatedData.lastName,
      validatedData.thaiFirstName || null,
      validatedData.thaiLastName || null,
      validatedData.dateOfBirth,
      validatedData.gender,
      validatedData.nationalId || null,
      validatedData.phone || null,
      validatedData.email || null,
      validatedData.address || null,
      validatedData.bloodType || null,
      validatedData.allergies || null,
      validatedData.medicalHistory || null,
      validatedData.currentMedications || null,
      validatedData.chronicDiseases || null,
      validatedData.emergencyContactName || null,
      validatedData.emergencyContactPhone || null,
      validatedData.emergencyContactRelation || null,
      validatedData.drugAllergies || null,
      validatedData.foodAllergies || null,
      validatedData.environmentAllergies || null,
      validatedData.weight || null,
      validatedData.height || null,
      validatedData.race || null,
      validatedData.occupation || null,
      validatedData.education || null,
      validatedData.maritalStatus || null,
      validatedData.currentAddress || null,
      validatedData.title || null,
      validatedData.userId // created_by
    ]);
    
    const newPatient = patientResult.rows[0];
    
    // Update user role to 'patient' after successful EMR registration
    await db.query(`
      UPDATE users 
      SET role = 'patient', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [validatedData.userId]);
    
    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      await NotificationService.sendPatientNotification({
        patientId: newPatient.id,
        patientHn: newPatient.hn || '',
        patientName: newPatient.thai_first_name || `${newPatient.first_name} ${newPatient.last_name}`,
        patientPhone: newPatient.phone,
        patientEmail: newPatient.email,
        notificationType: 'patient_registered',
        title: `ลงทะเบียนสำเร็จ: ${newPatient.hn}`,
        message: `ยินดีต้อนรับคุณ ${newPatient.thai_first_name || newPatient.first_name} เข้าสู่ระบบ EMR ของโรงพยาบาล`,
        recordType: 'patient_registration',
        recordId: newPatient.id,
        createdBy: validatedData.userId,
        createdByName: user.first_name || user.username,
        metadata: {
          hospitalNumber: newPatient.hn,
          registrationDate: newPatient.created_at,
          userRole: 'patient'
        }
      });
    } catch (notificationError) {
      console.error('❌ Failed to send patient registration notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการลงทะเบียน
    }
    
    // Log audit
    await db.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      validatedData.userId,
      'PATIENT_EMR_REGISTRATION',
      'PATIENT',
      newPatient.id,
      JSON.stringify({ 
        hospitalNumber: newPatient.hn,
        patientName: `${newPatient.first_name} ${newPatient.last_name}`
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);
    res.status(201).json(
      successResponse('Patient successfully registered in EMR system', {
        patient: {
          id: newPatient.id,
          hospitalNumber: newPatient.hn,
          firstName: newPatient.first_name,
          lastName: newPatient.last_name,
          thaiFirstName: newPatient.thai_first_name,
          thaiLastName: newPatient.thai_last_name,
          dateOfBirth: newPatient.date_of_birth,
          gender: newPatient.gender,
          nationalId: newPatient.national_id,
          phone: newPatient.phone,
          email: newPatient.email,
          address: newPatient.address,
          bloodType: newPatient.blood_type,
          allergies: newPatient.allergies,
          medicalHistory: newPatient.medical_history,
          currentMedications: newPatient.current_medications,
          chronicDiseases: newPatient.chronic_diseases,
          emergencyContactName: newPatient.emergency_contact_name,
          emergencyContactPhone: newPatient.emergency_contact_phone,
          emergencyContactRelation: newPatient.emergency_contact_relation,
          insuranceType: newPatient.insurance_type,
          insuranceNumber: newPatient.insurance_number,
          insuranceExpiryDate: newPatient.insurance_expiry_date,
          title: newPatient.title,
          createdAt: newPatient.created_at,
          updatedAt: newPatient.updated_at
        }
      })
    );
    
  } catch (error) {
    console.error('EMR Patient registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('Validation error', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Get patient information by user ID
 */
export const getPatientByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json(
        errorResponse('User ID is required', 400)
      );
    }
    
    // Get patient information
    const patientResult = await db.query(`
      SELECT 
        p.id, p.hn, p.first_name, p.last_name, p.thai_first_name,
        p.date_of_birth, p.gender, p.national_id, p.phone, p.email, p.address, p.blood_type,
        p.allergies, p.medical_history, p.current_medications, p.chronic_conditions,
        p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relation,
        p.insurance_type, p.insurance_number, p.insurance_expiry_date,
        p.title, p.created_at, p.updated_at,
        u.username, u.email as user_email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [userId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Patient not found in EMR system', 404)
      );
    }
    
    const patient = patientResult.rows[0];
    
    res.json(
      successResponse('Patient information retrieved successfully', {
        patient: {
          id: patient.id,
          hospitalNumber: patient.hn,
          firstName: patient.first_name,
          lastName: patient.last_name,
          thaiFirstName: patient.thai_first_name,
          thaiLastName: null,
          dateOfBirth: patient.date_of_birth,
          gender: patient.gender,
          nationalId: patient.national_id,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          bloodType: patient.blood_type,
          allergies: patient.allergies,
          medicalHistory: patient.medical_history,
          currentMedications: patient.current_medications,
          chronicDiseases: patient.chronic_conditions,
          emergencyContactName: patient.emergency_contact_name,
          emergencyContactPhone: patient.emergency_contact_phone,
          emergencyContactRelation: patient.emergency_contact_relation,
          insuranceType: patient.insurance_type,
          insuranceNumber: patient.insurance_number,
          insuranceExpiryDate: patient.insurance_expiry_date,
          title: patient.title,
          createdAt: patient.created_at,
          updatedAt: patient.updated_at,
          user: {
            username: patient.username,
            email: patient.user_email
          }
        }
      })
    );
    
  } catch (error) {
    console.error('Get patient by user ID error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Check if patient is registered in EMR system
 */
export const checkPatientRegistration = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json(
        errorResponse('User ID is required', 400)
      );
    }
    
    // Check if patient exists
    const patientResult = await db.query(`
      SELECT id, hn, first_name, last_name, created_at
      FROM patients 
      WHERE user_id = $1
    `, [userId]);
    
    const isRegistered = patientResult.rows.length > 0;
    
    res.json(
      successResponse('Patient registration status checked', {
        isRegistered,
        patient: isRegistered ? {
          id: patientResult.rows[0].id,
          hospitalNumber: patientResult.rows[0].hn,
          firstName: patientResult.rows[0].first_name,
          lastName: patientResult.rows[0].last_name,
          registeredAt: patientResult.rows[0].created_at
        } : null
      })
    );
    
  } catch (error) {
    console.error('Check patient registration error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
