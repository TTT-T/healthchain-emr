import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin Audit Logs Controller
 * จัดการ audit logs สำหรับ Admin Panel
 */

/**
 * Get audit logs with pagination and filtering
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      user_id, 
      action, 
      resource_type,
      start_date,
      end_date,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      whereClause += ` AND al.user_id = $${paramCount}`;
      queryParams.push(user_id);
    }

    if (action) {
      paramCount++;
      whereClause += ` AND al.action = $${paramCount}`;
      queryParams.push(action);
    }

    if (resource_type) {
      paramCount++;
      whereClause += ` AND al.resource = $${paramCount}`;
      queryParams.push(resource_type);
    }

    if (start_date) {
      paramCount++;
      whereClause += ` AND al.created_at >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereClause += ` AND al.created_at <= $${paramCount}`;
      queryParams.push(end_date);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'action', 'resource', 'user_id'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get audit logs with pagination
    const auditLogsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.success,
        al.error_message,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const auditLogsResult = await databaseManager.query(auditLogsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format response
    const formattedLogs = auditLogsResult.rows.map(log => ({
      id: log.id,
      user: log.user_id ? {
        id: log.user_id,
        name: `${log.first_name} ${log.last_name}`,
        email: log.email,
        role: log.role
      } : null,
      action: log.action,
      resource_type: log.resource,
      resource_id: log.resource_id,
      details: log.details,
      success: log.success,
      error_message: log.error_message,
      metadata: {
        ip_address: log.ip_address,
        user_agent: log.user_agent
      },
      timestamp: log.created_at
    }));

    res.status(200).json({
      data: {
        audit_logs: formattedLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        logCount: formattedLogs.length,
        filters: {
          user_id,
          action,
          resource_type,
          start_date,
          end_date,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get audit log by ID
 * GET /api/admin/audit-logs/{id}
 */
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const auditLogQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.success,
        al.error_message,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `;

    const auditLogResult = await databaseManager.query(auditLogQuery, [id]);

    if (auditLogResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Audit log not found' },
        statusCode: 404
      });
    }

    const log = auditLogResult.rows[0];

    res.status(200).json({
      data: {
        audit_log: {
          id: log.id,
          user: log.user_id ? {
            id: log.user_id,
            name: `${log.first_name} ${log.last_name}`,
            email: log.email,
            role: log.role
          } : null,
          action: log.action,
          resource_type: log.resource,
          resource_id: log.resource_id,
          details: log.details,
          success: log.success,
          error_message: log.error_message,
          metadata: {
            ip_address: log.ip_address,
            user_agent: log.user_agent
          },
          timestamp: log.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting audit log by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get audit log statistics
 * GET /api/admin/audit-logs/stats
 */
export const getAuditLogStats = async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query; // Default to last 30 days
    const days = parseInt(period as string);

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get comprehensive audit statistics
    const [
      // Action statistics
      actionStatsResult,
      // User activity statistics
      userActivityResult,
      // Resource type statistics
      resourceTypeStatsResult,
      // Daily activity trends
      dailyActivityResult,
      // Top active users
      topActiveUsersResult,
      // Recent suspicious activities
      suspiciousActivityResult
    ] = await Promise.all([
      // Action statistics
      databaseManager.query(`
        SELECT 
          action,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs 
        WHERE created_at >= $1
        GROUP BY action
        ORDER BY count DESC
      `, [startDate]),

      // User activity statistics
      databaseManager.query(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.role,
          COUNT(al.id) as activity_count,
          MAX(al.created_at) as last_activity
        FROM users u
        LEFT JOIN audit_logs al ON u.id = al.user_id AND al.created_at >= $1
        WHERE u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.role
        HAVING COUNT(al.id) > 0
        ORDER BY activity_count DESC
        LIMIT 20
      `, [startDate]),

      // Resource type statistics
      databaseManager.query(`
        SELECT 
          resource,
          COUNT(*) as count,
          COUNT(DISTINCT resource_id) as unique_resources
        FROM audit_logs 
        WHERE created_at >= $1
        GROUP BY resource
        ORDER BY count DESC
      `, [startDate]),

      // Daily activity trends
      databaseManager.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_activities,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as creates,
          COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as updates,
          COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as deletes
        FROM audit_logs 
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [startDate]),

      // Top active users
      databaseManager.query(`
        SELECT 
          u.first_name,
          u.last_name,
          u.role,
          COUNT(al.id) as activity_count,
          COUNT(DISTINCT al.resource) as resource_types_accessed
        FROM users u
        JOIN audit_logs al ON u.id = al.user_id
        WHERE al.created_at >= $1
        GROUP BY u.id, u.first_name, u.last_name, u.role
        ORDER BY activity_count DESC
        LIMIT 10
      `, [startDate]),

      // Recent suspicious activities (multiple failed attempts, unusual patterns)
      databaseManager.query(`
        SELECT 
          user_id,
          action,
          resource,
          COUNT(*) as attempt_count,
          MIN(created_at) as first_attempt,
          MAX(created_at) as last_attempt
        FROM audit_logs 
        WHERE created_at >= $1
        GROUP BY user_id, action, resource
        HAVING COUNT(*) > 10
        ORDER BY attempt_count DESC
        LIMIT 20
      `, [startDate])
    ]);

    res.status(200).json({
      data: {
        period: {
          days,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        statistics: {
          actions: actionStatsResult.rows,
          user_activity: userActivityResult.rows,
          resource_types: resourceTypeStatsResult.rows,
          daily_trends: dailyActivityResult.rows,
          top_active_users: topActiveUsersResult.rows,
          suspicious_activities: suspiciousActivityResult.rows
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: (req as any).user.id
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting audit log stats:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create audit log entry (for internal use)
 */
export const createAuditLog = async (logData: {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details?: any;
  success?: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}) => {
  try {
    const createLogQuery = `
      INSERT INTO audit_logs (
        id, user_id, action, resource, resource_id,
        details, success, error_message, ip_address, user_agent, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;

    const logId = require('uuid').v4();
    const result = await databaseManager.query(createLogQuery, [
      logId,
      logData.user_id,
      logData.action,
      logData.resource,
      logData.resource_id,
      logData.details ? JSON.stringify(logData.details) : null,
      logData.success !== undefined ? logData.success : true,
      logData.error_message,
      logData.ip_address,
      logData.user_agent,
      new Date()
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};
