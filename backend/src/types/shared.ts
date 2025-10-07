/**
 * Shared Types between Frontend and Backend
 * These types should be kept in sync between both systems
 * Consider using a monorepo or npm package for true type sharing
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export type UUID = string;

export interface Timestamps {
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SoftDelete {
  deleted_at?: Date | string;
}

// =============================================================================
// USER TYPES
// =============================================================================

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
  // Patient Representative Roles
  | 'patient_guardian'
  | 'legal_representative'
  | 'medical_attorney'
  // External Roles
  | 'external_user'
  | 'external_admin'
  // Patient Role
  | 'patient';

export interface UserBase {
  id: UUID;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
}

// =============================================================================
// PATIENT TYPES
// =============================================================================

export type Gender = 'male' | 'female' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface PatientBase {
  id: UUID;
  hn: string; // Hospital Number (standard field name)
  patient_number?: string; // Legacy field
  first_name: string;
  last_name: string;
  thai_first_name?: string;
  thai_last_name?: string;
  date_of_birth: Date | string;
  gender: Gender;
  national_id?: string;
  phone?: string;
  email?: string;
  blood_type?: BloodType;
}

// =============================================================================
// VISIT TYPES
// =============================================================================

export type VisitType = 'walk_in' | 'appointment' | 'emergency' | 'follow_up' | 'referral';
export type VisitStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface VisitBase {
  id: UUID;
  patient_id: UUID;
  visit_number: string;
  visit_date: Date | string;
  visit_time: string;
  visit_type: VisitType;
  status: VisitStatus;
  priority: Priority;
  attending_doctor_id?: UUID;
  assigned_nurse_id?: UUID;
  department_id?: UUID;
}

// =============================================================================
// VITAL SIGNS TYPES
// =============================================================================

export interface VitalSignsBase {
  id: UUID;
  visit_id: UUID;
  patient_id: UUID;
  blood_pressure_systolic?: number; // Standard field name
  blood_pressure_diastolic?: number; // Standard field name
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  measurement_time: Date | string;
  measured_by: UUID;
}

// =============================================================================
// LAB TYPES
// =============================================================================

export type LabOrderStatus = 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
export type LabResultStatus = 'normal' | 'abnormal' | 'critical' | 'pending';
export type SpecimenType = 'blood' | 'urine' | 'stool' | 'sputum' | 'csf' | 'other';

export interface LabOrderBase {
  id: UUID;
  visit_id: UUID;
  patient_id: UUID;
  order_number: string;
  order_date: Date | string;
  test_type: string; // Standard field name (not _category)
  test_name: string; // Standard field name (not _name)
  test_code?: string; // Standard field name (not _code)
  status: LabOrderStatus;
  ordered_by: UUID;
}

export interface LabResultBase {
  id: UUID;
  lab_order_id: UUID;
  patient_id: UUID;
  visit_id: UUID;
  test_name: string; // Standard field name
  test_code?: string; // Standard field name
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  result_status: LabResultStatus;
  result_date: Date | string;
}

// =============================================================================
// PRESCRIPTION TYPES
// =============================================================================

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export type DosageForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'ointment' | 'drops' | 'inhaler' | 'other';

export interface PrescriptionBase {
  id: UUID;
  visit_id: UUID;
  patient_id: UUID;
  prescription_number: string;
  prescription_date: Date | string;
  status: PrescriptionStatus;
  prescribed_by: UUID;
}

export interface PrescriptionItemBase {
  id: UUID;
  prescription_id: UUID;
  medication_name: string;
  medication_code?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  unit?: string;
}

// =============================================================================
// APPOINTMENT TYPES
// =============================================================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface AppointmentBase {
  id: UUID;
  patient_id: UUID;
  doctor_id: UUID;
  department_id?: UUID;
  appointment_date: Date | string;
  appointment_time: string;
  duration_minutes?: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
}

// =============================================================================
// CONSENT TYPES
// =============================================================================

export type ConsentRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ConsentContractStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'suspended';
export type AccessLevel = 'read_only' | 'read_write' | 'full_access';

export interface ConsentRequestBase {
  id: UUID;
  patient_id: UUID;
  requester_id: UUID;
  request_type: string;
  purpose: string;
  data_types: string[];
  status: ConsentRequestStatus;
  requested_at: Date | string;
  expires_at?: Date | string;
}

export interface ConsentContractBase {
  id: UUID;
  contract_id: string;
  patient_id: UUID;
  requester_id: UUID;
  consent_request_id?: UUID;
  allowed_data_types: string[];
  purpose: string;
  access_level: AccessLevel;
  status: ConsentContractStatus;
  valid_from: Date | string;
  valid_until?: Date | string;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success' 
  | 'appointment' 
  | 'lab_result' 
  | 'prescription'
  | 'consent_request'
  | 'consent_response'
  | 'system';

export interface NotificationBase {
  id: UUID;
  user_id?: UUID;
  patient_id?: UUID;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: Date | string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginatedResponse<T> extends APIResponse<T> {
  meta?: {
    pagination?: PaginationMeta;
  };
}

// =============================================================================
// AUDIT TYPES
// =============================================================================

export interface AuditLogBase {
  id: UUID;
  user_id?: UUID;
  action: string;
  resource: string;
  resource_id?: UUID;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: Date | string;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isUUID(value: any): value is UUID {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isValidRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff',
    'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor',
    'patient_guardian', 'legal_representative', 'medical_attorney',
    'external_user', 'external_admin', 'patient'
  ];
  return validRoles.includes(role as UserRole);
}

// =============================================================================
// NAMING STANDARDS DOCUMENTATION
// =============================================================================

/**
 * NAMING STANDARDS:
 * 
 * 1. IDs: Always use UUID (string type)
 * 2. Timestamps: Use Date or string (ISO 8601)
 * 3. Snake_case: For database field names
 * 4. CamelCase: For TypeScript/JavaScript
 * 
 * STANDARD FIELD NAMES:
 * - hn (Hospital Number) - not hospital_number
 * - blood_pressure_systolic/diastolic - not systolic_bp/diastolic_bp
 * - test_type, test_name, test_code - not _category, _name, _code
 * 
 * FOREIGN KEY BEHAVIORS:
 * - CASCADE: Related data deleted with parent
 * - SET NULL: Preserve history/audit data
 */

