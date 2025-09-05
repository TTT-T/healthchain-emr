/**
 * Unit Tests for Auth Controller
 */

import { Request, Response } from 'express';
import { register, login, refreshToken, logout } from '../../../controllers/authController';
import { databaseManager } from '../../../database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../database/connection');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockDatabaseManager = databaseManager as jest.Mocked<typeof databaseManager>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890'
      };

      mockRequest.body = userData;
      mockDatabaseManager.query.mockResolvedValueOnce({ rows: [] }); // User doesn't exist
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [{ id: 'user-123', ...userData }] 
      }); // User created
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM users WHERE email = $1'),
        [userData.email]
      );
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          expect.any(String), // id
          userData.email,
          'hashed-password',
          userData.firstName,
          userData.lastName,
          'patient' // default role
        ])
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('User registered successfully')
        })
      );
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockRequest.body = userData;
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [{ id: 'existing-user' }] 
      }); // User exists

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User already exists')
        })
      );
    });

    it('should return error for invalid email format', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      mockRequest.body = userData;

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid email format')
        })
      );
    });

    it('should return error for weak password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: '123', // Too short
        firstName: 'John',
        lastName: 'Doe'
      };

      mockRequest.body = userData;

      // Act
      await register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Password must be at least 8 characters')
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient',
        is_active: true
      };

      mockRequest.body = loginData;
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('access-token' as never);
      mockJwt.sign.mockReturnValue('refresh-token' as never);

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = $1'),
        [loginData.email]
      );
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password_hash
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Login successful'),
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: mockUser.id,
              email: mockUser.email,
              firstName: mockUser.first_name,
              lastName: mockUser.last_name,
              role: mockUser.role
            }),
            accessToken: 'access-token',
            refreshToken: 'refresh-token'
          })
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient',
        is_active: true
      };

      mockRequest.body = loginData;
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid credentials')
        })
      );
    });

    it('should return error for inactive user', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient',
        is_active: false
      };

      mockRequest.body = loginData;
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Account is inactive')
        })
      );
    });

    it('should return error for non-existent user', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockRequest.body = loginData;
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [] 
      });

      // Act
      await login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid credentials')
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'patient'
      };

      mockRequest.body = refreshData;
      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [mockUser] 
      });
      mockJwt.sign.mockReturnValue('new-access-token' as never);
      mockJwt.sign.mockReturnValue('new-refresh-token' as never);

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(
        refreshData.refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1'),
        ['user-123']
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Token refreshed successfully'),
          data: expect.objectContaining({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          })
        })
      );
    });

    it('should return error for invalid refresh token', async () => {
      // Arrange
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      mockRequest.body = refreshData;
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid refresh token')
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const logoutData = {
        refreshToken: 'valid-refresh-token'
      };

      mockRequest.body = logoutData;
      mockJwt.verify.mockReturnValue({ userId: 'user-123' } as never);
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [{ id: 'session-123' }] 
      }); // Session found
      mockDatabaseManager.query.mockResolvedValueOnce({ 
        rows: [] 
      }); // Session deleted

      // Act
      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockDatabaseManager.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_sessions'),
        expect.any(Array)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Logout successful')
        })
      );
    });

    it('should handle logout without refresh token', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Logout successful')
        })
      );
    });
  });
});
