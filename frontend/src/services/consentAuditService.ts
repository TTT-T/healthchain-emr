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
    const response = await this.apiClient.get('/admin/consent-audit/summary');
    return response.data as ConsentAuditResponse;
  }

  async getViolationAlerts(limit: number = 10): Promise<{ success: boolean; data: ViolationAlert[] }> {
    const response = await this.apiClient.get(`/admin/consent-audit/violations?limit=${limit}`);
    return response.data as { success: boolean; data: ViolationAlert[] };
  }

  async getUsageByUserType(): Promise<{ success: boolean; data: UsageByUserType[] }> {
    const response = await this.apiClient.get('/admin/consent-audit/usage-by-type');
    return response.data as { success: boolean; data: UsageByUserType[] };
  }

  async getMonthlyTrends(period: number = 30): Promise<{ success: boolean; data: MonthlyTrend[] }> {
    const response = await this.apiClient.get(`/admin/consent-audit/monthly-trends?period=${period}`);
    return response.data as { success: boolean; data: MonthlyTrend[] };
  }

  async getAllAuditData(): Promise<ConsentAuditResponse> {
    const response = await this.apiClient.get('/admin/consent-audit/all');
    return response.data as ConsentAuditResponse;
  }
}

export const consentAuditService = new ConsentAuditService();
