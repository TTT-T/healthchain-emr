"use client";
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, FileText, Stethoscope, Pill, Tube, Calendar, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import AppLayout from '@/components/AppLayout';

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  record_type?: string;
  record_id?: string;
  sms_sent: boolean;
  email_sent: boolean;
  in_app_sent: boolean;
  read_at?: string;
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const { refreshNotificationCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getPatientNotifications(user.id);
      if (response && response.statusCode === 200 && response.data) {
        // Extract notifications from the response data structure
        const notificationsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.notifications || [];
        
        setNotifications(notificationsData);
        logger.info('Notifications loaded successfully', { count: notificationsData.length });

        // Auto-mark all unread notifications as read when user visits the page
        const unreadNotifications = notificationsData.filter((notif: any) => !notif.is_read);
        if (unreadNotifications.length > 0) {
          logger.info('Auto-marking unread notifications as read', { 
            count: unreadNotifications.length,
            patientId: user.id 
          });
          
          // Mark all unread notifications as read
          for (const notification of unreadNotifications) {
            try {
              await apiClient.request({
                method: 'PUT',
                url: `/medical/patients/${user.id}/notifications/${notification.id}/read`
              });
              logger.info('Auto-marked notification as read', { notificationId: notification.id });
            } catch (error: any) {
              console.error('❌ Failed to auto-mark notification as read:', notification.id, error);
              logger.error('Failed to auto-mark notification as read:', { 
                notificationId: notification.id, 
                error 
              });
              // Continue with other notifications even if one fails
            }
          }
          
          // Refresh notification count after marking all as read
          refreshNotificationCount();
        }
      } else {
        if (response && response.statusCode === 200) {
          // If status is 200 but no data, set empty notifications
          setNotifications([]);
          setError(null);
        } else {
          setError('ไม่สามารถโหลดการแจ้งเตือนได้');
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading notifications:', error);
      
      // Check if it's a 404 error (patient not found) - this is expected for users who haven't registered in EMR yet
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        setNotifications([]);
        setError(null); // Don't show error for expected 404
      } else if (error?.response?.status === 200) {
        // Don't show error for successful responses (status 200)
        setError(null);
      } else {
        console.error('❌ Error loading notifications:', error);
        logger.error('Failed to load notifications:', error);
        setError('เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.request({
        method: 'PUT',
        url: `/medical/patients/${user?.id}/notifications/${notificationId}/read`
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );

      // Refresh notification count in header
      refreshNotificationCount();

      logger.info('Notification marked as read', { notificationId });
    } catch (error: any) {
      console.error('❌ Failed to mark notification as read:', notificationId, error);
      logger.error('Failed to mark notification as read:', error);
      // Don't show error to user, just log it
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_created':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'record_updated':
        return <Stethoscope className="w-5 h-5 text-green-600" />;
      case 'appointment_created':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'lab_result_ready':
        return <Tube className="w-5 h-5 text-orange-600" />;
      case 'prescription_ready':
        return <Pill className="w-5 h-5 text-red-600" />;
      case 'queue_assigned':
        return <Bell className="w-5 h-5 text-indigo-600" />;
      case 'visit_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'document_created': 'เอกสารใหม่',
      'record_updated': 'อัปเดตข้อมูล',
      'appointment_created': 'นัดหมายใหม่',
      'lab_result_ready': 'ผลแลบพร้อม',
      'prescription_ready': 'ยาเตรียมพร้อม',
      'queue_assigned': 'ได้รับคิว',
      'visit_completed': 'เสร็จสิ้นการรักษา'
    };
    
    return labels[type] || 'การแจ้งเตือน';
  };

  // Format date to Thai time
  const formatDate = (daring: string) => {
    const date = new Date(daring);
    
    return date.toLocaleDaring('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      // Refresh notification count when user visits notifications page
      refreshNotificationCount();
    }
  }, [isAuthenticated, user?.id, refreshNotificationCount]);

  if (!isAuthenticated) {
    return (
      <AppLayout title="การแจ้งเตือน" userType="patient">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h1>
            <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อดูการแจ้งเตือน</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="การแจ้งเตือน" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
                <p className="text-gray-600">การแจ้งเตือนและอัปเดตข้อมูลทางการแพทย์</p>
              </div>
            </div>
            <button
              onClick={loadNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
                <p className="text-gray-600">คุณยังไม่มีการแจ้งเตือนใดๆ</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border border-slate-200 p-6 cursor-pointer transition-all hover:shadow-md ${
                    !notification.read_at ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.read_at) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2">{notification.message}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {getNotificationTypeLabel(notification.notification_type)}
                          </span>
                          {notification.sms_sent && (
                            <span className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                              SMS
                            </span>
                          )}
                          {notification.email_sent && (
                            <span className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                              Email
                            </span>
                          )}
                        </div>
                        
                        {notification.read_at && (
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            อ่านแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-lg">
              {/* Header Bar */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(selectedNotification.notification_type)}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                      <p className="text-gray-600 text-sm">{getNotificationTypeLabel(selectedNotification.notification_type)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="sr-only">ปิด</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">รายละเอียด</h3>
                    <p className="text-gray-600">{selectedNotification.message}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">ประเภท</h4>
                      <p className="text-gray-600">
                        {getNotificationTypeLabel(selectedNotification.notification_type)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">วันที่</h4>
                      <p className="text-gray-600">
                        {formatDate(selectedNotification.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedNotification.metadata && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(selectedNotification.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}