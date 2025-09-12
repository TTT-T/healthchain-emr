import { apiClient } from '@/lib/api';

export interface ConsentAuditSummary {
  totalConsentRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  emergencyAccess: number;
  violationAlerts: number;
  complianceRate: number;
  averageResponseTime: number;
  dataAccessCount: number;
  revokedConsents: number;
}

export interface ViolationAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  timestamp: string;
  involvedUser: string;
  patientId: string;
  action: string;
  resolved: boolean;
}

export interface UsageByUserType {
  type: string;
  label: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  requests: number;
  approved: number;
  rejected: number;
}

export interface ConsentAuditResponse {
  success: boolean;
  data: {
    summary: ConsentAuditSummary;
    violationAlerts: ViolationAlert[];
    usageByUserType: UsageByUserType[];
    monthlyTrends: MonthlyTrend[];
  };
}

export class ConsentAuditService {
  private apiClient = apiClient;

  async getAuditSummary(): Promise<ConsentAuditResponse> {
    return this.apiClient.get('/admin/consent-audit/summary');
  }

  async getViolationAlerts(limit: number = 10): Promise<{ success: boolean; data: ViolationAlert[] }> {
    return this.apiClient.get(`/admin/consent-audit/violations?limit=${limit}`);
  }

  async getUsageByUserType(): Promise<{ success: boolean; data: UsageByUserType[] }> {
    return this.apiClient.get('/admin/consent-audit/usage-by-type');
  }

  async getMonthlyTrends(period: number = 30): Promise<{ success: boolean; data: MonthlyTrend[] }> {
    return this.apiClient.get(`/admin/consent-audit/monthly-trends?period=${period}`);
  }

  async getAllAuditData(): Promise<ConsentAuditResponse> {
    return this.apiClient.get('/admin/consent-audit/all');
  }
}

export const consentAuditService = new ConsentAuditService();
