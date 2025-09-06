import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * External Requesters Notifications Controller
 * จัดการการแจ้งเตือนสำหรับ External Requesters
 */

/**
 * Get notifications for external requester
 * GET /api/external-requesters/notifications
 */
export const getExternalRequesterNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, type, isRead, startDate, endDate } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE n.user_id = $1';
    const queryParams: any[] = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND n.type = $${paramCount}`;
      queryParams.push(type);
    }

    if (isRead !== undefined) {
      paramCount++;
      whereClause += ` AND n.is_read = $${paramCount}`;
      queryParams.push(isRead === 'true');
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

    // Get notifications with pagination
    const notificationsQuery = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.priority,
        n.is_read,
        n.read_at,
        n.created_at,
        n.updated_at
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const notificationsResult = await databaseManager.query(notificationsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;

    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    const notifications = notificationsResult.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.parse(notification.data) : null,
      priority: notification.priority,
      isRead: notification.is_read,
      readAt: notification.read_at,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at
    }));

    res.json({
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting external requester notifications:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/external-requesters/notifications/:id/read
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id: notificationId } = req.params;
    const userId = (req as any).user.id;

    // Verify notification belongs to user
    const notificationQuery = `
      SELECT id, is_read FROM notifications 
      WHERE id = $1 AND user_id = $2
    `;

    const notificationResult = await databaseManager.query(notificationQuery, [notificationId, userId]);

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Notification not found' },
        statusCode: 404
      });
    }

    const notification = notificationResult.rows[0];

    if (notification.is_read) {
      return res.json({
        data: { message: 'Notification already marked as read' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4()
        },
        error: null,
        statusCode: 200
      });
    }

    // Mark as read
    const updateQuery = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, [notificationId, userId]);

    res.json({
      data: {
        notification: {
          id: updateResult.rows[0].id,
          isRead: updateResult.rows[0].is_read,
          readAt: updateResult.rows[0].read_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/external-requesters/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const updateQuery = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*) as updated_count
    `;

    const updateResult = await databaseManager.query(updateQuery, [userId]);
    const updatedCount = parseInt(updateResult.rows[0].updated_count);

    res.json({
      data: {
        message: `Marked ${updatedCount} notifications as read`,
        updatedCount
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get notification statistics
 * GET /api/external-requesters/notifications/stats
 */
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_month
      FROM notifications 
      WHERE user_id = $1
    `;

    const statsResult = await databaseManager.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    res.json({
      data: {
        total: parseInt(stats.total),
        unread: parseInt(stats.unread),
        read: parseInt(stats.read),
        lastWeek: parseInt(stats.last_week),
        lastMonth: parseInt(stats.last_month)
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
