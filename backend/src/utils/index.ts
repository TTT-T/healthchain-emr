import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index';
import { JWTPayload, RefreshTokenPayload, TokenPair, ValidationError } from '../types';

/**
 * Password utilities
 */
export class PasswordUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
        value: password.length
      });
    }

    if (!/[a-z]/.(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter'
      });
    }

    if (!/[A-Z]/.(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/[0-9]/.(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number'
      });
    }

    if (!/[^a-zA-Z0-9]/.(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one special character'
      });
    }

    return errors;
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}

/**
 * JWT utilities
 */
export class JWTUtils {
  /**
   * Generate access and refresh tokens
   */
  static generateTokenPair(userId: string, username: string, email: string, role: string): TokenPair {
    const accessTokenPayload: JWTPayload = {
      sub: userId,
      username,
      email,
      role: role as any,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(config.jwt.expiresIn)
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(config.jwt.refreshExpiresIn)
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret);
    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.parseExpiresIn(config.jwt.expiresIn),
      token_type: 'Bearer'
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Parse expires in string to seconds
   */
  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}

/**
 * Encryption utilities
 */
export class EncryptionUtils {
  private static algorithm = 'aes-256-cbc';
  private static key = Buffer.from(config.security.encryptionKey, 'utf8');

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data using SHA-256
   */
  static hashSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.(email);
  }

  /**
   * Validate Thai phone number
   */
  static isValidThaiPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.(phone.replace(/[-\s]/g, ''));
  }

  /**
   * Validate Thai national ID
   */
  static isValidThaiNationalId(id: string): boolean {
    const cleanId = id.replace(/[-\s]/g, '');
    if (!/^\d{13}$/.(cleanId)) return false;

    // Validate checksum
    const digits = cleanId.split('').map(Number);
    const checksum = digits.slice(0, 12).reduce((sum, digit, index) => {
      return sum + digit * (13 - index);
    }, 0);
    
    const checkDigit = (11 - (checksum % 11)) % 10;
    return checkDigit === digits[12];
  }

  /**
   * Validate username format
   */
  static isValidUsername(username: string): boolean {
    // Username: 3-50 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.(username);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>\"']/g, '');
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.(uuid);
  }
}

/**
 * Date utilities
 */
export class DateUtils {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parse date from various formats
   */
  static parseDate(daring: string): Date | null {
    const date = new Date(daring);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Check if date is in the past
   */
  static isInPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  /**
   * Add time to date
   */
  static addTime(date: Date, amount: number, unit: 'seconds' | 'minutes' | 'hours' | 'days'): Date {
    const newDate = new Date(date);
    
    switch (unit) {
      case 'seconds':
        newDate.setSeconds(newDate.getSeconds() + amount);
        break;
      case 'minutes':
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
      case 'hours':
        newDate.setHours(newDate.getHours() + amount);
        break;
      case 'days':
        newDate.setDate(newDate.getDate() + amount);
        break;
    }
    
    return newDate;
  }

  /**
   * Format date for Thai locale
   */
  static formatThaiDate(date: Date): string {
    return date.toLocaleDaring('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Response utilities
 */
export class ResponseUtils {
  /**
   * Create success response
   */
  static success<T>(data: T, message?: string, metadata?: any) {
    return {
      success: true,
      data,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error response
   */
  static error(message: string, statusCode: number = 400, code?: string, details?: any) {
    return {
      success: false,
      error: {
        message,
        code: code || 'VALIDATION_ERROR',
        statusCode,
        timestamp: new Date().toISOString(),
        requestId: EncryptionUtils.generateSecureToken(16),
        details
      }
    };
  }

  /**
   * Create paginated response
   */
  static paginated<T>(data: T[], page: number, limit: number, total: number, message?: string) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Request utilities
 */
export class RequestUtils {
  /**
   * Extract IP address from request
   */
  static getClientIP(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.headers?.['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  /**
   * Extract User-Agent from request
   */
  static getUserAgent(req: any): string {
    return req.get?.('User-Agent') || req.headers?.['user-agent'] || 'unknown';
  }

  /**
   * Generate request ID
   */
  static generateRequestId(): string {
    return EncryptionUtils.generateSecureToken(16);
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  /**
   * Create application error
   */
  static createError(message: string, statusCode: number = 500, code?: string, details?: any): AppError {
    return new AppError(message, statusCode, code, details);
  }

  /**
   * Check if error is operational (expected)
   */
  static isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
  }
}

/**
 * Application Error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

import { User, APIResponse } from '../types/index';

// Export utility functions for easy access
export const hashPassword = (password: string): Promise<string> => {
  return PasswordUtils.hashPassword(password);
};

export const validatePassword = (password: string, hash: string): Promise<boolean> => {
  return PasswordUtils.verifyPassword(password, hash);
};

export const generateTokens = (user: User): { accessToken: string; refreshToken: string } => {
  const tokens = JWTUtils.generateTokenPair(user.id, user.username, user.email, user.role);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token
  };
};

export const verifyToken = (token: string): JWTPayload | null => {
  return JWTUtils.verifyAccessToken(token);
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  return JWTUtils.verifyRefreshToken(token);
};

export const successResponse = <T>(message: string, data?: T, metadata?: any): any => {
  return {
    data,
    meta: metadata ? { pagination: metadata.pagination } : null,
    error: null,
    statusCode: 200
  };
};

export const errorResponse = (message: string, statusCode?: number, errors?: any, metadata?: any): any => {
  return {
    data: null,
    meta: null,
    error: {
      code: 'ERROR',
      message,
      details: errors
    },
    metadata: metadata,
    statusCode: statusCode || 500
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const handleError = (error: Error, req?: any, res?: any, next?: any) => {
  console.error('Error:', error);
  
  if (res && !res.headersSent) {
    return res.status(500).json(errorResponse('Internal server error', 500));
  }
  
  if (next) {
    return next(error);
  }
  
  throw error;
};

export const createValidationError = (field: string, message: string, value?: any): ValidationError => {
  return {
    field,
    message,
    value
  };
};

export const createAppError = (message: string, statusCode: number, code?: string): AppError => {
  return ErrorUtils.createError(message, statusCode, code);
};

/**
 * Generate Hospital Number (HN)
 */
export const generateHospitalNumber = async (): Promise<string> => {
  // Get the current year in Thai Buddhist era
  const thaiYear = new Date().getFullYear() + 543;
  const yearSuffix = thaiYear.toString().slice(-2); // Last 2 digits
  
  // Generate random 6-digit number
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  
  // Format: YY-XXXXXX (e.g., 68-123456)
  const hn = `${yearSuffix}-${randomNumber}`;
  
  return hn;
};
