import { apiClient } from '@/lib/api';

export interface DashboardStats {
  system_health: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    response_time: number;
    database: {
      status: string;
      response_time: number;
      version: string;
      current_time: string;
    };
  };
  statistics: {
    users: {
      total: number;
      active: number;
      patients: number;
      doctors: number;
      nurses: number;
    };
    patients: {
      total: number;
      active: number;
    };
    visits: {
      total: number;
      today: number;
      this_week: number;
    };
    appointments: {
      total: number;
      pending: number;
      confirmed: number;
    };
    lab_orders: {
      total: number;
      pending: number;
      completed: number;
    };
    prescriptions: {
      total: number;
      active: number;
      dispensed: number;
    };
  };
}

export interface DashboardResponse {
  data: DashboardStats;
  meta: {
    timestamp: string;
    checked_by: string;
  };
  error: null;
  statusCode: number;
}

export interface RecentActivity {
  activity_type: string;
  reference: string;
  user_name: string;
  timestamp: string;
}

export interface SystemStatsResponse {
  data: {
    period: {
      days: number;
      start_date: string;
      end_date: string;
    };
    trends: {
      user_growth: Array<{
        date: string;
        new_users: number;
        role: string;
      }>;
      visits: Array<{
        date: string;
        visits: number;
        visit_type: string;
      }>;
      appointments: Array<{
        date: string;
        appointments: number;
        status: string;
      }>;
      lab_orders: Array<{
        date: string;
        lab_orders: number;
        status: string;
      }>;
      prescriptions: Array<{
        date: string;
        prescriptions: number;
        status: string;
      }>;
    };
    department_statistics: Array<{
      department_name: string;
      staff_count: number;
      visit_count: number;
      appointment_count: number;
    }>;
    top_performers: {
      doctors: Array<{
        first_name: string;
        last_name: string;
        visit_count: number;
        appointment_count: number;
        avg_visit_duration_hours: number;
      }>;
    };
    recent_activity: RecentActivity[];
  };
  meta: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

export interface ApprovalStats {
  [role: string]: {
    total: number;
    pending: number;
    approved: number;
    unverified: number;
  };
}

export interface ApprovalStatsResponse {
  data: ApprovalStats;
  meta: {
    timestamp: string;
    generated_by: string;
  };
  error: null;
  statusCode: number;
}

class AdminDashboardService {
  private apiClient = apiClient;

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardResponse> {
    try {
      const response = await this.apiClient.get<DashboardResponse>('/admin/dashboard/stats');
      return response.data as DashboardResponse;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get system statistics with trends
   */
  async getSystemStats(period: number = 30): Promise<SystemStatsResponse> {
    try {
      const response = await this.apiClient.get<SystemStatsResponse>(`/admin/system/stats?period=${period}`);
      return response.data as SystemStatsResponse;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<DashboardResponse> {
    try {
      const response = await this.apiClient.get<DashboardResponse>('/admin/system/health');
      return response.data as DashboardResponse;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(): Promise<ApprovalStatsResponse> {
    try {
      const response = await this.apiClient.get<ApprovalStatsResponse>('/admin/approval-stats');
      return response as unknown as ApprovalStatsResponse;
    } catch (error) {
      console.error('Error fetching approval stats:', error);
      throw error;
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
