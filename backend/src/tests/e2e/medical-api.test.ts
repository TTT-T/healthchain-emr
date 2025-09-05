/**
 * E2E Tests for Medical API
 * Tests the complete flow of medical API endpoints
 */

import request from 'supertest';
import Application from '../../app';
import { databaseInitializer } from '../../database/init';

describe('Medical API E2E Tests', () => {
  let app: Application;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    // Initialize database
    await databaseInitializer.initialize();
    
    // Create app instance
    app = new Application();
    server = app.app;
  });

  afterAll(async () => {
    // Cleanup - no need to close server as it's not started in tests
    // The app instance will be garbage collected
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        data: {
          status: 'ok',
          time: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
          services: {
            database: {
              status: 'connected',
              responseTime: expect.any(String)
            },
            api: {
              status: 'running',
              port: expect.any(Number)
            }
          }
        },
        meta: null,
        error: null,
        statusCode: 200
      });
    });
  });

  describe('Authentication', () => {
    it('should register a new user or login if exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'doctor'
      };

      // Try to register first
      let response = await request(server)
        .post('/api/auth/register')
        .send(userData);

      // If user already exists (409), try to login instead
      if (response.status === 409) {
        response = await request(server)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            password: userData.password
          });
      }

      expect([200, 201]).toContain(response.status);
      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }),
        meta: null,
        error: null,
        statusCode: expect.any(Number)
      });

      authToken = response.body.data.accessToken;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          user: expect.objectContaining({
            username: loginData.username
          }),
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        }),
        meta: null,
        error: null,
        statusCode: 200
      });
    });
  });

  describe('Patient Management', () => {
    let patientId: string;

    it('should create a new patient', async () => {
      // Ensure we have a valid auth token
      if (!authToken) {
        throw new Error('No auth token available for patient creation test');
      }
      // Generate unique hospital number to avoid duplicates
      const timestamp = Date.now();
      const patientData = {
        hospitalNumber: `HN${timestamp}`,
        firstName: 'John',
        lastName: 'Doe',
        thaiName: 'จอห์น โด',
        nationalId: '1234567890123',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '0812345678',
        email: `john.doe.${timestamp}@example.com`,
        address: '123 Main St, Bangkok',
        bloodType: 'O+',
        allergies: 'Penicillin'
      };

      const response = await request(server)
        .post('/api/medical/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patientData)
        .expect(201);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          hospitalNumber: patientData.hospitalNumber,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          gender: patientData.gender,
          phone: patientData.phone,
          email: patientData.email,
          address: patientData.address,
          id: expect.any(String)
        }),
        meta: null,
        error: null,
        statusCode: 201
      });

      patientId = response.body.data.id;
      console.log('Created patient ID:', patientId); // Debug log
    });

    it('should get patient by ID', async () => {
      // Ensure we have a valid patient ID
      if (!patientId) {
        throw new Error('No patient ID available for get patient test');
      }
      
      const response = await request(server)
        .get(`/api/medical/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          id: patientId,
          firstName: 'John',
          lastName: 'Doe'
        }),
        meta: null,
        error: null,
        statusCode: 200
      });
    });

    it('should get patients list with pagination', async () => {
      const response = await request(server)
        .get('/api/medical/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            hospitalNumber: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String)
          })
        ]),
        meta: expect.objectContaining({
          pagination: expect.objectContaining({
            page: 1,
            total: expect.any(Number),
            totalPages: expect.any(Number)
          })
        }),
        error: null,
        statusCode: 200
      });
    });

    it('should update patient', async () => {
      // Ensure we have a valid patient ID
      if (!patientId) {
        throw new Error('No patient ID available for update patient test');
      }
      
      const updateData = {
        phone: '0812345679',
        email: 'john.doe.updated@example.com'
      };

      const response = await request(server)
        .put(`/api/medical/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          id: patientId,
          phone: updateData.phone,
          email: updateData.email,
          updatedAt: expect.any(String)
        }),
        meta: null,
        error: null,
        statusCode: 200
      });
    });

    it('should delete patient', async () => {
      // Ensure we have a valid patient ID
      if (!patientId) {
        throw new Error('No patient ID available for delete patient test');
      }
      
      const response = await request(server)
        .delete(`/api/medical/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: { message: 'Patient deleted successfully' },
        meta: null,
        error: null,
        statusCode: 200
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent patient', async () => {
      const response = await request(server)
        .get('/api/medical/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        data: null,
        meta: null,
        error: {
          code: 'ERROR',
          message: 'ไม่พบข้อมูลผู้ป่วย'
        },
        statusCode: 404
      });
    });

    it('should return 400 for invalid patient data', async () => {
      const invalidData = {
        hospitalNumber: '', // Invalid: empty
        firstName: '', // Invalid: empty
        dateOfBirth: 'invalid-date' // Invalid: not a date
      };

      const response = await request(server)
        .post('/api/medical/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        data: null,
        meta: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.any(Array)
        },
        statusCode: 400
      });
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(server)
        .get('/api/medical/patients')
        .expect(401);

      expect(response.body).toMatchObject({
        data: null,
        meta: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required'
        },
        statusCode: 401
      });
    });
  });

  describe('CORS', () => {
    it('should handle preflight requests', async () => {
      const response = await request(server)
        .options('/api/medical/patients')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });
});
