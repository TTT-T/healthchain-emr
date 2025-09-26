import { Router } from 'express';
import { AdminActivityLogsController } from '../controllers/adminActivityLogsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     summary: Get activity logs with filtering and pagination
 *     tags: [Admin - Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for action, module, or user
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module/resource type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, warning, error]
 *         description: Filter by status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by username
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: today
 *         description: Filter by date range
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: string
 *                           user_role:
 *                             type: string
 *                           action:
 *                             type: string
 *                           module:
 *                             type: string
 *                           details:
 *                             type: string
 *                           ip_address:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [success, warning, error]
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                     filters:
 *                       type: object
 *                       properties:
 *                         modules:
 *                           type: array
 *                           items:
 *                             type: string
 *                         users:
 *                           type: array
 *                           items:
 *                             type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalActivities:
 *                           type: integer
 *                         successRate:
 *                           type: integer
 *                         warnings:
 *                           type: integer
 *                         errors:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/', AdminActivityLogsController.getActivityLogs);

/**
 * @swagger
 * /api/admin/activity-logs/{id}:
 *   get:
 *     summary: Get activity log details by ID
 *     tags: [Admin - Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     log:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         user:
 *                           type: string
 *                         userRole:
 *                           type: string
 *                         action:
 *                           type: string
 *                         module:
 *                           type: string
 *                         details:
 *                           type: string
 *                         ipAddress:
 *                           type: string
 *                         status:
 *                           type: string
 *                         errorMessage:
 *                           type: string
 *                         executionTime:
 *                           type: integer
 *                         requestId:
 *                           type: string
 *                         oldValues:
 *                           type: object
 *                         newValues:
 *                           type: object
 *                         userAgent:
 *                           type: string
 *       404:
 *         description: Activity log not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/:id', AdminActivityLogsController.getActivityLogDetails);

/**
 * @swagger
 * /api/admin/activity-logs/export:
 *   get:
 *     summary: Export activity logs
 *     tags: [Admin - Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for action, module, or user
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module/resource type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, warning, error]
 *         description: Filter by status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by username
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: today
 *         description: Filter by date range
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *     responses:
 *       200:
 *         description: Activity logs exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *                     totalRecords:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/export', AdminActivityLogsController.exportActivityLogs);

export default router;
