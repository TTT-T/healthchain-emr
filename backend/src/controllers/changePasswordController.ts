import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import bcrypt from 'bcryptjs';

/**
 * Change Password Controller
 * จัดการการเปลี่ยนรหัสผ่าน
 */

/**
 * Change user password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

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
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Current password, new password, and confirm password are required'
        },
        statusCode: 400
      });
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'PASSWORD_MISMATCH',
          message: 'New password and confirm password do not match'
        },
        statusCode: 400
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 8 characters long'
        },
        statusCode: 400
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'SAME_PASSWORD',
          message: 'New password must be different from current password'
        },
        statusCode: 400
      });
    }

    // Get user's current password hash
    const userQuery = `
      SELECT id, email, password_hash, first_name, last_name
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const userResult = await databaseManager.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        statusCode: 404
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect'
        },
        statusCode: 400
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Start transaction
    await databaseManager.query('BEGIN');

    try {
      // Update password
      const updatePasswordQuery = `
        UPDATE users 
        SET 
          password_hash = $1,
          password_changed_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, first_name, last_name
      `;

      const updateResult = await databaseManager.query(updatePasswordQuery, [newPasswordHash, userId]);

      // Log the password change action
      const logQuery = `
        INSERT INTO audit_logs (
          user_id, action, resource, resource_id, details, ip_address, user_agent, success
        ) VALUES ($1, 'change_password', 'user', $2, $3, $4, $5, true)
      `;

      await databaseManager.query(logQuery, [
        userId,
        userId,
        JSON.stringify({
          passwordChanged: true,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || 'unknown'
        }),
        req.ip || 'unknown',
        req.get('User-Agent') || 'unknown'
      ]);

      // Invalidate all existing sessions (optional - for security)
      const invalidateSessionsQuery = `
        UPDATE user_sessions 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = $1 AND is_active = true
      `;

      await databaseManager.query(invalidateSessionsQuery, [userId]);

      // Commit transaction
      await databaseManager.query('COMMIT');

      res.status(200).json({
        data: {
          message: 'Password changed successfully',
          user: {
            id: updateResult.rows[0].id,
            email: updateResult.rows[0].email,
            firstName: updateResult.rows[0].first_name,
            lastName: updateResult.rows[0].last_name
          },
          passwordChangedAt: new Date().toISOString()
        },
        meta: {
          message: 'Password changed successfully',
          sessionsInvalidated: true
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
    console.error('Change password error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Failed to change password'
      },
      statusCode: 500
    });
  }
};

/**
 * Validate password strength
 * POST /api/auth/validate-password
 */
export const validatePasswordStrength = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_PASSWORD',
          message: 'Password is required'
        },
        statusCode: 400
      });
    }

    const validation = {
      isValid: true,
      score: 0,
      feedback: [] as string[],
      requirements: {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.(password),
        hasLowercase: /[a-z]/.(password),
        hasNumbers: /\d/.(password),
        hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.(password)
      }
    };

    // Calculate score
    if (validation.requirements.minLength) validation.score += 1;
    if (validation.requirements.hasUppercase) validation.score += 1;
    if (validation.requirements.hasLowercase) validation.score += 1;
    if (validation.requirements.hasNumbers) validation.score += 1;
    if (validation.requirements.hasSpecialChars) validation.score += 1;

    // Generate feedback
    if (!validation.requirements.minLength) {
      validation.feedback.push('Password must be at least 8 characters long');
    }
    if (!validation.requirements.hasUppercase) {
      validation.feedback.push('Password must contain at least one uppercase letter');
    }
    if (!validation.requirements.hasLowercase) {
      validation.feedback.push('Password must contain at least one lowercase letter');
    }
    if (!validation.requirements.hasNumbers) {
      validation.feedback.push('Password must contain at least one number');
    }
    if (!validation.requirements.hasSpecialChars) {
      validation.feedback.push('Password must contain at least one special character');
    }

    // Determine if password is valid
    validation.isValid = validation.score >= 4; // Require at least 4 out of 5 criteria

    // Add strength level
    let strength = 'weak';
    if (validation.score >= 4) strength = 'strong';
    else if (validation.score >= 3) strength = 'medium';

    res.status(200).json({
      data: {
        ...validation,
        strength,
        score: validation.score,
        maxScore: 5
      },
      meta: {
        message: 'Password validation completed'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Validate password strength error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate password strength'
      },
      statusCode: 500
    });
  }
};

/**
 * Get password requirements
 * GET /api/auth/password-requirements
 */
export const getPasswordRequirements = async (req: Request, res: Response) => {
  try {
    const requirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbiddenPatterns: [
        'password',
        '123456',
        'qwerty',
        'admin',
        'user'
      ],
      description: 'Password must be strong and secure',
      tips: [
        'Use a combination of uppercase and lowercase letters',
        'Include numbers and special characters',
        'Avoid common words or patterns',
        'Make it unique and memorable to you',
        'Consider using a passphrase'
      ]
    };

    res.status(200).json({
      data: requirements,
      meta: {
        message: 'Password requirements retrieved successfully'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get password requirements error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'REQUIREMENTS_ERROR',
        message: 'Failed to get password requirements'
      },
      statusCode: 500
    });
  }
};