import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { emailService } from '../services/emailService';

/**
 * Admin Approval Controller
 * จัดการการอนุมัติผู้ใช้โดย admin
 */

/**
 * Get pending users for approval
 * GET /api/admin/pending-users
 */
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE u.is_active = false';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Filter by role (only medical staff need approval)
    if (role) {
      paramCount++;
      whereClause += ` AND u.role = $${paramCount}`;
      queryParams.push(role);
    } else {
      whereClause += ` AND u.role IN ('doctor', 'nurse', 'staff')`;
    }

    // Search functionality
    if (search) {
      paramCount++;
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get pending users with professional info
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        u.updated_at,
        d.medical_license_number,
        d.specialization,
        d.department,
        d.position,
        n.nursing_license_number,
        n.specialization as nurse_specialization,
        n.department as nurse_department,
        n.position as nurse_position
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      LEFT JOIN nurses n ON u.id = n.user_id
      ${whereClause}
      ORDER BY u.created_at ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const usersResult = await databaseManager.query(usersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format response
    const users = usersResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      createdAt: user.created_at,
      professionalInfo: {
        licenseNumber: user.medical_license_number || user.nursing_license_number,
        specialization: user.specialization || user.nurse_specialization,
        department: user.department || user.nurse_department,
        position: user.position || user.nurse_position
      }
    }));

    res.status(200).json({
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_PENDING_USERS_ERROR',
        message: 'Failed to get pending users'
      },
      statusCode: 500
    });
  }
};

/**
 * Approve user
 * POST /api/admin/pending-users/:id/approve
 */
export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const approvedBy = (req as any).user.id;

    // Check if user exists and is pending
    const userQuery = `
      SELECT u.*, d.medical_license_number, d.specialization, n.nursing_license_number
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      LEFT JOIN nurses n ON u.id = n.user_id
      WHERE u.id = $1 AND u.is_active = false
    `;
    const userResult = await databaseManager.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or already approved'
        },
        statusCode: 404
      });
    }

    const user = userResult.rows[0];

    // Update user status
    const updateQuery = `
      UPDATE users 
      SET 
        is_active = true,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await databaseManager.query(updateQuery, [id]);

    // Log approval action
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'APPROVE_USER', 'USER', $2, $3, $4, $5, true)
    `, [
      approvedBy,
      id,
      JSON.stringify({
        approvedUser: user.email,
        role: user.role,
        approvalNotes,
        licenseNumber: user.medical_license_number || user.nursing_license_number
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    // Send approval notification email
    try {
      await emailService.sendUserApprovalNotification(
        user.email,
        user.first_name,
        user.role,
        approvalNotes
      );
      console.log('📧 Approval notification sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send approval notification:', emailError);
      // Don't fail the approval if email fails
    }

    res.status(200).json({
      data: {
        user: {
          id: updateResult.rows[0].id,
          email: updateResult.rows[0].email,
          name: `${updateResult.rows[0].first_name} ${updateResult.rows[0].last_name}`,
          role: updateResult.rows[0].role,
          status: 'approved'
        },
        message: 'User approved successfully'
      },
      meta: {
        approvedBy,
        approvedAt: new Date().toISOString(),
        approvalNotes
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'APPROVE_USER_ERROR',
        message: 'Failed to approve user'
      },
      statusCode: 500
    });
  }
};

/**
 * Reject user
 * POST /api/admin/pending-users/:id/reject
 */
export const rejectUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectedBy = (req as any).user.id;

    // Check if user exists and is pending
    const userQuery = `
      SELECT u.*, d.medical_license_number, d.specialization, n.nursing_license_number
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      LEFT JOIN nurses n ON u.id = n.user_id
      WHERE u.id = $1 AND u.is_active = false
    `;
    const userResult = await databaseManager.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or already processed'
        },
        statusCode: 404
      });
    }

    const user = userResult.rows[0];

    // Soft delete user (set is_active to false and add rejection reason)
    const updateQuery = `
      UPDATE users 
      SET 
        is_active = false,
        updated_at = NOW(),
        rejection_reason = $1
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await databaseManager.query(updateQuery, [rejectionReason, id]);

    // Log rejection action
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent, success
      ) VALUES ($1, 'REJECT_USER', 'USER', $2, $3, $4, $5, true)
    `, [
      rejectedBy,
      id,
      JSON.stringify({
        rejectedUser: user.email,
        role: user.role,
        rejectionReason,
        licenseNumber: user.medical_license_number || user.nursing_license_number
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    // Send rejection notification email
    try {
      await emailService.sendUserRejectionNotification(
        user.email,
        user.first_name,
        user.role,
        rejectionReason
      );
      console.log('📧 Rejection notification sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send rejection notification:', emailError);
      // Don't fail the rejection if email fails
    }

    res.status(200).json({
      data: {
        user: {
          id: updateResult.rows[0].id,
          email: updateResult.rows[0].email,
          name: `${updateResult.rows[0].first_name} ${updateResult.rows[0].last_name}`,
          role: updateResult.rows[0].role,
          status: 'rejected'
        },
        message: 'User rejected successfully'
      },
      meta: {
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        rejectionReason
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'REJECT_USER_ERROR',
        message: 'Failed to reject user'
      },
      statusCode: 500
    });
  }
};

/**
 * Get approval statistics
 * GET /api/admin/approval-stats
 */
export const getApprovalStats = async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        role,
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = false THEN 1 END) as pending,
        COUNT(CASE WHEN is_active = true THEN 1 END) as approved,
        COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified
      FROM users 
      WHERE role IN ('doctor', 'nurse', 'staff')
      GROUP BY role
    `;
    const statsResult = await databaseManager.query(statsQuery);

    const stats = statsResult.rows.reduce((acc, row) => {
      acc[row.role] = {
        total: parseInt(row.total),
        pending: parseInt(row.pending),
        approved: parseInt(row.approved),
        unverified: parseInt(row.unverified)
      };
      return acc;
    }, {} as any);

    res.status(200).json({
      data: {
        stats,
        summary: {
          totalPending: Object.values(stats).reduce((sum: number, role: any) => sum + role.pending, 0),
          totalApproved: Object.values(stats).reduce((sum: number, role: any) => sum + role.approved, 0),
          totalUnverified: Object.values(stats).reduce((sum: number, role: any) => sum + role.unverified, 0)
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Get approval stats error:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'GET_APPROVAL_STATS_ERROR',
        message: 'Failed to get approval statistics'
      },
      statusCode: 500
    });
  }
};
