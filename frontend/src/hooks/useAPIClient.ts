import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { 
  User, 
  MedicalPatient, 
  MedicalRecord, 
  RiskAssessmentRequest, 
  ConsentContractRequest 
} from '@/types/api';

// Query Keys
export const queryKeys = {
  // Auth
  profile: ['profile'],
  
  // Medical
  patients: ['patients'],
  patient: (id: string) => ['patient', id],
  patientRecords: (id: string) => ['patient', id, 'records'],
  
  // AI
  riskHistory: (patientId: string) => ['risk-history', patientId],
  riskDashboard: ['risk-dashboard'],
  
  // Consent
  consentContracts: ['consent-contracts'],
  consentDashboard: ['consent-dashboard'],
  
  // Admin
  users: ['users'],
  systemHealth: ['system-health'],
  auditLogs: ['audit-logs'],
} as const;

// Auth Hooks
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiClient.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Medical Hooks
export function usePatients(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...queryKeys.patients, params],
    queryFn: () => apiClient.getPatients(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => apiClient.getPatient(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePatientRecords(patientId: string) {
  return useQuery({
    queryKey: queryKeys.patientRecords(patientId),
    queryFn: () => apiClient.getPatientRecords(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<MedicalPatient, 'id' | 'created_at' | 'updated_at'>) => 
      apiClient.createPatient(data),
    onSuccess: () => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ patientId, data }: { 
      patientId: string; 
      data: Omit<MedicalRecord, 'id' | 'patientId' | 'created_at' | 'updated_at'> 
    }) => apiClient.createMedicalRecord(patientId, data),
    onSuccess: (_, { patientId }) => {
      // Invalidate patient records
      queryClient.invalidateQueries({ queryKey: queryKeys.patientRecords(patientId) });
    },
  });
}

// AI Risk Assessment Hooks
export function useRiskHistory(patientId: string) {
  return useQuery({
    queryKey: queryKeys.riskHistory(patientId),
    queryFn: () => apiClient.getRiskHistory(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRiskDashboard() {
  return useQuery({
    queryKey: queryKeys.riskDashboard,
    queryFn: () => apiClient.getRiskDashboard(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssessDiabetesRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RiskAssessmentRequest) => 
      apiClient.assessDiabetesRisk(data),
    onSuccess: (_, { patientId }) => {
      // Invalidate risk history
      queryClient.invalidateQueries({ queryKey: queryKeys.riskHistory(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.riskDashboard });
    },
  });
}

export function useAssessHypertensionRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RiskAssessmentRequest) => 
      apiClient.assessHypertensionRisk(data),
    onSuccess: (_, { patientId }) => {
      // Invalidate risk history
      queryClient.invalidateQueries({ queryKey: queryKeys.riskHistory(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.riskDashboard });
    },
  });
}

export function useAssessHeartDiseaseRisk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RiskAssessmentRequest) => 
      apiClient.assessHeartDiseaseRisk(data),
    onSuccess: (_, { patientId }) => {
      // Invalidate risk history
      queryClient.invalidateQueries({ queryKey: queryKeys.riskHistory(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.riskDashboard });
    },
  });
}

// Consent Engine Hooks
export function useConsentContracts(params?: { status?: string; patientId?: string }) {
  return useQuery({
    queryKey: [...queryKeys.consentContracts, params],
    queryFn: () => apiClient.getConsentContracts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useConsentDashboard() {
  return useQuery({
    queryKey: queryKeys.consentDashboard,
    queryFn: () => apiClient.getConsentDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateConsentContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ConsentContractRequest) => 
      apiClient.createConsentContract(data),
    onSuccess: () => {
      // Invalidate consent contracts
      queryClient.invalidateQueries({ queryKey: queryKeys.consentContracts });
      queryClient.invalidateQueries({ queryKey: queryKeys.consentDashboard });
    },
  });
}

export function useUpdateConsentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contractId, status, reason }: { 
      contractId: string; 
      status: string; 
      reason?: string 
    }) => apiClient.updateConsentStatus(contractId, status, reason),
    onSuccess: () => {
      // Invalidate consent contracts
      queryClient.invalidateQueries({ queryKey: queryKeys.consentContracts });
      queryClient.invalidateQueries({ queryKey: queryKeys.consentDashboard });
    },
  });
}

// Admin Hooks
export function useUsers(params?: { page?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: [...queryKeys.users, params],
    queryFn: () => apiClient.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.systemHealth,
    queryFn: () => apiClient.getSystemHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

export function useAuditLogs(params?: { page?: number; limit?: number; userId?: string; action?: string }) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs, params],
    queryFn: () => apiClient.getAuditLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<User, 'id' | 'created_at' | 'updated_at'>) => 
      apiClient.createUser(data),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      apiClient.updateUser(id, data),
    onSuccess: () => {
      // Invalidate users list and profile
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}
