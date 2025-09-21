"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '@/services/roleManagementService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onSave: (userData: Partial<UserType>) => Promise<void>;
  loading?: boolean;
}

export default function UserEditModal({ isOpen, onClose, user, onSave, loading = false }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.name.split(' ')[0] || '',
        last_name: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        role: user.role,
        is_active: user.status === 'active'
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'กรุณากรอกชื่อ';
    if (!formData.last_name.trim()) newErrors.last_name = 'กรุณากรอกนามสกุล';
    if (!formData.email.trim()) newErrors.email = 'กรุณากรอกอีเมล';
    if (!formData.role) newErrors.role = 'กรุณาเลือกบทบาท';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        status: formData.is_active ? 'active' : 'inactive'
      });
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">แก้ไขข้อมูลผู้ใช้</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกชื่อ"
                disabled={loading}
              />
            </div>
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.first_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกนามสกุล"
                disabled={loading}
              />
            </div>
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.last_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="กรอกอีเมล"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บทบาท <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">เลือกบทบาท</option>
                <option value="admin">ผู้ดูแลระบบ</option>
                <option value="doctor">แพทย์</option>
                <option value="nurse">พยาบาล</option>
                <option value="pharmacist">เภสัชกร</option>
                <option value="lab_technician">นักเทคนิคแลป</option>
                <option value="staff">เจ้าหน้าที่</option>
                <option value="patient">ผู้ป่วย</option>
              </select>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.role}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              สถานะใช้งาน
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} />
                  บันทึก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
