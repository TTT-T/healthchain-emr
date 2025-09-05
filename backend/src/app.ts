import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import config from './config/index';
import { databaseInitializer } from './database/init';

// Routes
import authRoutes from './routes/auth';
import medicalRoutes from './routes/medical';
import patientRoutes from './routes/patients';
import aiRoutes from './routes/ai';
import consentRoutes from './routes/consent';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { corsOptions } from './middleware/cors';

/**
 * Express Application Setup
 * Supports 3 main functions:
 * 1. EMR Web Application (Medical Records Management)
 * 2. AI Risk Assessment System
 * 3. Consent Engine (Smart Contract-like Logic)
 */
class Application {
  public app: express.Application;
  
  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors(corsOptions));

    // Compression
    this.app.use(compression());

    // Rate limiting - More lenient in development
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Very lenient in dev
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'development' ? 200 : 10, // Much more lenient in development
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', authLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Trust proxy (for production behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: '1.0.0',
        services: {
          database: 'connected', // Could be dynamic check
          ai: 'available',
          consent: 'active'
        }
      });
    });

    // API Routes
    this.app.use('/api/auth', authRoutes);           // 1. Authentication & Authorization
    this.app.use('/api/patients', patientRoutes);    // Patient Management
    this.app.use('/api/medical', medicalRoutes);     // 1. EMR Web Application
    this.app.use('/api/ai', aiRoutes);               // 2. AI Risk Assessment
    this.app.use('/api/consent', consentRoutes);     // 3. Consent Engine
    this.app.use('/api/admin', adminRoutes);         // 1. Admin functions
    this.app.use('/api/profile', profileRoutes);     // Profile management

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database system
      console.log('🚀 Initializing database system...');
      await databaseInitializer.initialize();
      console.log('✅ Database system initialized successfully');

      // Start server
      const port = config.port || 3001;
      
      this.app.listen(port, () => {
        console.log(`
🚀 EMR Backend Server Started Successfully!
📍 Port: ${port}
🌍 Environment: ${config.nodeEnv}
🔧 API Base URL: http://localhost:${port}/api

📋 Available Services:
  1. 🏥 EMR Web Application - /api/medical
  2. 🤖 AI Risk Assessment - /api/ai  
  3. 📝 Consent Engine - /api/consent
  4. 👤 Authentication - /api/auth
  5. ⚙️  Admin Panel - /api/admin

🔍 Health Check: http://localhost:${port}/health
        `);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down server...');
    
    try {
      // Database connections will be closed automatically by the pool
      console.log('✅ Server shutdown completed');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

export default Application;
