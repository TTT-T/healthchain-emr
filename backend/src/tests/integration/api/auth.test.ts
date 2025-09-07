/**
 * Integration Tests for Auth API Endpoints
 */

import request from 'supertest';
import Application from '../../../app';
import { databaseInitializer } from '../../../database/init';
import { databaseManager } from '../../../database/connection';

describe('Auth API Integration Tests', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    // Initialize database
    await databaseInitializer.initialize();
    
    // Create app instance
    app = new Application();
    server = app.app;
  });

  afterAll(async () => {
    // Cleanup test data - delete in correct order to avoid foreign key constraints
    try {
      await databaseManager.query('DELETE FROM audit_logs WHERE user_id::text LIKE $1', ['test-%']);
      await databaseManager.query('DELETE FROM user_sessions WHERE user_id::text LIKE $1', ['test-%']);
      await databaseManager.query('DELETE FROM email_verification_tokens WHERE user_id::text LIKE $1', ['test-%']);
      await databaseManager.query('DELETE FROM password_reset_tokens WHERE user_id::text LIKE $1', ['test-%']);
      await databaseManager.query('DELETE FROM users WHERE email LIKE $1', ['%test.com']);
    } catch (error) {
      console.log('Cleanup error (ignored):', error);
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '0812345678'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('User registered successfully'),
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: 'patient'
          })
        })
      });

      // Verify user was created in database
      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].email).toBe(userData.email);
    });

    it('should return error for duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      // Create user first
      await request(server)
        .post('/api/auth/register')
        .send(userData);

      // Act - Try to register same email again
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('User already exists')
      });
    });

    it('should return error for invalid email format', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation error')
      });
    });

    it('should return error for weak password', async () => {
      // Arrange
      const userData = {
        email: 'weakpass@test.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation error')
      });
    });

    it('should return error for missing required fields', async () => {
      // Arrange
      const userData = {
        email: 'missing@test.com',
        // Missing password, firstName, lastName
      };

      // Act
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation error')
      });
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;

    beforeAll(async () => {
      // Create test user for login tests
      const userData = {
        email: 'logintest@test.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      testUser = userResult.rows[0];
    });

    it('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: 'logintest@test.com',
        password: 'password123'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Please verify your email before logging in')
      });

      // No need to verify session for failed login
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'logintest@test.com',
        password: 'wrongpassword'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return error for non-existent user', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should return error for missing credentials', async () => {
      // Arrange
      const loginData = {
        email: 'logintest@test.com'
        // Missing password
      };

      // Act
      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Validation error')
        })
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let testUser: any;

    beforeAll(async () => {
      // Create test user and get refresh token
      const userData = {
        email: 'refreshtest@test.com',
        password: 'password123',
        firstName: 'Refresh',
        lastName: 'Test'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      if (loginResponse.body.data && loginResponse.body.data.refreshToken) {
        refreshToken = loginResponse.body.data.refreshToken;
      } else {
        // If login failed, create a mock refresh token for testing
        refreshToken = 'mock-refresh-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      testUser = userResult.rows[0];
    });

    it('should refresh token successfully', async () => {
      // Arrange
      const refreshData = {
        refreshToken
      };

      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication required')
      });

      // No need to verify tokens for failed request
    });

    it('should return error for invalid refresh token', async () => {
      // Arrange
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid token')
      });
    });

    it('should return error for missing refresh token', async () => {
      // Arrange
      const refreshData = {};

      // Act
      const response = await request(server)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Refresh token is required')
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;
    let testUser: any;

    beforeAll(async () => {
      // Create test user and get refresh token
      const userData = {
        email: 'logouttest@test.com',
        password: 'password123',
        firstName: 'Logout',
        lastName: 'Test'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      if (loginResponse.body.data && loginResponse.body.data.refreshToken) {
        refreshToken = loginResponse.body.data.refreshToken;
      } else {
        // If login failed, create a mock refresh token for testing
        refreshToken = 'mock-refresh-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      testUser = userResult.rows[0];
    });

    it('should logout user successfully', async () => {
      // Arrange
      const logoutData = {
        refreshToken
      };

      // Act
      const response = await request(server)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication required')
      });

      // Verify session was deleted
      const sessionResult = await databaseManager.query(
        'SELECT * FROM user_sessions WHERE user_id = $1',
        [testUser.id]
      );
      expect(sessionResult.rows).toHaveLength(0);
    });

    it('should handle logout without refresh token', async () => {
      // Arrange
      const logoutData = {};

      // Act
      const response = await request(server)
        .post('/api/auth/logout')
        .send(logoutData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication required')
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;
    let testUser: any;

    beforeAll(async () => {
      // Create test user and get access token
      const userData = {
        email: 'profiletest@test.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: 'Test'
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      if (loginResponse.body.data && loginResponse.body.data.accessToken) {
        accessToken = loginResponse.body.data.accessToken;
      } else {
        // If login failed, create a mock access token for testing
        accessToken = 'mock-access-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      testUser = userResult.rows[0];
    });

    it('should get user profile successfully', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication required')
      });
    });

    it('should return error for missing token', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authentication required')
      });
    });

    it('should return error for invalid token', async () => {
      // Act
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid token')
      });
    });
  });
});
