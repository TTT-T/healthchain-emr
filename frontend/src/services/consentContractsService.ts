import { apiClient } from '@/lib/api';

export interface ConsentContract {
  id: string;
  contract_id: string;
  patient_id: string;
  requester_id: string;
  allowed_data_types: string[];
  contract_type: string;
  valid_from: string;
  valid_until?: string;
  access_count: number;
  max_access_count?: number;
  status: string;
  last_accessed?: string;
  patient_name: string;
  patient_hn: string;
  requester_name: string;
}

export interface ConsentContractStats {
  totalContracts: number;
  activeContracts: number;
  expiredContracts: number;
  pendingContracts: number;
}

export interface ConsentContractResponse {
  success: boolean;
  data: {
    contracts: ConsentContract[];
  };
  meta?: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

export interface ConsentContractStatsResponse {
  success: boolean;
  data: ConsentContractStats;
  meta?: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

class ConsentContractsService {
  private baseUrl = '/admin';

  async getActiveContracts(limit: number = 10): Promise<ConsentContractResponse> {
    try {
      const response = await this.apiClient.get<ConsentContractResponse>(`${this.baseUrl}/consent-dashboard/active-contracts?limit=${limit}`);
      return response as unknown as ConsentContractResponse;
    } catch (error) {
      console.error('Error fetching active consent contracts:', error);
      throw error;
    }
  }

  async getAllContracts(): Promise<ConsentContractResponse> {
    try {
      const response = await this.apiClient.get<ConsentContractResponse>(`${this.baseUrl}/consent-contracts`);
      return response as unknown as ConsentContractResponse;
    } catch (error) {
      console.error('Error fetching all consent contracts:', error);
      throw error;
    }
  }

  async getContractStats(): Promise<ConsentContractStatsResponse> {
    try {
      const response = await this.apiClient.get<ConsentContractStatsResponse>(`${this.baseUrl}/consent-contracts/stats`);
      return response as unknown as ConsentContractStatsResponse;
    } catch (error) {
      console.error('Error fetching consent contract stats:', error);
      throw error;
    }
  }

  async getContractById(id: string): Promise<ConsentContractResponse> {
    try {
      const response = await this.apiClient.get<ConsentContractResponse>(`${this.baseUrl}/consent-contracts/${id}`);
      return response as unknown as ConsentContractResponse;
    } catch (error) {
      console.error('Error fetching consent contract by ID:', error);
      throw error;
    }
  }

  async updateContractStatus(id: string, status: string): Promise<ConsentContractResponse> {
    try {
      const response = await this.apiClient.post<ConsentContractResponse>(`${this.baseUrl}/consent-contracts/${id}/status`, { status });
      return response as unknown as ConsentContractResponse;
    } catch (error) {
      console.error('Error updating consent contract status:', error);
      throw error;
    }
  }

  private get apiClient() {
    return apiClient;
  }
}

export const consentContractsService = new ConsentContractsService();
