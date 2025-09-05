import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  User, 
  AuthRegisterRequest, 
  AuthLoginRequest, 
  AuthResponse,
  RefreshTokenRequest,
  APIResponse
} from '../types/index';
import { emailService } from '../services/emailService';

import { db, DatabaseSchema } from '../database/index';

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().optional(),
  role: z.enum([
    'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff',
    'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor',
    'patient_guardian', 'legal_representative', 'medical_attorney',
    'external_user', 'external_admin', 'patient'
  ]).optional()
});

const loginSchema = z.object({
  username: z.string().min(1).optional(), // Make username optional
  email: z.string().email().optional(),    // Make email optional
  password: z.string().min(1)
}).refine(data => data.username || data.email, {
  message: "Either username or email must be provided",
  path: ["username"]
});

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
    
    // Generate username from email if not provided
    const username = validatedData.username || validatedData.email.split('@')[0];
    
    // Check if user already exists
    const existingUser = await db.getUserByUsernameOrEmail(
      username, 
      validatedData.email
    );
    
    if (existingUser) {
      return res.status(409).json(
        errorResponse('User already exists with this username or email', 409)
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    const newUser = await db.createUser({
      username: username,
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phoneNumber: validatedData.phoneNumber,
      role: validatedData.role || 'patient',
      isActive: true,
      isEmailVerified: false
    });
    
    // Send email verification for patients only
    if (newUser.role === 'patient') {
      try {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Store token in database
        await DatabaseSchema.createEmailVerificationToken(newUser.id, verificationToken);
        
        // Send verification email
        await emailService.sendEmailVerification(
          validatedData.email,
          validatedData.firstName,
          verificationToken
        );
        
        console.log('📧 Verification email sent to:', validatedData.email);
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
      accessToken,
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
    const { password: _, ...userWithoutPassword } = newUser;
    
    const authResponse: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
    
    // Different response for patients vs other users
    if (newUser.role === 'patient') {
      res.status(201).json(
        successResponse('Registration successful. Please check your email to verify your account before logging in.', {
          ...authResponse,
          requiresEmailVerification: true
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
        errorResponse('Invalid credentials', 401)
      );
    }
    
    // Check if user is active
    console.log('🔍 User check - is_active:', user.is_active);
    if (!user.is_active) {
      console.log('❌ User is not active');
      return res.status(401).json(
        errorResponse('Account is deactivated', 401)
      );
    }
    
    // Check email verification for patients only
    console.log('🔍 User check - role:', user.role, 'email_verified:', user.email_verified);
    if (user.role === 'patient' && !user.email_verified) {
      console.log('❌ Patient email not verified');
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for the verification link.',
        data: null,
        errors: null,
        metadata: {
          requiresEmailVerification: true,
          email: user.email
        }
      });
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
        errorResponse('Invalid credentials', 401)
      );
    }
    
    console.log('✅ Password validation successful for user:', user.email);
    
    // Update last login
    await db.updateUserLastLogin(user.id);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Create session
    await db.createSession({
      userId: user.id,
      accessToken,
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
    
    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    
    const authResponse: AuthResponse = {
      user: userWithoutPassword,
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
    
    if (!user || !user.isActive) {
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
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = currentUser;
    
    res.json(
      successResponse('Profile retrieved successfully', userWithoutPassword)
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
    
    // Validate input (partial update)
    const updateSchema = z.object({
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      phoneNumber: z.string().optional()
    });
    
    const validatedData = updateSchema.parse(req.body);
    
    // Check if email is being changed and already exists
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await db.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json(
          errorResponse('Email already exists', 409)
        );
      }
    }
    
    // Update user
    const updatedUser = await db.updateUser(user.id, validatedData);
    
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
 * Verify email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
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
      await emailService.sendEmailVerification(
        user.email,
        user.first_name,
        verificationToken
      );
      
      console.log('📧 Verification email resent to:', user.email);
      
      res.json(
        successResponse('Verification email sent successfully. Please check your email.', {
          emailSent: true,
          email: user.email
        })
      );
      
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);
      
      res.status(500).json(
        errorResponse('Failed to send verification email', 500)
      );
    }
    
  } catch (error) {
    console.error('Resend verification email error:', error);
    
    res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
