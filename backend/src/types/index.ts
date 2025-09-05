// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  employee_id?: string;
  professional_license?: string;
  position?: string;
  department_id?: string;
  role: UserRole;
  phone?: string;
  emergency_contact?: string;
  is_active: boolean;
  is_verified: boolean;
  email_verified: boolean;
  profile_completed: boolean;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  last_activity?: Date;
  password_changed_at: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

// Patient Types
export interface Patient {
  id: string;
  hospital_number: string;
  
  // Personal Information
  first_name: string;
  last_name: string;
  thai_name?: string;
  date_of_birth: Date;
  gender: 'male' | 'female' | 'other';
  nationality?: string;
  religion?: string;
  
  // Identification
  national_id?: string;
  passport_number?: string;
  
  // Contact Information
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Medical Information
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  chronic_conditions?: string;
  
  // Insurance Information
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: Date;
  
  // System Fields
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  thai_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  nationality?: string;
  religion?: string;
  national_id?: string;
  passport_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  chronic_conditions?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
}

export interface UpdatePatientRequest {
  first_name?: string;
  last_name?: string;
  thai_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  religion?: string;
  national_id?: string;
  passport_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  current_medications?: string;
  chronic_conditions?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
}

export interface PatientSearchQuery {
  search?: string;
  hospital_number?: string;
  national_id?: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  page?: number;
  limit?: number;
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
  // Patient Representative Roles
  | 'patient_guardian'
  | 'legal_representative'
  | 'medical_attorney'
  // External Roles
  | 'external_user'
  | 'external_admin'
  // Patient Role
  | 'patient';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  role: UserRole;
  employee_id?: string;
  professional_license?: string;
  position?: string;
  department_id?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  thai_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department_id?: string;
  professional_license?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password_hash'>;
  tokens?: TokenPair;
  message?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface JWTPayload {
  sub: string; // user ID
  username: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

// Session Types
export interface SessionInfo {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
  is_active: boolean;
}

export interface CreateSessionRequest {
  user_id: string;
  access_token: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
}

// Authorization Types
export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: Permission[];
}

export interface AccessRequest {
  user_id: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

// Registration Types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  role: UserRole;
  terms_accepted: boolean;
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

// Audit Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: Date;
}

export interface CreateAuditLogRequest {
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

// Department Types
export interface Department {
  id: string;
  department_code: string;
  department_name: string;
  department_type: 'clinical' | 'diagnostic' | 'support';
  location?: string;
  phone?: string;
  operating_hours?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
  errors?: any;
  statusCode?: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    requestId: string;
    details?: Record<string, any>;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Express Request Extensions  
export interface AuthenticatedRequest {
  user?: Omit<User, 'password_hash'>;
  session?: SessionInfo;
  ip?: string;
  get?: (name: string) => string | undefined;
  headers?: any;
  body?: any;
  params?: any;
  query?: any;
}

// Validation Schemas
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Security Types
export interface SecurityEvent {
  type: 'failed_login' | 'account_locked' | 'password_changed' | 'suspicious_activity';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date;
}

// Email Types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// File Upload Types
export interface FileInfo {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  uploaded_by: string;
  created_at: Date;
}

export interface UploadFileRequest {
  file: any; // Will be typed properly when multer is configured
  category?: string;
  description?: string;
}

// Additional Auth types for API
export interface AuthRegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthLoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
