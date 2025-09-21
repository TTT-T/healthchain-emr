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
      // TODO: Implement real notification system for medical staff
      // For now, set to 0 as we don't have medical staff notifications yet
      setNotificationCount(0);
      return;
    }

    // Only fetch patient notifications for patient role
    if (user.role === 'patient') {
      try {
        // Try to fetch from API first
        const response = await apiClient.getPatientNotifications(user.id);
        if (response.statusCode === 200 && response.data) {
          // Count unread notifications
          const notifications = Array.isArray(response.data) 
            ? response.data 
            : (response.data as any)?.notifications || [];
          
          const unreadCount = notifications.filter((notif: any) => 
            !notif.is_read
          ).length;
          
          console.log('🔔 NotificationContext - Notifications:', notifications);
          console.log('🔔 NotificationContext - Unread count:', unreadCount);
          
          setNotificationCount(unreadCount);
        } else if (response.statusCode === 404) {
          // Patient record not found - this is expected for users who haven't registered in EMR yet
          setNotificationCount(0);
        } else {
          // No notifications found
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
      // For now, just reset the count
      // TODO: Implement API endpoint to mark all notifications as read
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
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
