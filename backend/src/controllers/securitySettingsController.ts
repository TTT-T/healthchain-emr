import { Request, Response } from 'express';
import { z } from 'zod';
import DatabaseConnection from '../database/index';
import { 
  successResponse,
  errorResponse
} from '../utils/index';

const db = DatabaseConnection.getInstance();

// Validation schema สำหรับการตั้งค่าความปลอดภัย
const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  sessionTimeout: z.number().min(5).max(480).optional(), // 5 minutes to 8 hours
  requirePasswordChange: z.boolean().optional(),
  passwordChangeInterval: z.number().min(30).max(365).optional(), // 30 days to 1 year
  deviceTrust: z.boolean().optional(),
  locationTracking: z.boolean().optional()
});

/**
 * Get user security settings
 * GET /api/security/settings
 */
export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    // Get user security settings from database
    const result = await db.query(
      `SELECT 
        two_factor_enabled,
        email_notifications,
        sms_notifications,
        login_alerts,
        session_timeout,
        require_password_change,
        password_change_interval,
        device_trust,
        location_tracking,
        created_at,
        updated_at
      FROM user_security_settings 
      WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Return default settings if no settings exist
      const defaultSettings = {
        twoFactorEnabled: false,
        emailNotifications: true,
        smsNotifications: false,
        loginAlerts: true,
        sessionTimeout: 60, // 1 hour
        requirePasswordChange: false,
        passwordChangeInterval: 90, // 90 days
        deviceTrust: false,
        locationTracking: false
      };

      return res.status(200).json(
        successResponse(defaultSettings, 'Security settings retrieved')
      );
    }

    const settings = result.rows[0];
    const formattedSettings = {
      twoFactorEnabled: settings.two_factor_enabled,
      emailNotifications: settings.email_notifications,
      smsNotifications: settings.sms_notifications,
      loginAlerts: settings.login_alerts,
      sessionTimeout: settings.session_timeout,
      requirePasswordChange: settings.require_password_change,
      passwordChangeInterval: settings.password_change_interval,
      deviceTrust: settings.device_trust,
      locationTracking: settings.location_tracking,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    };

    return res.status(200).json(
      successResponse(formattedSettings, 'Security settings retrieved')
    );

  } catch (error) {
    console.error('Get security settings error:', error);
    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Update user security settings
 * PUT /api/security/settings
 */
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    const validatedData = securitySettingsSchema.parse(req.body);

    // Check if settings exist
    const existingResult = await db.query(
      'SELECT id FROM user_security_settings WHERE user_id = $1',
      [req.user.id]
    );

    if (existingResult.rows.length === 0) {
      // Create new settings
      await db.query(
        `INSERT INTO user_security_settings (
          user_id, two_factor_enabled, email_notifications, sms_notifications,
          login_alerts, session_timeout, require_password_change,
          password_change_interval, device_trust, location_tracking
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          req.user.id,
          validatedData.twoFactorEnabled || false,
          validatedData.emailNotifications !== undefined ? validatedData.emailNotifications : true,
          validatedData.smsNotifications || false,
          validatedData.loginAlerts !== undefined ? validatedData.loginAlerts : true,
          validatedData.sessionTimeout || 60,
          validatedData.requirePasswordChange || false,
          validatedData.passwordChangeInterval || 90,
          validatedData.deviceTrust || false,
          validatedData.locationTracking || false
        ]
      );
    } else {
      // Update existing settings
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (validatedData.twoFactorEnabled !== undefined) {
        updateFields.push(`two_factor_enabled = $${paramIndex}`);
        updateValues.push(validatedData.twoFactorEnabled);
        paramIndex++;
      }

      if (validatedData.emailNotifications !== undefined) {
        updateFields.push(`email_notifications = $${paramIndex}`);
        updateValues.push(validatedData.emailNotifications);
        paramIndex++;
      }

      if (validatedData.smsNotifications !== undefined) {
        updateFields.push(`sms_notifications = $${paramIndex}`);
        updateValues.push(validatedData.smsNotifications);
        paramIndex++;
      }

      if (validatedData.loginAlerts !== undefined) {
        updateFields.push(`login_alerts = $${paramIndex}`);
        updateValues.push(validatedData.loginAlerts);
        paramIndex++;
      }

      if (validatedData.sessionTimeout !== undefined) {
        updateFields.push(`session_timeout = $${paramIndex}`);
        updateValues.push(validatedData.sessionTimeout);
        paramIndex++;
      }

      if (validatedData.requirePasswordChange !== undefined) {
        updateFields.push(`require_password_change = $${paramIndex}`);
        updateValues.push(validatedData.requirePasswordChange);
        paramIndex++;
      }

      if (validatedData.passwordChangeInterval !== undefined) {
        updateFields.push(`password_change_interval = $${paramIndex}`);
        updateValues.push(validatedData.passwordChangeInterval);
        paramIndex++;
      }

      if (validatedData.deviceTrust !== undefined) {
        updateFields.push(`device_trust = $${paramIndex}`);
        updateValues.push(validatedData.deviceTrust);
        paramIndex++;
      }

      if (validatedData.locationTracking !== undefined) {
        updateFields.push(`location_tracking = $${paramIndex}`);
        updateValues.push(validatedData.locationTracking);
        paramIndex++;
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(req.user.id);
        
        await db.query(
          `UPDATE user_security_settings 
           SET ${updateFields.join(', ')} 
           WHERE user_id = $${paramIndex}`,
          updateValues
        );
      }
    }

    // Log audit
    await db.createAuditLog({
      userId: req.user.id,
      action: 'SECURITY_SETTINGS_UPDATE',
      resource: 'USER_SECURITY',
      resourceId: req.user.id,
      details: { 
        updatedFields: Object.keys(validatedData),
        updatedAt: new Date().toISOString()
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(200).json(
      successResponse(
        null,
        'Security settings updated successfully'
      )
    );

  } catch (error) {
    console.error('Update security settings error:', error);
    
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

/**
 * Get user login sessions
 * GET /api/security/sessions
 */
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    // Get user sessions from database
    const result = await db.query(
      `SELECT 
        id,
        device_info,
        ip_address,
        user_agent,
        location,
        is_active,
        last_activity,
        created_at
      FROM user_sessions 
      WHERE user_id = $1 
      ORDER BY last_activity DESC`,
      [req.user.id]
    );

    const sessions = result.rows.map(session => ({
      id: session.id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      location: session.location,
      isActive: session.is_active,
      lastActivity: session.last_activity,
      createdAt: session.created_at
    }));

    return res.status(200).json(
      successResponse(sessions, 'User sessions retrieved')
    );

  } catch (error) {
    console.error('Get user sessions error:', error);
    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};

/**
 * Terminate user session
 * DELETE /api/security/sessions/:sessionId
 */
export const terminateSession = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    const { sessionId } = req.params;

    // Verify session belongs to user
    const sessionResult = await db.query(
      'SELECT id FROM user_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('Session not found', 404)
      );
    }

    // Terminate session
    await db.query(
      'UPDATE user_sessions SET is_active = false, terminated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionId]
    );

    // Log audit
    await db.createAuditLog({
      userId: req.user.id,
      action: 'SESSION_TERMINATE',
      resource: 'USER_SESSION',
      resourceId: sessionId,
      details: { 
        terminatedAt: new Date().toISOString(),
        ipAddress: req.ip || 'unknown'
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(200).json(
      successResponse(
        null,
        'Session terminated successfully'
      )
    );

  } catch (error) {
    console.error('Terminate session error:', error);
    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
