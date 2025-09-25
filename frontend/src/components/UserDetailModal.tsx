"use client";

import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, User, Mail, Calendar, Shield, Activity, Loader2, AlertCircle } from 'lucide-react';
import { User as UserType } from '@/services/roleManagementService';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onEdit: (user: UserType) => void;
  onDelete: (userId: string) => void;
  loading?: boolean;
}

export default function UserDetailModal({ isOpen, onClose, userId, onEdit, onDelete, loading = false }: UserDetailModalProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    try {
      setUserLoading(true);
      setError(null);
      
      // Call real API to get user details
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      const userData = data.data.user;
      
      // Transform API response to match UserType interface
      const transformedUser: UserType = {
        id: userData.id,
        username: userData.username || '',
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email,
        role: userData.role,
        status: userData.isActive ? 'active' : 'inactive',
        department: userData.departmentName || '',
        last_login: userData.last_login,
        visit_count: userData.visit_count || 0,
        appointment_count: userData.appointment_count || 0,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
      
      setUser(transformedUser);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      console.error('Error fetching user details:', err);
    } finally {
      setUserLoading(false);
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

  const formatDate = (daring: string) => {
    return new Date(daring).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">รายละเอียดผู้ใช้</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {userLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <AlertCircle size={32} className="text-red-500" />
              <span className="ml-2 text-red-600">{error}</span>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </div>
                  {user.department && (
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{user.department}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{user.visit_count}</p>
                      <p className="text-sm text-gray-600">การเยี่ยม</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{user.appointment_count}</p>
                      <p className="text-sm text-gray-600">นัดหมาย</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Activity size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">
                        {user.last_login ? 'ออนไลน์' : 'ออฟไลน์'}
                      </p>
                      <p className="text-sm text-gray-600">สถานะ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">ประวัติการใช้งาน</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">เข้าสู่ระบบล่าสุด: {formatDate(user.last_login || user.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">สร้างบัญชี: {formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">อัปเดตล่าสุด: {formatDate(user.updated_at)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onEdit(user)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  <Edit3 size={16} />
                  แก้ไขข้อมูล
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  ลบผู้ใช้
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
