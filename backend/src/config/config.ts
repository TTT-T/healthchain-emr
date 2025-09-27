import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface Config {
  // Server
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  
  // Database
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
    connectionTimeout: number;
    idleTimeout: number;
    autoCreateDatabase: boolean;
    autoCreateUser: boolean;
  };
  
  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  
  // Security
  security: {
    bcryptRounds: number;
    sessionSecret: string;
  };

  // Email
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };

  // App
  app: {
    frontendUrl: string;
  };
}

const config: Config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'emr_development',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    autoCreateDatabase: process.env.DB_AUTO_CREATE === 'true' || process.env.NODE_ENV === 'development',
    autoCreateUser: process.env.DB_AUTO_CREATE_USER === 'true' || process.env.NODE_ENV === 'development',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  
  // Security
  security: {
    bcryptRounds: 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production',
  },

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  },

  // App
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export default config;
