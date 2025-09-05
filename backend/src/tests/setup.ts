/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/emr_test';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-at-least-32-characters-long';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.EMAIL_FROM = 'test@example.com';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
// Commented out to allow console output for debugging
// global.console = {
//   ...console,
//   // Uncomment to suppress console.log in tests
//   // log: jest.fn(),
//   // debug: jest.fn(),
//   // info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
