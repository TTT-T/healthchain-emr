import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { databaseManager } from '../database/connection';
import { successResponse, errorResponse } from '../utils/index';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { getCurrentThailandTimeForDB } from '../utils/thailandTime';

/**
 * Register external requester organization
 * POST /api/external-requesters/register
 */
export const registerExternalRequester = async (req: Request, res: Response) => {
  try {
    const {
      request_id,
      organization_name,
      organization_type,
      registration_number,
      license_number,
      tax_id,
      primary_contact_title,
      primary_contact_first_name_thai,
      primary_contact_last_name_thai,
      primary_contact_first_name_english,
      primary_contact_last_name_english,
      primary_contact_email,
      primary_contact_phone,
      address,
      allowed_request_types,
      data_access_level,
      max_concurrent_requests,
      compliance_certifications,
      data_protection_certification,
      verification_documents,
      username,
      login_email,
      password_hash,
      status = 'pending_review'
    } = req.body;

    // Validate required fields
    if (!organization_name || !organization_type || !primary_contact_email || !login_email) {
      return res.status(400).json(
        errorResponse('Missing required fields', 400, {
          message: 'กรุณาระบุข้อมูลที่จำเป็น: ชื่อองค์กร, ประเภทองค์กร, อีเมลติดต่อ, อีเมลสำหรับเข้าสู่ระบบ'
        })
      );
    }

    // Check if email already exists
    const existingUser = await databaseManager.query(
      'SELECT id FROM users WHERE email = $1',
      [login_email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json(
        errorResponse('Email already exists', 409, {
          message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'
        })
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password_hash, 12);

    // Create user account for external requester
    const userId = uuidv4();
    // Use provided username or generate from email
    const finalUsername = username || login_email.split('@')[0] + '_' + Date.now();

    // Extract additional user fields from request body
    const {
      firstNameThai,
      lastNameThai,
      firstNameEnglish,
      lastNameEnglish,
      title,
      nationalId,
      birthDate,
      gender,
      nationality,
      currentAddress,
      idCardAddress
    } = req.body;

    const createUserQuery = `
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name, thai_name, title,
        role, is_active, email_verified, profile_completed,
        phone, address, national_id, birth_date, gender, nationality,
        current_address, id_card_address,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22
      ) RETURNING id, username, email, first_name, last_name, role, is_active
    `;

    const userResult = await databaseManager.query(createUserQuery, [
      userId,
      finalUsername,
      login_email,
      hashedPassword,
      primary_contact_first_name_thai, // first_name
      primary_contact_last_name_thai,  // last_name
      (firstNameThai || '') + ' ' + (lastNameThai || ''), // thai_name
      title || null,
      'external_requester',
      false, // inactive until approved
      false, // email not verified yet
      false, // profile not completed
      primary_contact_phone,
      JSON.stringify(address),
      nationalId || null,
      birthDate || null,
      gender || null,
      nationality || 'Thai',
      currentAddress || null,
      idCardAddress || null,
      getCurrentThailandTimeForDB(),
      getCurrentThailandTimeForDB()
    ]);

    // Create external requester record
    const externalRequesterId = uuidv4();
    const createExternalRequesterQuery = `
      INSERT INTO external_data_requests (
        id, request_id, requester_name, requester_organization, requester_email, requester_phone,
        request_type, requested_data_types, purpose, data_usage_period,
        consent_required, patient_ids, date_range_start, date_range_end,
        additional_requirements, status, created_by, created_at, updated_at,
        organization_type, registration_number, license_number, tax_id,
        address, allowed_request_types, data_access_level, max_concurrent_requests,
        compliance_certifications, data_protection_certification, verification_documents
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *
    `;

    const externalRequesterResult = await databaseManager.query(createExternalRequesterQuery, [
      externalRequesterId,
      request_id,
      primary_contact_first_name_thai + ' ' + primary_contact_last_name_thai,
      organization_name,
      primary_contact_email,
      primary_contact_phone,
      'organization_registration', // request_type
      allowed_request_types || [],
      'Organization registration for data access', // purpose
      null, // data_usage_period
      true, // consent_required
      null, // patient_ids
      null, // date_range_start
      null, // date_range_end
      JSON.stringify({
        organization_type,
        registration_number,
        license_number,
        tax_id,
        compliance_certifications,
        data_protection_certification,
        verification_documents
      }), // additional_requirements
              status,
              userId, // created_by
              getCurrentThailandTimeForDB(),
              getCurrentThailandTimeForDB(),
      organization_type,
      registration_number,
      license_number,
      tax_id,
      JSON.stringify(address),
      allowed_request_types || [],
      data_access_level || 'basic',
      max_concurrent_requests || 5,
      compliance_certifications || [],
      data_protection_certification,
      verification_documents || []
    ]);

    // Create audit log
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      'EXTERNAL_REQUESTER_REGISTER',
      'EXTERNAL_REQUESTER',
      externalRequesterId,
      JSON.stringify({
        organization_name,
        organization_type,
        request_id
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      new Date()
    ]);

    // Send email verification for external requester
    try {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Store token in database
      await databaseManager.query(`
        INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
        VALUES ($1, $2, $3, $4)
      `, [
        userId,
        verificationToken,
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        new Date()
      ]);
      
      // Send verification email
      const emailSent = await emailService.sendEmailVerification(
        login_email,
        primary_contact_first_name_thai + ' ' + primary_contact_last_name_thai,
        verificationToken
      );
      
      logger.info(`📧 Verification email sent to external requester: ${login_email}, Success: ${emailSent}`);
    } catch (emailError) {
      logger.error('❌ Failed to send verification email to external requester:', emailError);
      // Don't fail registration if email sending fails
    }

    const response = {
      id: externalRequesterId,
      request_id,
      organization_name,
      organization_type,
      status,
      user_id: userId,
      created_at: new Date().toISOString(),
      requiresEmailVerification: true,
      requiresAdminApproval: true,
      message: 'การลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี และรอการอนุมัติจากผู้ดูแลระบบ'
    };

    res.status(201).json(
      successResponse('External requester registration successful', response)
    );

  } catch (error) {
    console.error('External requester registration error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Get external requester registration status
 * GET /api/external-requesters/register/:requestId
 */
export const getRegistrationStatus = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const query = `
      SELECT 
        edr.id,
        edr.request_id,
        edr.requester_name,
        edr.requester_organization,
        edr.requester_email,
        edr.status,
        edr.created_at,
        edr.updated_at,
        u.is_active,
        u.email_verified
      FROM external_data_requests edr
      LEFT JOIN users u ON edr.created_by = u.id
      WHERE edr.request_id = $1
    `;

    const result = await databaseManager.query(query, [requestId]);

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Registration not found', 404)
      );
    }

    const registration = result.rows[0];

    res.json(
      successResponse('Registration status retrieved', registration)
    );

  } catch (error) {
    console.error('Get registration status error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
