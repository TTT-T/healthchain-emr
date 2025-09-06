import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Doctor Profile Controller
 * จัดการข้อมูลโปรไฟล์ของแพทย์
 */

/**
 * Update doctor profile
 * PUT /api/profile/doctor
 */
export const updateDoctorProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      firstName, lastName, email, phone, dateOfBirth, gender,
      address, city, state, postalCode, country,
      medicalLicenseNumber, specialization, yearsOfExperience,
      education, certifications, languages, department, position,
      workSchedule, consultationFee, availability,
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
    if (!firstName || !lastName || !email || !medicalLicenseNumber || !specialization) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'First name, last name, email, medical license number, and specialization are required'
        },
        statusCode: 400
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

    // Check if medical license number is already taken
    const licenseCheckQuery = `
      SELECT id FROM doctors 
      WHERE medical_license_number = $1 AND user_id != $2
    `;
    const licenseCheck = await databaseManager.query(licenseCheckQuery, [medicalLicenseNumber, userId]);
    
    if (licenseCheck.rows.length > 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'LICENSE_ALREADY_EXISTS',
          message: 'Medical license number is already taken'
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

      // Check if doctor record exists
      const doctorCheckQuery = `SELECT id FROM doctors WHERE user_id = $1`;
      const doctorCheck = await databaseManager.query(doctorCheckQuery, [userId]);

      let doctorResult;

      if (doctorCheck.rows.length > 0) {
        // Update existing doctor record
        const updateDoctorQuery = `
          UPDATE doctors SET
            medical_license_number = $1, specialization = $2, years_of_experience = $3,
            education = $4, certifications = $5, languages = $6, department = $7,
            position = $8, work_schedule = $9, consultation_fee = $10, availability = $11,
            emergency_contact = $12, emergency_phone = $13, notification_preferences = $14,
            privacy_settings = $15, updated_at = NOW()
          WHERE user_id = $16
          RETURNING *
        `;

        doctorResult = await databaseManager.query(updateDoctorQuery, [
          medicalLicenseNumber, specialization, yearsOfExperience,
          education ? JSON.stringify(education) : null,
          certifications ? JSON.stringify(certifications) : null,
          languages ? JSON.stringify(languages) : null,
          department, position, workSchedule ? JSON.stringify(workSchedule) : null,
          consultationFee, availability ? JSON.stringify(availability) : null,
          emergencyContact, emergencyPhone,
          notificationPreferences ? JSON.stringify(notificationPreferences) : null,
          privacySettings ? JSON.stringify(privacySettings) : null,
          userId
        ]);
      } else {
        // Create new doctor record
        const createDoctorQuery = `
          INSERT INTO doctors (
            id, user_id, medical_license_number, specialization, years_of_experience,
            education, certifications, languages, department, position, work_schedule,
            consultation_fee, availability, emergency_contact, emergency_phone,
            notification_preferences, privacy_settings, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          )
          RETURNING *
        `;

        doctorResult = await databaseManager.query(createDoctorQuery, [
          uuidv4(), userId, medicalLicenseNumber, specialization, yearsOfExperience,
          education ? JSON.stringify(education) : null,
          certifications ? JSON.stringify(certifications) : null,
          languages ? JSON.stringify(languages) : null,
          department, position, workSchedule ? JSON.stringify(workSchedule) : null,
          consultationFee, availability ? JSON.stringify(availability) : null,
          emergencyContact, emergencyPhone,
          notificationPreferences ? JSON.stringify(notificationPreferences) : null,
          privacySettings ? JSON.stringify(privacySettings) : null
        ]);
      }

      // Log the update action
      const logQuery = `
        INSERT INTO audit_logs (
          user_id, action, resource, resource_id, details, ip_address, user_agent, success
        ) VALUES ($1, 'update', 'doctor_profile', $2, $3, $4, $5, true)
      `;

      await databaseManager.query(logQuery, [
        userId, doctorResult.rows[0].id,
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
        doctor: {
          ...doctorResult.rows[0],
          education: doctorResult.rows[0].education ? JSON.parse(doctorResult.rows[0].education) : null,
          certifications: doctorResult.rows[0].certifications ? JSON.parse(doctorResult.rows[0].certifications) : null,
          languages: doctorResult.rows[0].languages ? JSON.parse(doctorResult.rows[0].languages) : null,
          workSchedule: doctorResult.rows[0].work_schedule ? JSON.parse(doctorResult.rows[0].work_schedule) : null,
          availability: doctorResult.rows[0].availability ? JSON.parse(doctorResult.rows[0].availability) : null,
          notificationPreferences: doctorResult.rows[0].notification_preferences ? JSON.parse(doctorResult.rows[0].notification_preferences) : null,
          privacySettings: doctorResult.rows[0].privacy_settings ? JSON.parse(doctorResult.rows[0].privacy_settings) : null
        }
      };

      res.status(200).json({
        data: responseData,
        meta: {
          message: 'Doctor profile updated successfully',
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
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Failed to update doctor profile'
      },
      statusCode: 500
    });
  }
};

/**
 * Get doctor profile
 * GET /api/profile/doctor
 */
export const getDoctorProfile = async (req: Request, res: Response) => {
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

    // Get user and doctor information
    const profileQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.date_of_birth, u.gender,
        u.address, u.city, u.state, u.postal_code, u.country, u.role, u.is_active,
        u.created_at, u.updated_at,
        d.id as doctor_id, d.medical_license_number, d.specialization, d.years_of_experience,
        d.education, d.certifications, d.languages, d.department, d.position,
        d.work_schedule, d.consultation_fee, d.availability, d.emergency_contact,
        d.emergency_phone, d.notification_preferences, d.privacy_settings,
        d.created_at as doctor_created_at, d.updated_at as doctor_updated_at
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = $1 AND u.role = 'doctor'
    `;

    const result = await databaseManager.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Doctor profile not found'
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
      doctor: profile.doctor_id ? {
        id: profile.doctor_id, medicalLicenseNumber: profile.medical_license_number,
        specialization: profile.specialization, yearsOfExperience: profile.years_of_experience,
        education: profile.education ? JSON.parse(profile.education) : null,
        certifications: profile.certifications ? JSON.parse(profile.certifications) : null,
        languages: profile.languages ? JSON.parse(profile.languages) : null,
        department: profile.department, position: profile.position,
        workSchedule: profile.work_schedule ? JSON.parse(profile.work_schedule) : null,
        consultationFee: profile.consultation_fee,
        availability: profile.availability ? JSON.parse(profile.availability) : null,
        emergencyContact: profile.emergency_contact, emergencyPhone: profile.emergency_phone,
        notificationPreferences: profile.notification_preferences ? JSON.parse(profile.notification_preferences) : null,
        privacySettings: profile.privacy_settings ? JSON.parse(profile.privacy_settings) : null,
        createdAt: profile.doctor_created_at, updatedAt: profile.doctor_updated_at
      } : null
    };

    res.status(200).json({
      data: responseData,
      meta: {
        message: 'Doctor profile retrieved successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_PROFILE_ERROR',
        message: 'Failed to get doctor profile'
      },
      statusCode: 500
    });
  }
};