import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * External Requesters Profile Controller
 * จัดการข้อมูลโปรไฟล์ขององค์กรภายนอก
 */

/**
 * Get external requester profile
 * GET /api/external-requesters/profile
 */
export const getExternalRequesterProfile = async (req: Request, res: Response) => {
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

    // Get external requester profile
    const profileQuery = `
      SELECT 
        er.id,
        er.organization_name,
        er.organization_type,
        er.registration_number,
        er.license_number,
        er.tax_id,
        er.primary_contact_name,
        er.primary_contact_email,
        er.primary_contact_phone,
        er.address,
        er.is_verified,
        er.verification_date,
        er.verified_by,
        er.allowed_request_types,
        er.data_access_level,
        er.max_concurrent_requests,
        er.status,
        er.suspension_reason,
        er.compliance_certifications,
        er.data_protection_certification,
        er.last_compliance_audit,
        er.created_at,
        er.updated_at,
        er.last_login,
        u.first_name,
        u.last_name,
        u.email as login_email,
        u.phone as login_phone
      FROM external_requesters er
      LEFT JOIN users u ON er.user_id = u.id
      WHERE er.user_id = $1
    `;

    const result = await databaseManager.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'External requester profile not found'
        },
        statusCode: 404
      });
    }

    const profile = result.rows[0];

    // Parse JSON fields
    const responseData = {
      id: profile.id,
      organizationName: profile.organization_name,
      organizationType: profile.organization_type,
      registrationNumber: profile.registration_number,
      licenseNumber: profile.license_number,
      taxId: profile.tax_id,
      primaryContactName: profile.primary_contact_name,
      primaryContactEmail: profile.primary_contact_email,
      primaryContactPhone: profile.primary_contact_phone,
      address: profile.address ? JSON.parse(profile.address) : null,
      isVerified: profile.is_verified,
      verificationDate: profile.verification_date,
      verifiedBy: profile.verified_by,
      allowedRequestTypes: profile.allowed_request_types ? JSON.parse(profile.allowed_request_types) : [],
      dataAccessLevel: profile.data_access_level,
      maxConcurrentRequests: profile.max_concurrent_requests,
      status: profile.status,
      suspensionReason: profile.suspension_reason,
      complianceCertifications: profile.compliance_certifications ? JSON.parse(profile.compliance_certifications) : [],
      dataProtectionCertification: profile.data_protection_certification,
      lastComplianceAudit: profile.last_compliance_audit,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      lastLogin: profile.last_login,
      user: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.login_email,
        phone: profile.login_phone
      }
    };

    res.status(200).json({
      data: responseData,
      meta: {
        message: 'External requester profile retrieved successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get external requester profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_PROFILE_ERROR',
        message: 'Failed to get external requester profile'
      },
      statusCode: 500
    });
  }
};

/**
 * Update external requester profile
 * PUT /api/external-requesters/profile
 */
export const updateExternalRequesterProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      organizationName,
      organizationType,
      registrationNumber,
      licenseNumber,
      taxId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      address,
      allowedRequestTypes,
      dataAccessLevel,
      maxConcurrentRequests,
      complianceCertifications,
      dataProtectionCertification
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
    if (!organizationName || !organizationType || !primaryContactName || !primaryContactEmail) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Organization name, type, primary contact name, and email are required'
        },
        statusCode: 400
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryContactEmail)) {
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

    // Validate organization type
    const validOrganizationTypes = [
      'hospital', 'clinic', 'insurance_company', 'research_institute', 
      'government_agency', 'legal_entity', 'audit_organization'
    ];
    if (!validOrganizationTypes.includes(organizationType)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_ORGANIZATION_TYPE',
          message: 'Invalid organization type'
        },
        statusCode: 400
      });
    }

    // Validate data access level
    const validAccessLevels = ['basic', 'standard', 'premium'];
    if (dataAccessLevel && !validAccessLevels.includes(dataAccessLevel)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_ACCESS_LEVEL',
          message: 'Invalid data access level'
        },
        statusCode: 400
      });
    }

    // Check if email is already taken by another external requester
    const emailCheckQuery = `
      SELECT id FROM external_requesters 
      WHERE primary_contact_email = $1 AND user_id != $2
    `;
    const emailCheck = await databaseManager.query(emailCheckQuery, [primaryContactEmail, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already taken by another organization'
        },
        statusCode: 400
      });
    }

    // Start transaction
    await databaseManager.query('BEGIN');

    try {
      // Update external requester profile
      const updateQuery = `
        UPDATE external_requesters SET
          organization_name = $1,
          organization_type = $2,
          registration_number = $3,
          license_number = $4,
          tax_id = $5,
          primary_contact_name = $6,
          primary_contact_email = $7,
          primary_contact_phone = $8,
          address = $9,
          allowed_request_types = $10,
          data_access_level = $11,
          max_concurrent_requests = $12,
          compliance_certifications = $13,
          data_protection_certification = $14,
          updated_at = NOW()
        WHERE user_id = $15
        RETURNING *
      `;

      const result = await databaseManager.query(updateQuery, [
        organizationName,
        organizationType,
        registrationNumber,
        licenseNumber,
        taxId,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        address ? JSON.stringify(address) : null,
        allowedRequestTypes ? JSON.stringify(allowedRequestTypes) : null,
        dataAccessLevel,
        maxConcurrentRequests,
        complianceCertifications ? JSON.stringify(complianceCertifications) : null,
        dataProtectionCertification,
        userId
      ]);

      if (result.rows.length === 0) {
        throw new Error('External requester profile not found');
      }

      // Log the update action
      const logQuery = `
        INSERT INTO audit_logs (
          user_id, action, resource, resource_id, details, ip_address, user_agent, success
        ) VALUES ($1, 'update', 'external_requester_profile', $2, $3, $4, $5, true)
      `;

      await databaseManager.query(logQuery, [
        userId,
        result.rows[0].id,
        JSON.stringify({
          updatedFields: Object.keys(req.body),
          timestamp: new Date().toISOString()
        }),
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown'
      ]);

      // Commit transaction
      await databaseManager.query('COMMIT');

      // Prepare response data
      const responseData = {
        ...result.rows[0],
        address: result.rows[0].address ? JSON.parse(result.rows[0].address) : null,
        allowedRequestTypes: result.rows[0].allowed_request_types ? JSON.parse(result.rows[0].allowed_request_types) : [],
        complianceCertifications: result.rows[0].compliance_certifications ? JSON.parse(result.rows[0].compliance_certifications) : []
      };

      res.status(200).json({
        data: responseData,
        meta: {
          message: 'External requester profile updated successfully',
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
    console.error('Update external requester profile error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Failed to update external requester profile'
      },
      statusCode: 500
    });
  }
};

/**
 * Get external requester settings
 * GET /api/external-requesters/settings
 */
export const getExternalRequesterSettings = async (req: Request, res: Response) => {
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

    // Get external requester settings
    const settingsQuery = `
      SELECT 
        er.id,
        er.organization_name,
        er.data_access_level,
        er.max_concurrent_requests,
        er.allowed_request_types,
        er.compliance_certifications,
        er.data_protection_certification,
        er.last_compliance_audit,
        er.status,
        er.notification_preferences,
        er.privacy_settings,
        er.created_at,
        er.updated_at
      FROM external_requesters er
      WHERE er.user_id = $1
    `;

    const result = await databaseManager.query(settingsQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'External requester settings not found'
        },
        statusCode: 404
      });
    }

    const settings = result.rows[0];

    // Parse JSON fields
    const responseData = {
      id: settings.id,
      organizationName: settings.organization_name,
      dataAccessLevel: settings.data_access_level,
      maxConcurrentRequests: settings.max_concurrent_requests,
      allowedRequestTypes: settings.allowed_request_types ? JSON.parse(settings.allowed_request_types) : [],
      complianceCertifications: settings.compliance_certifications ? JSON.parse(settings.compliance_certifications) : [],
      dataProtectionCertification: settings.data_protection_certification,
      lastComplianceAudit: settings.last_compliance_audit,
      status: settings.status,
      notificationPreferences: settings.notification_preferences ? JSON.parse(settings.notification_preferences) : {},
      privacySettings: settings.privacy_settings ? JSON.parse(settings.privacy_settings) : {},
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    };

    res.status(200).json({
      data: responseData,
      meta: {
        message: 'External requester settings retrieved successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get external requester settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_SETTINGS_ERROR',
        message: 'Failed to get external requester settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Update external requester settings
 * PUT /api/external-requesters/settings
 */
export const updateExternalRequesterSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      notificationPreferences,
      privacySettings,
      dataAccessLevel,
      maxConcurrentRequests,
      allowedRequestTypes,
      complianceCertifications,
      dataProtectionCertification
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

    // Validate data access level if provided
    const validAccessLevels = ['basic', 'standard', 'premium'];
    if (dataAccessLevel && !validAccessLevels.includes(dataAccessLevel)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_ACCESS_LEVEL',
          message: 'Invalid data access level'
        },
        statusCode: 400
      });
    }

    // Update external requester settings
    const updateQuery = `
      UPDATE external_requesters SET
        notification_preferences = COALESCE($1, notification_preferences),
        privacy_settings = COALESCE($2, privacy_settings),
        data_access_level = COALESCE($3, data_access_level),
        max_concurrent_requests = COALESCE($4, max_concurrent_requests),
        allowed_request_types = COALESCE($5, allowed_request_types),
        compliance_certifications = COALESCE($6, compliance_certifications),
        data_protection_certification = COALESCE($7, data_protection_certification),
        updated_at = NOW()
      WHERE user_id = $8
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [
      notificationPreferences ? JSON.stringify(notificationPreferences) : null,
      privacySettings ? JSON.stringify(privacySettings) : null,
      dataAccessLevel,
      maxConcurrentRequests,
      allowedRequestTypes ? JSON.stringify(allowedRequestTypes) : null,
      complianceCertifications ? JSON.stringify(complianceCertifications) : null,
      dataProtectionCertification,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'External requester settings not found'
        },
        statusCode: 404
      });
    }

    // Log the update action
    const logQuery = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'update', 'external_requester_settings', $2, $3, $4, $5, true)
    `;

    await databaseManager.query(logQuery, [
      userId,
      result.rows[0].id,
      JSON.stringify({
        updatedFields: Object.keys(req.body),
        timestamp: new Date().toISOString()
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.status(200).json({
      data: {
        ...result.rows[0],
        notificationPreferences: result.rows[0].notification_preferences ? JSON.parse(result.rows[0].notification_preferences) : {},
        privacySettings: result.rows[0].privacy_settings ? JSON.parse(result.rows[0].privacy_settings) : {},
        allowedRequestTypes: result.rows[0].allowed_request_types ? JSON.parse(result.rows[0].allowed_request_types) : [],
        complianceCertifications: result.rows[0].compliance_certifications ? JSON.parse(result.rows[0].compliance_certifications) : []
      },
      meta: {
        message: 'External requester settings updated successfully',
        updatedAt: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update external requester settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: 'Failed to update external requester settings'
      },
      statusCode: 500
    });
  }
};
