/**
 * Unified Configuration Management
 * Centralized configuration with environment validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// =============================================================================
// 1. ENVIRONMENT VALIDATION SCHEMA
// =============================================================================

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database Configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().default('emr_development'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password'),
  DB_MAX_CONNECTIONS: z.string().transform(Number).default('20'),
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).default('10000'),
  DB_IDLE_TIMEOUT: z.string().transform(Number).default('30000'),
  DB_AUTO_CREATE: z.string().transform(val => val === 'true').default('true'),
  DB_AUTO_CREATE_USER: z.string().transform(val => val === 'true').default('true'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Email Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  
  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Application Configuration
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  
  // Redis Configuration (Optional)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // File Upload Configuration
  UPLOAD_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
});

// =============================================================================
// 2. VALIDATE ENVIRONMENT VARIABLES
// =============================================================================

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

// =============================================================================
// 3. CONFIGURATION OBJECT
// =============================================================================

export const config = {
  // Server Configuration
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  // Database Configuration
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.NODE_ENV === 'production',
    maxConnections: env.DB_MAX_CONNECTIONS,
    connectionTimeout: env.DB_CONNECTION_TIMEOUT,
    idleTimeout: env.DB_IDLE_TIMEOUT,
    autoCreateDatabase: env.DB_AUTO_CREATE,
    autoCreateUser: env.DB_AUTO_CREATE_USER,
  },
  
  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Email Configuration
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    },
    from: env.EMAIL_FROM,
  },
  
  // CORS Configuration
  cors: {
    origins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // Application Configuration
  app: {
    frontendUrl: env.FRONTEND_URL,
    name: 'EMR System',
    version: process.env.npm_package_version || '1.0.0',
  },
  
  // Redis Configuration
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  
  // File Upload Configuration
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()),
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // Logging Configuration
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },
};

// =============================================================================
// 4. CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate configuration on startup
 */
export const validateConfig = (): void => {
  console.log('🔧 Validating configuration...');
  
  // Check required configurations
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  
  // Check database configuration
  if (!config.database.host || !config.database.database) {
    throw new Error('Database configuration is incomplete');
  }
  
  // Check CORS configuration
  if (config.cors.origins.length === 0) {
    throw new Error('CORS origins must be specified');
  }
  
  console.log('✅ Configuration validation passed');
};

// =============================================================================
// 5. CONFIGURATION HELPERS
// =============================================================================

/**
 * Get database connection string
 */
export const getDatabaseUrl = (): string => {
  const { host, port, database, username, password } = config.database;
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
};

/**
 * Get Redis connection string
 */
export const getRedisUrl = (): string => {
  if (config.redis.url) {
    return config.redis.url;
  }
  
  const { host, port, password } = config.redis;
  if (password) {
    return `redis://:${password}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature: string): boolean => {
  const featureEnv = process.env[`FEATURE_${feature.toUpperCase()}`];
  return featureEnv === 'true' || (config.server.isDevelopment && featureEnv !== 'false');
};

/**
 * Get environment-specific configuration
 */
export const getEnvConfig = <T>(key: string, defaultValue: T): T => {
  return process.env[key] as T || defaultValue;
};

// =============================================================================
// 6. EXPORT DEFAULT
// =============================================================================

export default config;

// =============================================================================
// 7. CONFIGURATION SUMMARY
// =============================================================================

if (config.server.isDevelopment) {
  console.log('🔧 Configuration Summary:');
  console.log(`  - Environment: ${config.server.nodeEnv}`);
  console.log(`  - Port: ${config.server.port}`);
  console.log(`  - Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
  console.log(`  - CORS Origins: ${config.cors.origins.join(', ')}`);
  console.log(`  - Frontend URL: ${config.app.frontendUrl}`);
  console.log(`  - JWT Expires In: ${config.jwt.expiresIn}`);
  console.log(`  - Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs}ms`);
}