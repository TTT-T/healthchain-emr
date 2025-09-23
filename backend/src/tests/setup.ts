/**
 * Jest  Setup
 * Global  configuration and setup
 */

// Set  environment variables
process.env.NODE_ENV = '';
process.env.DATABASE_URL = 'postgresql://:@localhost:5432/emr_';
process.env.JWT_SECRET = '-secret-key-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = '-refresh-secret-key-that-is-at-least-32-characters-long';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = '@example.com';
process.env.SMTP_PASSWORD = '-password';
process.env.EMAIL_FROM = '@example.com';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Global  timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in s
// Commented out to allow console output for ging
// global.console = {
//   ...console,
//   // Uncomment to suppress console.log in s
//   // log: jest.fn(),
//   // : jest.fn(),
//   // info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
