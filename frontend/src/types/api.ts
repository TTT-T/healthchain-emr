// API Types - ตรงตาม Backend

export interface APIResponse<T = any> {
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
    details?: any;
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
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  profileCompleted: boolean;
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
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  requiresProfileSetup?: boolean;
  redirectTo?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
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
  factors?: Record<string, any>;
}

export interface RiskAssessmentResponse {
  patientId: string;
  riskLevel: 'low' | 'moderate' | 'high';
  probability: number;
  factors: Array<{
    factor: string;
    value: any;
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
  createdAt: string;
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
  nationalId: string;
  thaiName: string;
  englishName?: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceNumber?: string;
  insuranceProvider?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  bloodType?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreatePatientRequest {
  nationalId: string;
  thaiName: string;
  englishName?: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceNumber?: string;
  insuranceProvider?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  bloodType?: string;
}

// Visit Types
export interface MedicalVisit {
  id: string;
  patient_id: string;
  visit_number: string;
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
  test_category: 'blood' | 'urine' | 'stool' | 'imaging' | 'other';
  test_name: string;
  test_code?: string;
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
  testCategory: 'blood' | 'urine' | 'stool' | 'imaging' | 'other';
  testName: string;
  testCode?: string;
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
  type: 'consultation' | 'follow-up' | 'procedure' | 'test' | 'vaccination' | 'checkup';
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
  details?: any;
}
