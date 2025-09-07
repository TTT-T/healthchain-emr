import { Router, Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { successResponse, errorResponse } from '../utils';

const router = Router();

/**
 * Test SMTP connection
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const isConnected = await emailService.testConnection();
    
    if (isConnected) {
      return res.status(200).json(
        successResponse('SMTP connection test successful', {
          connected: true,
          message: 'Email service is working correctly'
        })
      );
    } else {
      return res.status(500).json(
        errorResponse('SMTP connection test failed', 500, {
          connected: false,
          message: 'Email service is not working'
        })
      );
    }
  } catch (error: any) {
    console.error('❌ SMTP test error:', error);
    return res.status(500).json(
      errorResponse('SMTP test failed', 500, {
        error: error.message
      })
    );
  }
});

/**
 * Send test email
 */
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(
        errorResponse('Email address is required', 400)
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        errorResponse('Invalid email format', 400)
      );
    }

    const success = await emailService.sendTestEmail(email);
    
    if (success) {
      return res.status(200).json(
        successResponse('Test email sent successfully', {
          email: email,
          sent: true,
          message: 'Test email has been sent to your inbox'
        })
      );
    } else {
      return res.status(500).json(
        errorResponse('Failed to send test email', 500, {
          email: email,
          sent: false,
          message: 'Please check your email configuration'
        })
      );
    }
  } catch (error: any) {
    console.error('❌ Send test email error:', error);
    return res.status(500).json(
      errorResponse('Failed to send test email', 500, {
        error: error.message
      })
    );
  }
});

/**
 * Get email service status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = {
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      smtpPort: process.env.SMTP_PORT || 'Not configured',
      smtpUser: process.env.SMTP_USER ? 'Configured' : 'Not configured',
      smtpPassword: process.env.SMTP_PASSWORD ? 'Configured' : 'Not configured',
      emailFrom: process.env.EMAIL_FROM || 'Not configured',
      frontendUrl: process.env.FRONTEND_URL || 'Not configured'
    };

    return res.status(200).json(
      successResponse('Email service status', {
        configured: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD),
        config: config
      })
    );
  } catch (error: any) {
    console.error('❌ Email status error:', error);
    return res.status(500).json(
      errorResponse('Failed to get email status', 500, {
        error: error.message
      })
    );
  }
});

export default router;
