import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { getCurrentThailandTimeForDB } from '../utils/thailandTime';
import crypto from 'crypto';

/**
 * Email Verification Controller
 * จัดการการยืนยันอีเมลสำหรับผู้ใช้
 */

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบโทเค็นการยืนยัน'
      });
    }

    // Find the verification token
    const tokenResult = await databaseManager.query(
      'SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'โทเค็นการยืนยันไม่ถูกต้องหรือหมดอายุแล้ว'
      });
    }

    const verificationToken = tokenResult.rows[0];

    // Check if email is already verified
    const userResult = await databaseManager.query(
      'SELECT * FROM users WHERE id = $1',
      [verificationToken.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้ที่ระบุ'
      });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ได้รับการยืนยันแล้ว'
      });
    }

    // Update user email verification status
    await databaseManager.query(
      'UPDATE users SET email_verified = true, updated_at = $1 WHERE id = $2',
      [getCurrentThailandTimeForDB(), user.id]
    );

    // Delete the used token
    await databaseManager.query(
      'DELETE FROM email_verification_tokens WHERE token = $1',
      [token]
    );

    // Log the verification
    logger.info(`Email verified for user ${user.id} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'อีเมลได้รับการยืนยันเรียบร้อยแล้ว',
      email: user.email
    });

  } catch (error) {
    logger.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยืนยันอีเมล'
    });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมล'
      });
    }

    // Find user by email
    const userResult = await databaseManager.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้ที่ระบุ'
      });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ได้รับการยืนยันแล้ว'
      });
    }

    // Check if there's a recent verification token (within 5 minutes)
    const recentTokenResult = await databaseManager.query(
      'SELECT * FROM email_verification_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'5 minutes\'',
      [user.id]
    );

    if (recentTokenResult.rows.length > 0) {
      return res.status(429).json({
        success: false,
        message: 'กรุณารอสักครู่ก่อนส่งอีเมลยืนยันใหม่ (5 นาที)'
      });
    }

    // Delete old verification tokens for this user
    await databaseManager.query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1',
      [user.id]
    );

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Save the token
    await databaseManager.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4)',
      [user.id, token, expiresAt, getCurrentThailandTimeForDB()]
    );

    // Send verification email
    try {
      const emailSent = await emailService.sendEmailVerification(
        user.email,
        `${user.first_name} ${user.last_name}`,
        token
      );

      if (emailSent) {
        logger.info(`Verification email resent to ${user.email}`);
        res.status(200).json({
          success: true,
          message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว'
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถส่งอีเมลยืนยันได้'
      });
    }

  } catch (error) {
    logger.error('Error resending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่'
    });
  }
};

/**
 * Generate verification token for user
 * POST /api/auth/generate-verification-token
 */
export const generateVerificationToken = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ ID ผู้ใช้'
      });
    }

    // Check if user exists
    const userResult = await databaseManager.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้ที่ระบุ'
      });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ได้รับการยืนยันแล้ว'
      });
    }

    // Delete old verification tokens for this user
    await databaseManager.query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1',
      [userId]
    );

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Save the token
    await databaseManager.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4)',
      [userId, token, expiresAt, getCurrentThailandTimeForDB()]
    );

    // Send verification email
    try {
      const emailSent = await emailService.sendEmailVerification(
        user.email,
        `${user.first_name} ${user.last_name}`,
        token
      );

      if (emailSent) {
        logger.info(`Verification email sent to ${user.email}`);
        res.status(200).json({
          success: true,
          message: 'ส่งอีเมลยืนยันเรียบร้อยแล้ว',
          token: token // Only for testing purposes
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถส่งอีเมลยืนยันได้'
      });
    }

  } catch (error) {
    logger.error('Error generating verification token:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างโทเค็นยืนยัน'
    });
  }
};
