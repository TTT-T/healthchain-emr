"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Filter, Edit3, Trash2, Eye, Shield, Loader2, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { roleManagementService, User } from '@/services/roleManagementService';

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await roleManagementService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        role: selectedRole === 'all' ? undefined : selectedRole,
        status: selectedStatus === 'all' ? undefined : selectedStatus as 'active' | 'inactive'
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      await roleManagementService.updateUserRole(userId, newRole);
      await fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตบทบาท');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      setActionLoading(userId);
      await roleManagementService.updateUserStatus(userId, isActive);
      await fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return;
    
    try {
      setActionLoading(userId);
      await roleManagementService.deleteUser(userId);
      await fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'ผู้ดูแลระบบ',
      'doctor': 'แพทย์',
      'nurse': 'พยาบาล',
      'pharmacist': 'เภสัชกร',
      'lab_technician': 'นักเทคนิคแลป',
      'staff': 'เจ้าหน้าที่',
      'patient': 'ผู้ป่วย'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'doctor': 'bg-green-100 text-green-800 border-green-200',
      'nurse': 'bg-purple-100 text-purple-800 border-purple-200',
      'pharmacist': 'bg-orange-100 text-orange-800 border-orange-200',
      'lab_technician': 'bg-teal-100 text-teal-800 border-teal-200',
      'staff': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'patient': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <AlertCircle size={32} className="text-red-500" />
            <span className="ml-2 text-red-600">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/admin/role-management"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">กำหนดบทบาทผู้ใช้</h1>
              <p className="text-gray-600">จัดการบทบาทและสถานะของผู้ใช้ในระบบ</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchUsers}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                    กิจกรรม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)} disabled:opacity-50`}
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
                        onClick={() => handleStatusChange(user.id, user.status === 'inactive')}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : user.status === 'active' ? (
                          <>
                            <CheckCircle size={12} className="inline mr-1" />
                            ใช้งาน
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="inline mr-1" />
                            ไม่ใช้งาน
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>การเยี่ยม: {user.visit_count}</div>
                      <div>นัดหมาย: {user.appointment_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="ลบผู้ใช้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
