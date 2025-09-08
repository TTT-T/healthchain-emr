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
    // Only create transporter if SMTP is configured
    if (config.smtp.user && config.smtp.password) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465, // true for 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password,
        },
        tls: {
          rejectUnauthorized: false // For development/testing
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000, // 20 seconds
        rateLimit: 5 // max 5 emails per rateDelta
      });
      
      console.log('📧 Email service initialized with SMTP:', config.smtp.host);
      console.log('📧 SMTP User:', config.smtp.user);
      console.log('📧 SMTP Port:', config.smtp.port);
    } else {
      console.log('📧 Email service initialized in development mode (no SMTP configured)');
    }
  }

  /**
   * Send email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Check if transporter is available
      if (!this.transporter) {
        console.log('📧 [NO SMTP] Email would be sent (no SMTP configured):');
        console.log('  To:', emailData.to);
        console.log('  Subject:', emailData.subject);
        console.log('  Content:', emailData.html);
        return true; // Return true in development mode
      }

      // In development mode, still send email if SMTP is configured
      if (process.env.NODE_ENV === 'development' && (!config.smtp.user || !config.smtp.password)) {
        console.log('📧 [DEV MODE] Email would be sent (no SMTP configured):');
        console.log('  To:', emailData.to);
        console.log('  Subject:', emailData.subject);
        console.log('  Content:', emailData.html);
        return true;
      }

      const info = await this.transporter.sendMail({
        from: `"HealthChain EMR" <${config.smtp.from}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      console.log('📧 Email sent successfully:', info.messageId);
      console.log('📧 Email response:', info.response);
      return true;
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response:', error.response);
      
      // Handle specific Gmail errors
      if (error.code === 'EAUTH') {
        console.error('❌ Authentication failed. Please check your Gmail App Password.');
      } else if (error.code === 'ECONNECTION') {
        console.error('❌ Connection failed. Please check your internet connection.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Connection timeout. Please try again later.');
      }
      
      return false;
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('📧 No SMTP transporter configured');
        return false;
      }

      await this.transporter.verify();
      console.log('📧 SMTP connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ SMTP connection test failed:', error.message);
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
        <title>ยืนยันอีเมล - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .logo-icon {
            font-size: 40px;
            margin-right: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .verification-section {
            background: #f7fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .verification-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
          }
          .verification-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }
          .link-section {
            margin: 25px 0;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .link-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
            font-weight: 500;
          }
          .verification-link {
            background: #ffffff;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            word-break: break-all;
            color: #1e293b;
            border: 1px solid #e2e8f0;
          }
          .warning-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            color: #92400e;
          }
          .warning-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
          }
          .warning-icon {
            margin-right: 8px;
            font-size: 18px;
          }
          .warning-list {
            margin: 0;
            padding-left: 20px;
          }
          .warning-list li {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .benefits-section {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .benefits-title {
            font-size: 18px;
            font-weight: 600;
            color: #065f46;
            margin-bottom: 15px;
            text-align: center;
          }
          .benefits-list {
            list-style: none;
            padding: 0;
          }
          .benefits-list li {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            color: #047857;
          }
          .benefit-icon {
            margin-right: 12px;
            font-size: 16px;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .contact-info {
            font-size: 14px;
            color: #3b82f6;
            font-weight: 500;
            margin: 10px 0;
          }
          .copyright {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 12px;
            }
            .header, .content, .footer {
              padding: 25px 20px;
            }
            .verification-section {
              padding: 20px;
            }
            .logo {
              font-size: 28px;
            }
            .header-title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <span class="logo-icon">🏥</span>HealthChain EMR
            </div>
            <h1 class="header-title">ยืนยันอีเมลของคุณ</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              สวัสดี คุณ<strong>${firstName}</strong> 👋
            </div>
            
            <div class="message">
              ขอบคุณที่สมัครใช้งาน <strong>HealthChain EMR System</strong> 
              ระบบจัดการข้อมูลทางการแพทย์ที่ทันสมัยและปลอดภัย
            </div>
            
            <div class="message">
              เพื่อความปลอดภัยและให้คุณสามารถใช้งานระบบได้อย่างเต็มรูปแบบ 
              กรุณายืนยันอีเมลของคุณโดยคลิกปุ่มด้านล่าง:
            </div>
            
            <div class="verification-section">
              <a href="${verificationUrl}" class="verification-button">
                ✅ ยืนยันอีเมลของฉัน
              </a>
            </div>
            
            <div class="link-section">
              <div class="link-label">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</div>
              <div class="verification-link">${verificationUrl}</div>
            </div>
            
            <div class="warning-box">
              <div class="warning-title">
                <span class="warning-icon">⚠️</span>
                ข้อสำคัญที่ควรทราบ
              </div>
              <ul class="warning-list">
                <li>ลิงก์ยืนยันนี้จะหมดอายุใน <strong>24 ชั่วโมง</strong></li>
                <li>หากคุณไม่ได้สมัครบัญชีนี้ กรุณาเพิกเฉยต่ออีเมลนี้</li>
                <li>อย่าแชร์ลิงก์นี้กับผู้อื่นเพื่อความปลอดภัย</li>
                <li>หากลิงก์หมดอายุ สามารถขอส่งใหม่ได้ที่หน้าเข้าสู่ระบบ</li>
              </ul>
            </div>
            
            <div class="benefits-section">
              <div class="benefits-title">🎉 หลังจากยืนยันอีเมลเรียบร้อย คุณจะสามารถ:</div>
              <ul class="benefits-list">
                <li><span class="benefit-icon">🔐</span>เข้าสู่ระบบได้อย่างปลอดภัย</li>
                <li><span class="benefit-icon">👤</span>จัดการข้อมูลส่วนตัวและประวัติการรักษา</li>
                <li><span class="benefit-icon">📅</span>จองนัดหมายกับแพทย์ออนไลน์</li>
                <li><span class="benefit-icon">📊</span>ติดตามผลการตรวจและยาที่ได้รับ</li>
                <li><span class="benefit-icon">💊</span>รับการแจ้งเตือนเกี่ยวกับการรักษา</li>
                <li><span class="benefit-icon">📱</span>เข้าถึงข้อมูลได้ทุกที่ทุกเวลา</li>
              </ul>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="footer-text">
              อีเมลนี้ส่งมาจาก <strong>HealthChain EMR System</strong>
            </div>
            <div class="contact-info">
              📧 หากมีคำถาม กรุณาติดต่อ: support@healthchain.co.th
            </div>
            <div class="contact-info">
              📞 โทรศัพท์: 02-xxx-xxxx (จันทร์-ศุกร์ 8:00-17:00)
            </div>
            <div class="copyright">
              © 2025 HealthChain EMR System. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset HTML template
   */
  generatePasswordResetTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>รีเซ็ตรหัสผ่าน - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .logo-icon {
            font-size: 40px;
            margin-right: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .reset-section {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
          }
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          }
          .link-section {
            margin: 25px 0;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
          }
          .link-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
            font-weight: 500;
          }
          .reset-link {
            background: #ffffff;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            word-break: break-all;
            color: #1e293b;
            border: 1px solid #e2e8f0;
          }
          .warning-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            color: #92400e;
          }
          .warning-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
          }
          .warning-icon {
            margin-right: 8px;
            font-size: 18px;
          }
          .warning-list {
            margin: 0;
            padding-left: 20px;
          }
          .warning-list li {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .security-tips {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .security-title {
            font-size: 18px;
            font-weight: 600;
            color: #065f46;
            margin-bottom: 15px;
            text-align: center;
          }
          .security-list {
            list-style: none;
            padding: 0;
          }
          .security-list li {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            color: #047857;
          }
          .security-icon {
            margin-right: 12px;
            font-size: 16px;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .contact-info {
            font-size: 14px;
            color: #dc2626;
            font-weight: 500;
            margin: 10px 0;
          }
          .copyright {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 12px;
            }
            .header, .content, .footer {
              padding: 25px 20px;
            }
            .reset-section {
              padding: 20px;
            }
            .logo {
              font-size: 28px;
            }
            .header-title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <span class="logo-icon">🔐</span>HealthChain EMR
            </div>
            <h1 class="header-title">รีเซ็ตรหัสผ่าน</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              สวัสดี คุณ<strong>${firstName}</strong> 👋
            </div>
            
            <div class="message">
              เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี <strong>HealthChain EMR System</strong> ของคุณ
            </div>
            
            <div class="message">
              หากคุณเป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาคลิกปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่:
            </div>
            
            <div class="reset-section">
              <a href="${resetUrl}" class="reset-button">
                🔑 รีเซ็ตรหัสผ่าน
              </a>
            </div>
            
            <div class="link-section">
              <div class="link-label">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</div>
              <div class="reset-link">${resetUrl}</div>
            </div>
            
            <div class="warning-box">
              <div class="warning-title">
                <span class="warning-icon">⚠️</span>
                ข้อสำคัญที่ควรทราบ
              </div>
              <ul class="warning-list">
                <li>ลิงก์รีเซ็ตรหัสผ่านนี้จะหมดอายุใน <strong>1 ชั่วโมง</strong></li>
                <li>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</li>
                <li>อย่าแชร์ลิงก์นี้กับผู้อื่นเพื่อความปลอดภัย</li>
                <li>หากลิงก์หมดอายุ สามารถขอรีเซ็ตใหม่ได้ที่หน้าเข้าสู่ระบบ</li>
              </ul>
            </div>
            
            <div class="security-tips">
              <div class="security-title">🛡️ เคล็ดลับความปลอดภัยสำหรับรหัสผ่าน</div>
              <ul class="security-list">
                <li><span class="security-icon">🔤</span>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</li>
                <li><span class="security-icon">🔢</span>ผสมตัวอักษรใหญ่ ตัวอักษรเล็ก ตัวเลข และสัญลักษณ์</li>
                <li><span class="security-icon">🚫</span>หลีกเลี่ยงการใช้ข้อมูลส่วนตัว เช่น ชื่อ วันเกิด</li>
                <li><span class="security-icon">🔄</span>เปลี่ยนรหัสผ่านเป็นประจำทุก 3-6 เดือน</li>
                <li><span class="security-icon">🔒</span>ไม่ใช้รหัสผ่านเดียวกันกับบัญชีอื่น</li>
                <li><span class="security-icon">💾</span>ใช้ตัวจัดการรหัสผ่านเพื่อความปลอดภัย</li>
              </ul>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="footer-text">
              อีเมลนี้ส่งมาจาก <strong>HealthChain EMR System</strong>
            </div>
            <div class="contact-info">
              📧 หากมีคำถาม กรุณาติดต่อ: support@healthchain.co.th
            </div>
            <div class="contact-info">
              📞 โทรศัพท์: 02-xxx-xxxx (จันทร์-ศุกร์ 8:00-17:00)
            </div>
            <div class="copyright">
              © 2025 HealthChain EMR System. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate welcome email HTML template
   */
  generateWelcomeTemplate(firstName: string, loginUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยินดีต้อนรับ - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .logo-icon {
            font-size: 40px;
            margin-right: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .welcome-section {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .welcome-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
          }
          .welcome-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }
          .features-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .features-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 15px;
            text-align: center;
          }
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          .feature-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .feature-icon {
            font-size: 20px;
            margin-right: 8px;
          }
          .feature-title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .feature-desc {
            font-size: 14px;
            color: #64748b;
          }
          .next-steps {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .next-steps-title {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 15px;
            text-align: center;
          }
          .steps-list {
            list-style: none;
            padding: 0;
          }
          .steps-list li {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            color: #92400e;
          }
          .step-icon {
            margin-right: 12px;
            font-size: 16px;
            background: #f59e0b;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .contact-info {
            font-size: 14px;
            color: #10b981;
            font-weight: 500;
            margin: 10px 0;
          }
          .copyright {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 12px;
            }
            .header, .content, .footer {
              padding: 25px 20px;
            }
            .welcome-section {
              padding: 20px;
            }
            .features-grid {
              grid-template-columns: 1fr;
            }
            .logo {
              font-size: 28px;
            }
            .header-title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <span class="logo-icon">🎉</span>HealthChain EMR
            </div>
            <h1 class="header-title">ยินดีต้อนรับสู่ HealthChain EMR!</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              สวัสดี คุณ<strong>${firstName}</strong> 🎊
            </div>
            
            <div class="message">
              ยินดีต้อนรับสู่ <strong>HealthChain EMR System</strong>! 
              ระบบจัดการข้อมูลทางการแพทย์ที่ทันสมัยและปลอดภัย
            </div>
            
            <div class="message">
              บัญชีของคุณได้รับการยืนยันเรียบร้อยแล้ว 
              ตอนนี้คุณสามารถเริ่มใช้งานระบบได้ทันที
            </div>
            
            <div class="welcome-section">
              <a href="${loginUrl}" class="welcome-button">
                🚀 เริ่มใช้งานระบบ
              </a>
            </div>
            
            <div class="features-section">
              <div class="features-title">🌟 ฟีเจอร์หลักของ HealthChain EMR</div>
              <div class="features-grid">
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">📋</span>จัดการข้อมูลผู้ป่วย
                  </div>
                  <div class="feature-desc">บันทึกและจัดการข้อมูลผู้ป่วยอย่างครบถ้วน</div>
                </div>
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">📅</span>ระบบนัดหมาย
                  </div>
                  <div class="feature-desc">จองและจัดการนัดหมายออนไลน์</div>
                </div>
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">💊</span>จัดการยาและใบสั่งยา
                  </div>
                  <div class="feature-desc">บันทึกและติดตามการจ่ายยา</div>
                </div>
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">🔬</span>ผลการตรวจ
                  </div>
                  <div class="feature-desc">บันทึกและติดตามผลการตรวจทางห้องปฏิบัติการ</div>
                </div>
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">📊</span>รายงานและสถิติ
                  </div>
                  <div class="feature-desc">ดูรายงานและสถิติการรักษา</div>
                </div>
                <div class="feature-item">
                  <div class="feature-title">
                    <span class="feature-icon">🔒</span>ความปลอดภัย
                  </div>
                  <div class="feature-desc">ระบบรักษาความปลอดภัยข้อมูลระดับสูง</div>
                </div>
              </div>
            </div>
            
            <div class="next-steps">
              <div class="next-steps-title">📝 ขั้นตอนต่อไป</div>
              <ul class="steps-list">
                <li><span class="step-icon">1</span>เข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ</li>
                <li><span class="step-icon">2</span>อัปเดตข้อมูลส่วนตัวในโปรไฟล์</li>
                <li><span class="step-icon">3</span>สำรวจฟีเจอร์ต่างๆ ของระบบ</li>
                <li><span class="step-icon">4</span>เริ่มบันทึกข้อมูลผู้ป่วยหรือจองนัดหมาย</li>
                <li><span class="step-icon">5</span>ติดตั้งแอปมือถือ (หากมี) เพื่อความสะดวก</li>
              </ul>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="footer-text">
              อีเมลนี้ส่งมาจาก <strong>HealthChain EMR System</strong>
            </div>
            <div class="contact-info">
              📧 หากมีคำถาม กรุณาติดต่อ: support@healthchain.co.th
            </div>
            <div class="contact-info">
              📞 โทรศัพท์: 02-xxx-xxxx (จันทร์-ศุกร์ 8:00-17:00)
            </div>
            <div class="copyright">
              © 2025 HealthChain EMR System. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate appointment reminder HTML template
   */
  generateAppointmentReminderTemplate(
    firstName: string, 
    doctorName: string, 
    appointmentDate: string, 
    appointmentTime: string,
    appointmentType: string,
    location: string,
    notes?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>แจ้งเตือนนัดหมาย - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .logo-icon {
            font-size: 40px;
            margin-right: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .appointment-card {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #0ea5e9;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .appointment-title {
            font-size: 20px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 20px;
          }
          .appointment-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .detail-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0ea5e9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .detail-icon {
            font-size: 18px;
            margin-right: 8px;
          }
          .detail-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 16px;
            color: #0c4a6e;
            font-weight: 600;
            margin-top: 4px;
          }
          .notes-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .notes-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
          }
          .notes-content {
            color: #92400e;
            font-size: 14px;
          }
          .reminder-tips {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .tips-title {
            font-size: 18px;
            font-weight: 600;
            color: #065f46;
            margin-bottom: 15px;
            text-align: center;
          }
          .tips-list {
            list-style: none;
            padding: 0;
          }
          .tips-list li {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 15px;
            color: #047857;
          }
          .tip-icon {
            margin-right: 12px;
            font-size: 16px;
          }
          .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .contact-info {
            font-size: 14px;
            color: #3b82f6;
            font-weight: 500;
            margin: 10px 0;
          }
          .copyright {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 20px 0;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 10px;
              border-radius: 12px;
            }
            .header, .content, .footer {
              padding: 25px 20px;
            }
            .appointment-card {
              padding: 20px;
            }
            .appointment-details {
              grid-template-columns: 1fr;
            }
            .logo {
              font-size: 28px;
            }
            .header-title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <span class="logo-icon">📅</span>HealthChain EMR
            </div>
            <h1 class="header-title">แจ้งเตือนนัดหมาย</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              สวัสดี คุณ<strong>${firstName}</strong> 👋
            </div>
            
            <div class="message">
              นี่คือการแจ้งเตือนนัดหมายของคุณกับ <strong>HealthChain EMR System</strong>
            </div>
            
            <div class="appointment-card">
              <div class="appointment-title">📋 รายละเอียดนัดหมาย</div>
              <div class="appointment-details">
                <div class="detail-item">
                  <div class="detail-label">
                    <span class="detail-icon">👨‍⚕️</span>แพทย์
                  </div>
                  <div class="detail-value">${doctorName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">
                    <span class="detail-icon">📅</span>วันที่
                  </div>
                  <div class="detail-value">${appointmentDate}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">
                    <span class="detail-icon">🕐</span>เวลา
                  </div>
                  <div class="detail-value">${appointmentTime}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">
                    <span class="detail-icon">🏥</span>ประเภท
                  </div>
                  <div class="detail-value">${appointmentType}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">
                    <span class="detail-icon">📍</span>สถานที่
                  </div>
                  <div class="detail-value">${location}</div>
                </div>
              </div>
              ${notes ? `
                <div class="notes-section">
                  <div class="notes-title">📝 หมายเหตุ</div>
                  <div class="notes-content">${notes}</div>
                </div>
              ` : ''}
            </div>
            
            <div class="reminder-tips">
              <div class="tips-title">💡 เคล็ดลับก่อนมาพบแพทย์</div>
              <ul class="tips-list">
                <li><span class="tip-icon">⏰</span>มาถึงก่อนเวลานัด 15-30 นาที</li>
                <li><span class="tip-icon">📋</span>นำบัตรประชาชนและบัตรประกันสุขภาพ</li>
                <li><span class="tip-icon">💊</span>นำยาที่ใช้อยู่มาด้วย (ถ้ามี)</li>
                <li><span class="tip-icon">📝</span>เตรียมรายการอาการหรือคำถามที่ต้องการถาม</li>
                <li><span class="tip-icon">📱</span>ปิดเสียงโทรศัพท์หรือเปิดโหมดสั่น</li>
                <li><span class="tip-icon">😷</span>สวมหน้ากากอนามัย (หากจำเป็น)</li>
              </ul>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="footer-text">
              อีเมลนี้ส่งมาจาก <strong>HealthChain EMR System</strong>
            </div>
            <div class="contact-info">
              📧 หากต้องการยกเลิกหรือเลื่อนนัด กรุณาติดต่อ: support@healthchain.co.th
            </div>
            <div class="contact-info">
              📞 โทรศัพท์: 02-xxx-xxxx (จันทร์-ศุกร์ 8:00-17:00)
            </div>
            <div class="copyright">
              © 2025 HealthChain EMR System. All rights reserved.
            </div>
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

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string, 
    firstName: string, 
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const emailData: EmailData = {
      to: email,
      subject: '🔐 HealthChain - รีเซ็ตรหัสผ่าน',
      html: this.generatePasswordResetTemplate(firstName, resetUrl)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string, 
    firstName: string
  ): Promise<boolean> {
    const loginUrl = `${config.app.frontendUrl}/login`;
    
    const emailData: EmailData = {
      to: email,
      subject: '🎉 ยินดีต้อนรับสู่ HealthChain EMR!',
      html: this.generateWelcomeTemplate(firstName, loginUrl)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    email: string,
    firstName: string,
    doctorName: string,
    appointmentDate: string,
    appointmentTime: string,
    appointmentType: string,
    location: string,
    notes?: string
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: email,
      subject: `📅 HealthChain - แจ้งเตือนนัดหมาย ${appointmentDate}`,
      html: this.generateAppointmentReminderTemplate(
        firstName, 
        doctorName, 
        appointmentDate, 
        appointmentTime, 
        appointmentType, 
        location, 
        notes
      )
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const emailData: EmailData = {
      to: to,
      subject: '🧪 HealthChain EMR - Test Email',
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; border-radius: 8px;">
            <h1>🧪 Test Email</h1>
            <p>HealthChain EMR System</p>
          </div>
          <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin-top: 20px;">
            <h2>✅ Email Service Working!</h2>
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString('th-TH')}</p>
            <p><strong>Recipient:</strong> ${to}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
            <p>© 2025 HealthChain EMR System</p>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send user approval notification
   */
  async sendUserApprovalNotification(
    email: string,
    firstName: string,
    role: string,
    approvalNotes?: string
  ): Promise<boolean> {
    try {
      const subject = `🎉 บัญชีของคุณได้รับการอนุมัติแล้ว - HealthChain EMR`;
      const htmlContent = this.generateUserApprovalTemplate(firstName, role, approvalNotes);
      
      return await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('Error sending user approval notification:', error);
      return false;
    }
  }

  /**
   * Send user rejection notification
   */
  async sendUserRejectionNotification(
    email: string,
    firstName: string,
    role: string,
    rejectionReason: string
  ): Promise<boolean> {
    try {
      const subject = `❌ บัญชีของคุณไม่ได้รับการอนุมัติ - HealthChain EMR`;
      const htmlContent = this.generateUserRejectionTemplate(firstName, role, rejectionReason);
      
      return await this.sendEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('Error sending user rejection notification:', error);
      return false;
    }
  }

  /**
   * Generate user approval HTML template
   */
  generateUserApprovalTemplate(
    firstName: string,
    role: string,
    approvalNotes?: string
  ): string {
    const roleLabels = {
      doctor: 'แพทย์',
      nurse: 'พยาบาล',
      staff: 'เจ้าหน้าที่'
    };

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>บัญชีได้รับการอนุมัติ - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .success-icon {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
            margin-bottom: 20px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 10px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .notes {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
          }
          .notes h3 {
            color: #166534;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .notes p {
            color: #15803d;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .footer a {
            color: #10b981;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 บัญชีได้รับการอนุมัติแล้ว</h1>
            <p>HealthChain EMR System</p>
          </div>
          
          <div class="content">
            <div class="success-icon">
              <div class="icon">✅</div>
            </div>
            
            <div class="greeting">สวัสดี ${firstName}</div>
            
            <div class="message">
              <p>ยินดีด้วย! บัญชีของคุณในฐานะ<span class="role-badge">${roleLabels[role as keyof typeof roleLabels] || role}</span>ได้รับการอนุมัติจากผู้ดูแลระบบแล้ว</p>
              
              <p>ตอนนี้คุณสามารถเข้าสู่ระบบและใช้งานฟีเจอร์ต่างๆ ของ HealthChain EMR ได้แล้ว</p>
            </div>
            
            ${approvalNotes ? `
            <div class="notes">
              <h3>📝 หมายเหตุจากผู้ดูแลระบบ</h3>
              <p>${approvalNotes}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="cta-button">
                เข้าสู่ระบบ
              </a>
            </div>
            
            <div class="message">
              <p><strong>สิ่งที่คุณสามารถทำได้:</strong></p>
              <ul style="margin: 20px 0; padding-left: 20px;">
                <li>เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่สมัครไว้</li>
                <li>เข้าถึงระบบ EMR และฟีเจอร์ต่างๆ</li>
                <li>จัดการข้อมูลผู้ป่วยและบันทึกการรักษา</li>
                <li>ใช้งานระบบตามสิทธิ์ที่ได้รับ</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>หากคุณมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุน</p>
            <p>
              <a href="mailto:support@healthchain.com">support@healthchain.com</a> | 
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">HealthChain EMR</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate user rejection HTML template
   */
  generateUserRejectionTemplate(
    firstName: string,
    role: string,
    rejectionReason: string
  ): string {
    const roleLabels = {
      doctor: 'แพทย์',
      nurse: 'พยาบาล',
      staff: 'เจ้าหน้าที่'
    };

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>บัญชีไม่ได้รับการอนุมัติ - HealthChain EMR</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px 30px;
          }
          .rejection-icon {
            text-align: center;
            margin-bottom: 30px;
          }
          .rejection-icon .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
            margin-bottom: 20px;
          }
          .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.8;
          }
          .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 10px 0;
          }
          .rejection-reason {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
          }
          .rejection-reason h3 {
            color: #dc2626;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .rejection-reason p {
            color: #b91c1c;
            font-size: 14px;
            line-height: 1.6;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>❌ บัญชีไม่ได้รับการอนุมัติ</h1>
            <p>HealthChain EMR System</p>
          </div>
          
          <div class="content">
            <div class="rejection-icon">
              <div class="icon">❌</div>
            </div>
            
            <div class="greeting">สวัสดี ${firstName}</div>
            
            <div class="message">
              <p>ขออภัย บัญชีของคุณในฐานะ<span class="role-badge">${roleLabels[role as keyof typeof roleLabels] || role}</span>ไม่ได้รับการอนุมัติจากผู้ดูแลระบบ</p>
              
              <p>กรุณาติดต่อทีมสนับสนุนหากคุณต้องการข้อมูลเพิ่มเติมหรือต้องการสมัครใหม่</p>
            </div>
            
            <div class="rejection-reason">
              <h3>📝 เหตุผลที่ไม่ได้รับการอนุมัติ</h3>
              <p>${rejectionReason}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="mailto:support@healthchain.com" class="cta-button">
                ติดต่อทีมสนับสนุน
              </a>
            </div>
            
            <div class="message">
              <p><strong>หากคุณต้องการสมัครใหม่:</strong></p>
              <ul style="margin: 20px 0; padding-left: 20px;">
                <li>ตรวจสอบข้อมูลที่กรอกให้ถูกต้องและครบถ้วน</li>
                <li>แนบเอกสารประกอบที่จำเป็น</li>
                <li>ติดต่อทีมสนับสนุนเพื่อขอคำแนะนำ</li>
                <li>รอการพิจารณาจากผู้ดูแลระบบ</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>หากคุณมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุน</p>
            <p>
              <a href="mailto:support@healthchain.com">support@healthchain.com</a> | 
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">HealthChain EMR</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
