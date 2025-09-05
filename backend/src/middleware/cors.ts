import { CorsOptions } from 'cors';
import config from '../config/index';

/**
 * CORS configuration with dynamic origins
 */
export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development mode - allow all origins
    if (config.server.isDevelopment) {
      return callback(null, true);
    }
    
    // Production mode - check allowed origins from config
    const allowedOrigins = config.cors.origins;
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};
