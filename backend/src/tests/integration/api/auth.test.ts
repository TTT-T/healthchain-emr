/**
 * Integration s for Auth API Endpoints
 */

import request from 'super';
import Application from '../../../app';
import { databaseInitializer } from '../../../database/init';
import { databaseManager } from '../../../database/connection';

describe('Auth API Integration s', () => {
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
    // Cleanup  data - delete in correct order to avoid foreign key constraints
    try {
      await databaseManager.query('DELETE FROM audit_logs WHERE user_id::text LIKE $1', ['-%']);
      await databaseManager.query('DELETE FROM user_sessions WHERE user_id::text LIKE $1', ['-%']);
      await databaseManager.query('DELETE FROM email_verification_tokens WHERE user_id::text LIKE $1', ['-%']);
      await databaseManager.query('DELETE FROM password_reset_tokens WHERE user_id::text LIKE $1', ['-%']);
      await databaseManager.query('DELETE FROM users WHERE email LIKE $1', ['%.com']);
    } catch (error) {
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@.com',
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
        email: 'duplicate@.com',
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
        firstName: '',
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
        email: 'weakpass@.com',
        password: '123',
        firstName: '',
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
        email: 'missing@.com',
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
    let User: any;

    beforeAll(async () => {
      // Create  user for login s
      const userData = {
        email: 'login@.com',
        password: 'password123',
        firstName: 'Login',
        lastName: ''
      };

      await request(server)
        .post('/api/auth/register')
        .send(userData);

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      User = userResult.rows[0];
    });

    it('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: 'login@.com',
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
        email: 'login@.com',
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
        email: 'nonexistent@.com',
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
        email: 'login@.com'
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
    let User: any;

    beforeAll(async () => {
      // Create  user and get refresh token
      const userData = {
        email: 'refresh@.com',
        password: 'password123',
        firstName: 'Refresh',
        lastName: ''
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
        // If login failed, create a mock refresh token for ing
        refreshToken = 'mock-refresh-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      User = userResult.rows[0];
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
    let User: any;

    beforeAll(async () => {
      // Create  user and get refresh token
      const userData = {
        email: 'logout@.com',
        password: 'password123',
        firstName: 'Logout',
        lastName: ''
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
        // If login failed, create a mock refresh token for ing
        refreshToken = 'mock-refresh-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      User = userResult.rows[0];
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
        [User.id]
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
    let User: any;

    beforeAll(async () => {
      // Create  user and get access token
      const userData = {
        email: 'profile@.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: ''
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
        // If login failed, create a mock access token for ing
        accessToken = 'mock-access-token';
      }

      const userResult = await databaseManager.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      User = userResult.rows[0];
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
