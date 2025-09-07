import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { webSocketService } from '@/services/websocketService';
import { logger } from '@/lib/logger';

/**
 * WebSocket Hook
 * จัดการ WebSocket connection และ events สำหรับ React components
 */

interface NotificationData {
  id: string;
  type: 'system' | 'user' | 'admin';
  title: string;
  message: string;
  data?: unknown;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface SystemUpdate {
  id: string;
  type: 'maintenance' | 'feature' | 'security' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: unknown;
  timestamp: string;
}

interface DashboardUpdate {
  data: unknown;
  timestamp: string;
}

interface PatientUpdate {
  type: 'visit' | 'lab_result' | 'prescription' | 'appointment';
  patientId: string;
  data: unknown;
  timestamp: string;
}

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([]);
  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [patientUpdates, setPatientUpdates] = useState<PatientUpdate[]>([]);
  
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.accessToken) {
      // Connect to WebSocket
      webSocketService.connect(user.accessToken);

      // Set up event listeners
      const handleConnected = () => {
        setIsConnected(true);
        logger.debug('🔌 WebSocket connected in hook');
      };

      const handleDisconnected = (reason: string) => {
        setIsConnected(false);
        logger.debug('🔌 WebSocket disconnected in hook:', reason);
      };

      const handleConnectionError = (error: unknown) => {
        setIsConnected(false);
        logger.error('🔌 WebSocket connection error in hook:', error);
      };

      const handleNotification = (notification: NotificationData) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
        logger.debug('📢 New notification received:', notification);
      };

      const handleSystemUpdate = (update: SystemUpdate) => {
        setSystemUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep last 20 updates
        logger.debug('🔄 New system update received:', update);
      };

      const handleDashboardUpdate = (update: DashboardUpdate) => {
        setDashboardData(update.data);
        logger.debug('📊 Dashboard updated:', update);
      };

      const handlePatientUpdate = (update: PatientUpdate) => {
        setPatientUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep last 20 updates
        logger.debug('🏥 New patient update received:', update);
      };

      // Add event listeners
      webSocketService.on('connected', handleConnected);
      webSocketService.on('disconnected', handleDisconnected as any);
      webSocketService.on('connection_error', handleConnectionError as any);
      webSocketService.on('notification', handleNotification as any);
      webSocketService.on('system_update', handleSystemUpdate as any);
      webSocketService.on('dashboard_update', handleDashboardUpdate as any);
      webSocketService.on('patient_update', handlePatientUpdate as any);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (!webSocketService.getConnectionStatus()) {
          logger.warn('⚠️ WebSocket connection timeout');
          setIsConnected(false);
        }
      }, 10000);

      // Cleanup function
      return () => {
        // Remove event listeners
        webSocketService.off('connected', handleConnected);
        webSocketService.off('disconnected', handleDisconnected as any);
        webSocketService.off('connection_error', handleConnectionError as any);
        webSocketService.off('notification', handleNotification as any);
        webSocketService.off('system_update', handleSystemUpdate as any);
        webSocketService.off('dashboard_update', handleDashboardUpdate as any);
        webSocketService.off('patient_update', handlePatientUpdate as any);

        // Clear timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }

        // Disconnect WebSocket
        webSocketService.disconnect();
        setIsConnected(false);
      };
    } else {
      // Disconnect if not authenticated
      webSocketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.accessToken]);

  // Auto-join relevant rooms based on user role
  useEffect(() => {
    if (isConnected && user) {
      // Join user-specific room
      webSocketService.joinRoom(`user:${user.id}`);
      
      // Join role-specific room
      if (user.role) {
        webSocketService.joinRoom(`role:${user.role}`);
      }

      // Join admin room if user is admin
      if (user.role === 'admin') {
        webSocketService.joinRoom('admin');
      }

      // Join common rooms
      webSocketService.joinRoom('notifications');
      webSocketService.joinRoom('system_updates');
      
      if (user.role === 'patient') {
        webSocketService.joinRoom('patient_updates');
      }
    }
  }, [isConnected, user]);

  return {
    isConnected,
    notifications,
    systemUpdates,
    dashboardData,
    patientUpdates,
    joinRoom: webSocketService.joinRoom.bind(webSocketService),
    leaveRoom: webSocketService.leaveRoom.bind(webSocketService),
    startTyping: webSocketService.startTyping.bind(webSocketService),
    stopTyping: webSocketService.stopTyping.bind(webSocketService),
    clearNotifications: () => setNotifications([]),
    clearSystemUpdates: () => setSystemUpdates([]),
    clearPatientUpdates: () => setPatientUpdates([])
  };
};

/**
 * Hook for real-time notifications
 */
export const useNotifications = () => {
  const { notifications, clearNotifications } = useWebSocket();
  
  const unreadCount = notifications.filter(n => !(n.data as any)?.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;
  
  return {
    notifications,
    unreadCount,
    highPriorityCount,
    clearNotifications
  };
};

/**
 * Hook for real-time dashboard updates
 */
export const useDashboardUpdates = () => {
  const { dashboardData, isConnected } = useWebSocket();
  
  return {
    dashboardData,
    isConnected
  };
};

/**
 * Hook for patient updates (for medical staff)
 */
export const usePatientUpdates = () => {
  const { patientUpdates, clearPatientUpdates } = useWebSocket();
  
  const recentUpdates = patientUpdates.slice(0, 10);
  const criticalUpdates = patientUpdates.filter(u => 
    u.type === 'lab_result' && (u.data as any)?.status === 'critical'
  );
  
  return {
    patientUpdates: recentUpdates,
    criticalUpdates,
    clearPatientUpdates
  };
};
