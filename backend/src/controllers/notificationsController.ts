import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notifications Controller
 * จัดการการแจ้งเตือนของผู้ป่วย
 */

/**
 * Get notifications for a patient
 * GET /api/patients/{id}/notifications
 */
export const getPatientNotifications = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, type, isRead, startDate, endDate } = req.query;
    const user = (req as any).user;
    

    // For patient role, find patient record by user's email
    // For other roles, use the patientId from URL
    let actualPatientId = patientId;
    let patient: any;
    
    if (user?.role === 'patient') {
      // Find patient record by user's email
      const patientByEmail = await databaseManager.query(
        'SELECT id, first_name, last_name FROM patients WHERE email = $1',
        [user.email]
      );
      
      if (patientByEmail.rows.length === 0) {
        // Patient record not found - this is expected for users who haven't registered in EMR yet
        // Return empty notifications instead of 404 error
        return res.status(200).json({
          data: {
            patient: {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`
            },
            notifications: [],
            unread_count: 0,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: 0,
              totalPages: 0
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
            notificationCount: 0
          },
          error: null,
          statusCode: 200
        });
      }
      
      actualPatientId = patientByEmail.rows[0].id;
      patient = patientByEmail.rows[0];
    } else {
      // For doctors/nurses/admins, validate patient exists
      const patientExists = await databaseManager.query(
        'SELECT id, first_name, last_name FROM patients WHERE id = $1',
        [patientId]
      );

      if (patientExists.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      
      patient = patientExists.rows[0];
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Build query for notifications
    let whereClause = 'WHERE n.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (type) {
      whereClause += ' AND n.notification_type = $2';
      queryParams.push(type);
    }

    if (isRead !== undefined) {
      const paramIndex = queryParams.length + 1;
      if (isRead === 'true') {
        whereClause += ` AND n.read_at IS NOT NULL`;
      } else {
        whereClause += ` AND n.read_at IS NULL`;
      }
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND n.created_at >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND n.created_at <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get notifications
    const notificationsQuery = `
      SELECT 
        n.id,
        n.title,
        n.message,
        n.notification_type,
        n.read_at,
        n.is_read,
        n.priority,
        n.metadata,
        n.created_at,
        n.updated_at,
        n.created_by
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const notificationsResult = await databaseManager.query(notificationsQuery, queryParams);
    const notifications = notificationsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get unread count
    const unreadCountResult = await databaseManager.query(`
      SELECT COUNT(*) as unread_count
      FROM notifications n
      WHERE n.patient_id = $1 AND n.read_at IS NULL
    `, [actualPatientId]);
    const unreadCount = parseInt(unreadCountResult.rows[0].unread_count);
    // Format notifications
    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      patient_id: actualPatientId, // Add patient_id to response
      title: notif.title,
      message: notif.message,
      notification_type: notif.notification_type,
      read_at: notif.read_at,
      is_read: notif.is_read,
      priority: notif.priority,
      metadata: notif.metadata,
      created_at: notif.created_at,
      updated_at: notif.updated_at,
      created_by: notif.created_by
    }));
    

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        notifications: formattedNotifications,
        unread_count: unreadCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        notificationCount: formattedNotifications.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient notifications:', error);
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
 * PUT /api/patients/{id}/notifications/{notifId}/read
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id: patientId, notifId } = req.params;
    const user = (req as any).user;
    

    // For patient role, find patient record by user's email
    // For other roles, use the patientId from URL
    let actualPatientId = patientId;
    
    if (user?.role === 'patient') {
      // Find patient record by user's email
      const patientByEmail = await databaseManager.query(
        'SELECT id, first_name, last_name FROM patients WHERE email = $1',
        [user.email]
      );
      
      if (patientByEmail.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient record not found' },
          statusCode: 404
        });
      }
      
      actualPatientId = patientByEmail.rows[0].id;
    }

    // Validate notification exists and belongs to patient
    const notificationExists = await databaseManager.query(`
      SELECT id, read_at FROM notifications 
      WHERE id = $1 AND patient_id = $2
    `, [notifId, actualPatientId]);

    if (notificationExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Notification not found' },
        statusCode: 404
      });
    }

    const notification = notificationExists.rows[0];

    if (notification.read_at) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Notification is already marked as read' },
        statusCode: 400
      });
    }

    // Mark notification as read
    await databaseManager.query(`
      UPDATE notifications 
      SET read_at = NOW() AT TIME ZONE 'Asia/Bangkok', updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = $1
    `, [notifId]);
    // Get updated notification
    const updatedNotification = await databaseManager.query(`
      SELECT 
        n.id, n.title, n.message, n.notification_type,
        n.read_at, n.updated_at
      FROM notifications n
      WHERE n.id = $1
    `, [notifId]);

    res.json({
      data: {
        notification: updatedNotification.rows[0],
        message: 'Notification marked as read'
      },
      meta: {
        timestamp: new Date().toISOString(),
        markedBy: user?.id
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
 * Delete notification
 * DELETE /api/patients/{id}/notifications/{notifId}
 */
export const deletePatientNotification = async (req: Request, res: Response) => {
  try {
    const { id: patientId, notifId } = req.params;
    const userId = (req as any).user.id;

    // Validate notification exists and belongs to patient
    const notificationExists = await databaseManager.query(`
      SELECT id FROM notifications 
      WHERE id = $1 AND patient_id = $2
    `, [notifId, patientId]);

    if (notificationExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Notification not found' },
        statusCode: 404
      });
    }

    // Delete notification
    await databaseManager.query(`
      DELETE FROM notifications 
      WHERE id = $1
    `, [notifId]);

    res.json({
      data: {
        message: 'Notification deleted successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        deletedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting patient notification:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create notification for patient
 * POST /api/patients/{id}/notifications
 */
export const createPatientNotification = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      title,
      message,
      notification_type,
      priority = 'normal',
      action_required = false,
      action_url,
      expires_at
    } = req.body;

    const userId = (req as any).user.id;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Create notification
    const notificationId = uuidv4();

    await databaseManager.query(`
      INSERT INTO notifications (
        id, patient_id, title, message, notification_type, priority,
        action_required, action_url, expires_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      notificationId, patientId, title, message, notification_type, priority,
      action_required, action_url, expires_at, userId
    ]);

    // Get created notification
    const createdNotification = await databaseManager.query(`
      SELECT 
        n.id, n.title, n.message, n.notification_type, n.priority,
        n.read_at, n.action_required, n.action_url, n.expires_at,
        n.created_at, n.updated_at,
        u.first_name as created_by_first_name, u.last_name as created_by_last_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = $1
    `, [notificationId]);

    res.status(201).json({
      data: {
        notification: {
          ...createdNotification.rows[0],
          created_by: {
            name: `${createdNotification.rows[0].created_by_first_name} ${createdNotification.rows[0].created_by_last_name}`
          }
        },
        message: 'Notification created successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        notificationId: notificationId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating patient notification:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
