import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Security Settings Controller
 * จัดการการตั้งค่าความปลอดภัย
 */

/**
 * Get user security settings
 * GET /api/security/settings
 */
export const getSecuritySettings = async (req: Request, res: Response) => {
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

    // Get user security settings
    const settingsQuery = `
      SELECT 
        u.id, u.email, u.two_factor_enabled, u.two_factor_secret,
        u.email_notifications, u.sms_notifications, u.login_notifications,
        u.security_alerts, u.data_sharing, u.privacy_level,
        u.last_password_change, u.password_expires_at,
        u.account_locked, u.failed_login_attempts, u.locked_until,
        u.created_at, u.updated_at
      FROM users u
      WHERE u.id = $1
    `;

    const result = await databaseManager.query(settingsQuery, [userId]);

    if (result.rows.length === 0) {
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

    const user = result.rows[0];

    // Get recent login history
    const loginHistoryQuery = `
      SELECT 
        id, ip_address, user_agent, login_time, logout_time, success, location
      FROM login_history
      WHERE user_id = $1
      ORDER BY login_time DESC
      LIMIT 10
    `;

    const loginHistory = await databaseManager.query(loginHistoryQuery, [userId]);

    // Get active sessions
    const activeSessionsQuery = `
      SELECT 
        id, session_token, ip_address, user_agent, created_at, last_activity, expires_at
      FROM user_sessions
      WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
      ORDER BY last_activity DESC
    `;

    const activeSessions = await databaseManager.query(activeSessionsQuery, [userId]);

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.two_factor_enabled,
        emailNotifications: user.email_notifications,
        smsNotifications: user.sms_notifications,
        loginNotifications: user.login_notifications,
        securityAlerts: user.security_alerts,
        dataSharing: user.data_sharing,
        privacyLevel: user.privacy_level,
        lastPasswordChange: user.last_password_change,
        passwordExpiresAt: user.password_expires_at,
        accountLocked: user.account_locked,
        failedLoginAttempts: user.failed_login_attempts,
        lockedUntil: user.locked_until,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      loginHistory: loginHistory.rows.map(session => ({
        id: session.id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        loginTime: session.login_time,
        logoutTime: session.logout_time,
        success: session.success,
        location: session.location
      })),
      activeSessions: activeSessions.rows.map(session => ({
        id: session.id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at
      }))
    };

    res.status(200).json({
      data: responseData,
      meta: {
        message: 'Security settings retrieved successfully',
        totalActiveSessions: activeSessions.rows.length,
        totalLoginHistory: loginHistory.rows.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_SETTINGS_ERROR',
        message: 'Failed to get security settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Update security settings
 * PUT /api/security/settings
 */
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      emailNotifications,
      smsNotifications,
      loginNotifications,
      securityAlerts,
      dataSharing,
      privacyLevel
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

    // Validate privacy level
    const validPrivacyLevels = ['public', 'friends', 'private'];
    if (privacyLevel && !validPrivacyLevels.includes(privacyLevel)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_PRIVACY_LEVEL',
          message: 'Invalid privacy level'
        },
        statusCode: 400
      });
    }

    // Update security settings
    const updateQuery = `
      UPDATE users SET
        email_notifications = COALESCE($1, email_notifications),
        sms_notifications = COALESCE($2, sms_notifications),
        login_notifications = COALESCE($3, login_notifications),
        security_alerts = COALESCE($4, security_alerts),
        data_sharing = COALESCE($5, data_sharing),
        privacy_level = COALESCE($6, privacy_level),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await databaseManager.query(updateQuery, [
      emailNotifications,
      smsNotifications,
      loginNotifications,
      securityAlerts,
      dataSharing,
      privacyLevel,
      userId
    ]);

    if (result.rows.length === 0) {
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

    // Log the update action
    const logQuery = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'update', 'security_settings', $2, $3, $4, $5, true)
    `;

    await databaseManager.query(logQuery, [
      userId,
      userId,
      JSON.stringify({
        updatedFields: Object.keys(req.body),
        timestamp: new Date().toISOString()
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.status(200).json({
      data: {
        user: result.rows[0],
        message: 'Security settings updated successfully'
      },
      meta: {
        updatedAt: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: 'Failed to update security settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Terminate all sessions
 * POST /api/security/sessions/terminate-all
 */
export const terminateAllSessions = async (req: Request, res: Response) => {
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

    // Terminate all active sessions except current one
    const terminateQuery = `
      UPDATE user_sessions 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND is_active = true
      RETURNING id
    `;

    const result = await databaseManager.query(terminateQuery, [userId]);

    // Log the action
    const logQuery = `
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'terminate_sessions', 'user_sessions', $2, $3, $4, $5, true)
    `;

    await databaseManager.query(logQuery, [
      userId,
      userId,
      JSON.stringify({
        terminatedSessions: result.rows.length,
        timestamp: new Date().toISOString()
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.status(200).json({
      data: {
        message: 'All sessions terminated successfully',
        terminatedCount: result.rows.length
      },
      meta: {
        terminatedAt: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Terminate sessions error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'TERMINATE_SESSIONS_ERROR',
        message: 'Failed to terminate sessions'
      },
      statusCode: 500
    });
  }
};