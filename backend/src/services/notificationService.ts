import { databaseManager } from '../database/connection';
import { logger } from '../utils/logger';

export interface PatientNotificationData {
  patientId: string;
  patientHn: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  notificationType: 'document_created' | 'record_updated' | 'appointment_created' | 'lab_result_ready' | 'prescription_ready';
  title: string;
  message: string;
  recordType?: string;
  recordId?: string;
  createdBy: string;
  createdByName: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วย
   */
  static async sendPatientNotification(data: PatientNotificationData): Promise<void> {
    try {
      logger.info('Sending patient notification', {
        patientId: data.patientId,
        patientHn: data.patientHn,
        notificationType: data.notificationType
      });

      // 1. บันทึกการแจ้งเตือนในฐานข้อมูล
      await this.saveNotificationToDatabase(data);

      // 2. ส่ง SMS (ถ้ามีเบอร์โทรศัพท์)
      if (data.patientPhone) {
        await this.sendSMS(data);
      }

      // 3. ส่ง Email (ถ้ามีอีเมล)
      if (data.patientEmail) {
        await this.sendEmail(data);
      }

      // 4. ส่งการแจ้งเตือนในระบบ
      await this.sendInAppNotification(data);

      logger.info('Patient notification sent successfully', {
        patientId: data.patientId,
        notificationType: data.notificationType
      });
    } catch (error) {
      logger.error('Failed to send patient notification:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการทำงานหลัก
    }
  }

  /**
   * บันทึกการแจ้งเตือนในฐานข้อมูล
   */
  private static async saveNotificationToDatabase(data: PatientNotificationData): Promise<void> {
    try {
      const notificationId = require('uuid').v4();
      
      await databaseManager.query(
        `INSERT INTO notifications (
          id, patient_id, notification_type, title, message, 
          record_type, record_id, created_by, metadata, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() AT TIME ZONE 'Asia/Bangkok', NOW() AT TIME ZONE 'Asia/Bangkok')`,
        [
          notificationId,
          data.patientId,
          data.notificationType,
          data.title,
          data.message,
          data.recordType || null,
          data.recordId || null,
          data.createdBy,
          JSON.stringify(data.metadata || {})
        ]
      );

      logger.info('Notification saved to database', { notificationId });
    } catch (error) {
      logger.error('Failed to save notification to database:', error);
    }
  }

  /**
   * ส่ง SMS แจ้งเตือน
   */
  private static async sendSMS(data: PatientNotificationData): Promise<void> {
    try {
      const smsMessage = this.generateSMSMessage(data);
      
      // ในระบบจริงจะเชื่อมต่อกับ SMS Gateway
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('SMS notification sent', { 
        patientId: data.patientId,
        phone: data.patientPhone?.substring(0, 3) + '***'
      });
    } catch (error) {
      logger.error('Failed to send SMS:', error);
    }
  }

  /**
   * ส่ง Email แจ้งเตือน
   */
  private static async sendEmail(data: PatientNotificationData): Promise<void> {
    try {
      const emailData = {
        to: data.patientEmail,
        subject: data.title,
        html: this.generateEmailTemplate(data)
      };
      
      // ในระบบจริงจะเชื่อมต่อกับ Email Service
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logger.info('Email notification sent', { 
        patientId: data.patientId,
        email: data.patientEmail?.substring(0, 3) + '***'
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนในระบบ
   */
  private static async sendInAppNotification(data: PatientNotificationData): Promise<void> {
    try {
      // สร้าง event สำหรับ real-time notification
      const notificationEvent = {
        id: `notif-${Date.now()}`,
        patientId: data.patientId,
        patientHn: data.patientHn,
        type: data.notificationType,
        title: data.title,
        message: data.message,
        recordType: data.recordType,
        recordId: data.recordId,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: new Date().toISOString(),
        read: false,
        metadata: data.metadata
      };

      // ในระบบจริงจะใช้ WebSocket หรือ Server-Sent Events
      logger.info('In-app notification sent', { 
        patientId: data.patientId,
        notificationType: data.notificationType
      });
    } catch (error) {
      logger.error('Failed to send in-app notification:', error);
    }
  }

  /**
   * สร้างข้อความ SMS
   */
  private static generateSMSMessage(data: PatientNotificationData): string {
    const hospitalName = 'โรงพยาบาลตัวอย่าง';
    const timestamp = new Date().toLocaleString('th-TH');
    
    switch (data.notificationType) {
      case 'document_created':
        return `🏥 ${hospitalName}\nมีเอกสารใหม่: ${data.title}\nสำหรับคุณ ${data.patientName}\nสร้างโดย: ${data.createdByName}\nเวลา: ${timestamp}`;
      
      case 'record_updated':
        return `🏥 ${hospitalName}\nอัปเดตข้อมูล: ${data.title}\nสำหรับคุณ ${data.patientName}\nโดย: ${data.createdByName}\nเวลา: ${timestamp}`;
      
      case 'appointment_created':
        return `🏥 ${hospitalName}\nนัดหมายใหม่: ${data.title}\nสำหรับคุณ ${data.patientName}\nโดย: ${data.createdByName}\nเวลา: ${timestamp}`;
      
      case 'lab_result_ready':
        return `🏥 ${hospitalName}\nผลแลบพร้อม: ${data.title}\nสำหรับคุณ ${data.patientName}\nเวลา: ${timestamp}`;
      
      case 'prescription_ready':
        return `🏥 ${hospitalName}\nยาเตรียมพร้อม: ${data.title}\nสำหรับคุณ ${data.patientName}\nเวลา: ${timestamp}`;
      
      default:
        return `🏥 ${hospitalName}\n${data.title}\nสำหรับคุณ ${data.patientName}\nเวลา: ${timestamp}`;
    }
  }

  /**
   * สร้าง Email Template
   */
  private static generateEmailTemplate(data: PatientNotificationData): string {
    const timestamp = new Date().toLocaleString('th-TH');
    const hospitalName = 'โรงพยาบาลตัวอย่าง';
    
    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .info-box h3 { margin-top: 0; color: #667eea; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 ${hospitalName}</h1>
            <h2>${data.title}</h2>
          </div>
          
          <div class="content">
            <p>เรียน คุณ ${data.patientName}</p>
            
            <div class="highlight">
              <p><strong>${data.message}</strong></p>
            </div>
            
            <div class="info-box">
              <h3>📋 ข้อมูลการแจ้งเตือน</h3>
              <p><strong>ประเภท:</strong> ${this.getNotificationTypeLabel(data.notificationType)}</p>
              <p><strong>วันที่:</strong> ${timestamp}</p>
              <p><strong>ผู้ดำเนินการ:</strong> ${data.createdByName}</p>
              ${data.recordType ? `<p><strong>ประเภทข้อมูล:</strong> ${data.recordType}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>📱 ข้อมูลติดต่อ</h3>
              <p>หากมีข้อสงสัย กรุณาติดต่อโรงพยาบาล</p>
              <p>โทรศัพท์: 02-xxx-xxxx</p>
              <p>อีเมล: info@hospital.example.com</p>
            </div>
          </div>
          
          <div class="footer">
            <p>${hospitalName} | ระบบบันทึกสุขภาพอิเล็กทรอนิกส์</p>
            <p>สร้างโดย: ${data.createdByName} | ${timestamp}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * แปลงประเภทการแจ้งเตือนเป็นภาษาไทย
   */
  private static getNotificationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'document_created': 'เอกสารใหม่',
      'record_updated': 'อัปเดตข้อมูล',
      'appointment_created': 'นัดหมายใหม่',
      'lab_result_ready': 'ผลแลบพร้อม',
      'prescription_ready': 'ยาเตรียมพร้อม'
    };
    
    return labels[type] || 'การแจ้งเตือน';
  }

  /**
   * ดึงการแจ้งเตือนของผู้ป่วย
   */
  static async getPatientNotifications(patientId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await databaseManager.query(
        `SELECT * FROM notifications 
         WHERE patient_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [patientId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get patient notifications:', error);
      return [];
    }
  }

  /**
   * อัปเดตสถานะการอ่านการแจ้งเตือน
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await databaseManager.query(
        `UPDATE notifications 
         SET read_at = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [notificationId]
      );

      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }
}
