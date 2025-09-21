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
  weight: z.union([
    z.number().min(0).max(1000),
    z.string().transform((val) => val === '' || val === null ? null : parseFloat(val)).pipe(z.number().min(0).max(1000))
  ]).optional().nullable(),
  height: z.union([
    z.number().min(0).max(300),
    z.string().transform((val) => val === '' || val === null ? null : parseFloat(val)).pipe(z.number().min(0).max(300))
  ]).optional().nullable(),
  
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
  hospitalNumber: z.string().optional().nullable(),
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
  thaiLastName: z.string().min(1).max(100).optional().nullable(),
  
  // Personal Information
  nationalId: ProfileFieldValidators.nationalId,
  birthDate: ProfileFieldValidators.birthDate,
  birthDay: z.number().min(1).max(31).optional().nullable(),
  birthMonth: z.number().min(1).max(12).optional().nullable(),
  birthYear: z.number().min(2400).max(2700).optional().nullable(), // พ.ศ.
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
  insuranceExpiryDay: z.number().min(1).max(31).optional().nullable(),
  insuranceExpiryMonth: z.number().min(1).max(12).optional().nullable(),
  insuranceExpiryYear: z.number().min(2400).max(2700).optional().nullable(), // พ.ศ.
  
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
    phone: data.phone && data.phone !== '' ? data.phone : null,
    thai_name: data.thaiName && data.thaiName !== '' ? data.thaiName : null,
    thai_last_name: data.thaiLastName && data.thaiLastName !== '' ? data.thaiLastName : null,
    
    // Personal Info
    national_id: data.nationalId && data.nationalId !== '' ? data.nationalId : null,
    birth_date: data.birthDate && data.birthDate !== '' ? data.birthDate : null,
    birth_day: data.birthDay && data.birthDay !== '' ? data.birthDay : null,
    birth_month: data.birthMonth && data.birthMonth !== '' ? data.birthMonth : null,
    birth_year: data.birthYear && data.birthYear !== '' ? data.birthYear : null,
    gender: data.gender && data.gender !== '' ? data.gender : null,
    blood_type: data.bloodType && data.bloodType !== '' ? data.bloodType : null,
    
    // Address Info
    address: data.address && data.address !== '' ? data.address : null,
    id_card_address: data.idCardAddress && data.idCardAddress !== '' ? data.idCardAddress : null,
    
    // Contact Info
    emergency_contact_name: data.emergencyContactName && data.emergencyContactName !== '' ? data.emergencyContactName : null,
    emergency_contact_phone: data.emergencyContactPhone && data.emergencyContactPhone !== '' ? data.emergencyContactPhone : null,
    emergency_contact_relation: data.emergencyContactRelation && data.emergencyContactRelation !== '' ? data.emergencyContactRelation : null,
    
    // Medical Info
    allergies: data.allergies && data.allergies !== '' ? data.allergies : null,
    drug_allergies: data.drugAllergies && data.drugAllergies !== '' ? data.drugAllergies : null,
    food_allergies: data.foodAllergies && data.foodAllergies !== '' ? data.foodAllergies : null,
    environment_allergies: data.environmentAllergies && data.environmentAllergies !== '' ? data.environmentAllergies : null,
    medical_history: data.medicalHistory && data.medicalHistory !== '' ? data.medicalHistory : null,
    current_medications: data.currentMedications && data.currentMedications !== '' ? data.currentMedications : null,
    chronic_diseases: data.chronicDiseases && data.chronicDiseases !== '' ? data.chronicDiseases : null,
    
    // Physical Info
    weight: data.weight && data.weight !== '' ? data.weight : null,
    height: data.height && data.height !== '' ? data.height : null,
    
    // Additional Info
    occupation: data.occupation && data.occupation !== '' ? data.occupation : null,
    education: data.education && data.education !== '' ? data.education : null,
    marital_status: data.maritalStatus && data.maritalStatus !== '' ? data.maritalStatus : null,
    religion: data.religion && data.religion !== '' ? data.religion : null,
    race: data.race && data.race !== '' ? data.race : null,
    
    // Insurance Info
    insurance_type: data.insuranceType && data.insuranceType !== '' ? data.insuranceType : null,
    insurance_number: data.insuranceNumber && data.insuranceNumber !== '' ? data.insuranceNumber : null,
    insurance_expiry_date: data.insuranceExpiryDate && data.insuranceExpiryDate !== '' ? data.insuranceExpiryDate : null,
    insurance_expiry_day: data.insuranceExpiryDay && data.insuranceExpiryDay !== '' ? data.insuranceExpiryDay : null,
    insurance_expiry_month: data.insuranceExpiryMonth && data.insuranceExpiryMonth !== '' ? data.insuranceExpiryMonth : null,
    insurance_expiry_year: data.insuranceExpiryYear && data.insuranceExpiryYear !== '' ? data.insuranceExpiryYear : null,
    
    // System Info
    profile_image: data.profileImage && data.profileImage !== '' ? data.profileImage : null,
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
    thaiLastName: data.thai_last_name,
    role: data.role,
    
    // Personal Info
    nationalId: data.national_id,
    hospitalNumber: data.hospital_number,
    birthDate: data.birth_date,
    birthDay: data.birth_day || (data.birth_date ? new Date(data.birth_date).getDate() : null),
    birthMonth: data.birth_month || (data.birth_date ? new Date(data.birth_date).getMonth() + 1 : null),
    birthYear: data.birth_year || (data.birth_date ? new Date(data.birth_date).getFullYear() + 543 : null), // Convert to Buddhist Era
    gender: data.gender,
    bloodType: data.blood_type,
    
    // Address Info
    address: data.address,
    idCardAddress: data.id_card_address,
    
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
    insuranceExpiryDay: data.insurance_expiry_day || (data.insurance_expiry_date ? new Date(data.insurance_expiry_date).getDate() : null),
    insuranceExpiryMonth: data.insurance_expiry_month || (data.insurance_expiry_date ? new Date(data.insurance_expiry_date).getMonth() + 1 : null),
    insuranceExpiryYear: data.insurance_expiry_year || (data.insurance_expiry_date ? new Date(data.insurance_expiry_date).getFullYear() + 543 : null), // Convert to Buddhist Era
    
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
