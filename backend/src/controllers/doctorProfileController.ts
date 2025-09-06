import { Request, Response } from 'express';
import { z } from 'zod';
import DatabaseConnection from '../database/index';
import { 
  successResponse,
  errorResponse
} from '../utils/index';

const db = DatabaseConnection.getInstance();

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

/**
 * Update doctor profile
 * PUT /api/profile/doctor
 */
export const updateDoctorProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json(
        errorResponse('Only doctors can update doctor profile', 403)
      );
    }

    const validatedData = doctorProfileSchema.parse(req.body);

    // Update user table
    const userFields = ['first_name', 'last_name', 'email', 'phone'];
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

    // Update doctor specific fields in users table
    const doctorFields = [
      'hospital', 'department', 'specialty', 'medical_license', 
      'experience_years', 'education', 'bio', 'position', 'professional_license'
    ];
    const doctorUpdates = [];
    const doctorValues = [];
    let doctorParamIndex = 1;

    for (const field of doctorFields) {
      if (validatedData[field] !== undefined) {
        let dbField = field;
        // Map frontend field names to database column names
        if (field === 'medical_license') dbField = 'professional_license';
        else if (field === 'experience_years') dbField = 'experience';
        
        doctorUpdates.push(`${dbField} = $${doctorParamIndex}`);
        doctorValues.push(validatedData[field]);
        doctorParamIndex++;
      }
    }

    if (doctorUpdates.length > 0) {
      doctorUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      doctorValues.push(req.user.id);
      
      await db.query(`
        UPDATE users 
        SET ${doctorUpdates.join(', ')} 
        WHERE id = $${doctorParamIndex}
      `, doctorValues);
    }

    // Log audit
    await db.createAuditLog({
      userId: req.user.id,
      action: 'DOCTOR_PROFILE_UPDATE',
      resource: 'USER',
      resourceId: req.user.id,
      details: { updatedFields: Object.keys(validatedData) },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(200).json(
      successResponse(
        null,
        'Doctor profile updated successfully'
      )
    );

  } catch (error) {
    console.error('Update doctor profile error:', error);
    
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
