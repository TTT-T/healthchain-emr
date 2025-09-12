import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  department?: string;
  last_login?: string;
  visit_count: number;
  appointment_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  meta: {
    timestamp: string;
    userCount: number;
    filters: {
      search?: string;
      role?: string;
      status?: string;
      sortBy: string;
      sortOrder: string;
    };
  };
  error: null;
  statusCode: number;
}

export interface RoleStats {
  [role: string]: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface SystemStatsResponse {
  data: {
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
  meta: {
    timestamp: string;
    health_score: number;
    response_time: number;
  };
  error: null;
  statusCode: number;
}

class RoleManagementService {
  private apiClient = apiClient;

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<UsersResponse> {
    try {
      const response = await this.apiClient.request<UsersResponse>({
        method: 'GET',
        url: '/admin/users',
        params
      });
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get system statistics for role management
   */
  async getSystemStats(): Promise<SystemStatsResponse> {
    try {
      const response = await this.apiClient.request<SystemStatsResponse>({
        method: 'GET',
        url: '/admin/system/health'
      });
      return response;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'GET',
        url: `/admin/users/${id}`
      });
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'PUT',
        url: `/admin/users/${id}`,
        data: { role }
      });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(id: string, isActive: boolean): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'PUT',
        url: `/admin/users/${id}`,
        data: { is_active: isActive }
      });
      return response;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update user details
   */
  async updateUser(id: string, userData: Partial<User>): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'PUT',
        url: `/admin/users/${id}`,
        data: userData
      });
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    password: string;
  }): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'POST',
        url: '/admin/users',
        data: userData
      });
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'DELETE',
        url: `/admin/users/${id}`
      });
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'GET',
        url: `/admin/users/${userId}`
      });
      return response;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'PUT',
        url: `/admin/users/${userId}`,
        data: { role }
      });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'PUT',
        url: `/admin/users/${userId}`,
        data: { is_active: isActive }
      });
      return response;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<any> {
    try {
      const response = await this.apiClient.request({
        method: 'DELETE',
        url: `/admin/users/${userId}`
      });
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Calculate role statistics from users data
   */
  calculateRoleStats(users: User[]): RoleStats {
    const stats: RoleStats = {};
    
    users.forEach(user => {
      if (!stats[user.role]) {
        stats[user.role] = {
          total: 0,
          active: 0,
          inactive: 0
        };
      }
      
      stats[user.role].total++;
      if (user.status === 'active') {
        stats[user.role].active++;
      } else {
        stats[user.role].inactive++;
      }
    });
    
    return stats;
  }

  /**
   * Get role permissions (static data for now)
   */
  getRolePermissions(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      'admin': ['จัดการผู้ใช้', 'จัดการระบบ', 'จัดการฐานข้อมูล', 'ดูรายงาน', 'อนุมัติคำขอ'],
      'doctor': ['ดูข้อมูลผู้ป่วย', 'บันทึกการรักษา', 'สั่งยา', 'ดูผลแลป', 'จัดการนัดหมาย'],
      'nurse': ['ดูข้อมูลผู้ป่วย', 'บันทึกอาการเบื้องต้น', 'ช่วยการรักษา', 'จัดการยา'],
      'patient': ['ดูข้อมูลส่วนตัว', 'นัดหมาย', 'ดูประวัติการรักษา'],
      'pharmacist': ['ดูใบสั่งยา', 'จัดจ่ายยา', 'ตรวจสอบยา', 'จัดการสต็อกยา'],
      'lab_technician': ['ดูใบสั่งแลป', 'บันทึกผลแลป', 'ตรวจสอบผลแลป', 'จัดการอุปกรณ์'],
      'staff': ['ดูข้อมูลทั่วไป', 'ช่วยงานทั่วไป', 'จัดการเอกสาร']
    };
    
    return permissions[role] || ['สิทธิ์พื้นฐาน'];
  }

  /**
   * Get role color
   */
  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'admin': 'red',
      'doctor': 'green',
      'nurse': 'purple',
      'patient': 'gray',
      'pharmacist': 'orange',
      'lab_technician': 'teal',
      'staff': 'blue'
    };
    
    return colors[role] || 'gray';
  }

  /**
   * Get role display name in Thai
   */
  getRoleDisplayName(role: string): string {
    const names: { [key: string]: string } = {
      'admin': 'ผู้ดูแลระบบ',
      'doctor': 'แพทย์',
      'nurse': 'พยาบาล',
      'patient': 'ผู้ป่วย',
      'pharmacist': 'เภสัชกร',
      'lab_technician': 'นักเทคนิคแลป',
      'staff': 'เจ้าหน้าที่'
    };
    
    return names[role] || role;
  }
}

export const roleManagementService = new RoleManagementService();
