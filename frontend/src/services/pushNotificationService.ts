"use client";
import { logger } from '@/lib/logger';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkSupport();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * ตรวจสอบการรองรับ Push Notifications
   */
  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    
    logger.info('Push notification support check', {
      isSupported: this.isSupported,
      permission: this.permission
    });
  }

  /**
   * ขอสิทธิ์การแจ้งเตือน
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      logger.warn('Push notifications not supported');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      logger.info('Notification permission requested', { permission: this.permission });
      return this.permission;
    } catch (error) {
      logger.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * ลงทะเบียน Service Worker
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      logger.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service Worker registered', { registration: this.registration });
      return this.registration;
    } catch (error) {
      logger.error('Failed to register Service Worker:', error);
      return null;
    }
  }

  /**
   * ส่งการแจ้งเตือน
   */
  public async showNotification(data: PushNotificationData): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      logger.warn('Cannot show notification - not supported or permission denied');
      return;
    }

    try {
      if (this.registration) {
        // ใช้ Service Worker
        await this.registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          badge: data.badge || '/badge-72x72.png',
          // image: data.image, // Not supported in NotificationOptions
          tag: data.tag,
          data: data.data,
          // actions: data.actions, // Not supported in NotificationOptions
          requireInteraction: data.requireInteraction,
          silent: data.silent
        });
      } else {
        // ใช้ Notification API โดยตรง
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192x192.png',
          tag: data.tag,
          data: data.data,
          requireInteraction: data.requireInteraction,
          silent: data.silent
        });
      }

      logger.info('Push notification shown', { title: data.title });
    } catch (error) {
      logger.error('Failed to show notification:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนการนัดหมาย
   */
  public async showAppointmentNotification(data: {
    patientName: string;
    queueNumber: string;
    doctorName: string;
    visitTime: string;
  }): Promise<void> {
    await this.showNotification({
      title: `การนัดหมายใหม่ - ${data.queueNumber}`,
      body: `คุณ ${data.patientName} ได้รับหมายเลขคิว ${data.queueNumber} สำหรับตรวจกับ ${data.doctorName}`,
      tag: `appointment-${data.queueNumber}`,
      data: {
        type: 'appointment',
        queueNumber: data.queueNumber,
        visitTime: data.visitTime
      },
      actions: [
        {
          action: 'view',
          title: 'ดูรายละเอียด',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'ปิด'
        }
      ]
    });
  }

  /**
   * ส่งการแจ้งเตือนการอัปเดตข้อมูล
   */
  public async showRecordUpdateNotification(data: {
    patientName: string;
    recordType: string;
    recordTitle: string;
  }): Promise<void> {
    await this.showNotification({
      title: `อัปเดตข้อมูล - ${data.recordTitle}`,
      body: `มีการอัปเดต${data.recordType}สำหรับคุณ ${data.patientName}`,
      tag: `record-update-${data.recordType}`,
      data: {
        type: 'record_update',
        recordType: data.recordType
      }
    });
  }

  /**
   * ส่งการแจ้งเตือนสถานะคิว
   */
  public async showQueueStatusNotification(data: {
    queueNumber: string;
    status: string;
    estimatedWaitTime?: string;
  }): Promise<void> {
    const statusText = {
      'waiting': 'รอคิว',
      'in_progress': 'กำลังตรวจ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    }[data.status] || data.status;

    await this.showNotification({
      title: `สถานะคิว ${data.queueNumber}`,
      body: `สถานะ: ${statusText}${data.estimatedWaitTime ? ` (รอประมาณ ${data.estimatedWaitTime} นาที)` : ''}`,
      tag: `queue-status-${data.queueNumber}`,
      data: {
        type: 'queue_status',
        queueNumber: data.queueNumber,
        status: data.status
      }
    });
  }

  /**
   * ปิดการแจ้งเตือนทั้งหมด
   */
  public async closeAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  /**
   * ตรวจสอบสถานะการแจ้งเตือน
   */
  public getStatus(): {
    isSupported: boolean;
    permission: NotificationPermission;
    isRegistered: boolean;
  } {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isRegistered: this.registration !== null
    };
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Hook for using push notifications in React components
export const usePushNotifications = () => {
  const service = pushNotificationService;

  return {
    requestPermission: () => service.requestPermission(),
    registerServiceWorker: () => service.registerServiceWorker(),
    showNotification: (data: PushNotificationData) => service.showNotification(data),
    showAppointmentNotification: (data: any) => service.showAppointmentNotification(data),
    showRecordUpdateNotification: (data: any) => service.showRecordUpdateNotification(data),
    showQueueStatusNotification: (data: any) => service.showQueueStatusNotification(data),
    closeAllNotifications: () => service.closeAllNotifications(),
    getStatus: () => service.getStatus()
  };
};
