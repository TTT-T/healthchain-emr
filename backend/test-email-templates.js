#!/usr/bin/env node

/**
 * Email Templates Test Script
 * ทดสอบการแสดงผลของ email templates ใหม่
 */

const fs = require('fs');
const path = require('path');

// Mock config for testing
const mockConfig = {
  app: {
    frontendUrl: 'http://localhost:3000'
  }
};

// Mock email service class with just the template methods
class MockEmailService {
  generateEmailVerificationTemplate(firstName, verificationUrl) {
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

  generatePasswordResetTemplate(firstName, resetUrl) {
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
}

// Create output directory
const outputDir = path.join(__dirname, 'email-templates-preview');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate email templates
const emailService = new MockEmailService();

console.log('🎨 Generating Email Templates Preview...\n');

// 1. Email Verification Template
const verificationUrl = `${mockConfig.app.frontendUrl}/verify-email?token=abc123&email=test@example.com`;
const verificationHtml = emailService.generateEmailVerificationTemplate('สมชาย ใจดี', verificationUrl);
fs.writeFileSync(path.join(outputDir, 'email-verification.html'), verificationHtml);
console.log('✅ Email Verification Template: email-templates-preview/email-verification.html');

// 2. Password Reset Template
const resetUrl = `${mockConfig.app.frontendUrl}/reset-password?token=xyz789&email=test@example.com`;
const resetHtml = emailService.generatePasswordResetTemplate('สมชาย ใจดี', resetUrl);
fs.writeFileSync(path.join(outputDir, 'password-reset.html'), resetHtml);
console.log('✅ Password Reset Template: email-templates-preview/password-reset.html');

// 3. Create index.html to preview all templates
const indexHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HealthChain EMR - Email Templates Preview</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #3b82f6;
            margin: 0 0 10px 0;
        }
        .header p {
            color: #64748b;
            margin: 0;
        }
        .templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .template-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        .template-card:hover {
            transform: translateY(-2px);
        }
        .template-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .template-description {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .template-link {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
        }
        .template-link:hover {
            background: #2563eb;
        }
        .features {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        .features h2 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .feature-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .feature-icon {
            margin-right: 10px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 HealthChain EMR - Email Templates</h1>
            <p>ชุดเทมเพลตอีเมลที่สวยงามและใช้งานง่ายสำหรับระบบ EMR</p>
        </div>
        
        <div class="templates-grid">
            <div class="template-card">
                <div class="template-title">📧 Email Verification</div>
                <div class="template-description">
                    เทมเพลตสำหรับยืนยันอีเมลผู้ใช้ใหม่ พร้อมการออกแบบที่สวยงามและข้อมูลที่ชัดเจน
                </div>
                <a href="email-verification.html" class="template-link" target="_blank">ดูตัวอย่าง</a>
            </div>
            
            <div class="template-card">
                <div class="template-title">🔐 Password Reset</div>
                <div class="template-description">
                    เทมเพลตสำหรับรีเซ็ตรหัสผ่าน พร้อมเคล็ดลับความปลอดภัยและคำแนะนำ
                </div>
                <a href="password-reset.html" class="template-link" target="_blank">ดูตัวอย่าง</a>
            </div>
        </div>
        
        <div class="features">
            <h2>🌟 ฟีเจอร์ของ Email Templates</h2>
            <div class="features-grid">
                <div class="feature-item">
                    <span class="feature-icon">🎨</span>
                    <span>การออกแบบที่สวยงามและทันสมัย</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📱</span>
                    <span>รองรับการแสดงผลบนมือถือ</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🔒</span>
                    <span>ข้อมูลความปลอดภัยที่ชัดเจน</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🌐</span>
                    <span>รองรับภาษาไทย</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <span>โหลดเร็วและใช้งานง่าย</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <span>ข้อมูลที่จัดระเบียบและเข้าใจง่าย</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
console.log('✅ Preview Index: email-templates-preview/index.html');

console.log('\n🎉 Email Templates Generated Successfully!');
console.log('\n📁 Files created:');
console.log('   - email-templates-preview/index.html (Preview all templates)');
console.log('   - email-templates-preview/email-verification.html');
console.log('   - email-templates-preview/password-reset.html');
console.log('\n💡 To view the templates:');
console.log('   1. Open email-templates-preview/index.html in your browser');
console.log('   2. Click on the template links to see individual templates');
console.log('\n🚀 The templates are now ready to use in your EMR system!');
