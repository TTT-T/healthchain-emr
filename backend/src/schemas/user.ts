/**
 * Standardized User Schema Validation
 * Centralized Zod schemas for consistency
 */

import { z } from 'zod';

// Base validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THAI_PHONE_REGEX = /^[0-9]{10}$/;
const THAI_NATIONAL_ID_REGEX = /^\d{13}$/;

// Enums for consistent validation
export const UserRoles = [
  'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff',
  'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor',
  'patient_guardian', 'legal_representative', 'medical_attorney',
  'external_user', 'external_admin', 'patient'
] as const;

export const BloodTypes = ['A', 'B', 'AB', 'O'] as const;

// Title options for Thai and English
export const TitleOptions = [
  'นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง',
  'Mr.', 'Mrs.', 'Miss', 'Ms.'
] as const;
export const Genders = ['male', 'female', 'other'] as const;

// Reusable field validators
export const FieldValidators = {
  email: z.string().email().regex(EMAIL_REGEX, 'Invalid email format'),
  phone: z.string().regex(THAI_PHONE_REGEX, 'Phone must be 10 digits').optional(),
  nationalId: z.string().regex(THAI_NATIONAL_ID_REGEX, 'National ID must be 13 digits').optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  emergencyContactName: z.string().min(1).max(100).optional(),
  emergencyContactPhone: z.string().regex(THAI_PHONE_REGEX, 'Emergency contact phone must be 10 digits').optional(),
  emergencyContactRelation: z.string().min(1).max(50).optional(),
  bloodType: z.enum(BloodTypes).optional(),
  gender: z.enum(Genders).optional(),
  role: z.enum(UserRoles),
  
  // Thai language validators
  thaiText: z.string().max(500).optional(), // For Thai text fields
  thaiName: z.string().max(200).optional(), // For Thai names
  thaiTitle: z.string().max(50).optional(), // For Thai titles
  thaiAddress: z.string().max(1000).optional(), // For Thai addresses
  thaiOccupation: z.string().max(100).optional(), // For Thai occupations
  thaiEducation: z.string().max(100).optional(), // For Thai education
  thaiReligion: z.string().max(50).optional(), // For Thai religion
  thaiRace: z.string().max(50).optional(), // For Thai race
  thaiInsurance: z.string().max(50).optional(), // For Thai insurance types
  thaiMedical: z.string().max(2000).optional(), // For Thai medical information
  thaiMaritalStatus: z.string().max(20).optional(), // For Thai marital status
  thaiNationality: z.string().max(50).optional() // For Thai nationality
};

// User schemas
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: FieldValidators.email,
  password: z.string().min(8).max(128),
  firstName: FieldValidators.firstName,
  lastName: FieldValidators.lastName,
  thaiFirstName: FieldValidators.thaiName,
  thaiLastName: FieldValidators.thaiName,
  title: z.enum(TitleOptions).optional(),
  phoneNumber: FieldValidators.phone,
  role: FieldValidators.role.optional(),
  
  // Optional profile fields
  nationalId: FieldValidators.nationalId,
  birthDate: z.string().date().optional(),
  gender: FieldValidators.gender,
  address: FieldValidators.thaiAddress,
  idCardAddress: FieldValidators.thaiAddress,
  bloodType: FieldValidators.bloodType,
  
  // Emergency contact
  emergencyContactName: FieldValidators.thaiName,
  emergencyContactPhone: FieldValidators.emergencyContactPhone,
  emergencyContactRelation: FieldValidators.thaiText,
  
  // Additional Thai fields
  nationality: FieldValidators.thaiNationality,
  occupation: FieldValidators.thaiOccupation,
  education: FieldValidators.thaiEducation,
  maritalStatus: FieldValidators.thaiMaritalStatus,
  religion: FieldValidators.thaiReligion,
  race: FieldValidators.thaiRace,
  insuranceType: FieldValidators.thaiInsurance,
  allergies: FieldValidators.thaiMedical,
  drugAllergies: FieldValidators.thaiMedical,
  foodAllergies: FieldValidators.thaiMedical,
  environmentAllergies: FieldValidators.thaiMedical,
  medicalHistory: FieldValidators.thaiMedical,
  currentMedications: FieldValidators.thaiMedical,
  chronicDiseases: FieldValidators.thaiMedical
});

export const UpdateUserProfileSchema = z.object({
  firstName: FieldValidators.firstName.optional(),
  lastName: FieldValidators.lastName.optional(),
  email: FieldValidators.email.optional(),
  phoneNumber: FieldValidators.phone,
  
  // Emergency contact fields
  emergencyContactName: FieldValidators.emergencyContactName,
  emergencyContactPhone: FieldValidators.emergencyContactPhone,
  emergencyContactRelation: FieldValidators.emergencyContactRelation,
  
  // System field
  profile_completed: z.boolean().optional()
});

export const LoginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1)
}).refine((data) => data.email || data.username, {
  message: "Either email or username is required"
});

// Transform functions for camelCase <-> snake_case
export const TransformToDatabase = {
  userProfile: (data: any) => ({
    first_name: data.firstName,
    last_name: data.lastName,
    thai_name: data.thaiFirstName,
    thai_last_name: data.thaiLastName,
    title: data.title,
    email: data.email,
    phone: data.phoneNumber,
    emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone,
    emergency_contact_relation: data.emergencyContactRelation,
    profile_completed: data.profile_completed,
    national_id: data.nationalId,
    birth_date: data.birthDate,
    gender: data.gender,
    address: data.address,
    blood_type: data.bloodType
  })
};

export const TransformFromDatabase = {
  userProfile: (data: any) => ({
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    thaiFirstName: data.thai_name,
    thaiLastName: data.thai_last_name,
    title: data.title,
    phoneNumber: data.phone,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    emergencyContactRelation: data.emergency_contact_relation,
    profileCompleted: data.profile_completed,
    nationalId: data.national_id,
    birthDate: data.birth_date,
    gender: data.gender,
    address: data.address,
    bloodType: data.blood_type,
    role: data.role,
    isActive: data.is_active,
    emailVerified: data.email_verified,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  })
};

// Type exports
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type UserRole = typeof UserRoles[number];
export type BloodType = typeof BloodTypes[number];
export type Gender = typeof Genders[number];
