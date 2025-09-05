import nodemailer from 'nodemailer';
import crypto from 'crypto';
import config from '../config/config';

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"HealthChain EMR" <${config.smtp.from}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate email verification HTML template
   */
  generateEmailVerificationTemplate(firstName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยืนยันอีเมล - HealthChain</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e1e8ed;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .verification-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #10b981);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .verification-button:hover {
            opacity: 0.9;
          }
          .footer {
            border-top: 1px solid #e1e8ed;
            padding-top: 20px;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏥 HealthChain</div>
            <h2 style="color: #1f2937; margin: 0;">ยืนยันอีเมลของคุณ</h2>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">สวัสดี คุณ<strong>${firstName}</strong>,</p>
            
            <p>ขอบคุณที่สมัครใช้งาน HealthChain EMR System</p>
            
            <p>เพื่อความปลอดภัยและให้คุณสามารถใช้งานระบบได้อย่างเต็มรูปแบบ กรุณายืนยันอีเมลของคุณโดยคลิกปุ่มด้านล่าง:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="verification-button">
                ✅ ยืนยันอีเมล
              </a>
            </div>
            
            <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
            <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ ข้อสำคัญ:</strong>
              <ul style="margin: 10px 0 0 20px;">
                <li>ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong></li>
                <li>หากคุณไม่ได้สมัครบัญชีนี้ กรุณาเพิกเฉยต่ออีเมลนี้</li>
                <li>อย่าแชร์ลิงก์นี้กับผู้อื่น</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">หลังจากยืนยันอีเมลเรียบร้อย คุณจะสามารถ:</p>
            <ul style="color: #10b981;">
              <li>✅ เข้าสู่ระบบได้</li>
              <li>✅ จัดการข้อมูลส่วนตัว</li>
              <li>✅ เข้าถึงบริการการแพทย์</li>
              <li>✅ ติดตามประวัติการรักษา</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ส่งมาจาก HealthChain EMR System</p>
            <p>หากมีคำถาม กรุณาติดต่อ: support@healthchain.co.th</p>
            <p style="font-size: 12px; color: #999;">
              © 2025 HealthChain. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    email: string, 
    firstName: string, 
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    const emailData: EmailData = {
      to: email,
      subject: '🏥 HealthChain - ยืนยันอีเมลของคุณ',
      html: this.generateEmailVerificationTemplate(firstName, verificationUrl)
    };

    return await this.sendEmail(emailData);
  }
}

export const emailService = new EmailService();
