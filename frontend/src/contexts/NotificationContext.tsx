"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { mockNotifications, getUnreadNotificationCount } from '@/lib/mockNotifications';

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

    try {
      // Try to fetch from API first
      const response = await apiClient.getPatientNotifications(user.id);
      if (response.statusCode === 200 && response.data) {
        // Count unread notifications
        const notifications = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.notifications || [];
        
        const unreadCount = notifications.filter((notif: any) => 
          !notif.isRead && !notif.is_read && !notif.read_at
        ).length;
        
        setNotificationCount(unreadCount);
      } else {
        // Fallback to mock data for demonstration
        const unreadCount = getUnreadNotificationCount(mockNotifications);
        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Use mock data as fallback
      const unreadCount = getUnreadNotificationCount(mockNotifications);
      setNotificationCount(unreadCount);
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
