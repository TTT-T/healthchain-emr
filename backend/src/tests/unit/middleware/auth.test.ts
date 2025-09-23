/**
 * Unit s for Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, optionalAuth } from '../../../middleware/auth';
import jwt from 'jsonwebtoken';
import { databaseManager } from '../../../database/connection';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../database/connection');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockDatabaseManager = databaseManager as jest.Mocked<typeof databaseManager>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token in Authorization header', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: '@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1'),
        ['user-123']
      );
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate user with valid token in cookies', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: '@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      };

      mockRequest.cookies = {
        access_token: 'valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for missing token', async () => {
      // Arrange
      mockRequest.headers = {};
      mockRequest.cookies = {};

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access token required')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid token')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for user not found', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [] 
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for inactive user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: '@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient',
        is_active: false
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Account is inactive')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      // Set up authenticated user
      mockRequest.user = {
        id: 'user-123',
        email: '@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      };
    });

    it('should authorize user with correct role', () => {
      // Arrange
      const allowedRoles = ['patient', 'doctor'];

      // Act
      authorize(allowedRoles)(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize user with admin role for admin-only endpoint', () => {
      // Arrange
      mockRequest.user!.role = 'admin';
      const allowedRoles = ['admin'];

      // Act
      authorize(allowedRoles)(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for insufficient permissions', () => {
      // Arrange
      const allowedRoles = ['admin', 'doctor'];

      // Act
      authorize(allowedRoles)(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Insufficient permissions')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for missing user', () => {
      // Arrange
      delete mockRequest.user;
      const allowedRoles = ['patient'];

      // Act
      authorize(allowedRoles)(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Authentication required')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: '@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication for missing token', async () => {
      // Arrange
      mockRequest.headers = {};
      mockRequest.cookies = {};

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication for invalid token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication for user not found', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [] 
      });

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
