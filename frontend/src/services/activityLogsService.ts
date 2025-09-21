import { apiClient } from '@/lib/api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  user_role: string;
  action: string;
  module: string;
  details: string;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
  error_message?: string;
  execution_time_ms?: number;
  request_id?: string;
}

export interface ActivityLogDetails extends ActivityLog {
  oldValues?: any;
  newValues?: any;
  userAgent?: string;
}

export interface ActivityLogsFilters {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  status?: string;
  user?: string;
  dateRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityLogsResponse {
  data: {
    logs: ActivityLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      modules: string[];
      users: string[];
    };
    statistics: {
      totalActivities: number;
      successRate: number;
      warnings: number;
      errors: number;
    };
  };
  meta: {
    timestamp: string;
    queryTime: number;
  };
  error: null;
}

export interface ActivityLogDetailsResponse {
  data: {
    log: ActivityLogDetails;
  };
  meta: {
    timestamp: string;
  };
  error: null;
}

export interface ExportActivityLogsResponse {
  data: {
    logs: ActivityLog[];
    exportedAt: string;
    totalRecords: number;
  };
  meta: {
    timestamp: string;
  };
  error: null;
}

export class ActivityLogsService {
  /**
   * Get activity logs with filtering and pagination
   */
  static async getActivityLogs(filters: ActivityLogsFilters = {}): Promise<ActivityLogsResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.module) params.append('module', filters.module);
    if (filters.status) params.append('status', filters.status);
    if (filters.user) params.append('user', filters.user);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get(`/admin/activity-logs?${params.toString()}`);
    return response as unknown as ActivityLogsResponse;
  }

  /**
   * Get activity log details by ID
   */
  static async getActivityLogDetails(id: string): Promise<ActivityLogDetailsResponse> {
    const response = await apiClient.get(`/admin/activity-logs/${id}`);
    return response as unknown as ActivityLogDetailsResponse;
  }

  /**
   * Export activity logs
   */
  static async exportActivityLogs(
    filters: Omit<ActivityLogsFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'> & { format?: 'csv' | 'json' } = {}
  ): Promise<ExportActivityLogsResponse | Blob> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.module) params.append('module', filters.module);
    if (filters.status) params.append('status', filters.status);
    if (filters.user) params.append('user', filters.user);
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.format) params.append('format', filters.format);

    const response = await apiClient.get(`/admin/activity-logs/export?${params.toString()}`, {
      responseType: filters.format === 'csv' ? 'blob' : 'json'
    });

    return response as unknown as Blob | ExportActivityLogsResponse;
  }
}
