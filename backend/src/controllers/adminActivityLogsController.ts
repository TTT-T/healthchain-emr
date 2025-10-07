import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { logger } from '../utils/logger';

export class AdminActivityLogsController {
  /**
   * Get activity logs with filtering and pagination
   */
  static async getActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        module = '',
        status = '',
        user = '',
        dateRange = 'today',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const limitNum = Number(limit);

      // Build WHERE conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Search condition
      if (search) {
        conditions.push(`(
          al.action ILIKE $${paramIndex} OR 
          al.table_name ILIKE $${paramIndex} OR 
          u.username ILIKE $${paramIndex} OR 
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Module filter (table_name)
      if (module) {
        conditions.push(`al.table_name = $${paramIndex}`);
        params.push(module);
        paramIndex++;
      }

      // Status filter - simplified since audit_logs doesn't have success/error columns
      if (status) {
        if (status === 'error') {
          conditions.push(`al.action ILIKE '%error%' OR al.action ILIKE '%fail%'`);
        } else if (status === 'success') {
          conditions.push(`al.action NOT ILIKE '%error%' AND al.action NOT ILIKE '%fail%'`);
        }
      }

      // User filter
      if (user) {
        conditions.push(`u.username = $${paramIndex}`);
        params.push(user);
        paramIndex++;
      }

      // Date range filter
      if (dateRange && dateRange !== 'all') {
        let dateCondition = '';
        switch (dateRange) {
          case 'today':
            dateCondition = `al.created_at >= CURRENT_DATE`;
            break;
          case 'week':
            dateCondition = `al.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
            break;
          case 'month':
            dateCondition = `al.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
            break;
        }
        if (dateCondition) {
          conditions.push(dateCondition);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
      `;
      
      const countResult = await databaseManager.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get activity logs with user information
      const logsQuery = `
        SELECT 
          al.id,
          al.created_at as timestamp,
          COALESCE(u.username, 'System') as user,
          COALESCE(u.role, 'System') as user_role,
          al.action,
          al.table_name as module,
          CASE 
            WHEN al.old_values IS NOT NULL AND al.new_values IS NOT NULL THEN
              'Updated ' || al.table_name || ' record'
            WHEN al.new_values IS NOT NULL THEN
              'Created ' || al.table_name || ' record'
            WHEN al.old_values IS NOT NULL THEN
              'Deleted ' || al.table_name || ' record'
            ELSE al.action
          END as details,
          al.ip_address,
          CASE 
            WHEN al.action ILIKE '%error%' OR al.action ILIKE '%fail%' THEN 'error'
            ELSE 'success'
          END as status,
          NULL as error_message,
          NULL as execution_time_ms,
          NULL as request_id
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.${sortBy} ${String(sortOrder).toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limitNum, offset);
      const logsResult = await databaseManager.query(logsQuery, params);

      // Get unique modules and users for filters
      const modulesQuery = `
        SELECT DISTINCT table_name as module
        FROM audit_logs
        WHERE table_name IS NOT NULL
        ORDER BY table_name
      `;
      const modulesResult = await databaseManager.query(modulesQuery);

      const usersQuery = `
        SELECT DISTINCT u.username
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE u.username IS NOT NULL
        ORDER BY u.username
      `;
      const usersResult = await databaseManager.query(usersQuery);

      // Get statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN action NOT ILIKE '%error%' AND action NOT ILIKE '%fail%' THEN 1 END) as success_count,
          COUNT(CASE WHEN action ILIKE '%error%' OR action ILIKE '%fail%' THEN 1 END) as error_count,
          0 as warning_count
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
      `;
      const statsResult = await databaseManager.query(statsQuery, params.slice(0, -2)); // Remove limit and offset params

      const stats = statsResult.rows[0];
      const successRate = stats.total_activities > 0 
        ? Math.round((stats.success_count / stats.total_activities) * 100) 
        : 0;

      res.status(200).json({
        data: {
          logs: logsResult.rows,
          pagination: {
            page: Number(page),
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          },
          filters: {
            modules: modulesResult.rows.map((row: any) => row.module),
            users: usersResult.rows.map((row: any) => row.username)
          },
          statistics: {
            totalActivities: parseInt(stats.total_activities),
            successRate,
            warnings: parseInt(stats.warning_count),
            errors: parseInt(stats.error_count)
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          queryTime: Date.now()
        },
        error: null
      });

    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      res.status(500).json({
        data: null,
        meta: {
          timestamp: new Date().toISOString()
        },
        error: {
          message: 'Failed to fetch activity logs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Get activity log details by ID
   */
  static async getActivityLogDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          al.*,
          u.username,
          u.first_name,
          u.last_name,
          u.role,
          u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.id = $1
      `;

      const result = await databaseManager.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          data: null,
          meta: {
            timestamp: new Date().toISOString()
          },
          error: {
            message: 'Activity log not found'
          }
        });
        return;
      }

      const log = result.rows[0];

      res.status(200).json({
        data: {
          log: {
            id: log.id,
            timestamp: log.created_at,
            user: log.username || 'System',
            user_role: log.role || 'System',
            action: log.action,
            module: log.table_name,
            details: log.old_values && log.new_values 
              ? `Updated ${log.table_name} record`
              : log.new_values 
                ? `Created ${log.table_name} record`
                : log.old_values 
                  ? `Deleted ${log.table_name} record`
                  : log.action,
            ip_address: log.ip_address,
            status: log.action && (log.action.includes('error') || log.action.includes('fail')) ? 'error' : 'success',
            errorMessage: null,
            executionTime: null,
            requestId: null,
            oldValues: log.old_values,
            newValues: log.new_values,
            userAgent: log.user_agent
          }
        },
        meta: {
          timestamp: new Date().toISOString()
        },
        error: null
      });

    } catch (error) {
      logger.error('Error fetching activity log details:', error);
      res.status(500).json({
        data: null,
        meta: {
          timestamp: new Date().toISOString()
        },
        error: {
          message: 'Failed to fetch activity log details',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Export activity logs
   */
  static async exportActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        search = '',
        module = '',
        status = '',
        user = '',
        dateRange = 'today',
        format = 'csv'
      } = req.query;

      // Build WHERE conditions (same as getActivityLogs)
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        conditions.push(`(
          al.action ILIKE $${paramIndex} OR 
          al.table_name ILIKE $${paramIndex} OR 
          u.username ILIKE $${paramIndex} OR 
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (module) {
        conditions.push(`al.table_name = $${paramIndex}`);
        params.push(module);
        paramIndex++;
      }

      if (status) {
        if (status === 'error') {
          conditions.push(`al.action ILIKE '%error%' OR al.action ILIKE '%fail%'`);
        } else if (status === 'success') {
          conditions.push(`al.action NOT ILIKE '%error%' AND al.action NOT ILIKE '%fail%'`);
        }
      }

      if (user) {
        conditions.push(`u.username = $${paramIndex}`);
        params.push(user);
        paramIndex++;
      }

      if (dateRange && dateRange !== 'all') {
        let dateCondition = '';
        switch (dateRange) {
          case 'today':
            dateCondition = `al.created_at >= CURRENT_DATE`;
            break;
          case 'week':
            dateCondition = `al.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
            break;
          case 'month':
            dateCondition = `al.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
            break;
        }
        if (dateCondition) {
          conditions.push(dateCondition);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          al.created_at as timestamp,
          COALESCE(u.username, 'System') as user,
          COALESCE(u.role, 'System') as user_role,
          al.action,
          al.table_name as module,
          CASE 
            WHEN al.old_values IS NOT NULL AND al.new_values IS NOT NULL THEN
              'Updated ' || al.table_name || ' record'
            WHEN al.new_values IS NOT NULL THEN
              'Created ' || al.table_name || ' record'
            WHEN al.old_values IS NOT NULL THEN
              'Deleted ' || al.table_name || ' record'
            ELSE al.action
          END as details,
          al.ip_address,
          CASE 
            WHEN al.action ILIKE '%error%' OR al.action ILIKE '%fail%' THEN 'error'
            ELSE 'success'
          END as status,
          NULL as error_message,
          NULL as execution_time_ms
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
      `;

      const result = await databaseManager.query(query, params);

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Details', 'IP Address', 'Status', 'Error Message', 'Execution Time (ms)'];
        const csvContent = [
          headers.join(','),
          ...result.rows.map((row: any) => [
            row.timestamp,
            `"${row.user}"`,
            `"${row.user_role}"`,
            `"${row.action}"`,
            `"${row.module}"`,
            `"${row.details}"`,
            row.ip_address || '',
            row.status,
            `"${row.error_message || ''}"`,
            row.execution_time_ms || ''
          ].join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON
        res.status(200).json({
          data: {
            logs: result.rows,
            exportedAt: new Date().toISOString(),
            totalRecords: result.rows.length
          },
          meta: {
            timestamp: new Date().toISOString()
          },
          error: null
        });
      }

    } catch (error) {
      logger.error('Error exporting activity logs:', error);
      res.status(500).json({
        data: null,
        meta: {
          timestamp: new Date().toISOString()
        },
        error: {
          message: 'Failed to export activity logs',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}
