/**
 * Profile Controller
 * จัดการข้อมูล profile ครบถ้วน รวมทั้งการแสดง แก้ไข และลบข้อมูล
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { databaseManager } from '../database/connection';
import { 
  CompleteProfileSchema, 
  UpdateProfileSchema, 
  ProfileTransformers 
} from '../schemas/profile';
import { successResponse, errorResponse } from '../utils';

/**
 * Get complete user profile
 * GET /api/auth/profile/complete
 */
export const getCompleteProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    // Get complete user data from database
    const userQuery = `
      SELECT 
        id, username, email, first_name, last_name, phone, role,
        thai_name, thai_last_name, national_id, birth_date, birth_day, birth_month, birth_year, gender, blood_type,
        address, id_card_address,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        allergies, drug_allergies, food_allergies, environment_allergies,
        medical_history, current_medications, chronic_diseases,
        weight, height, occupation, education, marital_status, religion, race,
        insurance_type, insurance_number, insurance_expiry_date, insurance_expiry_day, insurance_expiry_month, insurance_expiry_year,
        profile_image, is_active, email_verified, profile_completed,
        created_at, updated_at, last_login, last_activity
      FROM users 
      WHERE id = $1
    `;
    
    const result = await databaseManager.query(userQuery, [user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Transform database data to frontend format
    const userData = ProfileTransformers.fromDatabase(result.rows[0]);
    
    // Calculate BMI if weight and height are available
    if (userData.weight && userData.height) {
      const heightInMeters = userData.height / 100;
      userData.bmi = parseFloat((userData.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Add computed fields
    userData.isProfileComplete = Boolean(
      userData.firstName && 
      userData.lastName && 
      userData.email && 
      userData.phone && 
      userData.birthDate && 
      userData.gender
    );

    res.json(
      successResponse('Profile retrieved successfully', userData)
    );

  } catch (error) {
    console.error('Get complete profile error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile/complete
 */
export const updateCompleteProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    console.log('🔍 updateCompleteProfile - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 updateCompleteProfile - User ID:', user.id);

    // Validate input
    const validatedData = UpdateProfileSchema.parse(req.body);
    
    // Check if email is being changed and already exists
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await databaseManager.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [validatedData.email, user.id]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json(
          errorResponse('Email already exists', 409)
        );
      }
    }

    // Transform data to database format
    const dbData = ProfileTransformers.toDatabase(validatedData);
    console.log('🔍 updateCompleteProfile - Validated data:', JSON.stringify(validatedData, null, 2));
    console.log('🔍 updateCompleteProfile - DB data:', JSON.stringify(dbData, null, 2));
    
    // Remove undefined fields
    const updateData: any = {};
    Object.keys(dbData).forEach(key => {
      if (dbData[key as keyof typeof dbData] !== undefined) {
        updateData[key] = dbData[key as keyof typeof dbData];
      }
    });

    console.log('🔍 updateCompleteProfile - Update data:', JSON.stringify(updateData, null, 2));

    // Build dynamic update query
    const setClause = Object.keys(updateData).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const updateQuery = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id, username, email, first_name, last_name, phone, role,
        thai_name, thai_last_name, national_id, birth_date, birth_day, birth_month, birth_year, gender, blood_type,
        address, id_card_address,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        allergies, drug_allergies, food_allergies, environment_allergies,
        medical_history, current_medications, chronic_diseases,
        weight, height, occupation, education, marital_status, religion, race,
        insurance_type, insurance_number, insurance_expiry_date, insurance_expiry_day, insurance_expiry_month, insurance_expiry_year,
        profile_image, is_active, email_verified, profile_completed,
        created_at, updated_at, last_login, last_activity
    `;

    const values = [user.id, ...Object.values(updateData)];
    console.log('🔍 updateCompleteProfile - SQL Query:', updateQuery);
    console.log('🔍 updateCompleteProfile - SQL Values:', values);
    
    const result = await databaseManager.query(updateQuery, values);
    console.log('🔍 updateCompleteProfile - Query result rows:', result.rows.length);

    // Transform response data
    const updatedUserData = ProfileTransformers.fromDatabase(result.rows[0]);

    // Log audit
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      user.id,
      'PROFILE_UPDATE',
      'USER',
      user.id,
      JSON.stringify({ updatedFields: Object.keys(updateData) }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json(
      successResponse('Profile updated successfully', updatedUserData)
    );

  } catch (error) {
    console.error('Update complete profile error:', error);
    
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
 * Delete profile field
 * DELETE /api/auth/profile/field/:fieldName
 */
export const deleteProfileField = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fieldName } = req.params;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    // List of deletable fields
    const deletableFields = [
      'thai_name', 'national_id', 'address', 'id_card_address', 'current_address',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
      'allergies', 'drug_allergies', 'food_allergies', 'environment_allergies',
      'medical_history', 'current_medications', 'chronic_diseases',
      'weight', 'height', 'occupation', 'education', 'religion', 'race',
      'insurance_type', 'insurance_number', 'insurance_expiry_date',
      'profile_image'
    ];

    if (!deletableFields.includes(fieldName)) {
      return res.status(400).json(
        errorResponse('Field cannot be deleted', 400)
      );
    }

    // Update field to NULL
    const updateQuery = `
      UPDATE users 
      SET ${fieldName} = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ${fieldName}
    `;

    await databaseManager.query(updateQuery, [user.id]);

    // Log audit
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      user.id,
      'PROFILE_FIELD_DELETE',
      'USER',
      user.id,
      JSON.stringify({ deletedField: fieldName }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json(
      successResponse(`Field ${fieldName} deleted successfully`, { deletedField: fieldName })
    );

  } catch (error) {
    console.error('Delete profile field error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Upload profile image
 * POST /api/auth/profile/image
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { imageUrl } = req.body;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    if (!imageUrl) {
      return res.status(400).json(
        errorResponse('Image URL is required', 400)
      );
    }

    // Update profile image
    const updateQuery = `
      UPDATE users 
      SET profile_image = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING profile_image
    `;

    const result = await databaseManager.query(updateQuery, [user.id, imageUrl]);

    // Log audit
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      user.id,
      'PROFILE_IMAGE_UPDATE',
      'USER',
      user.id,
      JSON.stringify({ imageUrl }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json(
      successResponse('Profile image updated successfully', { 
        profileImage: result.rows[0].profile_image 
      })
    );

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Get profile completion status
 * GET /api/auth/profile/completion
 */
export const getProfileCompletion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }

    // Get user data for completion check
    const userQuery = `
      SELECT 
        first_name, last_name, email, phone, birth_date, gender,
        thai_name, national_id, address, emergency_contact_name,
        emergency_contact_phone, profile_image, profile_completed
      FROM users 
      WHERE id = $1
    `;
    
    const result = await databaseManager.query(userQuery, [user.id]);
    const userData = result.rows[0];

    // Calculate completion percentage
    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone', 'birth_date', 'gender'
    ];
    const optionalFields = [
      'thai_name', 'national_id', 'address', 'emergency_contact_name', 
      'emergency_contact_phone', 'profile_image'
    ];

    const completedRequired = requiredFields.filter(field => userData[field]).length;
    const completedOptional = optionalFields.filter(field => userData[field]).length;
    
    const requiredPercentage = (completedRequired / requiredFields.length) * 70; // 70% weight
    const optionalPercentage = (completedOptional / optionalFields.length) * 30; // 30% weight
    
    const completionPercentage = Math.round(requiredPercentage + optionalPercentage);
    
    const missingRequired = requiredFields.filter(field => !userData[field]);
    const missingOptional = optionalFields.filter(field => !userData[field]);

    const completionData = {
      completionPercentage,
      requiredComplete: completedRequired === requiredFields.length,
      missingRequired,
      missingOptional,
      totalFields: requiredFields.length + optionalFields.length,
      completedFields: completedRequired + completedOptional,
      profileCompleted: userData.profile_completed
    };

    res.json(
      successResponse('Profile completion status retrieved', completionData)
    );

  } catch (error) {
    console.error('Get profile completion error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};