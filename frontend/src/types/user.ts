/**
 * Standardized User and Profile Types
 * Consistent with backend schema validation
 */

export interface User {
  id: string;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  
  // Names (4 fields for Thai and English)
  thaiFirstName?: string;
  thaiLastName?: string;
  englishFirstName?: string;
  englishLastName?: string;
  
  // Emergency Contact (structured)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Profile Fields
  nationalId?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  
  // System Fields
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  profileCompleted: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  lastLogin?: string;
}

export type UserRole = 
  | 'admin' 
  | 'doctor' 
  | 'nurse' 
  | 'pharmacist' 
  | 'lab_tech'
  | 'staff'
  | 'patient'
  | 'consent_admin'
  | 'compliance_officer'
  | 'data_protection_officer'
  | 'legal_advisor'
  | 'patient_guardian'
  | 'legal_representative'
  | 'medical_attorney'
  | 'external_user'
  | 'external_admin';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profile_completed?: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

// Validation helpers
export const validateUser = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
  },
  
  nationalId: (id: string): boolean => {
    const cleanId = id.replace(/[-\s]/g, '');
    return /^\d{13}$/.test(cleanId);
  },
  
  bloodType: (type: string): boolean => {
    const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validTypes.includes(type);
  }
};
