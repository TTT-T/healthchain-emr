// API Types - ตรงตาม Backend

export interface APIResponse<T = unknown> {
  data: T | null;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  } | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  statusCode: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  thaiName?: string;
  title?: string;
  
  // Names (4 fields for Thai and English)
  thaiFirstName?: string;
  thaiLastName?: string;
  englishFirstName?: string;
  englishLastName?: string;
  employeeId?: string;
  professionalLicense?: string;
  position?: string;
  departmentId?: string;
  role: UserRole;
  phone?: string;
  emergencyContact?: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLogin?: Date;
  lastActivity?: Date;
  passwordChangedAt: Date;
  created_at: Date;
  updated_at: Date;
  createdBy?: string;
  profileCompleted: boolean;
  accessToken?: string; // For WebSocket authentication
}

export type UserRole = 
  // Internal Medical Staff
  | 'admin' 
  | 'doctor' 
  | 'nurse' 
  | 'pharmacist' 
  | 'lab_tech' 
  | 'staff'
  // Internal Consent Management
  | 'consent_admin'
  | 'compliance_officer'
  | 'data_protection_officer'
  | 'legal_advisor'
  // External Medical Authority
  | 'patient_guardian'
  | 'legal_representative'
  | 'medical_attorney'
  // External Requesters
  | 'external_user'
  | 'external_admin'
  // Patient
  | 'patient';

// Pagination Types
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  email?: string; // For external requesters
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  thaiFirstName?: string;
  thaiLastName?: string;
  title?: string;
  phoneNumber?: string;
  nationalId?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  idCardAddress?: string;
  bloodType?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  requiresProfileSetup?: boolean;
  redirectTo?: string;
  id?: string; // For external requester registration
  requestId?: string; // For external requester registration
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// External Requesters Types
export interface UserData {
  id: string;
  organizationName: string;
  organizationType?: string;
  lastLogin: string;
  created_at: string;
  email?: string;
  status?: string;
  dataAccessLevel?: string;
}

export interface ExternalRequesterProfile {
  organizationName: string;
  organizationType: string;
  registrationNumber: string;
  licenseNumber: string;
  taxId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: {
    streetAddress: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
  };
  allowedRequestTypes: string[];
  dataAccessLevel: string;
  maxConcurrentRequests: number;
  complianceCertifications: string[];
  dataProtectionCertification: string;
  status: string;
  isVerified: boolean;
  description?: string;
  website?: string;
  contactPerson?: string;
  position?: string;
  email?: string;
  phone?: string;
  // Additional properties for dashboard data
  lastLogin?: string;
  createdAt?: string;
}

export interface DashboardData {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  monthlyUsage: number;
  maxMonthlyUsage: number;
  activeConnections: number;
  dataTransferred: number;
  recentRequests?: RequestItem[];
}

export interface RequestItem {
  id: string;
  type: string;
  status: string;
  date: string;
  patientName?: string;
  description?: string;
  // Extended fields for request processing
  requestType?: string;
  patientId?: string;
  createdAt?: string;
  updatedAt?: string;
  purpose?: string;
}

export interface ReportData {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  monthlyData: MonthlyData[];
  requestTypes: RequestTypeData[];
}

export interface MonthlyData {
  month: string;
  requests: number;
  approved: number;
  rejected: number;
}

export interface RequestTypeData {
  type: string;
  count: number;
  percentage: number;
}

// Data Request Interfaces
export interface DataRequest {
  requesterName?: string;
  organizationName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  requestType?: string;
  dataTypes?: string[];
  purpose?: string;
  validUntil?: string;
  legalBasis?: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  doctorId: string;
}

// Medical Records Types
export interface Patient {
  id: string;
  hn: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  bloodType?: string;
  allergies?: string[];
  created_at: Date;
  updated_at: Date;
  // Add birth fields for age calculation
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  // Add other fields for EMR system
  thaiName?: string;
  nationalId?: string;
  queueNumber?: string;
  treatmentType?: string;
  assignedDoctor?: string;
  visitDate?: string;
  visitTime?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: Date;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// AI Risk Assessment Types
export interface RiskAssessmentRequest {
  patientId: string;
  factors?: Record<string, unknown>;
}

export interface RiskAssessmentResponse {
  patientId: string;
  riskLevel: 'low' | 'moderate' | 'high';
  probability: number;
  factors: Array<{
    factor: string;
    value: unknown;
    risk: 'low' | 'moderate' | 'high';
  }>;
  recommendations: string[];
  analysisDate: string;
}

// Consent Engine Types
export interface ConsentContract {
  contractId: string;
  patientId: string;
  requesterId: string;
  dataTypes: string[];
  purpose: string;
  duration: string;
  conditions: {
    accessLevel: string;
    timeRestrictions: string;
    purposeRestrictions: string[];
  };
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  created_at: string;
  expiresAt: string;
  smartContractRules: {
    autoExpire: boolean;
    autoRevoke: {
      onSuspiciousActivity: boolean;
      onDataBreach: boolean;
      onPolicyViolation: boolean;
    };
    auditLogging: boolean;
    encryptionRequired: boolean;
  };
}

export interface ConsentContractRequest {
  patientId: string;
  requesterId: string;
  dataTypes: string[];
  purpose: string;
  duration?: string;
  accessLevel?: string;
  timeRestrictions?: string;
  purposeRestrictions?: string[];
}

// =============================================================================
// MEDICAL RECORDS TYPES
// =============================================================================

// Patient Types
export interface MedicalPatient {
  id: string;
  hospitalNumber: string;
  hn: string; // Add missing hn property
  firstName: string;
  lastName: string;
  thaiName?: string; // Add missing thai_name property
  thai_name?: string; // Legacy field for backwards compatibility
  nationalId?: string; // Add missing national_id property
  national_id?: string; // Legacy field for backwards compatibility
  birthDate: string; // Also add birth_date alias
  birth_date?: string; // Legacy field for backwards compatibility
  dateOfBirth: string;
  // Add birth fields for age calculation
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  phone_number?: string; // Legacy field
  email?: string;
  address?: string;
  currentAddress?: string;
  current_address?: string; // Legacy field
  district?: string;
  province?: string;
  postalCode?: string;
  postal_code?: string; // Legacy field
  created_at: string;
  updated_at: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  emergency_contact_name?: string; // Legacy field
  emergency_contact_phone?: string; // Legacy field
  emergency_contact_relation?: string; // Legacy field
  
  // Medical Information
  bloodGroup?: string;
  blood_group?: string; // Legacy field
  bloodType?: string;
  blood_type?: string; // Legacy field
  weight?: number;
  height?: number;
  
  // Allergies
  drugAllergies?: string;
  drug_allergies?: string; // Legacy field
  foodAllergies?: string;
  food_allergies?: string; // Legacy field
  environmentAllergies?: string;
  environment_allergies?: string; // Legacy field
  allergies?: string[]; // Legacy field
  
  // Medical History
  chronicDiseases?: string;
  chronic_diseases?: string; // Legacy field
  medicalHistory?: string;
  medical_history?: string; // Legacy field
  currentMedications?: string;
  current_medications?: string; // Legacy field
  
  // Personal Information
  religion?: string;
  race?: string;
  occupation?: string;
  maritalStatus?: string;
  marital_status?: string; // Legacy field
  education?: string;
  
  // Additional missing properties
  englishName?: string;
  english_name?: string;
  chronicConditions?: string[];
  chronic_conditions?: string[];
}

export interface CreatePatientRequest {
  hospitalNumber: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  birthDate?: string; // Add missing birthDate alias
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  // Extended fields for Thai EMR system
  thaiName?: string;
  englishName?: string; // Add missing field
  nationalId?: string;
  nationality?: string;
  religion?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string;
  currentMedications?: string;
  insuranceType?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
}

// Visit Types
export interface MedicalVisit {
  id: string;
  patient_id: string;
  visitNumber: string;
  visit_date: string;
  visit_time: string;
  visit_type: 'walk_in' | 'appointment' | 'emergency' | 'follow_up' | 'referral';
  chief_complaint?: string;
  present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  doctor_notes?: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attending_doctor_id?: string;
  assigned_nurse_id?: string;
  department_id?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateVisitRequest {
  patientId: string;
  visitType?: 'walk_in' | 'appointment' | 'emergency' | 'follow_up' | 'referral';
  visitTime?: string; // ISO datetime string for visit start time
  chiefComplaint: string;
  presentIllness?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  attendingDoctorId?: string;
  assignedNurseId?: string;
  departmentId?: string;
}

// Vital Signs Types
export interface MedicalVitalSigns {
  id: string;
  visit_id: string;
  patient_id: string;
  weight?: number;
  height?: number;
  bmi?: number;
  waist_circumference?: number;
  hip_circumference?: number;
  waist_hip_ratio?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  body_temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  blood_sugar?: number;
  fasting_glucose?: number;
  pain_level?: number;
  general_condition?: string;
  notes?: string;
  measurement_time: string;
  measured_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVitalSignsRequest {
  visitId: string;
  patientId: string;
  weight?: number;
  height?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  bodyTemperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodSugar?: number;
  fastingGlucose?: number;
  painLevel?: number;
  generalCondition?: string;
  notes?: string;
  measurementTime?: string;
  measuredBy?: string;
}

// Lab Order Types
export interface MedicalLabOrder {
  id: string;
  patient_id: string;
  visit_id: string;
  order_number: string;
  _category: 'blood' | 'urine' | 'stool' | 'imaging' | 'other';
  _name: string;
  _code?: string;
  clinical_indication?: string;
  specimen_type?: string;
  collection_instructions?: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
  ordered_by?: string;
  ordered_date: string;
  collected_date?: string;
  result_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLabOrderRequest {
  patientId: string;
  visitId: string;
  Category: 'blood' | 'urine' | 'stool' | 'imaging' | 'other';
  Name: string;
  Code?: string;
  clinicalIndication?: string;
  specimenType?: string;
  collectionInstructions?: string;
  priority?: 'routine' | 'urgent' | 'stat';
  orderedBy?: string;
  notes?: string;
}

// Prescription Types
export interface MedicalPrescription {
  id: string;
  patient_id: string;
  visit_id: string;
  prescription_number: string;
  diagnosis_for_prescription?: string;
  prescriber_id?: string;
  status: 'pending' | 'dispensed' | 'completed' | 'cancelled';
  total_amount?: number;
  insurance_coverage?: number;
  patient_payment?: number;
  dispensed_by?: string;
  dispensed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  visitId: string;
  diagnosisForPrescription?: string;
  prescriberId?: string;
  medications: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
    unitPrice?: number;
  }[];
  notes?: string;
}

// Document Types
export interface MedicalDocument {
  id: string;
  title: string;
  category: 'lab-results' | 'prescriptions' | 'certificates' | 'imaging' | 'reports' | 'consent' | 'discharge' | 'insurance' | 'other';
  dateCreated: string;
  dateModified: string;
  size: number;
  format: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'expired';
  physician: {
    name: string;
    specialty: string;
    department: string;
  };
  description: string;
  url: string;
  patientId: string;
  visitId?: string;
}

export interface CreateDocumentRequest {
  title: string;
  category: string;
  patientId: string;
  visitId?: string;
  description?: string;
  physicianId?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  title: string;
  type: 'consultation' | 'follow-up' | 'procedure' | '' | 'vaccination' | 'checkup';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  date: string;
  time: string;
  duration: number;
  physician: {
    name: string;
    specialty: string;
    department: string;
  };
  location: {
    hospital: string;
    building: string;
    room: string;
    floor: string;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  preparations?: string[];
  reminderSent: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  patientId: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  title: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  physicianId?: string;
  notes?: string;
  preparations?: string[];
}

// Error Types
export interface APIError {
  message: string;
  code?: string;
  statusCode: number;
  details?: unknown;
}
