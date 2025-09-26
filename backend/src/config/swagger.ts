import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EMR System API',
      version: '1.0.0',
      description: 'Electronic Medical Records System API Documentation',
      contact: {
        name: 'EMR System Team',
        email: 'support@emrsystem.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.emrsystem.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['patient', 'doctor', 'nurse', 'admin', 'external_user'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'User active status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        Patient: {
          type: 'object',
          required: ['id', 'userId', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Patient unique identifier'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user ID'
            },
            firstName: {
              type: 'string',
              description: 'Patient first name'
            },
            lastName: {
              type: 'string',
              description: 'Patient last name'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Patient date of birth'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Patient gender'
            },
            phone: {
              type: 'string',
              description: 'Patient phone number'
            },
            address: {
              type: 'string',
              description: 'Patient address'
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' }
              }
            }
          }
        },
        MedicalRecord: {
          type: 'object',
          required: ['id', 'patientId', 'diagnosis', 'date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Medical record unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            diagnosis: {
              type: 'string',
              description: 'Medical diagnosis'
            },
            symptoms: {
              type: 'string',
              description: 'Patient symptoms'
            },
            treatment: {
              type: 'string',
              description: 'Treatment provided'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Record date'
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doctor ID'
            }
          }
        },
        LabResult: {
          type: 'object',
          required: ['id', 'patientId', 'Name', 'result', 'date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Lab result unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            Name: {
              type: 'string',
              description: 'Lab  name'
            },
            result: {
              type: 'string',
              description: ' result'
            },
            normalRange: {
              type: 'string',
              description: 'Normal range for the '
            },
            unit: {
              type: 'string',
              description: 'Result unit'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: ' date'
            },
            labTechnicianId: {
              type: 'string',
              format: 'uuid',
              description: 'Lab technician ID'
            }
          }
        },
        Appointment: {
          type: 'object',
          required: ['id', 'patientId', 'doctorId', 'date', 'time'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Appointment unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doctor ID'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Appointment date'
            },
            time: {
              type: 'string',
              format: 'time',
              description: 'Appointment time'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
              description: 'Appointment status'
            },
            notes: {
              type: 'string',
              description: 'Appointment notes'
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              description: 'Department ID'
            }
          }
        },
        Prescription: {
          type: 'object',
          required: ['id', 'patientId', 'doctorId', 'medications'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Prescription unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doctor ID'
            },
            medications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  instructions: { type: 'string' }
                }
              }
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Prescription date'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'dispensed', 'completed'],
              description: 'Prescription status'
            }
          }
        },
        Visit: {
          type: 'object',
          required: ['id', 'patientId', 'doctorId', 'visitType', 'date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Visit unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doctor ID'
            },
            visitType: {
              type: 'string',
              enum: ['consultation', 'follow_up', 'emergency', 'routine_checkup'],
              description: 'Type of visit'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Visit date'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
              description: 'Visit status'
            },
            chiefComplaint: {
              type: 'string',
              description: 'Chief complaint'
            },
            diagnosis: {
              type: 'string',
              description: 'Visit diagnosis'
            },
            treatment: {
              type: 'string',
              description: 'Treatment provided'
            },
            notes: {
              type: 'string',
              description: 'Visit notes'
            }
          }
        },
        VitalSigns: {
          type: 'object',
          required: ['id', 'visitId', 'date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Vital signs unique identifier'
            },
            visitId: {
              type: 'string',
              format: 'uuid',
              description: 'Visit ID'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Measurement date'
            },
            bloodPressure: {
              type: 'object',
              properties: {
                systolic: { type: 'number' },
                diastolic: { type: 'number' }
              }
            },
            heartRate: {
              type: 'number',
              description: 'Heart rate (bpm)'
            },
            temperature: {
              type: 'number',
              description: 'Body temperature (°C)'
            },
            respiratoryRate: {
              type: 'number',
              description: 'Respiratory rate (breaths/min)'
            },
            oxygenSaturation: {
              type: 'number',
              description: 'Oxygen saturation (%)'
            },
            weight: {
              type: 'number',
              description: 'Weight (kg)'
            },
            height: {
              type: 'number',
              description: 'Height (cm)'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error details'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      },
      {
        cookieAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EMR System API Documentation'
  }));
};

export default specs;
