import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getSecuritySettings, 
  updateSecuritySettings,
  getUserSessions,
  terminateSession
} from '../controllers/securitySettingsController';

const router = Router();

/**
 * @swagger
 * /api/security/settings:
 *   get:
 *     summary: Get user security settings
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     twoFactorEnabled:
 *                       type: boolean
 *                     emailNotifications:
 *                       type: boolean
 *                     smsNotifications:
 *                       type: boolean
 *                     loginAlerts:
 *                       type: boolean
 *                     sessionTimeout:
 *                       type: number
 *                     requirePasswordChange:
 *                       type: boolean
 *                     passwordChangeInterval:
 *                       type: number
 *                     deviceTrust:
 *                       type: boolean
 *                     locationTracking:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/settings', authenticate, getSecuritySettings);

/**
 * @swagger
 * /api/security/settings:
 *   put:
 *     summary: Update user security settings
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               twoFactorEnabled:
 *                 type: boolean
 *               emailNotifications:
 *                 type: boolean
 *               smsNotifications:
 *                 type: boolean
 *               loginAlerts:
 *                 type: boolean
 *               sessionTimeout:
 *                 type: number
 *                 minimum: 5
 *                 maximum: 480
 *               requirePasswordChange:
 *                 type: boolean
 *               passwordChangeInterval:
 *                 type: number
 *                 minimum: 30
 *                 maximum: 365
 *               deviceTrust:
 *                 type: boolean
 *               locationTracking:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Security settings updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/settings', authenticate, updateSecuritySettings);

/**
 * @swagger
 * /api/security/sessions:
 *   get:
 *     summary: Get user login sessions
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       deviceInfo:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       location:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/sessions', authenticate, getUserSessions);

/**
 * @swagger
 * /api/security/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate user session
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to terminate
 *     responses:
 *       200:
 *         description: Session terminated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete('/sessions/:sessionId', authenticate, terminateSession);

export default router;
