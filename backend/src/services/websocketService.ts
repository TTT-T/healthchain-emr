import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { databaseManager } from '../database/connection';

/**
 * WebSocket Service
 * จัดการ real-time communication ผ่าน Socket.IO
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

interface NotificationData {
  type: 'system' | 'user' | 'admin';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  userId?: string;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of room names

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Get user details from database
        const userQuery = `
          SELECT id, email, role, first_name, last_name, is_active
          FROM users 
          WHERE id = $1 AND is_active = true
        `;
        
        const userResult = await databaseManager.query(userQuery, [decoded.userId]);
        
        if (userResult.rows.length === 0) {
          return next(new Error('User not found or inactive'));
        }

        const user = userResult.rows[0];
        socket.userId = user.id;
        socket.userRole = user.role;
        socket.userEmail = user.email;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      // Store connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
        this.userRooms.set(socket.userId, new Set());
      }

      // Join user-specific room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        this.userRooms.get(socket.userId)?.add(`user:${socket.userId}`);
      }

      // Join role-specific room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
        this.userRooms.get(socket.userId!)?.add(`role:${socket.userRole}`);
      }

      // Join admin room if user is admin
      if (socket.userRole === 'admin') {
        socket.join('admin');
        this.userRooms.get(socket.userId!)?.add('admin');
      }

      // Handle join custom room
      socket.on('join_room', (roomName: string) => {
        if (this.canJoinRoom(socket, roomName)) {
          socket.join(roomName);
          this.userRooms.get(socket.userId!)?.add(roomName);
        }
      });

      // Handle leave custom room
      socket.on('leave_room', (roomName: string) => {
        socket.leave(roomName);
        this.userRooms.get(socket.userId!)?.delete(roomName);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { room: string; userId: string }) => {
        socket.to(data.room).emit('user_typing', {
          userId: data.userId,
          userEmail: socket.userEmail,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { room: string; userId: string }) => {
        socket.to(data.room).emit('user_typing', {
          userId: data.userId,
          userEmail: socket.userEmail,
          isTyping: false
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userRooms.delete(socket.userId);
        }
      });

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to HealthChain EMR System',
        userId: socket.userId,
        userRole: socket.userRole,
        timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
      });
    });
  }

  /**
   * Check if user can join a specific room
   */
  private canJoinRoom(socket: AuthenticatedSocket, roomName: string): boolean {
    // Admin can join any room
    if (socket.userRole === 'admin') {
      return true;
    }

    // User can join their own room
    if (roomName === `user:${socket.userId}`) {
      return true;
    }

    // User can join their role room
    if (roomName === `role:${socket.userRole}`) {
      return true;
    }

    // Check for specific room permissions
    const allowedRooms = [
      'notifications',
      'system_updates',
      'patient_updates'
    ];

    return allowedRooms.includes(roomName);
  }

  /**
   * Send notification to specific user
   */
  public sendNotificationToUser(userId: string, notification: NotificationData): void {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('notification', {
        ...notification,
        timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        id: this.generateNotificationId()
      });
    }
  }

  /**
   * Send notification to all users with specific role
   */
  public sendNotificationToRole(role: string, notification: NotificationData): void {
    this.io.to(`role:${role}`).emit('notification', {
      ...notification,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      id: this.generateNotificationId()
    });
  }

  /**
   * Send notification to all admins
   */
  public sendNotificationToAdmins(notification: NotificationData): void {
    this.io.to('admin').emit('notification', {
      ...notification,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      id: this.generateNotificationId()
    });
  }

  /**
   * Send notification to all connected users
   */
  public sendNotificationToAll(notification: NotificationData): void {
    this.io.emit('notification', {
      ...notification,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      id: this.generateNotificationId()
    });
  }

  /**
   * Send system update to all users
   */
  public sendSystemUpdate(update: {
    type: 'maintenance' | 'feature' | 'security' | 'general';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    data?: any;
  }): void {
    this.io.emit('system_update', {
      ...update,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      id: this.generateNotificationId()
    });
  }

  /**
   * Send real-time dashboard update
   */
  public sendDashboardUpdate(role: string, data: any): void {
    this.io.to(`role:${role}`).emit('dashboard_update', {
      data,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    });
  }

  /**
   * Send patient update to relevant users
   */
  public sendPatientUpdate(patientId: string, update: {
    type: 'visit' | 'lab_result' | 'prescription' | 'appointment';
    patientId: string;
    data: any;
  }): void {
    // Send to patient
    this.io.to(`user:${patientId}`).emit('patient_update', {
      ...update,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    });

    // Send to medical staff
    this.io.to('role:doctor').emit('patient_update', {
      ...update,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    });
    this.io.to('role:nurse').emit('patient_update', {
      ...update,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    });
  }

  /**
   * Send appointment reminder
   */
  public sendAppointmentReminder(userId: string, appointment: {
    id: string;
    date: string;
    time: string;
    doctor: string;
    type: string;
  }): void {
    this.sendNotificationToUser(userId, {
      type: 'user',
      title: 'Appointment Reminder',
      message: `You have an appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}`,
      priority: 'medium',
      data: appointment
    });
  }

  /**
   * Send lab result notification
   */
  public sendLabResultNotification(userId: string, labResult: {
    id: string;
    Name: string;
    result: string;
    status: 'normal' | 'abnormal' | 'critical';
  }): void {
    const priority = labResult.status === 'critical' ? 'high' : 'medium';
    
    this.sendNotificationToUser(userId, {
      type: 'user',
      title: 'Lab Result Available',
      message: `Your ${labResult.Name} results are ready. Status: ${labResult.status}`,
      priority,
      data: labResult
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users by role
   */
  public getConnectedUsersByRole(): { [role: string]: number } {
    const roleCount: { [role: string]: number } = {};
    
    this.connectedUsers.forEach(socket => {
      if (socket.userRole) {
        roleCount[socket.userRole] = (roleCount[socket.userRole] || 0) + 1;
      }
    });

    return roleCount;
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketService;
