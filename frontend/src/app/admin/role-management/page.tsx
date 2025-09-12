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
      
      const [usersResponse, systemStatsResponse] = await Promise.all([
        roleManagementService.getUsers({
          page: pagination.page,
          limit: pagination.limit,
          role: selectedRole === 'all' ? undefined : selectedRole,
          search: searchTerm || undefined
        }),
        roleManagementService.getSystemStats()
      ]);

      setUsers(usersResponse.data.users);
      setPagination(usersResponse.data.pagination);
      setSystemStats(systemStatsResponse.data);
      
      // Calculate role statistics
      const stats = roleManagementService.calculateRoleStats(usersResponse.data.users);
      setRoleStats(stats);
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

  // Get unique roles from users
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  // Calculate statistics
  const totalUsers = systemStats?.users?.total || 0;
  const activeUsers = systemStats?.users?.active || 0;
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

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Object.entries(roleStats).map(([role, stats]) => {
            const roleColor = roleManagementService.getRoleColor(role);
            const roleDisplayName = roleManagementService.getRoleDisplayName(role);
            const permissions = roleManagementService.getRolePermissions(role);
            const roleUsers = users.filter(user => user.role === role);
            
            return (
              <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getColorClasses(roleColor)}`}>
                      {roleDisplayName}
                    </div>
                    <span className="text-sm text-gray-500">{stats.total} คน</span>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {role === 'admin' && 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เข้าถึงทุกฟีเจอร์'}
                  {role === 'doctor' && 'แพทย์ มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยและระบบ EMR'}
                  {role === 'nurse' && 'พยาบาล มีสิทธิ์ช่วยในการดูแลผู้ป่วย'}
                  {role === 'patient' && 'ผู้ป่วย มีสิทธิ์ดูข้อมูลส่วนตัวเท่านั้น'}
                  {role === 'pharmacist' && 'เภสัชกร มีสิทธิ์จัดการยาและใบสั่งยา'}
                  {role === 'lab_technician' && 'นักเทคนิคแลป มีสิทธิ์จัดการผลแลป'}
                  {role === 'staff' && 'เจ้าหน้าที่ มีสิทธิ์ช่วยงานทั่วไป'}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">สิทธิ์การเข้าถึง</h4>
                  <div className="flex flex-wrap gap-1">
                    {permissions.slice(0, 3).map((permission, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {permission}
                      </span>
                    ))}
                    {permissions.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        +{permissions.length - 3} อื่น ๆ
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">ผู้ใช้ในบทบาทนี้</h4>
                  <div className="space-y-2">
                    {roleUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{user.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </div>
                    ))}
                    {roleUsers.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{roleUsers.length - 3} คนอื่น ๆ
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleViewUser(roleUsers[0])}
                    disabled={roleUsers.length === 0 || actionLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye size={14} />
                    ดูรายละเอียด
                  </button>
                  <button 
                    onClick={() => roleUsers.length > 0 && handleEditUserClick(roleUsers[0])}
                    disabled={roleUsers.length === 0 || actionLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 size={14} />
                    แก้ไข
                  </button>
                  <button 
                    onClick={() => roleUsers.length > 0 && handleDeleteUser(roleUsers[0].id)}
                    disabled={roleUsers.length === 0 || actionLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
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
