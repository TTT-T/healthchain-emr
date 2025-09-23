"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, Settings, UserPlus, Edit3, Trash2, Search, Filter, Plus, MoreVertical, Eye, Key, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { 
  roleManagementService, 
  User, 
  RoleStats, 
  SystemStatsResponse 
} from '@/services/roleManagementService';
import UserEditModal from '@/components/UserEditModal';
import UserCreateModal from '@/components/UserCreateModal';
import UserDetailModal from '@/components/UserDetailModal';

export default function RoleManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({});
  const [systemStats, setSystemStats] = useState<SystemStatsResponse['data'] | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users and system stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch users with fallback
      let usersResponse;
      try {
        usersResponse = await roleManagementService.getUsers({
          page: pagination.page,
          limit: pagination.limit,
          role: selectedRole === 'all' ? undefined : selectedRole,
          search: searchTerm || undefined
        });
        setUsers(usersResponse?.data?.users || []);
        setPagination(usersResponse?.data?.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        });
        
        // Calculate role statistics
        const stats = roleManagementService.calculateRoleStats(usersResponse?.data?.users || []);
        setRoleStats(stats);
      } catch (usersError) {
        console.warn('Could not fetch users, using fallback:', usersError);
        setUsers([]);
        setPagination({
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        });
        setRoleStats({});
      }

      // Try to fetch system stats with fallback
      try {
        const systemStatsResponse = await roleManagementService.getSystemStats();
        setSystemStats(systemStatsResponse?.data || null);
      } catch (statsError) {
        console.warn('Could not fetch system stats, using fallback:', statsError);
        setSystemStats(null);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, selectedRole, searchTerm]);

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle role filter change
  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // User management functions
  const handleCreateUser = async (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    password: string;
  }) => {
    try {
      setActionLoading(true);
      await roleManagementService.createUser(userData);
      await fetchData(); // Refresh data
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      await roleManagementService.updateUser(selectedUser.id, userData);
      await fetchData(); // Refresh data
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return;
    
    try {
      setActionLoading(true);
      await roleManagementService.deleteUser(userId);
      await fetchData(); // Refresh data
      setShowDetailModal(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setShowDetailModal(true);
  };

  const handleEditUserClick = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(true);
      await roleManagementService.updateUserRole(userId, newRole);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตบทบาท');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      setActionLoading(true);
      await roleManagementService.updateUserStatus(userId, isActive);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  // Get unique roles from users
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const totalRoles = Object.keys(roleStats).length;
  const activeRoles = Object.values(roleStats).filter(role => role.active > 0).length;
  const avgPermissions = Object.keys(roleStats).reduce((sum, role) => {
    return sum + roleManagementService.getRolePermissions(role).length;
  }, 0) / Math.max(totalRoles, 1);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">การจัดการบทบาทและสิทธิ์</h1>
            <p className="text-sm sm:text-base text-gray-600">จัดการบทบาท สิทธิ์การเข้าถึง และกำหนดสิทธิ์ผู้ใช้ในระบบ</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">บทบาททั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalRoles}</p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1 hidden sm:block">บทบาทในระบบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ผู้ใช้ทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">คนในระบบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-green-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">สิทธิ์เฉลี่ย</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{avgPermissions.toFixed(1)}</p>
              <p className="text-xs sm:text-sm text-purple-600 mt-1 hidden sm:block">สิทธิ์ต่อบทบาท</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="text-purple-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ผู้ใช้ใช้งาน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{activeUsers}</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">พร้อมใช้งาน</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">บทบาททั้งหมด</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {roleManagementService.getRoleDisplayName(role)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">เพิ่มผู้ใช้</span>
            </button>
            <Link href="/admin/role-management/advanced" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings size={16} />
              <span className="hidden sm:inline">ขั้นสูง</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">รายชื่อผู้ใช้ทั้งหมด</h3>
            <p className="text-sm text-gray-600 mt-1">จัดการบทบาทและสิทธิ์ของผู้ใช้แต่ละคน</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เข้าสู่ระบบล่าสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const roleColor = roleManagementService.getRoleColor(user.role);
                  const roleDisplayName = roleManagementService.getRoleDisplayName(user.role);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getColorClasses(roleColor)} disabled:opacity-50 cursor-pointer`}
                        >
                          <option value="admin">ผู้ดูแลระบบ</option>
                          <option value="doctor">แพทย์</option>
                          <option value="nurse">พยาบาล</option>
                          <option value="pharmacist">เภสัชกร</option>
                          <option value="lab_technician">นักเทคนิคแลป</option>
                          <option value="staff">เจ้าหน้าที่</option>
                          <option value="patient">ผู้ป่วย</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusChange(user.id, user.status === 'active' ? false : true)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {actionLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            user.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleDaring('th-TH') : 'ไม่เคยเข้าสู่ระบบ'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditUserClick(user)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-500">เริ่มต้นด้วยการเพิ่มผู้ใช้ใหม่</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดการเพิ่มเติม</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/admin/role-management/permissions" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Key className="text-blue-600" size={20} />
            <div className="text-left">
              <div className="font-medium text-gray-900">จัดการสิทธิ์</div>
              <div className="text-sm text-gray-500">ตั้งค่าสิทธิ์การเข้าถึง</div>
            </div>
          </Link>
          <Link href="/admin/role-management/users" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="text-green-600" size={20} />
            <div className="text-left">
              <div className="font-medium text-gray-900">กำหนดบทบาทผู้ใช้</div>
              <div className="text-sm text-gray-500">มอบหมายบทบาทให้ผู้ใช้</div>
            </div>
          </Link>
          <Link href="/admin/role-management/audit" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Shield className="text-purple-600" size={20} />
            <div className="text-left">
              <div className="font-medium text-gray-900">บันทึกการเปลี่ยนแปลง</div>
              <div className="text-sm text-gray-500">ตรวจสอบประวัติการแก้ไข</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateUser}
        loading={actionLoading}
      />

      <UserEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleEditUser}
        loading={actionLoading}
      />

      <UserDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUserId(null);
          setSelectedUser(null);
        }}
        userId={selectedUserId}
        onEdit={handleEditUserClick}
        onDelete={handleDeleteUser}
        loading={actionLoading}
      />
    </div>
  );
}
