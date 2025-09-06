import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import DatabaseConnection from '../database/index';
import { 
  successResponse,
  errorResponse
} from '../utils/index';

const db = DatabaseConnection.getInstance();

// Validation schema สำหรับการเปลี่ยนรหัสผ่าน
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  newPassword: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
});

/**
 * Change user password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    const validatedData = changePasswordSchema.parse(req.body);

    // Get current user data
    const userResult = await db.query(
      'SELECT id, password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        errorResponse('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400)
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

    // Update password in database
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    // Log audit
    await db.createAuditLog({
      userId: req.user.id,
      action: 'PASSWORD_CHANGE',
      resource: 'USER',
      resourceId: req.user.id,
      details: { 
        changedAt: new Date().toISOString(),
        ipAddress: req.ip || 'unknown'
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    return res.status(200).json(
      successResponse(
        null,
        'รหัสผ่านถูกเปลี่ยนเรียบร้อยแล้ว'
      )
    );

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('Invalid input data', 400, error.errors)
      );
    }

    return res.status(500).json(
      errorResponse('Internal server error', 500)
    );
  }
};
