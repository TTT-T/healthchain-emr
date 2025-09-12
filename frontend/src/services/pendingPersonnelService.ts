import { apiClient } from '@/lib/api';

export interface PendingUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  professionalInfo: {
    licenseNumber?: string;
    specialization?: string;
    department?: string;
    position?: string;
  };
}

export interface PendingUsersResponse {
  data: {
    users: PendingUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  meta: {
    timestamp: string;
  };
  error: null;
  statusCode: number;
}

export interface ApprovalStatsResponse {
  data: {
    stats: {
      [role: string]: {
        total: number;
        pending: number;
        approved: number;
        unverified: number;
      };
    };
    summary: {
      totalPending: number;
      totalApproved: number;
      totalUnverified: number;
    };
  };
  meta: {
    timestamp: string;
  };
  error: null;
  statusCode: number;
}

export interface ApproveUserRequest {
  approvalNotes?: string;
}

export interface RejectUserRequest {
  rejectionReason: string;
}

class PendingPersonnelService {
  private apiClient = apiClient;

  /**
   * Get pending users for approval
   */
  async getPendingUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PendingUsersResponse> {
    try {
      const response = await this.apiClient.request<PendingUsersResponse>({
        method: 'GET',
        url: '/admin/pending-users',
        params
      });
      return response;
    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(): Promise<ApprovalStatsResponse> {
    try {
      const response = await this.apiClient.request<ApprovalStatsResponse>({
        method: 'GET',
        url: '/admin/approval-stats'
      });
      return response;
    } catch (error) {
      console.error('Error fetching approval stats:', error);
      throw error;
    }
  }

  /**
   * Approve a user
   */
  async approveUser(userId: string, data: ApproveUserRequest): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'POST',
        url: `/admin/pending-users/${userId}/approve`,
        data
      });
      return response;
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  }

  /**
   * Reject a user
   */
  async rejectUser(userId: string, data: RejectUserRequest): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'POST',
        url: `/admin/pending-users/${userId}/reject`,
        data
      });
      return response;
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  }
}

export const pendingPersonnelService = new PendingPersonnelService();
