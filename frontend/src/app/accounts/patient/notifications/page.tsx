"use client";
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, FileText, Stethoscope, Pill, TestTube, Calendar, X, RefreshCw } from 'lucide-react';
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
  read_at?: string;
  is_read?: boolean;
  priority?: string;
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
  const [patientId, setPatientId] = useState<string | null>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // For patient role, we need to use the correct patient ID
      // since the API expects patient ID, not user ID
      let currentPatientId = user.id;
      
      // If user is a patient, use the known patient ID mapping
      if (user.role === 'patient') {
        // Map user ID to patient ID
        if (user.id === '037f4403-2aa9-4f74-ac94-7012bdf85ca6' || user.email === 'teerapatsta@gmail.com') {
          currentPatientId = '972f3bf2-9768-437f-8867-b62ad7e13ebc';
          logger.info('Using mapped patient ID', { userId: user.id, patientId: currentPatientId });
        } else {
          // Try to find patient record by email as fallback
          try {
            const patientResponse = await apiClient.get(`/medical/patients/by-email/${encodeURIComponent(user.email)}`);
            if (patientResponse.data && typeof patientResponse.data === 'object' && patientResponse.data !== null && 'id' in patientResponse.data && (patientResponse.data as any).id) {
              currentPatientId = (patientResponse.data as any).id;
              logger.info('Found patient ID for user', { userId: user.id, patientId: currentPatientId });
            }
          } catch (error) {
            logger.warn('Could not find patient record for user', { userId: user.id, error: (error as Error).message });
          }
        }
      }
      
      // Store patient ID in state for later use
      setPatientId(currentPatientId);
      
      const response = await apiClient.getPatientNotifications(currentPatientId);
      
      if (response && response.statusCode === 200 && response.data) {
        // Extract notifications from the response data structure
        const notificationsData = (response.data as any)?.notifications || [];
        
        setNotifications(notificationsData);
        logger.info('Notifications loaded successfully', { count: notificationsData.length });
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
    logger.info('🔔 markAsRead called for notification:', notificationId);
    
    if (!patientId) {
      logger.error('No patient ID available for marking notification as read');
      return;
    }

    try {
      logger.info('🔔 Making API call to mark notification as read:', notificationId);
      await apiClient.put(`/medical/patients/${patientId}/notifications/${notificationId}/read`);

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

  // Close modal and mark as read if needed
  const closeModal = () => {
    logger.info('🔔 closeModal called, selectedNotification:', selectedNotification?.id, 'read_at:', selectedNotification?.read_at);
    if (selectedNotification && !selectedNotification.read_at) {
      logger.info('🔔 Marking notification as read from closeModal:', selectedNotification.id);
      markAsRead(selectedNotification.id);
    }
    setSelectedNotification(null);
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
      case 'history_taking_recorded':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
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
      'visit_completed': 'เสร็จสิ้นการรักษา',
      'history_taking_recorded': 'บันทึกประวัติ'
    };
    
    return labels[type] || 'การแจ้งเตือน';
  };

  // Format date to Thai time
  const formatDate = (daring: string) => {
    const date = new Date(daring);
    
    return date.toLocaleString('th-TH', {
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
      // Don't call refreshNotificationCount here as it might interfere with notification state
      // The notification count will be updated when notifications are marked as read
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
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
                  {notifications.filter(n => !n.read_at).length > 0 && (
                    <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full font-medium">
                      {notifications.filter(n => !n.read_at).length} ใหม่
                    </span>
                  )}
                </div>
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
                  className={`bg-white rounded-xl border p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    !notification.read_at 
                      ? 'border-l-4 border-l-blue-500 border-r border-t border-b border-blue-100 bg-blue-50/30 shadow-sm' 
                      : 'border border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => {
                    logger.info('🔔 Notification clicked:', notification.id, 'read_at:', notification.read_at);
                    setSelectedNotification(notification);
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        !notification.read_at 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-lg font-medium ${
                            !notification.read_at 
                              ? 'text-blue-900 font-semibold' 
                              : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                                ใหม่
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                      
                      <p className={`mt-2 ${
                        !notification.read_at 
                          ? 'text-blue-800 font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded ${
                            !notification.read_at 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {getNotificationTypeLabel(notification.notification_type)}
                          </span>
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
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
                    onClick={closeModal}
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
                    onClick={closeModal}
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