import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Settings Management Controller
 * จัดการการตั้งค่าระบบสำหรับ Admin Panel
 */

/**
 * Get system settings
 * GET /api/admin/settings
 */
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    // Get system settings from database or return default settings
    const settingsQuery = `
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description,
        is_public,
        updated_at
      FROM system_settings
      ORDER BY setting_key
    `;

    const settings = await databaseManager.query(settingsQuery).catch(() => ({ rows: [] }));

    // Default settings if none exist
    const defaultSettings = {
      // General Settings
      systemName: 'HealthChain EMR System',
      systemDescription: 'Electronic Medical Records Management System',
      timezone: 'Asia/Bangkok',
      language: 'th',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      
      // User Management
      allowRegistration: true,
      requireEmailVerification: true,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      
      // Notifications
      emailNotifications: true,
      smsNotifications: false,
      systemAlerts: true,
      backupNotifications: true,
      maintenanceNotifications: true,
      
      // Security
      twoFactorAuth: false,
      encryptionLevel: 'AES-256',
      auditLogging: true,
      ipWhitelist: [],
      allowedDomains: [],
      
      // Database
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 90,
      compressionEnabled: true,
      
      // Email
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'system@healthchain.com',
      smtpPassword: '',
      fromName: 'HealthChain System',
      fromEmail: 'noreply@healthchain.com',
      
      // API
      apiRateLimit: 1000,
      apiTimeout: 30000,
      corsOrigins: ['http://localhost:3000'],
      
      // File Upload
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
      fileStoragePath: '/uploads',
      
      // Maintenance
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.',
      scheduledMaintenance: null
    };

    // Convert database settings to object
    const dbSettings: any = {};
    settings.rows.forEach((setting: any) => {
      let value = setting.setting_value;
      
      // Parse JSON values
      if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.setting_value;
        }
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseInt(value);
      }
      
      dbSettings[setting.setting_key] = value;
    });

    const finalSettings = { ...defaultSettings, ...dbSettings };

    res.status(200).json({
      data: {
        settings: finalSettings,
        lastUpdated: settings.rows.length > 0 ? settings.rows[0].updated_at : new Date().toISOString()
      },
      meta: {
        totalSettings: Object.keys(finalSettings).length,
        categories: {
          general: 6,
          userManagement: 8,
          notifications: 5,
          security: 5,
          database: 4,
          email: 6,
          api: 3,
          fileUpload: 4,
          maintenance: 3
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'SETTINGS_ERROR',
        message: 'Failed to get system settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Update system settings
 * PUT /api/admin/settings
 */
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    const updatedBy = req.user?.id || 'admin';

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_SETTINGS',
          message: 'Invalid settings data'
        },
        statusCode: 400
      });
    }

    // Validate critical settings
    const criticalSettings = ['systemName', 'timezone', 'language', 'sessionTimeout'];
    for (const key of criticalSettings) {
      if (settings[key] === undefined || settings[key] === null || settings[key] === '') {
        return res.status(400).json({
          data: null,
          meta: null,
          error: {
            code: 'MISSING_CRITICAL_SETTING',
            message: `Critical setting '${key}' is required`
          },
          statusCode: 400
        });
      }
    }

    // Update settings in database
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      let settingType = 'string';
      let settingValue = value;

      // Determine setting type
      if (typeof value === 'boolean') {
        settingType = 'boolean';
        settingValue = value.toString();
      } else if (typeof value === 'number') {
        settingType = 'number';
        settingValue = value.toString();
      } else if (typeof value === 'object') {
        settingType = 'json';
        settingValue = JSON.stringify(value);
      }

      // Upsert setting
      const upsertQuery = `
        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (setting_key)
        DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          setting_type = EXCLUDED.setting_type,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
      `;

      return databaseManager.query(upsertQuery, [key, settingValue, settingType, updatedBy]);
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      data: {
        message: 'Settings updated successfully',
        updatedSettings: Object.keys(settings),
        updatedBy,
        updatedAt: new Date().toISOString()
      },
      meta: {
        totalUpdated: Object.keys(settings).length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: 'Failed to update system settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Reset settings to default
 * POST /api/admin/settings/reset
 */
export const resetSystemSettings = async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    const updatedBy = req.user?.id || 'admin';

    // Default settings by category
    const defaultSettingsByCategory: any = {
      general: {
        systemName: 'HealthChain EMR System',
        systemDescription: 'Electronic Medical Records Management System',
        timezone: 'Asia/Bangkok',
        language: 'th',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      },
      userManagement: {
        allowRegistration: true,
        requireEmailVerification: true,
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        passwordRequireNumbers: true,
        passwordRequireUppercase: true,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        lockoutDuration: 30
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        systemAlerts: true,
        backupNotifications: true,
        maintenanceNotifications: true
      },
      security: {
        twoFactorAuth: false,
        encryptionLevel: 'AES-256',
        auditLogging: true,
        ipWhitelist: [],
        allowedDomains: []
      },
      database: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionPeriod: 90,
        compressionEnabled: true
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'system@healthchain.com',
        smtpPassword: '',
        fromName: 'HealthChain System',
        fromEmail: 'noreply@healthchain.com'
      }
    };

    const settingsToReset = category ? defaultSettingsByCategory[category] : 
      Object.assign({}, ...Object.values(defaultSettingsByCategory));

    if (!settingsToReset) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid settings category'
        },
        statusCode: 400
      });
    }

    // Reset settings in database
    const resetPromises = Object.entries(settingsToReset).map(async ([key, value]) => {
      let settingType = 'string';
      let settingValue = value;

      if (typeof value === 'boolean') {
        settingType = 'boolean';
        settingValue = value.toString();
      } else if (typeof value === 'number') {
        settingType = 'number';
        settingValue = value.toString();
      } else if (typeof value === 'object') {
        settingType = 'json';
        settingValue = JSON.stringify(value);
      }

      const upsertQuery = `
        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (setting_key)
        DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          setting_type = EXCLUDED.setting_type,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
      `;

      return databaseManager.query(upsertQuery, [key, settingValue, settingType, updatedBy]);
    });

    await Promise.all(resetPromises);

    res.status(200).json({
      data: {
        message: 'Settings reset successfully',
        resetCategory: category || 'all',
        resetSettings: Object.keys(settingsToReset),
        updatedBy,
        updatedAt: new Date().toISOString()
      },
      meta: {
        totalReset: Object.keys(settingsToReset).length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Reset system settings error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'RESET_SETTINGS_ERROR',
        message: 'Failed to reset system settings'
      },
      statusCode: 500
    });
  }
};

/**
 * Get settings history
 * GET /api/admin/settings/history
 */
export const getSettingsHistory = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, settingKey } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (settingKey) {
      paramCount++;
      whereClause += ` AND setting_key = $${paramCount}`;
      queryParams.push(settingKey);
    }

    const historyQuery = `
      SELECT 
        sh.id,
        sh.setting_key,
        sh.old_value,
        sh.new_value,
        sh.setting_type,
        sh.updated_by,
        sh.updated_at,
        u.first_name,
        u.last_name,
        u.email
      FROM system_settings_history sh
      LEFT JOIN users u ON sh.updated_by = u.id
      ${whereClause}
      ORDER BY sh.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const history = await databaseManager.query(historyQuery, queryParams).catch(() => ({ rows: [] }));

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_settings_history sh
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2)).catch(() => ({ rows: [{ total: 0 }] }));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      data: {
        history: history.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        totalHistory: total
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get settings history error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'SETTINGS_HISTORY_ERROR',
        message: 'Failed to get settings history'
      },
      statusCode: 500
    });
  }
};
