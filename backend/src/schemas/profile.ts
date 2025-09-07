/**
 * Comprehensive Profile Schema
 * รวมข้อมูลจากการสมัคร, setup profile และ profile management
 */

import { z } from 'zod';

// Enums และ patterns
const THAI_PHONE_REGEX = /^[0-9]{10}$/;
const THAI_NATIONAL_ID_REGEX = /^\d{13}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const Genders = ['male', 'female', 'other'] as const;
export const MaritalStatuses = ['single', 'married', 'divorced', 'widowed'] as const;
export const UserRoles = ['patient', 'doctor', 'nurse', 'admin', 'staff'] as const;

// Base validation helpers
export const ProfileFieldValidators = {
  // Basic Info
  email: z.string().email().regex(EMAIL_REGEX, 'รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().regex(THAI_PHONE_REGEX, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก').optional().nullable(),
  nationalId: z.string().regex(THAI_NATIONAL_ID_REGEX, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก').optional().nullable(),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล').max(100),
  thaiName: z.string().max(200).optional().nullable(),
  
  // Personal Info
  birthDate: z.string().optional().nullable(),
  gender: z.enum(Genders).optional().nullable(),
  bloodType: z.enum(BloodTypes).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  
  // Contact Info
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().regex(THAI_PHONE_REGEX, 'เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉินต้องเป็นตัวเลข 10 หลัก').optional().nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
  
  // Medical Info
  allergies: z.string().max(1000).optional().nullable(),
  drugAllergies: z.string().max(1000).optional().nullable(),
  foodAllergies: z.string().max(1000).optional().nullable(),
  environmentAllergies: z.string().max(1000).optional().nullable(),
  medicalHistory: z.string().max(2000).optional().nullable(),
  currentMedications: z.string().max(1000).optional().nullable(),
  chronicDiseases: z.string().max(1000).optional().nullable(),
  
  // Physical Info
  weight: z.number().min(0).max(1000).optional().nullable(),
  height: z.number().min(0).max(300).optional().nullable(),
  
  // Additional Info
  occupation: z.string().max(100).optional().nullable(),
  education: z.string().max(100).optional().nullable(),
  maritalStatus: z.enum(MaritalStatuses).optional().nullable(),
  religion: z.string().max(50).optional().nullable(),
  race: z.string().max(50).optional().nullable(),
  
  // Insurance Info
  insuranceType: z.string().max(50).optional().nullable(),
  insuranceNumber: z.string().max(50).optional().nullable(),
  insuranceExpiryDate: z.string().optional().nullable(),
  
  // System fields
  profileImage: z.string().max(255).optional().nullable(),
  role: z.enum(UserRoles).optional(),
  isActive: z.boolean().optional()
};

// Complete Profile Schema สำหรับการแสดงข้อมูล
export const CompleteProfileSchema = z.object({
  // User Basic Info
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: ProfileFieldValidators.email,
  firstName: ProfileFieldValidators.firstName,
  lastName: ProfileFieldValidators.lastName,
  phone: ProfileFieldValidators.phone,
  role: ProfileFieldValidators.role,
  
  // Personal Information
  thaiName: ProfileFieldValidators.thaiName,
  nationalId: ProfileFieldValidators.nationalId,
  birthDate: ProfileFieldValidators.birthDate,
  gender: ProfileFieldValidators.gender,
  bloodType: ProfileFieldValidators.bloodType,
  
  // Address Information
  address: ProfileFieldValidators.address,
  idCardAddress: z.string().max(500).optional().nullable(),
  currentAddress: z.string().max(500).optional().nullable(),
  
  // Contact Information
  emergencyContactName: ProfileFieldValidators.emergencyContactName,
  emergencyContactPhone: ProfileFieldValidators.emergencyContactPhone,
  emergencyContactRelation: ProfileFieldValidators.emergencyContactRelation,
  
  // Medical Information
  allergies: ProfileFieldValidators.allergies,
  drugAllergies: ProfileFieldValidators.drugAllergies,
  foodAllergies: ProfileFieldValidators.foodAllergies,
  environmentAllergies: ProfileFieldValidators.environmentAllergies,
  medicalHistory: ProfileFieldValidators.medicalHistory,
  currentMedications: ProfileFieldValidators.currentMedications,
  chronicDiseases: ProfileFieldValidators.chronicDiseases,
  
  // Physical Information
  weight: ProfileFieldValidators.weight,
  height: ProfileFieldValidators.height,
  
  // Additional Information
  occupation: ProfileFieldValidators.occupation,
  education: ProfileFieldValidators.education,
  maritalStatus: ProfileFieldValidators.maritalStatus,
  religion: ProfileFieldValidators.religion,
  race: ProfileFieldValidators.race,
  
  // Insurance Information
  insuranceType: ProfileFieldValidators.insuranceType,
  insuranceNumber: ProfileFieldValidators.insuranceNumber,
  insuranceExpiryDate: ProfileFieldValidators.insuranceExpiryDate,
  
  // System Information
  profileImage: ProfileFieldValidators.profileImage,
  isActive: ProfileFieldValidators.isActive,
  emailVerified: z.boolean().optional(),
  profileCompleted: z.boolean().optional(),
  
  // Timestamps
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastLogin: z.string().datetime().optional().nullable(),
  lastActivity: z.string().datetime().optional().nullable()
});

// Update Profile Schema สำหรับการอัปเดต
export const UpdateProfileSchema = z.object({
  // Basic Info (ที่สามารถแก้ไขได้)
  firstName: ProfileFieldValidators.firstName.optional(),
  lastName: ProfileFieldValidators.lastName.optional(),
  email: ProfileFieldValidators.email.optional(),
  phone: ProfileFieldValidators.phone,
  thaiName: ProfileFieldValidators.thaiName,
  
  // Personal Information
  nationalId: ProfileFieldValidators.nationalId,
  birthDate: ProfileFieldValidators.birthDate,
  gender: ProfileFieldValidators.gender,
  bloodType: ProfileFieldValidators.bloodType,
  
  // Address Information
  address: ProfileFieldValidators.address,
  idCardAddress: z.string().max(500).optional().nullable(),
  currentAddress: z.string().max(500).optional().nullable(),
  
  // Contact Information
  emergencyContactName: ProfileFieldValidators.emergencyContactName,
  emergencyContactPhone: ProfileFieldValidators.emergencyContactPhone,
  emergencyContactRelation: ProfileFieldValidators.emergencyContactRelation,
  
  // Medical Information
  allergies: ProfileFieldValidators.allergies,
  drugAllergies: ProfileFieldValidators.drugAllergies,
  foodAllergies: ProfileFieldValidators.foodAllergies,
  environmentAllergies: ProfileFieldValidators.environmentAllergies,
  medicalHistory: ProfileFieldValidators.medicalHistory,
  currentMedications: ProfileFieldValidators.currentMedications,
  chronicDiseases: ProfileFieldValidators.chronicDiseases,
  
  // Physical Information
  weight: ProfileFieldValidators.weight,
  height: ProfileFieldValidators.height,
  
  // Additional Information
  occupation: ProfileFieldValidators.occupation,
  education: ProfileFieldValidators.education,
  maritalStatus: ProfileFieldValidators.maritalStatus,
  religion: ProfileFieldValidators.religion,
  race: ProfileFieldValidators.race,
  
  // Insurance Information
  insuranceType: ProfileFieldValidators.insuranceType,
  insuranceNumber: ProfileFieldValidators.insuranceNumber,
  insuranceExpiryDate: ProfileFieldValidators.insuranceExpiryDate,
  
  // System fields
  profileImage: ProfileFieldValidators.profileImage,
  profileCompleted: z.boolean().optional()
});

// Transform functions for database operations
export const ProfileTransformers = {
  // Transform camelCase to snake_case for database
  toDatabase: (data: any) => ({
    // Basic Info
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    thai_name: data.thaiName,
    
    // Personal Info
    national_id: data.nationalId,
    birth_date: data.birthDate,
    gender: data.gender,
    blood_type: data.bloodType,
    
    // Address Info
    address: data.address,
    id_card_address: data.idCardAddress,
    current_address: data.currentAddress,
    
    // Contact Info
    emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone,
    emergency_contact_relation: data.emergencyContactRelation,
    
    // Medical Info
    allergies: data.allergies,
    drug_allergies: data.drugAllergies,
    food_allergies: data.foodAllergies,
    environment_allergies: data.environmentAllergies,
    medical_history: data.medicalHistory,
    current_medications: data.currentMedications,
    chronic_diseases: data.chronicDiseases,
    
    // Physical Info
    weight: data.weight,
    height: data.height,
    
    // Additional Info
    occupation: data.occupation,
    education: data.education,
    marital_status: data.maritalStatus,
    religion: data.religion,
    race: data.race,
    
    // Insurance Info
    insurance_type: data.insuranceType,
    insurance_number: data.insuranceNumber,
    insurance_expiry_date: data.insuranceExpiryDate,
    
    // System Info
    profile_image: data.profileImage,
    profile_completed: data.profileCompleted
  }),

  // Transform snake_case from database to camelCase
  fromDatabase: (data: any) => ({
    // Basic Info
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    thaiName: data.thai_name,
    role: data.role,
    
    // Personal Info
    nationalId: data.national_id,
    birthDate: data.birth_date,
    gender: data.gender,
    bloodType: data.blood_type,
    
    // Address Info
    address: data.address,
    idCardAddress: data.id_card_address,
    currentAddress: data.current_address,
    
    // Contact Info
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    emergencyContactRelation: data.emergency_contact_relation,
    
    // Medical Info
    allergies: data.allergies,
    drugAllergies: data.drug_allergies,
    foodAllergies: data.food_allergies,
    environmentAllergies: data.environment_allergies,
    medicalHistory: data.medical_history,
    currentMedications: data.current_medications,
    chronicDiseases: data.chronic_diseases,
    
    // Physical Info
    weight: data.weight,
    height: data.height,
    
    // Additional Info
    occupation: data.occupation,
    education: data.education,
    maritalStatus: data.marital_status,
    religion: data.religion,
    race: data.race,
    
    // Insurance Info
    insuranceType: data.insurance_type,
    insuranceNumber: data.insurance_number,
    insuranceExpiryDate: data.insurance_expiry_date,
    
    // System Info
    profileImage: data.profile_image,
    isActive: data.is_active,
    emailVerified: data.email_verified,
    profileCompleted: data.profile_completed,
    
    // Timestamps
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastLogin: data.last_login,
    lastActivity: data.last_activity,
    
    // Computed fields
    bmi: data.bmi,
    isProfileComplete: data.is_profile_complete
  })
};

// Type exports
export type CompleteProfile = z.infer<typeof CompleteProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type BloodType = typeof BloodTypes[number];
export type Gender = typeof Genders[number];
export type MaritalStatus = typeof MaritalStatuses[number];
export type UserRole = typeof UserRoles[number];
