import { apiClient } from '@/lib/api';

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
  validated_at?: string;
  validated_by?: string;
  is_compliant: boolean;
  compliance_notes?: string;
}

export interface ConsentRequestStats {
  totalRequests: number;
  pendingRequests: number;
  reviewingRequests: number;
  emergencyRequests: number;
}

class ConsentRequestsService {
  private apiClient = apiClient;

  /**
   * Get all consent requests
   */
  async getAllRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    urgency?: string;
    search?: string;
  }): Promise<ConsentRequest[]> {
    const response = await this.apiClient.get('/admin/consent-requests', {
      params
    });
    return (response.data as any as any).requests || [];
  }

  /**
   * Get consent request by ID
   */
  async getRequestById(id: string): Promise<ConsentRequest> {
    const response = await this.apiClient.get(`/admin/consent-requests/${id}`);
    return response.data as any as ConsentRequest;
  }

  /**
   * Get consent request statistics
   */
  async getRequestStats(): Promise<ConsentRequestStats> {
    const response = await this.apiClient.get('/admin/consent-requests/stats');
    return response.data as any;
  }

  /**
   * Approve consent request
   */
  async approveRequest(id: string, notes?: string): Promise<void> {
    await this.apiClient.post(`/admin/consent-requests/${id}/approve`, {
      notes
    });
  }

  /**
   * Reject consent request
   */
  async rejectRequest(id: string, reason: string): Promise<void> {
    await this.apiClient.post(`/admin/consent-requests/${id}/reject`, {
      reason
    });
  }

  /**
   * Update consent request status
   */
  async updateRequestStatus(id: string, status: string, notes?: string): Promise<void> {
    await this.apiClient.post(`/admin/consent-requests/${id}/status`, {
      status,
      notes
    });
  }

  /**
   * Export consent requests
   */
  async exportRequests(format: 'pdf' | 'excel' = 'pdf', filters?: any): Promise<Blob> {
    const response = await this.apiClient.get('/admin/consent-requests/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data as any;
  }
}

export const consentRequestsService = new ConsentRequestsService();
