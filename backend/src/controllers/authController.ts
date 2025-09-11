import { Request, Response } from 'express';
// bcrypt and jwt are handled by utils functions
import { z } from 'zod';
import crypto from 'crypto';
import { 
  generateTokens, 
  hashPassword, 
  validatePassword,
  successResponse,
  errorResponse
} from '../utils/index';
import { 
  AuthResponse
} from '../types/index';
import { emailService } from '../services/emailService';

import { databaseManager } from '../database/connection';
import { DatabaseSchema } from '../database/index';

// Create a database helper that combines databaseManager and DatabaseSchema
const db = {
  ...databaseManager,
  query: databaseManager.query.bind(databaseManager),
  transaction: databaseManager.transaction.bind(databaseManager),
  // Add methods from DatabaseSchema
  getUserByUsernameOrEmail: async (username: string, email: string) => {
    const query = `
      SELECT 
        id, username, email, password_hash, first_name, last_name,
        role, is_active, profile_completed, email_verified,
        created_at, updated_at
      FROM users
      WHERE username = $1 OR email = $2
    `;
    const result = await db.query(query, [username, email]);
    return result.rows[0] || null;
  },
  createUser: async (userData: any) => {
    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        thai_name, thai_last_name, phone, role, is_active, email_verified, profile_completed,
        national_id, birth_date, gender, address, id_card_address, blood_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, $12, $13, $14, $15, $16, $17)
      RETURNING id, username, email, first_name, last_name, thai_name, thai_last_name, role, is_active, email_verified, profile_completed
    `;
    const result = await db.query(query, [
      userData.username, userData.email, userData.password,
      userData.firstName, userData.lastName, userData.thaiFirstName, userData.thaiLastName, // Thai names
      userData.phoneNumber, userData.role, userData.isActive, userData.isEmailVerified,
      userData.nationalId, userData.birthDate, userData.gender, 
      userData.address, userData.idCardAddress, userData.bloodType
    ]);
    return result.rows[0];
  },
  createSession: async (sessionData: any) => {
    const query = `
      INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const result = await db.query(query, [
      sessionData.userId, sessionData.refreshToken,
      sessionData.expiresAt, sessionData.ipAddress, sessionData.userAgent
    ]);
    return result.rows[0];
  },
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
  },
  getUserById: async (userId: string) => {
    const query = `
      SELECT id, username, email, first_name, last_name,
             thai_name, thai_last_name, position, department_id,
             role, is_active, profile_completed, email_verified,
             created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  },
  updateUserLastLogin: async (userId: string) => {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await db.query(query, [userId]);
  },
  getSessionByRefreshToken: async (refreshToken: string) => {
    const query = `
      SELECT s.id, s.user_id, s.session_token, s.expires_at, s.created_at,
             u.username, u.email, u.role, u.is_active, u.profile_completed, u.email_verified
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1 AND u.is_active = true
    `;
    const result = await db.query(query, [refreshToken]);
    const session = result.rows[0] || null;
    if (session) {
      // Ensure user_id is properly mapped
      session.userId = session.user_id;
      console.log('🔍 Session mapping result:', {
        id: session.id,
        user_id: session.user_id,
        userId: session.userId,
        userIdType: typeof session.userId
      });
    }
    return session;
  },
  updateSession: async (sessionId: string, updateData: any) => {
    const query = `
      UPDATE user_sessions 
      SET session_token = COALESCE($2, session_token),
          expires_at = COALESCE($3, expires_at),
          created_at = COALESCE($4, created_at)
      WHERE id = $1
    `;
    await db.query(query, [
      sessionId, updateData.refreshToken, updateData.expiresAt, updateData.lastUsedAt
    ]);
  },
  deleteSessionByRefreshToken: async (refreshToken: string) => {
    const query = `DELETE FROM user_sessions WHERE session_token = $1`;
    await db.query(query, [refreshToken]);
  },
  getUserByEmail: async (email: string) => {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name,
             role, is_active, profile_completed, email_verified,
             created_at, updated_at
      FROM users WHERE email = $1
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  },
  getUserByUsername: async (username: string) => {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name,
             role, is_active, profile_completed, email_verified,
             created_at, updated_at
      FROM users WHERE username = $1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  },
  updateUser: async (userId: string, updateData: any) => {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [userId, ...values]);
    return result.rows[0];
  }
};

// Import standardized schemas
import { 
  CreateUserSchema, 
  UpdateUserProfileSchema, 
  LoginSchema as StandardLoginSchema,
  TransformToDatabase,
  TransformFromDatabase
} from '../schemas/user';

// Validation schemas using standardized definitions
const registerSchema = CreateUserSchema;
const loginSchema = StandardLoginSchema;
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    
    // Check if email already exists (only check email, not username)
    const existingUser = await db.getUserByEmail(validatedData.email);
    
    if (existingUser) {
      return res.status(409).json(
        errorResponse('Email already exists', 409, {
          message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ'
        })
      );
    }

    // Use provided username or generate from email if not provided
    let username = validatedData.username;
    
    // If no username provided, generate from email
    if (!username) {
      username = validatedData.email.split('@')[0];
    }
    
    // Check if username already exists and generate unique one if needed
    let counter = 1;
    const originalUsername = username;
    
    while (true) {
      const existingUsername = await db.getUserByUsername(username);
      if (!existingUsername) {
        break; // Username is unique
      }
      username = `${originalUsername}${counter}`;
      counter++;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    let newUser;
    try {
      newUser = await db.createUser({
        username: username,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        thaiFirstName: validatedData.thaiFirstName,
        thaiLastName: validatedData.thaiLastName,
        phoneNumber: validatedData.phoneNumber,
        role: validatedData.role || 'patient',
        isActive: validatedData.role === 'patient' ? true : false, // Only patients are active by default
        isEmailVerified: false,
        nationalId: validatedData.nationalId,
        birthDate: validatedData.birthDate,
        gender: validatedData.gender,
        address: validatedData.address,
        idCardAddress: validatedData.idCardAddress,
        bloodType: validatedData.bloodType
      });
    } catch (error: any) {
      // Handle database constraint errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_username_key') {
          return res.status(409).json(
            errorResponse('Username already exists', 409, {
              message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาใช้ชื่อผู้ใช้อื่น'
            })
          );
        } else if (error.constraint === 'users_email_key') {
          return res.status(409).json(
            errorResponse('Email already exists', 409, {
              message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ'
            })
          );
        }
      }
      throw error; // Re-throw if it's not a constraint error
    }
    
    // Create role-specific records
    if (newUser.role === 'doctor') {
      try {
        // Import DoctorDB
        const { DoctorDB } = await import('../database/doctors');
        
        // Create doctor profile
        await DoctorDB.createDoctorProfile({
          userId: newUser.id,
          medicalLicenseNumber: validatedData.medicalLicenseNumber || '',
          specialization: validatedData.specialization || '',
          yearsOfExperience: validatedData.yearsOfExperience || null,
          department: validatedData.department || null,
          position: validatedData.position || null
        });
        
        console.log('👨‍⚕️ Doctor profile created for user:', newUser.id);
      } catch (doctorError) {
        console.error('❌ Failed to create doctor profile:', doctorError);
        // Don't fail registration if doctor profile creation fails
      }
    } else if (newUser.role === 'nurse') {
      try {
        // Import NurseDB
        const { NurseDB } = await import('../database/doctors');
        
        // Create nurse profile
        await NurseDB.createNurseProfile({
          userId: newUser.id,
          nursingLicenseNumber: validatedData.nursingLicenseNumber || validatedData.medicalLicenseNumber || '',
          specialization: validatedData.specialization || '',
          yearsOfExperience: validatedData.yearsOfExperience || null,
          department: validatedData.department || null,
          position: validatedData.position || null
        });
        
        console.log('👩‍⚕️ Nurse profile created for user:', newUser.id);
      } catch (nurseError) {
        console.error('❌ Failed to create nurse profile:', nurseError);
        // Don't fail registration if nurse profile creation fails
      }
    }
    
    // Send verification email for all users except admin
    if (newUser.role !== 'admin') {
      try {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Store token in database
        await DatabaseSchema.createEmailVerificationToken(newUser.id, verificationToken);
        
        // Send verification email
        const emailSent = await emailService.sendEmailVerification(
          validatedData.email,
          validatedData.firstName,
          verificationToken
        );
        
        console.log('📧 Verification email sent to:', validatedData.email, 'Success:', emailSent);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);
    
    // Create session
    await db.createSession({
      userId: newUser.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Log audit
    await db.createAuditLog({
      userId: newUser.id,
      action: 'USER_REGISTER',
      resource: 'USER',
      resourceId: newUser.id,
      details: { username: newUser.username, email: newUser.email },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    
    const authResponse: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
    
    // Different response based on user role
    if (newUser.role === 'patient') {
      res.status(201).json(
        successResponse('Registration successful. Please check your email to verify your account before logging in.', {
          ...authResponse,
          requiresEmailVerification: true,
          emailSent: true,
          email: validatedData.email
        })
      );
    } else if (['doctor', 'nurse', 'staff'].includes(newUser.role)) {
      res.status(201).json(
        successResponse('Registration successful. Please check your email to verify your account. Your account will be activated after admin approval.', {
          ...authResponse,
          requiresEmailVerification: true,
          requiresAdminApproval: true,
          emailSent: true,
          email: validatedData.email,
          message: 'Your account is pending admin approval. You will be notified once approved.'
        })
      );
    } else {
      res.status(201).json(
        successResponse('User registered successfully', authResponse)
      );
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    
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
 * Login user
 */
/**
 * Resend email verification
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        errorResponse('Email is required', 400)
      );
    }

    // Find user by email
    const user = await db.getUserByUsernameOrEmail('', email);
    
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found with this email', 404)
      );
    }

    if (user.email_verified) {
      return res.status(400).json(
        errorResponse('Email is already verified', 400)
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store token in database
    await DatabaseSchema.createEmailVerificationToken(user.id, verificationToken);
    
    // Send verification email
    const emailSent = await emailService.sendEmailVerification(
      user.email,
      user.first_name,
      verificationToken
    );
    
    if (emailSent) {
      console.log('📧 Verification email resent successfully:', user.email);
      res.status(200).json(
        successResponse('Verification email sent successfully', { message: 'Verification email sent successfully' })
      );
    } else {
      console.error('❌ Failed to resend verification email:', user.email);
      res.status(500).json(
        errorResponse('Failed to send verification email', 500)
      );
    }
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    
    // Determine if the input is username or email
    const usernameOrEmail = validatedData.username || validatedData.email;
    
    if (!usernameOrEmail) {
      return res.status(400).json(
        errorResponse('Username or email is required', 400)
      );
    }
    
    console.log('🔍 Login attempt for:', usernameOrEmail);
    
    // Find user by username or email
    const user = await db.getUserByUsernameOrEmail(
      usernameOrEmail, 
      usernameOrEmail
    );
    
    console.log('🔍 User found:', user ? user.email : 'Not found');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json(
        errorResponse('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401)
      );
    }
    
    // Check if user is active
    console.log('🔍 User check - is_active:', user.is_active);
    if (!user.is_active) {
      console.log('❌ User is not active');
      // For medical staff, inactive usually means pending admin approval
      if (['doctor', 'nurse', 'staff'].includes(user.role)) {
        return res.status(401).json(
          errorResponse('บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ', 401, null, {
            requiresAdminApproval: true,
            email: user.email,
            message: 'บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ'
          })
        );
      } else {
        return res.status(401).json(
          errorResponse('บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 401)
        );
      }
    }
    
    // Check email verification for all users except admin
    console.log('🔍 User check - role:', user.role, 'email_verified:', user.email_verified);
    if (user.role !== 'admin' && !user.email_verified) {
      console.log('❌ Email not verified for role:', user.role);
      return res.status(401).json(
        errorResponse('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ ตรวจสอบอีเมลของคุณเพื่อคลิกลิงก์ยืนยัน', 401, null, {
          requiresEmailVerification: true,
          email: user.email
        })
      );
    }
    
    
    // Validate password
    console.log('🔍 Password validation - input length:', validatedData.password.length, 'hash length:', user.password_hash.length);
    const isPasswordValid = await validatePassword(validatedData.password, user.password_hash);
    console.log('🔍 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed for user:', user.email);
      // Log failed login attempt
      await db.createAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'USER',
        resourceId: user.id,
        details: { reason: 'Invalid password' },
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
      
      return res.status(401).json(
        errorResponse('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401)
      );
    }
    
    console.log('✅ Password validation successful for user:', user.email);
    
    // Update last login
    await db.updateUserLastLogin(user.id);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Clear existing sessions for this user to avoid duplicates
    await db.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
    
    // Create session
    await db.createSession({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Log successful login
    await db.createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'USER',
      resourceId: user.id,
      details: { username: user.username },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Remove password from response and transform field names
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _, ...userWithoutPassword } = user;
    
    // Transform user object to match expected format
    const transformedUser = {
      id: userWithoutPassword.id,
      username: userWithoutPassword.username,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.first_name,
      lastName: userWithoutPassword.last_name,
      role: userWithoutPassword.role,
      isActive: userWithoutPassword.is_active,
      profileCompleted: userWithoutPassword.profile_completed,
      emailVerified: userWithoutPassword.email_verified,
      createdAt: userWithoutPassword.created_at,
      updatedAt: userWithoutPassword.updated_at
    };
    
    const authResponse: any = {
      user: transformedUser,
      accessToken,
      refreshToken
    };
    
    // Check if patient needs to complete profile setup
    if (user.role === 'patient' && !user.profile_completed) {
      return res.json(
        successResponse('Login successful - Profile setup required', {
          ...authResponse,
          requiresProfileSetup: true,
          redirectTo: '/setup-profile'
        })
      );
    }
    
    res.json(
      successResponse('Login successful', {
        ...authResponse,
        requiresProfileSetup: false
      })
    );
    
  } catch (error) {
    console.error('Login error:', error);
    
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
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = refreshTokenSchema.parse(req.body);
    
    // Find session
    const session = await db.getSessionByRefreshToken(validatedData.refreshToken);
    
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json(
        errorResponse('Invalid or expired refresh token', 401)
      );
    }
    
    console.log('🔍 Session found:', { id: session.id, userId: session.userId, userIdType: typeof session.userId });
    
    // Get user
    const user = await db.getUserById(session.userId);
    
    console.log('🔍 User lookup result:', { user: user ? 'found' : 'not found', userId: session.userId });
    
    if (!user || !user.is_active) {
      return res.status(401).json(
        errorResponse('User not found or inactive', 401)
      );
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Update session
    await db.updateSession(session.id, {
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastUsedAt: new Date()
    });
    
    // Log audit
    await db.createAuditLog({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      resource: 'SESSION',
      resourceId: session.id,
      details: { sessionId: session.id },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    res.json(
      successResponse('Token refreshed successfully', {
        accessToken,
        refreshToken: newRefreshToken
      })
    );
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
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
 * Logout user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken;
    
    if (refreshToken) {
      // Delete session
      await db.deleteSessionByRefreshToken(refreshToken);
      
      // Log audit if user is available
      const user = (req as any).user;
      if (user) {
        await db.createAuditLog({
          userId: user.id,
          action: 'LOGOUT',
          resource: 'SESSION',
          resourceId: null, // Don't pass refresh token as resourceId since it's not a UUID
          details: { username: user.username, refreshToken: refreshToken?.substring(0, 20) + '...' },
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        });
      }
    }
    
    res.json(
      successResponse('Logged out successfully', null)
    );
    
  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }
    
    // Get fresh user data
    const currentUser = await db.getUserById(user.id);
    
    if (!currentUser) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }
    
    // Remove password from response and map field names
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = currentUser;
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedUser = {
      ...userWithoutPassword,
      thaiFirstName: userWithoutPassword.thai_name, // Use thai_name (combined) as first name
      thaiLastName: userWithoutPassword.thai_last_name,
      departmentId: userWithoutPassword.department_id,
      // Remove snake_case fields
      thai_name: undefined,
      thai_last_name: undefined,
      department_id: undefined
    };
    
    res.json(
      successResponse('Profile retrieved successfully', mappedUser)
    );
    
  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }
    
    // Validate input using standardized schema
    const validatedData = UpdateUserProfileSchema.parse(req.body);
    
    // Check if email is being changed and already exists
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await db.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json(
          errorResponse('Email already exists', 409)
        );
      }
    }
    
    // Transform data using standardized transformer
    const dbData = TransformToDatabase.userProfile(validatedData);
    
    // Remove undefined fields to avoid overwriting with null
    const dbUpdateData: any = {};
    Object.keys(dbData).forEach(key => {
      if (dbData[key as keyof typeof dbData] !== undefined) {
        dbUpdateData[key] = dbData[key as keyof typeof dbData];
      }
    });
    
    // Update user
    const updatedUser = await db.updateUser(user.id, dbUpdateData);
    
    // Log audit
    await db.createAuditLog({
      userId: user.id,
      action: 'PROFILE_UPDATE',
      resource: 'USER',
      resourceId: user.id,
      details: { updatedFields: Object.keys(validatedData) },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json(
      successResponse('Profile updated successfully', userWithoutPassword)
    );
    
  } catch (error) {
    console.error('Update profile error:', error);
    
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
 * Complete profile setup
 */
export const completeProfileSetup = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json(
        errorResponse('User not authenticated', 401)
      );
    }
    
    // Update profile_completed to true
    const updatedUser = await db.updateUser(user.id, { profile_completed: true });
    
    // Log audit
    await db.createAuditLog({
      userId: user.id,
      action: 'PROFILE_SETUP_COMPLETED',
      resource: 'USER',
      resourceId: user.id,
      details: { profile_completed: true },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
    
    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json(
      successResponse('Profile setup completed successfully', userWithoutPassword)
    );
    
  } catch (error) {
    console.error('Complete profile setup error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json(
        errorResponse('Verification token is required', 400)
      );
    }

    // Verify the token
    const result = await DatabaseSchema.verifyEmailToken(token);
    
    if (!result.success) {
      return res.status(400).json(
        errorResponse(result.error || 'Invalid verification token', 400)
      );
    }

    // Log audit
    await db.createAuditLog({
      userId: result.userId!,
      action: 'EMAIL_VERIFIED',
      resource: 'USER',
      resourceId: result.userId!,
      details: { token: token.substring(0, 20) + '...' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.json(
      successResponse('Email verified successfully! You can now log in.', {
        emailVerified: true,
        userId: result.userId
      })
    );
    
  } catch (error) {
    console.error('Email verification error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(
        errorResponse('Email is required', 400)
      );
    }

    // Find user
    const user = await db.getUserByUsernameOrEmail(email, email);
    
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Check if user is a patient
    if (user.role !== 'patient') {
      return res.status(400).json(
        errorResponse('Email verification is only required for patients', 400)
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json(
        errorResponse('Email is already verified', 400)
      );
    }

    try {
      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Store token in database
      await DatabaseSchema.createEmailVerificationToken(user.id, verificationToken);
      
      // Send verification email
      const emailSent = await emailService.sendEmailVerification(
        user.email,
        user.first_name,
        verificationToken
      );
      
      if (emailSent) {
        console.log('📧 Verification email resent to:', user.email);
        
        res.json(
          successResponse('Verification email sent successfully. Please check your email.', {
            emailSent: true,
            email: user.email
          })
        );
      } else {
        // In development mode, still return success even if email fails
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [DEV MODE] Email verification token generated:', verificationToken);
          
          res.json(
            successResponse('Verification email sent successfully. Please check your email.', {
              emailSent: true,
              email: user.email,
              devMode: true,
              verificationToken: verificationToken // Only in dev mode
            })
          );
        } else {
          res.status(500).json(
            errorResponse('Failed to send verification email', 500)
          );
        }
      }
      
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);
      
      // In development mode, still return success
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV MODE] Email error ignored in development mode');
        
        res.json(
          successResponse('Verification email sent successfully. Please check your email.', {
            emailSent: true,
            email: user.email,
            devMode: true
          })
        );
      } else {
        res.status(500).json(
          errorResponse('Failed to send verification email', 500)
        );
      }
    }
    
  } catch (error) {
    console.error('Resend verification email error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Forgot password - Send reset email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        errorResponse('Email is required', 400)
      );
    }

    console.log('🔍 Forgot password request for:', email);

    // Find user by email
    const user = await db.getUserByEmail(email);
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json(
        successResponse('If the email exists, a password reset link has been sent.', {
          emailSent: true
        })
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json(
        errorResponse('Account is deactivated', 400)
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    const tokenResult = await DatabaseSchema.createPasswordResetToken(user.id, resetToken, expiresAt);
    
    if (!tokenResult.success) {
      console.error('Failed to create reset token:', tokenResult.error);
      return res.status(500).json(
        errorResponse('Failed to create reset token', 500)
      );
    }

    // Send reset email
    const emailSent = await emailService.sendPasswordReset(
      user.email,
      user.first_name,
      resetToken
    );

    if (emailSent) {
      console.log('📧 Password reset email sent to:', user.email);
      
      res.json(
        successResponse('Password reset link has been sent to your email.', {
          emailSent: true,
          email: user.email
        })
      );
    } else {
      console.error('❌ Failed to send password reset email to:', user.email);
      
      // In development mode, still return success
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV MODE] Email error ignored in development mode');
        
        res.json(
          successResponse('Password reset link has been sent to your email.', {
            emailSent: true,
            email: user.email,
            devMode: true
          })
        );
      } else {
        res.status(500).json(
          errorResponse('Failed to send password reset email', 500)
        );
      }
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Reset password - Validate token and update password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json(
        errorResponse('Token and new password are required', 400)
      );
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json(
        errorResponse('Password must be at least 8 characters long', 400)
      );
    }

    console.log('🔍 Reset password request with token:', token.substring(0, 10) + '...');

    // Validate reset token
    const tokenValidation = await DatabaseSchema.validatePasswordResetToken(token);
    
    if (!tokenValidation.success) {
      return res.status(400).json(
        errorResponse(tokenValidation.error || 'Invalid or expired token', 400)
      );
    }

    const userId = tokenValidation.userId!;

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update user password
    const updateResult = await DatabaseSchema.updateUserPassword(userId, hashedPassword);
    
    if (!updateResult.success) {
      console.error('Failed to update password:', updateResult.error);
      return res.status(500).json(
        errorResponse('Failed to update password', 500)
      );
    }

    // Mark token as used
    await DatabaseSchema.markPasswordResetTokenAsUsed(token);

    // Invalidate all user sessions (optional - for security)
    try {
      await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    } catch (error) {
      console.warn('Failed to invalidate user sessions:', error);
    }

    console.log('✅ Password reset successful for user:', userId);

    res.json(
      successResponse('Password has been reset successfully. Please login with your new password.', {
        passwordReset: true
      })
    );
    
  } catch (error) {
    console.error('Reset password error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};