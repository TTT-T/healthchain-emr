import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';
// import { useAuth } from '@/contexts/AuthContext';

/**
 * WebSocket Service for Frontend
 * จัดการ real-time communication กับ Backend
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

interface TypingIndicator {
  userId: string;
  userEmail: string;
  isTyping: boolean;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token: string): void {
    if (this.socket && this.socket.connected) {
      logger.debug('🔌 WebSocket already connected');
      return;
    }

    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupSocketEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.debug('🔌 WebSocket disconnected');
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.debug('🔌 WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      logger.debug('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('🔌 WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    this.socket.on('notification', (notification: NotificationData) => {
      logger.debug('📢 Received notification:', notification);
      this.emit('notification', notification);
    });

    this.socket.on('system_update', (update: SystemUpdate) => {
      logger.debug('🔄 Received system update:', update);
      this.emit('system_update', update);
    });

    this.socket.on('dashboard_update', (update: DashboardUpdate) => {
      logger.debug('📊 Received dashboard update:', update);
      this.emit('dashboard_update', update);
    });

    this.socket.on('patient_update', (update: PatientUpdate) => {
      logger.debug('🏥 Received patient update:', update);
      this.emit('patient_update', update);
    });

    this.socket.on('user_typing', (indicator: TypingIndicator) => {
      this.emit('user_typing', indicator);
    });

    this.socket.on('connected', (data) => {
      logger.debug('✅ WebSocket connection confirmed:', data);
      this.emit('connection_confirmed', data);
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    logger.debug(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Join a room
   */
  public joinRoom(roomName: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', roomName);
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomName: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', roomName);
    }
  }

  /**
   * Send typing start indicator
   */
  public startTyping(room: string, userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { room, userId });
    }
  }

  /**
   * Send typing stop indicator
   */
  public stopTyping(room: string, userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { room, userId });
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Initialize event listener map
    const events = [
      'connected',
      'disconnected',
      'connection_error',
      'connection_confirmed',
      'notification',
      'system_update',
      'dashboard_update',
      'patient_update',
      'user_typing'
    ];

    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.push(callback);
    } else {
      this.eventListeners.set(event, [callback]);
    }
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: (...args: unknown[]) => void): void {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: unknown): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && this.socket ? this.socket.connected : false;
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
