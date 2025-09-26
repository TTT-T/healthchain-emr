import { apiClient } from '@/lib/api';

export interface ConsentStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeContracts: number;
  expiredContracts: number;
  dailyAccess: number;
  violationAlerts: number;
}

export interface ConsentRequest {
  id: string;
  request_id: string;
  requester_name: string;
  requester_type: 'hospital' | 'clinic' | 'insurance' | 'research' | 'government';
  patient_name: string;
  patient_hn: string;
  request_type: 'hospital_transfer' | 'insurance_claim' | 'research' | 'legal' | 'emergency';
  requested_data_types: string[];
  purpose: string;
  urgency_level: 'emergency' | 'urgent' | 'normal';
  status: 'pending' | 'sent_to_patient' | 'patient_reviewing' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  is_compliant: boolean;
  compliance_notes?: string;
}

export interface ConsentContract {
  id: string;
  contract_id: string;
  patient_name: string;
  patient_hn: string;
  requester_name: string;
  contract_type: string;
  allowed_data_types: string[];
  valid_from: string;
  valid_until: string;
  access_count: number;
  max_access_count?: number;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  last_accessed?: string;
}

export interface ComplianceAlert {
  id: string;
  type: 'violation' | 'warning' | 'info';
  title: string;
  description: string;
  contract_id?: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
  is_read: boolean;
  is_resolved: boolean;
}

export interface ConsentDashboardOverview {
  stats: ConsentStats;
  recentRequests: ConsentRequest[];
  activeContracts: ConsentContract[];
  complianceAlerts: ComplianceAlert[];
}

class ConsentDashboardService {
  private apiClient = apiClient;

  /**
   * Get consent dashboard statistics
   */
  async getStats(): Promise<ConsentStats> {
    const response = await this.apiClient.get('/admin/consent-dashboard/stats');
    return response.data as ConsentStats;
  }

  /**
   * Get recent consent requests
   */
  async getRecentRequests(limit: number = 5): Promise<ConsentRequest[]> {
    const response = await this.apiClient.get('/admin/consent-dashboard/recent-requests', {
      params: { limit }
    });
    return (response.data as any).requests;
  }

  /**
   * Get active consent contracts
   */
  async getActiveContracts(limit: number = 10): Promise<ConsentContract[]> {
    const response = await this.apiClient.get('/admin/consent-dashboard/active-contracts', {
      params: { limit }
    });
    return (response.data as any).contracts;
  }

  /**
   * Get compliance alerts
   */
  async getComplianceAlerts(limit: number = 10): Promise<ComplianceAlert[]> {
    const response = await this.apiClient.get('/admin/consent-dashboard/compliance-alerts', {
      params: { limit }
    });
    return (response.data as any).alerts;
  }

  /**
   * Get complete consent dashboard overview
   */
  async getOverview(): Promise<ConsentDashboardOverview> {
    const response = await this.apiClient.get('/admin/consent-dashboard/overview');
    return response.data as ConsentDashboardOverview;
  }

  /**
   * Mark compliance alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    await this.apiClient.post(`/admin/consent-dashboard/compliance-alerts/${alertId}/read`, {});
  }

  /**
   * Resolve compliance alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.apiClient.post(`/admin/consent-dashboard/compliance-alerts/${alertId}/resolve`, {});
  }

  /**
   * Export consent dashboard report
   */
  async exportReport(format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const response = await this.apiClient.get('/admin/consent-dashboard/export', {
      params: { format },
      responseType: 'blob'
    });
    return response.data as Blob;
  }
}

export const consentDashboardService = new ConsentDashboardService();
