import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from './config/index';
import { databaseInitializer } from './database/init';
import { setupSwagger } from './config/swagger';

// Routes
import authRoutes from './routes/auth';
import medicalRoutes from './routes/medical';
import patientRoutes from './routes/patients';
import aiRoutes from './routes/ai';
import consentRoutes from './routes/consent';
import adminRoutes from './routes/admin';
// Profile routes are now included in auth routes
import securityRoutes from './routes/security';
import externalRequestersRoutes from './routes/external-requesters';
import healthRoutes from './routes/health';
import emailTestRoutes from './routes/email-test';

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

    // Setup Swagger documentation
    setupSwagger(this.app as any);

    // Trust proxy (for production behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        
        // Check database connection
        const { db } = await import('./database');
        await db.query('SELECT 1');
        const dbResponseTime = Date.now() - startTime;
        
        const healthStatus = {
          data: {
            status: 'ok',
            time: new Date().toISOString(),
            version: '1.0.0',
            environment: config.server.nodeEnv,
            services: {
              database: {
                status: 'connected',
                responseTime: `${dbResponseTime}ms`
              },
              api: {
                status: 'running',
                port: config.server.port
              }
            }
          },
          meta: null,
          error: null,
          statusCode: 200
        };
        
        res.status(200).json(healthStatus);
      } catch (error) {
        res.status(503).json({
          data: null,
          meta: null,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service unavailable'
          },
          statusCode: 503
        });
      }
    });

    // API Routes
    this.app.use('/api/health', healthRoutes);       // Health check
    this.app.use('/api/auth', authRoutes);           // 1. Authentication & Authorization
    this.app.use('/api/patients', patientRoutes);    // Patient Management
    this.app.use('/api/medical', medicalRoutes);     // 1. EMR Web Application
    this.app.use('/api/ai', aiRoutes);               // 2. AI Risk Assessment
    this.app.use('/api/consent', consentRoutes);     // 3. Consent Engine
    this.app.use('/api/admin', adminRoutes);         // 1. Admin functions
    // Profile routes are now included in /api/auth
    this.app.use('/api/security', securityRoutes);   // Security Settings     // Profile management
    this.app.use('/api/external-requesters', externalRequestersRoutes); // External Requesters
    this.app.use('/api/email-test', emailTestRoutes); // Email Testing

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
      const port = config.server.port || 3001;
      
      this.app.listen(port, () => {
        console.log(`
🚀 EMR Backend Server Started Successfully!
📍 Port: ${port}
🌍 Environment: ${config.server.nodeEnv}
🔧 API Base URL: http://localhost:${port}/api

📋 Available Services:
  1. 🏥 EMR Web Application - /api/medical
  2. 🤖 AI Risk Assessment - /api/ai  
  3. 📝 Consent Engine - /api/consent
  4. 👤 Authentication - /api/auth
  5. ⚙️  Admin Panel - /api/admin
  6. 🌐 External Requesters - /api/external-requesters

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
