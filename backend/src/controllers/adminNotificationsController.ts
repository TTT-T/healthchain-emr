import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Notifications Management Controller
 * จัดการการแจ้งเตือนสำหรับ Admin Panel
 */

/**
 * Get all notifications with pagination and filtering
 * GET /api/admin/notifications
 */
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status,
      userId,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      whereClause += ` AND n.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND n.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (userId) {
      paramCount++;
      whereClause += ` AND n.user_id = $${paramCount}`;
      queryParams.push(userId);
    }

    if (startDate) {
      paramCount++;
      whereClause += ` AND n.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereClause += ` AND n.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'type', 'status', 'priority'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get notifications with pagination
    const notificationsQuery = `
      SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.priority,
        n.status,
        n.read_at,
        n.created_at,
        n.updated_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const notifications = await databaseManager.query(notificationsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get notification statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system,
        COUNT(CASE WHEN type = 'user' THEN 1 END) as user,
        COUNT(CASE WHEN type = 'admin' THEN 1 END) as admin,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
      FROM notifications n
      ${whereClause.replace('WHERE 1=1', 'WHERE 1=1').replace(/AND n\.(type|status|user_id|created_at)/g, 'AND n.$1')}
    `;

    const stats = await databaseManager.query(statsQuery, queryParams.slice(0, -2));

    res.status(200).json({
      data: {
        notifications: notifications.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        statistics: stats.rows[0]
      },
      meta: {
        totalNotifications: total,
        unreadCount: stats.rows[0].unread,
        readCount: stats.rows[0].read,
        archivedCount: stats.rows[0].archived
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'NOTIFICATIONS_ERROR',
        message: 'Failed to get notifications'
      },
      statusCode: 500
    });
  }
};

/**
 * Create system notification
 * POST /api/admin/notifications
 */
export const createSystemNotification = async (req: Request, res: Response) => {
  try {
    const { 
      userIds, 
      type = 'system', 
      title, 
      message, 
      data, 
      priority = 'medium' 
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Title and message are required'
        },
        statusCode: 400
      });
    }

    // If no specific users, send to all active users
    let targetUsers: any[] = [];
    
    if (userIds && userIds.length > 0) {
      // Send to specific users
      const usersQuery = `
        SELECT id FROM users 
        WHERE id = ANY($1) AND is_active = true
      `;
      const usersResult = await databaseManager.query(usersQuery, [userIds]);
      targetUsers = usersResult.rows;
    } else {
      // Send to all active users
      const allUsersQuery = `
        SELECT id FROM users 
        WHERE is_active = true
      `;
      const allUsersResult = await databaseManager.query(allUsersQuery);
      targetUsers = allUsersResult.rows;
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'NO_TARGET_USERS',
          message: 'No target users found'
        },
        statusCode: 400
      });
    }

    // Create notifications for each user
    const notificationPromises = targetUsers.map(async (user) => {
      const insertQuery = `
        INSERT INTO notifications (
          user_id, type, title, message, data, priority, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'unread', NOW())
        RETURNING id
      `;

      return databaseManager.query(insertQuery, [
        user.id,
        type,
        title,
        message,
        data ? JSON.stringify(data) : null,
        priority
      ]);
    });

    const results = await Promise.all(notificationPromises);
    const notificationIds = results.map(result => result.rows[0].id);

    res.status(201).json({
      data: {
        message: 'Notifications created successfully',
        notificationIds,
        targetUsers: targetUsers.length,
        type,
        priority
      },
      meta: {
        totalCreated: notificationIds.length
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'CREATE_NOTIFICATION_ERROR',
        message: 'Failed to create notification'
      },
      statusCode: 500
    });
  }
};

/**
 * Mark notifications as read
 * PUT /api/admin/notifications/mark-read
 */
export const markNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationIds, userId } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_NOTIFICATION_IDS',
          message: 'Notification IDs are required'
        },
        statusCode: 400
      });
    }

    let whereClause = 'WHERE id = ANY($1)';
    const queryParams: any[] = [notificationIds];

    if (userId) {
      whereClause += ' AND user_id = $2';
      queryParams.push(userId);
    }

    const updateQuery = `
      UPDATE notifications 
      SET status = 'read', read_at = NOW(), updated_at = NOW()
      ${whereClause}
      RETURNING id
    `;

    const result = await databaseManager.query(updateQuery, queryParams);

    res.status(200).json({
      data: {
        message: 'Notifications marked as read',
        updatedIds: result.rows.map(row => row.id),
        totalUpdated: result.rows.length
      },
      meta: {
        totalUpdated: result.rows.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'MARK_READ_ERROR',
        message: 'Failed to mark notifications as read'
      },
      statusCode: 500
    });
  }
};

/**
 * Archive notifications
 * PUT /api/admin/notifications/archive
 */
export const archiveNotifications = async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_NOTIFICATION_IDS',
          message: 'Notification IDs are required'
        },
        statusCode: 400
      });
    }

    const updateQuery = `
      UPDATE notifications 
      SET status = 'archived', updated_at = NOW()
      WHERE id = ANY($1)
      RETURNING id
    `;

    const result = await databaseManager.query(updateQuery, [notificationIds]);

    res.status(200).json({
      data: {
        message: 'Notifications archived successfully',
        archivedIds: result.rows.map(row => row.id),
        totalArchived: result.rows.length
      },
      meta: {
        totalArchived: result.rows.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Archive notifications error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'ARCHIVE_ERROR',
        message: 'Failed to archive notifications'
      },
      statusCode: 500
    });
  }
};

/**
 * Delete notifications
 * DELETE /api/admin/notifications
 */
export const deleteNotifications = async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: {
          code: 'INVALID_NOTIFICATION_IDS',
          message: 'Notification IDs are required'
        },
        statusCode: 400
      });
    }

    const deleteQuery = `
      DELETE FROM notifications 
      WHERE id = ANY($1)
      RETURNING id
    `;

    const result = await databaseManager.query(deleteQuery, [notificationIds]);

    res.status(200).json({
      data: {
        message: 'Notifications deleted successfully',
        deletedIds: result.rows.map(row => row.id),
        totalDeleted: result.rows.length
      },
      meta: {
        totalDeleted: result.rows.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete notifications'
      },
      statusCode: 500
    });
  }
};

/**
 * Get notification templates
 * GET /api/admin/notifications/templates
 */
export const getNotificationTemplates = async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'system_maintenance',
        name: 'System Maintenance',
        type: 'system',
        title: 'Scheduled System Maintenance',
        message: 'The system will be under maintenance from {startTime} to {endTime}. Please save your work and log out before the maintenance period.',
        priority: 'high',
        variables: ['startTime', 'endTime']
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        type: 'system',
        title: 'Security Alert',
        message: 'A security alert has been detected: {alertType}. Please review your account activity and contact support if needed.',
        priority: 'high',
        variables: ['alertType']
      },
      {
        id: 'backup_complete',
        name: 'Backup Complete',
        type: 'system',
        title: 'Database Backup Completed',
        message: 'The database backup has been completed successfully. Backup size: {backupSize}, Duration: {duration}.',
        priority: 'low',
        variables: ['backupSize', 'duration']
      },
      {
        id: 'user_registration',
        name: 'New User Registration',
        type: 'admin',
        title: 'New User Registration',
        message: 'A new user has registered: {userName} ({userEmail}) with role {userRole}.',
        priority: 'medium',
        variables: ['userName', 'userEmail', 'userRole']
      },
      {
        id: 'data_request',
        name: 'Data Request',
        type: 'admin',
        title: 'New Data Request',
        message: 'A new data request has been submitted by {requesterName} for {dataType}. Please review and approve.',
        priority: 'medium',
        variables: ['requesterName', 'dataType']
      }
    ];

    res.status(200).json({
      data: {
        templates
      },
      meta: {
        totalTemplates: templates.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get notification templates error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'TEMPLATES_ERROR',
        message: 'Failed to get notification templates'
      },
      statusCode: 500
    });
  }
};
