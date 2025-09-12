import { apiClient } from '@/lib/api';

export interface ComplianceReport {
  id: string;
  title: string;
  type: 'audit' | 'assessment' | 'review';
  status: 'completed' | 'in_progress' | 'scheduled';
  date: string;
  score: number;
  findings: number;
  recommendations: number;
  created_by: string;
  updated_at: string;
}

export interface ComplianceTrend {
  period: string;
  compliance_score: number;
  total_alerts: number;
  resolved_alerts: number;
  new_alerts: number;
  resolution_rate: number;
}

export interface ComplianceStats {
  totalAlerts: number;
  highPriorityAlerts: number;
  mediumPriorityAlerts: number;
  lowPriorityAlerts: number;
  resolvedAlerts: number;
  pendingAlerts: number;
  complianceScore: number;
  lastAuditDate: string;
  trends: {
    scoreChange: number;
    alertChange: number;
    resolutionRate: number;
  };
}

export interface ComplianceReportsResponse {
  success: boolean;
  data: {
    reports: ComplianceReport[];
  };
  meta?: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

export interface ComplianceTrendsResponse {
  success: boolean;
  data: {
    trends: ComplianceTrend[];
  };
  meta?: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

export interface ComplianceStatsResponse {
  success: boolean;
  data: ComplianceStats;
  meta?: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

class ComplianceService {
  private baseUrl = '/admin';

  async getComplianceReports(): Promise<ComplianceReportsResponse> {
    try {
      const response = await this.apiClient.request<ComplianceReportsResponse>({
        method: 'GET',
        url: `${this.baseUrl}/compliance/reports`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching compliance reports:', error);
      throw error;
    }
  }

  async getComplianceTrends(period: number = 30): Promise<ComplianceTrendsResponse> {
    try {
      const response = await this.apiClient.request<ComplianceTrendsResponse>({
        method: 'GET',
        url: `${this.baseUrl}/compliance/trends`,
        params: { period },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching compliance trends:', error);
      throw error;
    }
  }

  async getComplianceStats(): Promise<ComplianceStatsResponse> {
    try {
      const response = await this.apiClient.request<ComplianceStatsResponse>({
        method: 'GET',
        url: `${this.baseUrl}/compliance/stats`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
      throw error;
    }
  }

  async createComplianceReport(reportData: Partial<ComplianceReport>): Promise<ComplianceReportsResponse> {
    try {
      const response = await this.apiClient.request<ComplianceReportsResponse>({
        method: 'POST',
        url: `${this.baseUrl}/compliance/reports`,
        data: reportData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error creating compliance report:', error);
      throw error;
    }
  }

  async updateComplianceReport(id: string, reportData: Partial<ComplianceReport>): Promise<ComplianceReportsResponse> {
    try {
      const response = await this.apiClient.request<ComplianceReportsResponse>({
        method: 'PUT',
        url: `${this.baseUrl}/compliance/reports/${id}`,
        data: reportData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error updating compliance report:', error);
      throw error;
    }
  }

  private get apiClient() {
    return apiClient;
  }
}

export const complianceService = new ComplianceService();
