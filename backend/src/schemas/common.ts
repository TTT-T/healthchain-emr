/**
 * Common Zod Schemas for API Validation
 * Shared schemas for request/response validation
 */

import { z } from 'zod';

// =============================================================================
// 1. COMMON SCHEMAS
// =============================================================================

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  total: z.number().min(0),
  totalPages: z.number().min(0),
});

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

export const MetaSchema = z.object({
  pagination: PaginationSchema.optional(),
});

export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    meta: MetaSchema.nullable(),
    error: ErrorSchema.nullable(),
    statusCode: z.number(),
  });

// =============================================================================
// 2. PATIENT SCHEMAS
// =============================================================================

export const PatientSchema = z.object({
  id: z.string().uuid(),
  hospitalNumber: z.string().min(1).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  thaiName: z.string().max(200).optional(),
  nationalId: z.string().length(13).optional(),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().max(50).default('Thai'),
  religion: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().max(1000).optional(),
  medicalHistory: z.string().max(2000).optional(),
  currentMedications: z.string().max(1000).optional(),
  insuranceType: z.string().max(50).optional(),
  insuranceNumber: z.string().max(50).optional(),
  insuranceExpiryDate: z.string().date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
});

export const CreatePatientRequestSchema = z.object({
  hospitalNumber: z.string().min(1).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  thaiName: z.string().max(200).optional(),
  nationalId: z.string().length(13).optional(),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().max(50).default('Thai'),
  religion: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.string().max(1000).optional(),
  medicalHistory: z.string().max(2000).optional(),
  currentMedications: z.string().max(1000).optional(),
  insuranceType: z.string().max(50).optional(),
  insuranceNumber: z.string().max(50).optional(),
  insuranceExpiryDate: z.string().date().optional(),
});

export const UpdatePatientRequestSchema = CreatePatientRequestSchema.partial();

export const PatientResponseSchema = APIResponseSchema(PatientSchema);
export const PatientsResponseSchema = APIResponseSchema(z.array(PatientSchema));

// =============================================================================
// 3. VISIT SCHEMAS
// =============================================================================

export const VisitSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  visitNumber: z.string().min(1).max(20),
  visitDate: z.string().date(),
  visitTime: z.string().time(),
  visitType: z.enum(['walk_in', 'appointment', 'emergency', 'follow_up', 'referral']).default('walk_in'),
  chiefComplaint: z.string().max(1000).optional(),
  presentIllness: z.string().max(2000).optional(),
  physicalExamination: z.string().max(2000).optional(),
  diagnosis: z.string().max(1000).optional(),
  treatmentPlan: z.string().max(2000).optional(),
  doctorNotes: z.string().max(2000).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).default('in_progress'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  attendingDoctorId: z.string().uuid().optional(),
  assignedNurseId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().date().optional(),
  followUpNotes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
});

export const CreateVisitRequestSchema = z.object({
  patientId: z.string().uuid(),
  visitNumber: z.string().min(1).max(20),
  visitDate: z.string().date(),
  visitTime: z.string().time(),
  visitType: z.enum(['walk_in', 'appointment', 'emergency', 'follow_up', 'referral']).default('walk_in'),
  chiefComplaint: z.string().max(1000).optional(),
  presentIllness: z.string().max(2000).optional(),
  physicalExamination: z.string().max(2000).optional(),
  diagnosis: z.string().max(1000).optional(),
  treatmentPlan: z.string().max(2000).optional(),
  doctorNotes: z.string().max(2000).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).default('in_progress'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  attendingDoctorId: z.string().uuid().optional(),
  assignedNurseId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().date().optional(),
  followUpNotes: z.string().max(1000).optional(),
});

export const UpdateVisitRequestSchema = CreateVisitRequestSchema.partial();

export const VisitResponseSchema = APIResponseSchema(VisitSchema);
export const VisitsResponseSchema = APIResponseSchema(z.array(VisitSchema));

// =============================================================================
// 4. QUERY SCHEMAS
// =============================================================================

export const PatientQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  search: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  isActive: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sortBy: z.enum(['firstName', 'lastName', 'hospitalNumber', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const VisitQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  patientId: z.string().uuid().optional(),
  visitType: z.enum(['walk_in', 'appointment', 'emergency', 'follow_up', 'referral']).optional(),
  status: z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  sortBy: z.enum(['visitDate', 'visitTime', 'createdAt']).default('visitDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// 5. TYPE EXPORTS
// =============================================================================

export type Patient = z.infer<typeof PatientSchema>;
export type CreatePatientRequest = z.infer<typeof CreatePatientRequestSchema>;
export type UpdatePatientRequest = z.infer<typeof UpdatePatientRequestSchema>;
export type PatientResponse = z.infer<typeof PatientResponseSchema>;
export type PatientsResponse = z.infer<typeof PatientsResponseSchema>;

export type Visit = z.infer<typeof VisitSchema>;
export type CreateVisitRequest = z.infer<typeof CreateVisitRequestSchema>;
export type UpdateVisitRequest = z.infer<typeof UpdateVisitRequestSchema>;
export type VisitResponse = z.infer<typeof VisitResponseSchema>;
export type VisitsResponse = z.infer<typeof VisitsResponseSchema>;

export type PatientQuery = z.infer<typeof PatientQuerySchema>;
export type VisitQuery = z.infer<typeof VisitQuerySchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type Error = z.infer<typeof ErrorSchema>;
export type Meta = z.infer<typeof MetaSchema>;
