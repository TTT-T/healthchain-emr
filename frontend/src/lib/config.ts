// Environment configuration
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// API endpoints
export const apiEndpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    profile: '/auth/profile',
  },
  
  // Medical
  medical: {
    patients: '/medical/patients',
    patient: (id: string) => `/medical/patients/${id}`,
    patientRecords: (id: string) => `/medical/patients/${id}/records`,
    appointments: '/medical/appointments',
    vitals: (id: string) => `/medical/patients/${id}/vitals`,
    labs: (id: string) => `/medical/patients/${id}/labs`,
    prescriptions: (id: string) => `/medical/patients/${id}/prescriptions`,
    insurance: '/medical/insurance/claims',
  },

  // Patient Portal APIs
  patientPortal: {
    records: (id: string) => `/patients/${id}/records`,
    labResults: (id: string) => `/patients/${id}/lab-results`,
    appointments: (id: string) => `/patients/${id}/appointments`,
    medications: (id: string) => `/patients/${id}/medications`,
    documents: (id: string) => `/patients/${id}/documents`,
    notifications: (id: string) => `/patients/${id}/notifications`,
    aiInsights: (id: string) => `/patients/${id}/ai-insights`,
    consentRequests: (id: string) => `/patients/${id}/consent-requests`,
  },
  
  // AI Risk Assessment
  ai: {
    diabetesRisk: '/ai/risk-assessment/diabetes',
    hypertensionRisk: '/ai/risk-assessment/hypertension',
    heartDiseaseRisk: '/ai/risk-assessment/heart-disease',
    riskHistory: (patientId: string) => `/ai/risk-assessment/history/${patientId}`,
    dashboard: '/ai/dashboard/risk-overview',
  },
  
  // Consent Engine
  consent: {
    contracts: '/consent/contracts',
    contractStatus: (id: string) => `/consent/contracts/${id}/status`,
    executeContract: (id: string) => `/consent/contracts/${id}/execute`,
    contractAudit: (id: string) => `/consent/contracts/${id}/audit`,
    dashboard: '/consent/dashboard',
  },
  
  // Admin
  admin: {
    users: '/admin/users',
    user: (id: string) => `/admin/users/${id}`,
    systemHealth: '/admin/system/health',
    auditLogs: '/admin/audit-logs',
  },
} as const;

// Storage keys
export const storageKeys = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user',
} as const;

// App routes
export const appRoutes = {
  home: '/',
  login: '/login',
  register: '/register',
  setupProfile: '/setup-profile',
  
  // Medical staff
  emr: '/emr',
  emrDashboard: '/emr/dashboard',
  patients: '/emr/patients',
  appointments: '/emr/appointments',
  
  // Patient
  patient: '/accounts/patient',
  patientRecords: '/accounts/patient/records',
  
  // External requesters
  external: '/external-requesters',
  externalLogin: '/external-requesters/login',
  
  // Admin
  admin: '/admin',
  adminUsers: '/admin/users',
  adminSystem: '/admin/system',
  
  // Error pages
  unauthorized: '/unauthorized',
  notFound: '/404',
} as const;
