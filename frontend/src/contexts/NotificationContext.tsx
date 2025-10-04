"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
// Removed mock notifications import - using real data only

interface NotificationContextType {
  notificationCount: number;
  refreshNotificationCount: () => Promise<void>;
  decrementNotificationCount: () => void;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = async (): Promise<void> => {
    if (!user?.id) {
      setNotificationCount(0);
      return;
    }

    // For medical staff (doctors, nurses, admins), use real notification system
    if (['doctor', 'nurse', 'admin', 'staff'].includes(user.role)) {

      // For now, set to 0 as we don't have medical staff notifications yet
      setNotificationCount(0);
      return;
    }

    // Only fetch patient notifications for patient role
    if (user.role === 'patient') {
      try {
        // Check if user has a valid email
        if (!user.email || user.email.trim() === '') {
          // No email available, set notification count to 0
          setNotificationCount(0);
          return;
        }

        // First, try to find the patient record by email
        // This will work for both actual patient records and virtual patient records (users with patient role)
        const patientResponse = await apiClient.get(`/medical/patients/by-email/${encodeURIComponent(user.email)}`);
        
        if (patientResponse.statusCode === 200 && patientResponse.data) {
          const patientData = patientResponse.data as any;
          const patientId = patientData.id;
          
          // Now fetch notifications using the patient ID
          const response = await apiClient.getPatientNotifications(patientId);
          
          console.log('🔔 NotificationContext API Response:', { 
            statusCode: response?.statusCode,
            hasData: !!response?.data,
            responseData: response?.data
          });
          
          if (response.statusCode === 200 && response.data) {
            // Use unread_count from API response
            const responseData = response.data as any;
            const unreadCount = responseData?.unread_count || 0;
            console.log('🔔 NotificationContext - Setting notification count:', unreadCount, 'from response:', responseData);
            setNotificationCount(unreadCount);
          } else {
            // No notifications found
            console.log('🔔 NotificationContext - No notifications found, setting count to 0');
            setNotificationCount(0);
          }
        } else {
          // Patient record not found - this is expected for users who haven't registered in EMR yet
          setNotificationCount(0);
        }
      } catch (error: any) {
        // Check if it's a 404 error (patient not found) - this is expected for new patient users
        if (error?.response?.status === 404 || error?.statusCode === 404) {
          // Patient record not found - this is expected for users who haven't registered in EMR yet
          // Don't log this as an error since it's expected behavior
          setNotificationCount(0);
        } else {
          // Only log unexpected errors (not 404s)
          console.error('Unexpected error fetching notification count:', error);
          setNotificationCount(0);
        }
      }
    } else {
      // For other roles, no notifications
      setNotificationCount(0);
    }
  };

  const decrementNotificationCount = () => {
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      // For patient role, mark all notifications as read
      if (user.role === 'patient' && user.email) {
        // First, try to find the patient record by email
        const patientResponse = await apiClient.get(`/medical/patients/by-email/${encodeURIComponent(user.email)}`);
        
        if (patientResponse.statusCode === 200 && patientResponse.data) {
          const patientData = patientResponse.data as any;
          const patientId = patientData.id;
          
          // Mark all notifications as read
          await apiClient.put(`/medical/patients/${patientId}/notifications/mark-all-read`);
          
          console.log('🔔 NotificationContext - All notifications marked as read');
        }
      }
      
      // Reset the count
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Still reset the count even if API call fails
      setNotificationCount(0);
    }
  };

  // Fetch notification count when user changes
  useEffect(() => {
    fetchNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const value: NotificationContextType = {
    notificationCount,
    refreshNotificationCount: fetchNotificationCount,
    decrementNotificationCount,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
