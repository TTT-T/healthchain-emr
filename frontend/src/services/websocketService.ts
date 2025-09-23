"use client";
import { logger } from '@/lib/logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isConnecting = false;
  private isConnected = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    };
  }

  /**
   * เชื่อมต่อ WebSocket
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          logger.info('WebSocket connected', { url: this.config.url });
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          logger.warn('WebSocket disconnected', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          this.isConnected = false;
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * ปิดการเชื่อมต่อ WebSocket
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * ส่งข้อความผ่าน WebSocket
   */
  public send(type: string, data: any): boolean {
    if (!this.isConnected || !this.ws) {
      logger.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        id: this.generateMessageId()
      };

      this.ws.send(JSON.stringify(message));
      logger.('WebSocket message sent', { type, data });
      return true;
    } catch (error) {
      logger.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * ลงทะเบียน event handler
   */
  public on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * ยกเลิกการลงทะเบียน event handler
   */
  public off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * เข้าร่วมห้อง (room)
   */
  public joinRoom(roomId: string): boolean {
    return this.send('join_room', { roomId });
  }

  /**
   * ออกจากห้อง (room)
   */
  public leaveRoom(roomId: string): boolean {
    return this.send('leave_room', { roomId });
  }

  /**
   * เริ่มพิมพ์ (typing indicator)
   */
  public startTyping(roomId: string, userId: string): boolean {
    return this.send('start_typing', { roomId, userId });
  }

  /**
   * หยุดพิมพ์ (typing indicator)
   */
  public stopTyping(roomId: string, userId: string): boolean {
    return this.send('stop_typing', { roomId, userId });
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่อ
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * จัดการข้อความที่ได้รับ
   */
  private handleMessage(message: WebSocketMessage): void {
    logger.('WebSocket message received', { type: message.type });

    // เรียกใช้ handlers ที่ลงทะเบียนไว้
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          logger.error('Error in WebSocket event handler:', error);
        }
      });
    }

    // เรียกใช้ wildcard handler
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          logger.error('Error in WebSocket wildcard handler:', error);
        }
      });
    }
  }

  /**
   * เริ่มการ reconnect
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('Scheduling WebSocket reconnect', { 
      attempt: this.reconnectAttempts,
      delay 
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        logger.error('WebSocket reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * เริ่ม heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('ping', { timestamp: new Date().toISOString() });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * หยุด heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * สร้าง message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for the application
let wsServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsServiceInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    wsServiceInstance = new WebSocketService({ url: wsUrl });
  }
  return wsServiceInstance;
};

// Hook for using WebSocket in React components
export const useWebSocket = (config?: WebSocketConfig) => {
  const service = config ? new WebSocketService(config) : getWebSocketService();
  
  return {
    connect: () => service.connect(),
    disconnect: () => service.disconnect(),
    send: (type: string, data: any) => service.send(type, data),
    on: (eventType: string, handler: WebSocketEventHandler) => service.on(eventType, handler),
    off: (eventType: string, handler: WebSocketEventHandler) => service.off(eventType, handler),
    getConnectionStatus: () => service.getConnectionStatus(),
    joinRoom: (roomId: string) => service.joinRoom(roomId),
    leaveRoom: (roomId: string) => service.leaveRoom(roomId),
    startTyping: (roomId: string, userId: string) => service.startTyping(roomId, userId),
    stopTyping: (roomId: string, userId: string) => service.stopTyping(roomId, userId)
  };
};