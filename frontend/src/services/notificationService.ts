import { logger } from '@/lib/logger';
import { createLocalDateTimeString, formatLocalDateTime, formatLocalTime } from '@/utils/timeUtils';
import { emailTemplates } from '@/templates/emailTemplates';

interface NotificationData {
  patientHn: string;
  patientName: string;
  queueNumber: string;
  doctorName: string;
  department: string;
  visitTime: string;
  treatmentType: string;
  estimatedWaitTime: number;
  pdfUrl?: string;
}

interface PatientAppointmentNotificationData {
  patientHn: string;
  patientNationalId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  queueNumber: string;
  doctorName: string;
  department: string;
  visitTime: string;
  treatmentType: string;
  estimatedWaitTime: number;
  currentQueue: number;
  symptoms: string;
  notes: string;
  createdBy: string;
  createdByName: string;
}

interface PatientRecordUpdateNotificationData {
  patientHn: string;
  patientNationalId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  recordType: string;
  recordId: string;
  chiefComplaint?: string;
  recordedBy: string;
  recordedTime: string;
  message: string;
}

export class NotificationService {
  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วย
   */
  static async notifyPatient(data: NotificationData): Promise<void> {
    try {
      // 1. ส่ง SMS (ถ้ามีเบอร์โทรศัพท์)
      await this.sendSMS(data);
      
      // 2. ส่ง Email (ถ้ามีอีเมล)
      await this.sendEmail(data);
      
      // 3. ส่งการแจ้งเตือนในระบบ
      await this.sendInAppNotification(data);
      
      // 4. บันทึกการแจ้งเตือน
      await this.logNotification(data);
      
      logger.info('Patient notification sent successfully', { patientHn: data.patientHn, queueNumber: data.queueNumber });
    } catch (error) {
      logger.error('Failed to send patient notification:', error);
      throw error;
    }
  }

  /**
   * ส่ง SMS แจ้งเตือน
   */
  private static async sendSMS(data: NotificationData): Promise<void> {
    try {
      // ในระบบจริงจะเชื่อมต่อกับ SMS Gateway
      const message = `โรงพยาบาลตัวอย่าง: คุณ ${data.patientName} ได้รับหมายเลขคิว ${data.queueNumber} สำหรับตรวจกับ ${data.doctorName} วันที่ ${formatLocalDateTime(new Date(data.visitTime))} เวลา ${formatLocalTime(new Date(data.visitTime))} คาดว่าจะรอประมาณ ${data.estimatedWaitTime} นาที`;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('SMS notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      // Don't throw error - SMS is optional
    }
  }

  /**
   * ส่ง Email แจ้งเตือน
   */
  private static async sendEmail(data: NotificationData): Promise<void> {
    try {
      const emailData = {
        to: `patient-${data.patientHn}@example.com`, // ในระบบจริงจะดึงจากฐานข้อมูล
        subject: `หมายเลขคิว ${data.queueNumber} - โรงพยาบาลตัวอย่าง`,
        html: this.generateEmailTemplate(data)
      };
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Email notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send email:', error);
      // Don't throw error - Email is optional
    }
  }

  /**
   * ส่งการแจ้งเตือนทางอีเมลด้วย Template
   */
  private static async sendEmailWithTemplate(
    templateType: 'appointment' | 'recordUpdate' | 'registration' | 'queueStatus',
    data: any,
    patientEmail?: string
  ): Promise<void> {
    try {
      if (!patientEmail) {
        logger.warn('No email address provided, skipping email notification');
        return;
      }

      let htmlContent: string;
      
      switch (templateType) {
        case 'appointment':
          htmlContent = emailTemplates.appointment(data);
          break;
        case 'recordUpdate':
          htmlContent = emailTemplates.recordUpdate(data);
          break;
        case 'registration':
          htmlContent = emailTemplates.registration(data);
          break;
        case 'queueStatus':
          htmlContent = emailTemplates.queueStatus(data);
          break;
        default:
          throw new Error(`Unknown template type: ${templateType}`);
      }

      const emailData = {
        to: patientEmail,
        subject: this.getEmailSubject(templateType, data),
        html: htmlContent
      };
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Email with template sent', { 
        templateType, 
        patientEmail: patientEmail.substring(0, 3) + '***' // Mask email for privacy
      });
    } catch (error) {
      logger.error('Failed to send email with template:', error);
      // Don't throw error - Email is optional
    }
  }

  /**
   * ดึงหัวข้ออีเมลตามประเภท
   */
  private static getEmailSubject(templateType: string, data: any): string {
    switch (templateType) {
      case 'appointment':
        return `การนัดหมายใหม่ - หมายเลขคิว ${data.queueNumber}`;
      case 'recordUpdate':
        return `อัปเดตประวัติการรักษา - ${data.recordTitle}`;
      case 'registration':
        return `ยินดีต้อนรับสู่ระบบ EMR - หมายเลข HN ${data.hospitalNumber}`;
      case 'queueStatus':
        return `อัปเดตสถานะคิว - หมายเลขคิว ${data.queueNumber}`;
      default:
        return 'การแจ้งเตือนจากระบบ EMR';
    }
  }

  /**
   * ส่งการแจ้งเตือนในระบบ
   */
  private static async sendInAppNotification(data: NotificationData): Promise<void> {
    try {
      const notification = {
        id: `notif-${Date.now()}`,
        type: 'queue_assigned',
        title: `ได้รับหมายเลขคิว ${data.queueNumber}`,
        message: `คุณ ${data.patientName} ได้รับหมายเลขคิว ${data.queueNumber} สำหรับตรวจกับ ${data.doctorName}`,
        patientHn: data.patientHn,
        queueNumber: data.queueNumber,
        visitTime: data.visitTime,
        created_at: createLocalDateTimeString(new Date()),
        read: false
      };
      
      // บันทึกการแจ้งเตือนใน localStorage (ในระบบจริงจะบันทึกในฐานข้อมูล)
      const existingNotifications = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('patient_notifications', JSON.stringify(existingNotifications));
      
      // ส่ง event ให้ component อื่นๆ
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('patientNotification', { detail: notification }));
      }
      
      logger.info('In-app notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send in-app notification:', error);
    }
  }

  /**
   * บันทึกการแจ้งเตือน
   */
  private static async logNotification(data: NotificationData): Promise<void> {
    try {
      const logData = {
        patientHn: data.patientHn,
        queueNumber: data.queueNumber,
        notificationType: 'queue_assigned',
        sentAt: createLocalDateTimeString(new Date()),
        methods: ['sms', 'email', 'in_app'],
        status: 'sent'
      };
      
      // ในระบบจริงจะบันทึกในฐานข้อมูล
      logger.info('Notification logged', logData);
    } catch (error) {
      logger.error('Failed to log notification:', error);
    }
  }

  /**
   * สร้าง Email Template
   */
  private static generateEmailTemplate(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>หมายเลขคิว ${data.queueNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>โรงพยาบาลตัวอย่าง</h1>
            <h2>หมายเลขคิว ${data.queueNumber}</h2>
          </div>
          
          <div class="content">
            <p>เรียน คุณ ${data.patientName}</p>
            
            <div class="info-box">
              <h3>ข้อมูลการเข้ารับบริการ</h3>
              <p><strong>หมายเลขคิว:</strong> ${data.queueNumber}</p>
              <p><strong>แพทย์ผู้ตรวจ:</strong> ${data.doctorName}</p>
              <p><strong>แผนก:</strong> ${data.department}</p>
              <p><strong>ประเภทการรักษา:</strong> ${data.treatmentType}</p>
              <p><strong>วันที่:</strong> ${formatLocalDateTime(new Date(data.visitTime))}</p>
              <p><strong>เวลา:</strong> ${formatLocalTime(new Date(data.visitTime))}</p>
              <p><strong>เวลารอโดยประมาณ:</strong> ${data.estimatedWaitTime} นาที</p>
            </div>
            
            <div class="info-box">
              <h3>คำแนะนำ</h3>
              <ul>
                <li>กรุณามาก่อนเวลานัด 15 นาที</li>
                <li>นำบัตรประชาชนและเอกสารที่เกี่ยวข้องมาด้วย</li>
                <li>หากไม่สามารถมาได้ กรุณาแจ้งล่วงหน้า</li>
                <li>สามารถดูประวัติคิวได้ที่เว็บไซต์โรงพยาบาล</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>โรงพยาบาลตัวอย่าง | ระบบบันทึกสุขภาพอิเล็กทรอนิกส์</p>
            <p>หากมีข้อสงสัย กรุณาติดต่อ 02-xxx-xxxx</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * ส่งการแจ้งเตือนการนัดหมายให้ผู้ป่วย
   */
  static async notifyPatientAppointment(data: PatientAppointmentNotificationData): Promise<void> {
    try {
      // 1. ส่ง SMS (ถ้ามีเบอร์โทรศัพท์)
      if (data.patientPhone) {
        await this.sendAppointmentSMS(data);
      }
      
      // 2. ส่ง Email (ถ้ามีอีเมล)
      if (data.patientEmail) {
        await this.sendAppointmentEmail(data);
      }
      
      // 3. ส่งการแจ้งเตือนในระบบ
      await this.sendAppointmentInAppNotification(data);
      
      // 4. บันทึกการแจ้งเตือน
      await this.logAppointmentNotification(data);
      
      logger.info('Patient appointment notification sent successfully', {
        patientHn: data.patientHn,
        queueNumber: data.queueNumber
      });
    } catch (error) {
      logger.error('Failed to send patient appointment notification:', error);
      throw error;
    }
  }

  /**
   * ส่งการแจ้งเตือนการอัปเดตข้อมูลผู้ป่วย
   */
  static async notifyPatientRecordUpdate(data: PatientRecordUpdateNotificationData): Promise<void> {
    try {
      // 1. ส่งการแจ้งเตือนผ่าน Backend API
      await this.sendNotificationToBackend(data);
      
      // 2. ส่ง SMS (ถ้ามีเบอร์โทรศัพท์)
      if (data.patientPhone) {
        await this.sendRecordUpdateSMS(data);
      }
      
      // 3. ส่ง Email (ถ้ามีอีเมล)
      if (data.patientEmail) {
        await this.sendRecordUpdateEmail(data);
      }
      
      // 4. ส่งการแจ้งเตือนในระบบ
      await this.sendRecordUpdateInAppNotification(data);
      
      // 5. บันทึกการแจ้งเตือน
      await this.logRecordUpdateNotification(data);
      
      logger.info('Patient record update notification sent successfully', {
        patientHn: data.patientHn,
        recordType: data.recordType,
        recordId: data.recordId
      });
    } catch (error) {
      logger.error('Failed to send patient record update notification:', error);
      // Don't throw error to prevent breaking the main flow
      console.warn('Notification system failed but main process continues');
    }
  }

  /**
   * ส่ง SMS แจ้งเตือนการนัดหมาย
   */
  private static async sendAppointmentSMS(data: PatientAppointmentNotificationData): Promise<void> {
    try {
      const visitDate = formatLocalDateTime(new Date(data.visitTime));
      const visitTime = formatLocalTime(new Date(data.visitTime));
      
      const message = `🏥 โรงพยาบาลตัวอย่าง
คุณ ${data.patientName} ได้รับหมายเลขคิว ${data.queueNumber}
📅 วันที่: ${visitDate} เวลา: ${visitTime}
👨‍⚕️ แพทย์: ${data.doctorName} (${data.department})
⏰ คาดว่าจะรอประมาณ ${data.estimatedWaitTime} นาที
📋 คิวที่รอ: ${data.currentQueue} คิว

กรุณามาก่อนเวลานัด 15 นาที`;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Appointment SMS notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send appointment SMS:', error);
    }
  }

  /**
   * ส่ง Email แจ้งเตือนการนัดหมาย
   */
  private static async sendAppointmentEmail(data: PatientAppointmentNotificationData): Promise<void> {
    try {
      // ใช้ email template ใหม่
      await this.sendEmailWithTemplate('appointment', {
        patientName: data.patientName,
        patientHn: data.patientHn,
        queueNumber: data.queueNumber,
        doctorName: data.doctorName,
        department: data.department,
        visitTime: data.visitTime,
        treatmentType: data.treatmentType,
        estimatedWaitTime: data.estimatedWaitTime,
        symptoms: data.symptoms,
        notes: data.notes
      }, data.patientEmail);
      
      logger.info('Appointment email notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send appointment email:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนการนัดหมายในระบบ
   */
  private static async sendAppointmentInAppNotification(data: PatientAppointmentNotificationData): Promise<void> {
    try {
      const notification = {
        id: `appointment-${Date.now()}`,
        type: 'appointment',
        title: `ได้รับหมายเลขคิว ${data.queueNumber}`,
        message: `คุณ ${data.patientName} ได้รับหมายเลขคิว ${data.queueNumber} สำหรับตรวจกับ ${data.doctorName} วันที่ ${formatLocalDateTime(new Date(data.visitTime))} เวลา ${formatLocalTime(new Date(data.visitTime))}`,
        patientHn: data.patientHn,
        patientNationalId: data.patientNationalId,
        queueNumber: data.queueNumber,
        doctorName: data.doctorName,
        department: data.department,
        visitTime: data.visitTime,
        treatmentType: data.treatmentType,
        estimatedWaitTime: data.estimatedWaitTime,
        currentQueue: data.currentQueue,
        symptoms: data.symptoms,
        notes: data.notes,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        priority: 'high',
        actionRequired: false,
        created_at: createLocalDateTimeString(new Date()),
        read: false
      };
      
      // บันทึกการแจ้งเตือนใน localStorage
      const existingNotifications = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
      existingNotifications.push(notification);
      localStorage.setItem('patient_notifications', JSON.stringify(existingNotifications));
      
      // ส่ง event ให้ component อื่นๆ
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('patientAppointmentNotification', { detail: notification }));
      }
      
      logger.info('Appointment in-app notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send appointment in-app notification:', error);
    }
  }

  /**
   * บันทึกการแจ้งเตือนการนัดหมาย
   */
  private static async logAppointmentNotification(data: PatientAppointmentNotificationData): Promise<void> {
    try {
      const logData = {
        patientHn: data.patientHn,
        patientNationalId: data.patientNationalId,
        queueNumber: data.queueNumber,
        notificationType: 'appointment_created',
        sentAt: createLocalDateTimeString(new Date()),
        methods: ['sms', 'email', 'in_app'],
        status: 'sent',
        doctorName: data.doctorName,
        department: data.department,
        visitTime: data.visitTime,
        createdBy: data.createdBy,
        createdByName: data.createdByName
      };
      logger.info('Appointment notification logged', logData);
    } catch (error) {
      logger.error('Failed to log appointment notification:', error);
    }
  }

  /**
   * สร้าง Email Template สำหรับการนัดหมาย
   */
  private static generateAppointmentEmailTemplate(data: PatientAppointmentNotificationData): string {
    const visitDate = formatLocalDateTime(new Date(data.visitTime));
    const visitTime = formatLocalTime(new Date(data.visitTime));
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>หมายเลขคิว ${data.queueNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .queue-box { background: #fef3c7; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 โรงพยาบาลตัวอย่าง</h1>
            <h2>หมายเลขคิว ${data.queueNumber}</h2>
          </div>
          
          <div class="content">
            <p>เรียน คุณ ${data.patientName}</p>
            
            <div class="info-box queue-box">
              <h3>🎫 ข้อมูลคิว</h3>
              <p><strong>หมายเลขคิว:</strong> ${data.queueNumber}</p>
              <p><strong>คิวที่รออยู่:</strong> ${data.currentQueue} คิว</p>
              <p><strong>เวลารอโดยประมาณ:</strong> ${data.estimatedWaitTime} นาที</p>
            </div>
            
            <div class="info-box">
              <h3>👨‍⚕️ ข้อมูลการเข้ารับบริการ</h3>
              <p><strong>แพทย์ผู้ตรวจ:</strong> ${data.doctorName}</p>
              <p><strong>แผนก:</strong> ${data.department}</p>
              <p><strong>ประเภทการรักษา:</strong> ${data.treatmentType}</p>
              <p><strong>วันที่:</strong> ${visitDate}</p>
              <p><strong>เวลา:</strong> ${visitTime}</p>
              <p><strong>อาการเบื้องต้น:</strong> ${data.symptoms}</p>
              ${data.notes ? `<p><strong>หมายเหตุ:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>📋 คำแนะนำ</h3>
              <ul>
                <li>กรุณามาก่อนเวลานัด 15 นาที</li>
                <li>นำบัตรประชาชนและเอกสารที่เกี่ยวข้องมาด้วย</li>
                <li>หากไม่สามารถมาได้ กรุณาแจ้งล่วงหน้า</li>
                <li>สามารถดูประวัติคิวได้ที่เว็บไซต์โรงพยาบาล</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>โรงพยาบาลตัวอย่าง | ระบบบันทึกสุขภาพอิเล็กทรอนิกส์</p>
            <p>หากมีข้อสงสัย กรุณาติดต่อ 02-xxx-xxxx</p>
            <p>สร้างโดย: ${data.createdByName} | ${formatLocalDateTime(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * ดึงการแจ้งเตือนของผู้ป่วย
   */
  static getPatientNotifications(patientHn: string): any[] {
    try {
      const notifications = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
      return notifications.filter((notif: any) => notif.patientHn === patientHn);
    } catch (error) {
      logger.error('Failed to get patient notifications:', error);
      return [];
    }
  }

  /**
   * อัปเดตสถานะการอ่านการแจ้งเตือน
   */
  static markNotificationAsRead(notificationId: string): void {
    try {
      const notifications = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
      const updatedNotifications = notifications.map((notif: any) => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      localStorage.setItem('patient_notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS FOR RECORD UPDATE NOTIFICATIONS
  // =============================================================================

  /**
   * ส่งการแจ้งเตือนไปยัง Backend API
   */
  private static async sendNotificationToBackend(data: PatientRecordUpdateNotificationData): Promise<void> {
    try {
      // Map record types to notification types
      const notificationTypeMap: { [key: string]: string } = {
        'history_taking': 'history_taking_recorded',
        'vital_signs': 'vital_signs_recorded',
        'doctor_visit': 'record_updated',
        'lab_result': 'lab_result_ready',
        'prescription': 'prescription_ready',
        'document': 'document_created',
        'appointment': 'appointment_created',
        'patient_registration': 'patient_registered'
      };

      const notificationType = notificationTypeMap[data.recordType] || 'record_updated';
      
      // Get patient ID - use patientId if provided, otherwise try to fetch from HN
      let patientId = data.patientId;
      
      // If no patientId provided, try to get patient ID from HN
      if (!patientId && data.patientHn) {
        try {
          const { apiClient } = await import('@/lib/api');
          const patientResponse = await apiClient.get(`/medical/patients/by-hn/${data.patientHn}`);
          if (patientResponse.data && patientResponse.data.id) {
            patientId = patientResponse.data.id;
          }
        } catch (error) {
          logger.warn('Could not fetch patient ID from HN, skipping backend notification', { hn: data.patientHn });
          // Skip backend notification if we can't get patient ID
          return;
        }
      }
      
      // If we still don't have a valid UUID, skip backend notification
      if (!patientId || !patientId.includes('-')) {
        logger.warn('No valid patient ID found, skipping backend notification', { patientId, recordId: data.recordId });
        return;
      }
      
      const notificationPayload = {
        title: this.getNotificationTitle(data.recordType),
        message: data.message,
        notification_type: notificationType,
        priority: 'normal',
        action_required: false,
        metadata: {
          recordType: data.recordType,
          recordId: data.recordId,
          recordedBy: data.recordedBy,
          recordedTime: data.recordedTime
        }
      };

      // Import apiClient dynamically to avoid circular dependencies
      const { apiClient } = await import('@/lib/api');
      
      const apiUrl = `/medical/patients/${patientId}/notifications`;
      logger.info('Sending notification to backend', {
        apiUrl,
        patientId,
        notificationType,
        payload: notificationPayload
      });
      
      try {
        await apiClient.post(apiUrl, notificationPayload);
        logger.info('Notification API call successful');
      } catch (error) {
        logger.error('Notification API call failed', {
          apiUrl,
          patientId,
          error: error
        });
        // Don't throw error to prevent breaking the main flow
        // Just log the error and continue
        console.warn('Notification failed but continuing with main process');
        return;
      }
      
      logger.info('Notification sent to backend successfully', {
        patientId,
        notificationType,
        recordType: data.recordType
      });
    } catch (error) {
      logger.error('Failed to send notification to backend:', error);
      // Don't throw error to avoid breaking the main flow
      // The notification will still be sent via other methods (SMS, Email, In-app)
    }
  }

  /**
   * สร้างหัวข้อการแจ้งเตือนตามประเภท
   */
  private static getNotificationTitle(recordType: string): string {
    const titles: { [key: string]: string } = {
      'history_taking': 'บันทึกประวัติผู้ป่วย',
      'vital_signs': 'บันทึกสัญญาณชีพ',
      'doctor_visit': 'การตรวจโดยแพทย์',
      'lab_result': 'ผลแลบพร้อม',
      'prescription': 'ยาเตรียมพร้อม',
      'document': 'เอกสารใหม่',
      'appointment': 'นัดหมายใหม่',
      'patient_registration': 'ลงทะเบียนผู้ป่วยสำเร็จ'
    };
    
    return titles[recordType] || 'อัปเดตข้อมูลทางการแพทย์';
  }

  /**
   * ส่ง SMS แจ้งเตือนการอัปเดตข้อมูล
   */
  private static async sendRecordUpdateSMS(data: PatientRecordUpdateNotificationData): Promise<void> {
    const recordTypeLabels: { [key: string]: string } = {
      'history_taking': 'การซักประวัติ',
      'vital_signs': 'การวัดสัญญาณชีพ',
      'doctor_visit': 'การตรวจโดยแพทย์',
      'lab_result': 'ผลแลบ',
      'prescription': 'ใบสั่งยา',
      'document': 'เอกสารทางการแพทย์'
    };

    const recordTypeLabel = recordTypeLabels[data.recordType] || 'ข้อมูลทางการแพทย์';
    const message = `โรงพยาบาลตัวอย่าง: มีการอัปเดต${recordTypeLabel}สำหรับคุณ ${data.patientName} โดย ${data.recordedBy} วันที่ ${new Date(data.recordedTime).toLocaleString('th-TH')}`;
    
    logger.info('SMS sent (simulated):', { to: data.patientPhone, message });
  }

  /**
   * ส่ง Email แจ้งเตือนการอัปเดตข้อมูล
   */
  private static async sendRecordUpdateEmail(data: PatientRecordUpdateNotificationData): Promise<void> {
    try {
      // ใช้ email template ใหม่
      await this.sendEmailWithTemplate('recordUpdate', {
        patientName: data.patientName,
        patientHn: data.patientHn,
        recordType: data.recordType,
        recordTitle: data.recordType === 'vital_signs' ? 'บันทึกสัญญาณชีพ' : 
                    data.recordType === 'patient_registration' ? 'ลงทะเบียนผู้ป่วยใหม่' :
                    'อัปเดตข้อมูลทางการแพทย์',
        recordDescription: data.message,
        recordDetails: data.chiefComplaint ? { chiefComplaint: data.chiefComplaint } : undefined,
        createdByName: data.recordedBy,
        created_at: data.recordedTime
      }, data.patientEmail);
      
      logger.info('Record update email notification sent', { patientHn: data.patientHn });
    } catch (error) {
      logger.error('Failed to send record update email:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนในระบบสำหรับการอัปเดตข้อมูล
   */
  private static async sendRecordUpdateInAppNotification(data: PatientRecordUpdateNotificationData): Promise<void> {
    const recordTypeLabels: { [key: string]: string } = {
      'history_taking': 'การซักประวัติ',
      'vital_signs': 'การวัดสัญญาณชีพ',
      'doctor_visit': 'การตรวจโดยแพทย์',
      'lab_result': 'ผลแลบ',
      'prescription': 'ใบสั่งยา',
      'document': 'เอกสารทางการแพทย์'
    };

    const recordTypeLabel = recordTypeLabels[data.recordType] || 'ข้อมูลทางการแพทย์';
    
    const notification = {
      id: `record-update-${Date.now()}`,
      type: 'record_update',
      title: `อัปเดต${recordTypeLabel}`,
      message: data.message,
      patientHn: data.patientHn,
      patientNationalId: data.patientNationalId,
      recordType: data.recordType,
      recordId: data.recordId,
      recordedBy: data.recordedBy,
      recordedTime: data.recordedTime,
      priority: 'medium',
      actionRequired: false,
      created_at: new Date().toISOString(),
      read: false
    };

    // บันทึกใน localStorage
    const existingNotifications = JSON.parse(localStorage.getItem('patient_notifications') || '[]');
    existingNotifications.push(notification);
    localStorage.setItem('patient_notifications', JSON.stringify(existingNotifications));

    // ส่ง event สำหรับ real-time update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('patientRecordUpdateNotification', { 
        detail: notification 
      }));
    }
  }

  /**
   * บันทึกการแจ้งเตือนการอัปเดตข้อมูล
   */
  private static async logRecordUpdateNotification(data: PatientRecordUpdateNotificationData): Promise<void> {
    logger.info('Record update notification logged:', {
      patientHn: data.patientHn,
      recordType: data.recordType,
      recordId: data.recordId,
      recordedBy: data.recordedBy,
      timestamp: createLocalDateTimeString(new Date())
    });
  }

  /**
   * สร้าง HTML template สำหรับ Email การอัปเดตข้อมูล
   */
  private static generateRecordUpdateEmailTemplate(data: PatientRecordUpdateNotificationData): string {
    const recordTypeLabels: { [key: string]: string } = {
      'history_taking': 'การซักประวัติ',
      'vital_signs': 'การวัดสัญญาณชีพ',
      'doctor_visit': 'การตรวจโดยแพทย์',
      'lab_result': 'ผลแลบ',
      'prescription': 'ใบสั่งยา',
      'document': 'เอกสารทางการแพทย์'
    };

    const recordTypeLabel = recordTypeLabels[data.recordType] || 'ข้อมูลทางการแพทย์';
    const recordedDate = formatLocalDateTime(new Date(data.recordedTime));
    const recordedTime = formatLocalTime(new Date(data.recordedTime));

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การอัปเดตข้อมูลทางการแพทย์</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header h2 { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
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
            <h1>🏥 โรงพยาบาลตัวอย่าง</h1>
            <h2>การอัปเดต${recordTypeLabel}</h2>
          </div>
          
          <div class="content">
            <p>เรียน คุณ ${data.patientName}</p>
            
            <div class="highlight">
              <p><strong>มีการอัปเดต${recordTypeLabel}ใหม่สำหรับคุณ</strong></p>
            </div>
            
            <div class="info-box">
              <h3>📋 ข้อมูลการอัปเดต</h3>
              <p><strong>ประเภทข้อมูล:</strong> ${recordTypeLabel}</p>
              <p><strong>วันที่อัปเดต:</strong> ${recordedDate}</p>
              <p><strong>เวลาอัปเดต:</strong> ${recordedTime}</p>
              <p><strong>ผู้บันทึก:</strong> ${data.recordedBy}</p>
              ${data.chiefComplaint ? `<p><strong>อาการหลัก:</strong> ${data.chiefComplaint}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>💬 ข้อความ</h3>
              <p>${data.message}</p>
            </div>
            
            <div class="info-box">
              <h3>📱 ข้อมูลติดต่อ</h3>
              <p>หากมีข้อสงสัยเกี่ยวกับข้อมูลที่อัปเดต กรุณาติดต่อโรงพยาบาล</p>
              <p>โทรศัพท์: 02-xxx-xxxx</p>
              <p>อีเมล: info@hospital.example.com</p>
            </div>
          </div>
          
          <div class="footer">
            <p>โรงพยาบาลตัวอย่าง | ระบบบันทึกสุขภาพอิเล็กทรอนิกส์</p>
            <p>อัปเดตโดย: ${data.recordedBy} | ${formatLocalDateTime(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
