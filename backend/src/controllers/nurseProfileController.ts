import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Nurse Profile Controller
 * จัดการข้อมูลโปรไฟล์ของพยาบาล
 */

/**
 * Update nurse profile
 * PUT /api/profile/nurse
 */
export const updateNurseProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      firstName, lastName, email, phone, dateOfBirth, gender,
      address, city, state, postalCode, country,
      nursingLicenseNumber, specialization, yearsOfExperience,
      education, certifications, languages, department, position,
      workSchedule, shiftPreference, availability,
      emergencyContact, emergencyPhone,
      notificationPreferences, privacySettings
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        },
        statusCode: 401
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !nursingLicenseNumber || !specialization) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'First name, last name, email, nursing license number, and specialization are required'
        },
        statusCode: 400
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.(email)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        },
        statusCode: 400
      });
    }

    // Check if email is already taken by another user
    const emailCheckQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND id != $2 AND is_active = true
    `;
    const emailCheck = await databaseManager.query(emailCheckQuery, [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already taken by another user'
        },
        statusCode: 400
      });
    }

    // Check if nursing license number is already taken
    const licenseCheckQuery = `
      SELECT id FROM nurses 
      WHERE nursing_license_number = $1 AND user_id != $2
    `;
    const licenseCheck = await databaseManager.query(licenseCheckQuery, [nursingLicenseNumber, userId]);
    
    if (licenseCheck.rows.length > 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'LICENSE_ALREADY_EXISTS',
          message: 'Nursing license number is already taken'
        },
        statusCode: 400
      });
    }

    // Start transaction
    await databaseManager.query('BEGIN');

    try {
      // Update users table
      const updateUserQuery = `
        UPDATE users SET
          first_name = $1, last_name = $2, email = $3, phone = $4,
          date_of_birth = $5, gender = $6, address = $7, city = $8,
          state = $9, postal_code = $10, country = $11, updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `;

      const userResult = await databaseManager.query(updateUserQuery, [
        firstName, lastName, email, phone, dateOfBirth, gender,
        address, city, state, postalCode, country, userId
      ]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Check if nurse record exists
      const nurseCheckQuery = `SELECT id FROM nurses WHERE user_id = $1`;
      const nurseCheck = await databaseManager.query(nurseCheckQuery, [userId]);

      let nurseResult;

      if (nurseCheck.rows.length > 0) {
        // Update existing nurse record
        const updateNurseQuery = `
          UPDATE nurses SET
            nursing_license_number = $1, specialization = $2, years_of_experience = $3,
            education = $4, certifications = $5, languages = $6, department = $7,
            position = $8, work_schedule = $9, shift_preference = $10, availability = $11,
            emergency_contact = $12, emergency_phone = $13, notification_preferences = $14,
            privacy_settings = $15, updated_at = NOW()
          WHERE user_id = $16
          RETURNING *
        `;

        nurseResult = await databaseManager.query(updateNurseQuery, [
          nursingLicenseNumber, specialization, yearsOfExperience,
          education ? JSON.stringify(education) : null,
          certifications ? JSON.stringify(certifications) : null,
          languages ? JSON.stringify(languages) : null,
          department, position, workSchedule ? JSON.stringify(workSchedule) : null,
          shiftPreference, availability ? JSON.stringify(availability) : null,
          emergencyContact, emergencyPhone,
          notificationPreferences ? JSON.stringify(notificationPreferences) : null,
          privacySettings ? JSON.stringify(privacySettings) : null,
          userId
        ]);
      } else {
        // Create new nurse record
        const createNurseQuery = `
          INSERT INTO nurses (
            id, user_id, nursing_license_number, specialization, years_of_experience,
            education, certifications, languages, department, position, work_schedule,
            shift_preference, availability, emergency_contact, emergency_phone,
            notification_preferences, privacy_settings, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
          )
          RETURNING *
        `;

        nurseResult = await databaseManager.query(createNurseQuery, [
          uuidv4(), userId, nursingLicenseNumber, specialization, yearsOfExperience,
          education ? JSON.stringify(education) : null,
          certifications ? JSON.stringify(certifications) : null,
          languages ? JSON.stringify(languages) : null,
          department, position, workSchedule ? JSON.stringify(workSchedule) : null,
          shiftPreference, availability ? JSON.stringify(availability) : null,
          emergencyContact, emergencyPhone,
          notificationPreferences ? JSON.stringify(notificationPreferences) : null,
          privacySettings ? JSON.stringify(privacySettings) : null
        ]);
      }

      // Log the update action
      const logQuery = `
        INSERT INTO audit_logs (
          user_id, action, resource, resource_id, details, ip_address, user_agent, success
        ) VALUES ($1, 'update', 'nurse_profile', $2, $3, $4, $5, true)
      `;

      await databaseManager.query(logQuery, [
        userId, nurseResult.rows[0].id,
        JSON.stringify({
          updatedFields: Object.keys(req.body),
          timestamp: new Date().toISOString()
        }),
        req.ip || 'unknown', req.get('User-Agent') || 'unknown'
      ]);

      // Commit transaction
      await databaseManager.query('COMMIT');

      // Prepare response data
      const responseData = {
        user: userResult.rows[0],
        nurse: {
          ...nurseResult.rows[0],
          education: nurseResult.rows[0].education ? JSON.parse(nurseResult.rows[0].education) : null,
          certifications: nurseResult.rows[0].certifications ? JSON.parse(nurseResult.rows[0].certifications) : null,
          languages: nurseResult.rows[0].languages ? JSON.parse(nurseResult.rows[0].languages) : null,
          workSchedule: nurseResult.rows[0].work_schedule ? JSON.parse(nurseResult.rows[0].work_schedule) : null,
          availability: nurseResult.rows[0].availability ? JSON.parse(nurseResult.rows[0].availability) : null,
          notificationPreferences: nurseResult.rows[0].notification_preferences ? JSON.parse(nurseResult.rows[0].notification_preferences) : null,
          privacySettings: nurseResult.rows[0].privacy_settings ? JSON.parse(nurseResult.rows[0].privacy_settings) : null
        }
      };

      res.status(200).json({
        data: responseData,
        meta: {
          message: 'Nurse profile updated successfully',
          updatedAt: new Date().toISOString()
        },
        error: null,
        statusCode: 200
      });

    } catch (error) {
      // Rollback transaction
      await databaseManager.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Update nurse profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Failed to update nurse profile'
      },
      statusCode: 500
    });
  }
};

/**
 * Get nurse profile
 * GET /api/profile/nurse
 */
export const getNurseProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        },
        statusCode: 401
      });
    }

    // Get user and nurse information
    const profileQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.gender,
        u.address, u.city, u.state, u.postal_code, u.country, u.role, u.is_active,
        u.created_at, u.updated_at,
        n.id as nurse_id, n.nursing_license_number, n.specialization, n.years_of_experience,
        n.education, n.certifications, n.languages, n.department, n.position,
        n.work_schedule, n.shift_preference, n.availability, n.emergency_contact,
        n.emergency_phone, n.notification_preferences, n.privacy_settings,
        n.created_at as nurse_created_at, n.updated_at as nurse_updated_at
      FROM users u
      LEFT JOIN nurses n ON u.id = n.user_id
      WHERE u.id = $1 AND u.role = 'nurse'
    `;

    const result = await databaseManager.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Nurse profile not found'
        },
        statusCode: 404
      });
    }

    const profile = result.rows[0];

    // Parse JSON fields
    const responseData = {
      user: {
        id: profile.id, firstName: profile.first_name, lastName: profile.last_name,
        email: profile.email, phone: profile.phone, dateOfBirth: profile.date_of_birth,
        gender: profile.gender, address: profile.address, city: profile.city,
        state: profile.state, postalCode: profile.postal_code, country: profile.country,
        role: profile.role, isActive: profile.is_active,
        createdAt: profile.created_at, updatedAt: profile.updated_at
      },
      nurse: profile.nurse_id ? {
        id: profile.nurse_id, nursingLicenseNumber: profile.nursing_license_number,
        specialization: profile.specialization, yearsOfExperience: profile.years_of_experience,
        education: profile.education ? JSON.parse(profile.education) : null,
        certifications: profile.certifications ? JSON.parse(profile.certifications) : null,
        languages: profile.languages ? JSON.parse(profile.languages) : null,
        department: profile.department, position: profile.position,
        workSchedule: profile.work_schedule ? JSON.parse(profile.work_schedule) : null,
        shiftPreference: profile.shift_preference,
        availability: profile.availability ? JSON.parse(profile.availability) : null,
        emergencyContact: profile.emergency_contact, emergencyPhone: profile.emergency_phone,
        notificationPreferences: profile.notification_preferences ? JSON.parse(profile.notification_preferences) : null,
        privacySettings: profile.privacy_settings ? JSON.parse(profile.privacy_settings) : null,
        createdAt: profile.nurse_created_at, updatedAt: profile.nurse_updated_at
      } : null
    };

    res.status(200).json({
      data: responseData,
      meta: {
        message: 'Nurse profile retrieved successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get nurse profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_PROFILE_ERROR',
        message: 'Failed to get nurse profile'
      },
      statusCode: 500
    });
  }
};