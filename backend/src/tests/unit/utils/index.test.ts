/**
 * Unit s for Utility Functions
 */

import {
  generateTokens,
  hashPassword,
  validatePassword,
  successResponse,
  errorResponse,
  generateRandomString,
  formatDate,
  sanitizeInput,
  validateEmail,
  validatePhoneNumber
} from '../../../utils/index';

describe('Utility Functions', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      // Arrange
      const userId = 'user-123';
      const userRole = 'patient';

      // Act
      const tokens = generateTokens(userId, userRole);

      // Assert
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.length).toBeGreaterThan(0);
      expect(tokens.refreshToken.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different users', () => {
      // Arrange
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const userRole = 'patient';

      // Act
      const tokens1 = generateTokens(userId1, userRole);
      const tokens2 = generateTokens(userId2, userRole);

      // Assert
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      // Arrange
      const password = 'password123';

      // Act
      const hashedPassword = await hashPassword(password);

      // Assert
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      // Arrange
      const password = 'password123';

      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      // Arrange
      const password = '';

      // Act
      const hashedPassword = await hashPassword(password);

      // Assert
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', async () => {
      // Arrange
      const password = 'StrongPassword123!';
      const hashedPassword = await hashPassword(password);

      // Act
      const isValid = await validatePassword(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      // Arrange
      const correctPassword = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(correctPassword);

      // Act
      const isValid = await validatePassword(wrongPassword, hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      // Arrange
      const password = '';
      const hashedPassword = await hashPassword('somepassword');

      // Act
      const isValid = await validatePassword(password, hashedPassword);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('successResponse', () => {
    it('should create success response with data', () => {
      // Arrange
      const data = { id: '123', name: '' };
      const message = 'Success message';

      // Act
      const response = successResponse(data, message);

      // Assert
      expect(response).toEqual({
        success: true,
        message,
        data,
        meta: null,
        error: null,
        statusCode: 200
      });
    });

    it('should create success response without data', () => {
      // Arrange
      const message = 'Success message';

      // Act
      const response = successResponse(null, message);

      // Assert
      expect(response).toEqual({
        success: true,
        message,
        data: null,
        meta: null,
        error: null,
        statusCode: 200
      });
    });

    it('should create success response with custom status code', () => {
      // Arrange
      const data = { id: '123' };
      const message = 'Created successfully';
      const statusCode = 201;

      // Act
      const response = successResponse(data, message, statusCode);

      // Assert
      expect(response.statusCode).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('should create error response with message', () => {
      // Arrange
      const message = 'Error message';
      const statusCode = 400;

      // Act
      const response = errorResponse(message, statusCode);

      // Assert
      expect(response).toEqual({
        success: false,
        message,
        data: null,
        meta: null,
        error: { message },
        statusCode
      });
    });

    it('should create error response with details', () => {
      // Arrange
      const message = 'Validation error';
      const details = { field: 'email', error: 'Invalid format' };
      const statusCode = 422;

      // Act
      const response = errorResponse(message, statusCode, details);

      // Assert
      expect(response).toEqual({
        success: false,
        message,
        data: null,
        meta: null,
        error: { message, details },
        statusCode
      });
    });

    it('should default to 500 status code', () => {
      // Arrange
      const message = 'Internal server error';

      // Act
      const response = errorResponse(message);

      // Assert
      expect(response.statusCode).toBe(500);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      // Arrange
      const length = 10;

      // Act
      const randomString = generateRandomString(length);

      // Assert
      expect(typeof randomString).toBe('string');
      expect(randomString.length).toBe(length);
    });

    it('should generate different strings on multiple calls', () => {
      // Arrange
      const length = 10;

      // Act
      const string1 = generateRandomString(length);
      const string2 = generateRandomString(length);

      // Assert
      expect(string1).not.toBe(string2);
    });

    it('should handle zero length', () => {
      // Arrange
      const length = 0;

      // Act
      const randomString = generateRandomString(length);

      // Assert
      expect(randomString).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Arrange
      const date = new Date('2024-01-15T10:30:00Z');

      // Act
      const formattedDate = formatDate(date);

      // Assert
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle current date', () => {
      // Arrange
      const date = new Date();

      // Act
      const formattedDate = formatDate(date);

      // Assert
      expect(formattedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      // Arrange
      const input = '<script>alert("xss")</script>Hello World';

      // Act
      const sanitized = sanitizeInput(input);

      // Assert
      expect(sanitized).toBe('Hello World');
    });

    it('should handle empty string', () => {
      // Arrange
      const input = '';

      // Act
      const sanitized = sanitizeInput(input);

      // Assert
      expect(sanitized).toBe('');
    });

    it('should handle null input', () => {
      // Arrange
      const input = null;

      // Act
      const sanitized = sanitizeInput(input);

      // Assert
      expect(sanitized).toBe('');
    });

    it('should handle undefined input', () => {
      // Arrange
      const input = undefined;

      // Act
      const sanitized = sanitizeInput(input);

      // Assert
      expect(sanitized).toBe('');
    });

    it('should preserve safe content', () => {
      // Arrange
      const input = 'Hello World 123 !@#$%^&*()';

      // Act
      const sanitized = sanitizeInput(input);

      // Assert
      expect(sanitized).toBe(input);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      // Arrange
      const validEmails = [
        '@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@.com'
      ];

      // Act & Assert
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      // Arrange
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        '@',
        '..@example.com',
        '@.com',
        '@example.',
        ''
      ];

      // Act & Assert
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number format', () => {
      // Arrange
      const validPhones = [
        '0812345678',
        '081-234-5678',
        '+66812345678',
        '02-123-4567',
        '02 123 4567'
      ];

      // Act & Assert
      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone number format', () => {
      // Arrange
      const invalidPhones = [
        '123',
        '08123456789', // Too long
        '081234567',   // Too short
        'abc1234567',
        '',
        '081-234-567-89' // Too many digits
      ];

      // Act & Assert
      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false);
      });
    });
  });
});
