/**
 * Contract Tests for API
 * Ensures API contracts match between frontend and backend
 */

import { z } from 'zod';
import { 
  PatientSchema, 
  CreatePatientRequestSchema, 
  UpdatePatientRequestSchema,
  PatientResponseSchema,
  PatientsResponseSchema,
  VisitSchema,
  CreateVisitRequestSchema,
  VisitResponseSchema,
  VisitsResponseSchema
} from '../../schemas/common';

describe('API Contract Tests', () => {
  describe('Patient API Contract', () => {
    const validPatient = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      hospitalNumber: 'HN001',
      firstName: 'John',
      lastName: 'Doe',
      thaiName: 'จอห์น โด',
      nationalId: '1234567890123',
      dateOfBirth: '1990-01-01',
      gender: 'male' as const,
      nationality: 'Thai',
      religion: 'Buddhist',
      phone: '0812345678',
      email: 'john.doe@example.com',
      address: '123 Main St, Bangkok',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '0812345679',
      emergencyContactRelation: 'Spouse',
      bloodType: 'O+' as const,
      allergies: 'Penicillin',
      medicalHistory: 'No significant medical history',
      currentMedications: 'None',
      insuranceType: 'Social Security',
      insuranceNumber: 'SS001',
      insuranceExpiryDate: '2025-12-31',
      isActive: true,
      createdAt: '2025-01-15T10:30:00.000Z',
      updatedAt: '2025-01-15T10:30:00.000Z',
      createdBy: '123e4567-e89b-12d3-a456-426614174001',
      updatedBy: '123e4567-e89b-12d3-a456-426614174001'
    };

    const validCreatePatientRequest = {
      hospitalNumber: 'HN001',
      firstName: 'John',
      lastName: 'Doe',
      thaiName: 'จอห์น โด',
      nationalId: '1234567890123',
      dateOfBirth: '1990-01-01',
      gender: 'male' as const,
      nationality: 'Thai',
      religion: 'Buddhist',
      phone: '0812345678',
      email: 'john.doe@example.com',
      address: '123 Main St, Bangkok',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '0812345679',
      emergencyContactRelation: 'Spouse',
      bloodType: 'O+' as const,
      allergies: 'Penicillin',
      medicalHistory: 'No significant medical history',
      currentMedications: 'None',
      insuranceType: 'Social Security',
      insuranceNumber: 'SS001',
      insuranceExpiryDate: '2025-12-31'
    };

    const validUpdatePatientRequest = {
      phone: '0812345679',
      email: 'john.doe.updated@example.com',
      address: '456 Updated St, Bangkok'
    };

    describe('Patient Schema Validation', () => {
      it('should validate valid patient data', () => {
        const result = PatientSchema.safeParse(validPatient);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validPatient);
        }
      });

      it('should reject invalid patient data', () => {
        const invalidPatient = {
          ...validPatient,
          gender: 'invalid' // Invalid gender
        };

        const result = PatientSchema.safeParse(invalidPatient);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['gender'],
              message: expect.stringContaining('Invalid enum value')
            })
          );
        }
      });

      it('should reject patient with missing required fields', () => {
        const incompletePatient = {
          hospitalNumber: 'HN001',
          // Missing firstName, lastName, dateOfBirth, gender
        };

        const result = PatientSchema.safeParse(incompletePatient);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errorPaths = result.error.errors.map(err => err.path);
          expect(errorPaths).toContainEqual(['firstName']);
          expect(errorPaths).toContainEqual(['lastName']);
          expect(errorPaths).toContainEqual(['dateOfBirth']);
          expect(errorPaths).toContainEqual(['gender']);
        }
      });
    });

    describe('Create Patient Request Schema Validation', () => {
      it('should validate valid create patient request', () => {
        const result = CreatePatientRequestSchema.safeParse(validCreatePatientRequest);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validCreatePatientRequest);
        }
      });

      it('should reject create request with invalid email', () => {
        const invalidRequest = {
          ...validCreatePatientRequest,
          email: 'invalid-email'
        };

        const result = CreatePatientRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['email'],
              message: expect.stringContaining('Invalid email')
            })
          );
        }
      });

      it('should reject create request with invalid national ID length', () => {
        const invalidRequest = {
          ...validCreatePatientRequest,
          nationalId: '123' // Too short
        };

        const result = CreatePatientRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['nationalId'],
              message: expect.stringContaining('String must contain exactly 13 character(s)')
            })
          );
        }
      });
    });

    describe('Update Patient Request Schema Validation', () => {
      it('should validate valid update patient request', () => {
        const result = UpdatePatientRequestSchema.safeParse(validUpdatePatientRequest);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validUpdatePatientRequest);
        }
      });

      it('should allow partial updates', () => {
        const partialUpdate = {
          phone: '0812345679'
        };

        const result = UpdatePatientRequestSchema.safeParse(partialUpdate);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(partialUpdate);
        }
      });

      it('should reject update with invalid data types', () => {
        const invalidUpdate = {
          phone: 123, // Should be string
          email: 'invalid-email'
        };

        const result = UpdatePatientRequestSchema.safeParse(invalidUpdate);
        expect(result.success).toBe(false);
        if (!result.success) {
          const errorPaths = result.error.errors.map(err => err.path);
          expect(errorPaths).toContainEqual(['phone']);
          expect(errorPaths).toContainEqual(['email']);
        }
      });
    });

    describe('API Response Schema Validation', () => {
      it('should validate patient response format', () => {
        const patientResponse = {
          data: validPatient,
          meta: null,
          error: null,
          statusCode: 200
        };

        const result = PatientResponseSchema.safeParse(patientResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(patientResponse);
        }
      });

      it('should validate patients list response format', () => {
        const patientsResponse = {
          data: [validPatient],
          meta: {
            pagination: {
              page: 1,
              pageSize: 20,
              total: 1,
              totalPages: 1
            }
          },
          error: null,
          statusCode: 200
        };

        const result = PatientsResponseSchema.safeParse(patientsResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(patientsResponse);
        }
      });

      it('should validate error response format', () => {
        const errorResponse = {
          data: null,
          meta: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [
              {
                field: 'email',
                message: 'Invalid email format',
                code: 'invalid_string'
              }
            ]
          },
          statusCode: 400
        };

        const result = PatientResponseSchema.safeParse(errorResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(errorResponse);
        }
      });
    });
  });

  describe('Visit API Contract', () => {
    const validVisit = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      patientId: '123e4567-e89b-12d3-a456-426614174001',
      visitNumber: 'V001',
      visitDate: '2025-01-15',
      visitTime: '10:30:00',
      visitType: 'walk_in' as const,
      chiefComplaint: 'Headache and fever',
      presentIllness: 'Patient reports headache and fever for 2 days',
      physicalExamination: 'Temperature 38.5°C, blood pressure normal',
      diagnosis: 'Viral infection',
      treatmentPlan: 'Rest and symptomatic treatment',
      doctorNotes: 'Patient should return if symptoms worsen',
      status: 'completed' as const,
      priority: 'normal' as const,
      attendingDoctorId: '123e4567-e89b-12d3-a456-426614174002',
      assignedNurseId: '123e4567-e89b-12d3-a456-426614174003',
      departmentId: '123e4567-e89b-12d3-a456-426614174004',
      followUpRequired: true,
      followUpDate: '2025-01-22',
      followUpNotes: 'Follow up in 1 week',
      createdAt: '2025-01-15T10:30:00.000Z',
      updatedAt: '2025-01-15T10:30:00.000Z',
      createdBy: '123e4567-e89b-12d3-a456-426614174002',
      updatedBy: '123e4567-e89b-12d3-a456-426614174002'
    };

    const validCreateVisitRequest = {
      patientId: '123e4567-e89b-12d3-a456-426614174001',
      visitNumber: 'V001',
      visitDate: '2025-01-15',
      visitTime: '10:30:00',
      visitType: 'walk_in' as const,
      chiefComplaint: 'Headache and fever',
      presentIllness: 'Patient reports headache and fever for 2 days',
      physicalExamination: 'Temperature 38.5°C, blood pressure normal',
      diagnosis: 'Viral infection',
      treatmentPlan: 'Rest and symptomatic treatment',
      doctorNotes: 'Patient should return if symptoms worsen',
      status: 'completed' as const,
      priority: 'normal' as const,
      attendingDoctorId: '123e4567-e89b-12d3-a456-426614174002',
      assignedNurseId: '123e4567-e89b-12d3-a456-426614174003',
      departmentId: '123e4567-e89b-12d3-a456-426614174004',
      followUpRequired: true,
      followUpDate: '2025-01-22',
      followUpNotes: 'Follow up in 1 week'
    };

    describe('Visit Schema Validation', () => {
      it('should validate valid visit data', () => {
        const result = VisitSchema.safeParse(validVisit);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validVisit);
        }
      });

      it('should reject visit with invalid visit type', () => {
        const invalidVisit = {
          ...validVisit,
          visitType: 'invalid_type'
        };

        const result = VisitSchema.safeParse(invalidVisit);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['visitType'],
              message: expect.stringContaining('Invalid enum value')
            })
          );
        }
      });

      it('should reject visit with invalid status', () => {
        const invalidVisit = {
          ...validVisit,
          status: 'invalid_status'
        };

        const result = VisitSchema.safeParse(invalidVisit);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['status'],
              message: expect.stringContaining('Invalid enum value')
            })
          );
        }
      });
    });

    describe('Create Visit Request Schema Validation', () => {
      it('should validate valid create visit request', () => {
        const result = CreateVisitRequestSchema.safeParse(validCreateVisitRequest);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validCreateVisitRequest);
        }
      });

      it('should reject create request with invalid date format', () => {
        const invalidRequest = {
          ...validCreateVisitRequest,
          visitDate: 'invalid-date'
        };

        const result = CreateVisitRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['visitDate'],
              message: expect.stringContaining('Invalid date')
            })
          );
        }
      });

      it('should reject create request with invalid time format', () => {
        const invalidRequest = {
          ...validCreateVisitRequest,
          visitTime: '25:00:00' // Invalid time
        };

        const result = CreateVisitRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toContainEqual(
            expect.objectContaining({
              path: ['visitTime'],
              message: expect.stringContaining('Invalid time')
            })
          );
        }
      });
    });

    describe('Visit Response Schema Validation', () => {
      it('should validate visit response format', () => {
        const visitResponse = {
          data: validVisit,
          meta: null,
          error: null,
          statusCode: 200
        };

        const result = VisitResponseSchema.safeParse(visitResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(visitResponse);
        }
      });

      it('should validate visits list response format', () => {
        const visitsResponse = {
          data: [validVisit],
          meta: {
            pagination: {
              page: 1,
              pageSize: 20,
              total: 1,
              totalPages: 1
            }
          },
          error: null,
          statusCode: 200
        };

        const result = VisitsResponseSchema.safeParse(visitsResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(visitsResponse);
        }
      });
    });
  });

  describe('Field Mapping Consistency', () => {
    it('should ensure consistent field naming between frontend and backend', () => {
      // Test that frontend camelCase fields map to backend snake_case fields
      const frontendFields = [
        'hospitalNumber',
        'firstName',
        'lastName',
        'thaiName',
        'nationalId',
        'dateOfBirth',
        'emergencyContactName',
        'emergencyContactPhone',
        'emergencyContactRelation',
        'bloodType',
        'medicalHistory',
        'currentMedications',
        'insuranceType',
        'insuranceNumber',
        'insuranceExpiryDate',
        'isActive',
        'createdAt',
        'updatedAt',
        'createdBy',
        'updatedBy'
      ];

      const backendFields = [
        'hospital_number',
        'first_name',
        'last_name',
        'thai_name',
        'national_id',
        'date_of_birth',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'blood_type',
        'medical_history',
        'current_medications',
        'insurance_type',
        'insurance_number',
        'insurance_expiry_date',
        'is_active',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by'
      ];

      // Verify that all frontend fields have corresponding backend fields
      frontendFields.forEach(frontendField => {
        const expectedBackendField = frontendField
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '');
        
        expect(backendFields).toContain(expectedBackendField);
      });
    });
  });
});
