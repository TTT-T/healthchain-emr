"use client";
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, FileText, Stethoscope, Pill, TestTube, Calendar, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('❌ Not authenticated or no user ID:', { isAuthenticated, userId: user?.id });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading notifications for user:', user.id);
      
      const response = await apiClient.request({
        method: 'GET',
        url: `/medical/patients/${user.id}/notifications-list?limit=100`
      });

      console.log('📡 API Response:', response);

      if (response.statusCode === 200 && response.data) {
        setNotifications(response.data);
        console.log('✅ Notifications loaded successfully:', response.data);
        logger.info('Notifications loaded successfully', { count: response.data.length });
      } else {
        console.log('❌ Invalid response:', response);
        setError('ไม่สามารถโหลดการแจ้งเตือนได้');
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      logger.error('Failed to load notifications:', error);
      setError('เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน');
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

      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
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
        return <TestTube className="w-5 h-5 text-orange-600" />;
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convert to Thai timezone (UTC+7)
    const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    return thaiDate.toLocaleDateString('th-TH', {
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
    }
  }, [isAuthenticated, user?.id]);

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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getNotificationIcon(selectedNotification.notification_type)}
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedNotification.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
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
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}