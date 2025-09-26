"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Check, X, Save, Settings, Users, Eye, Edit, Trash, Plus, Loader2, AlertCircle } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permissions: string[];
}

export default function PermissionsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [saving, setSaving] = useState(false);

  // Mock permissions data
  const mockPermissions: Permission[] = [
    // User Management
    { id: 'user.create', name: 'สร้างผู้ใช้', description: 'สามารถสร้างผู้ใช้ใหม่ได้', category: 'User Management' },
    { id: 'user.read', name: 'ดูข้อมูลผู้ใช้', description: 'สามารถดูข้อมูลผู้ใช้ได้', category: 'User Management' },
    { id: 'user.update', name: 'แก้ไขผู้ใช้', description: 'สามารถแก้ไขข้อมูลผู้ใช้ได้', category: 'User Management' },
    { id: 'user.delete', name: 'ลบผู้ใช้', description: 'สามารถลบผู้ใช้ได้', category: 'User Management' },
    
    // Patient Management
    { id: 'patient.create', name: 'สร้างผู้ป่วย', description: 'สามารถสร้างข้อมูลผู้ป่วยใหม่ได้', category: 'Patient Management' },
    { id: 'patient.read', name: 'ดูข้อมูลผู้ป่วย', description: 'สามารถดูข้อมูลผู้ป่วยได้', category: 'Patient Management' },
    { id: 'patient.update', name: 'แก้ไขผู้ป่วย', description: 'สามารถแก้ไขข้อมูลผู้ป่วยได้', category: 'Patient Management' },
    { id: 'patient.delete', name: 'ลบผู้ป่วย', description: 'สามารถลบข้อมูลผู้ป่วยได้', category: 'Patient Management' },
    
    // Medical Records
    { id: 'medical.create', name: 'สร้างบันทึกการรักษา', description: 'สามารถสร้างบันทึกการรักษาได้', category: 'Medical Records' },
    { id: 'medical.read', name: 'ดูบันทึกการรักษา', description: 'สามารถดูบันทึกการรักษาได้', category: 'Medical Records' },
    { id: 'medical.update', name: 'แก้ไขบันทึกการรักษา', description: 'สามารถแก้ไขบันทึกการรักษาได้', category: 'Medical Records' },
    { id: 'medical.delete', name: 'ลบบันทึกการรักษา', description: 'สามารถลบบันทึกการรักษาได้', category: 'Medical Records' },
    
    // Appointments
    { id: 'appointment.create', name: 'สร้างนัดหมาย', description: 'สามารถสร้างนัดหมายได้', category: 'Appointments' },
    { id: 'appointment.read', name: 'ดูนัดหมาย', description: 'สามารถดูนัดหมายได้', category: 'Appointments' },
    { id: 'appointment.update', name: 'แก้ไขนัดหมาย', description: 'สามารถแก้ไขนัดหมายได้', category: 'Appointments' },
    { id: 'appointment.delete', name: 'ลบนัดหมาย', description: 'สามารถลบนัดหมายได้', category: 'Appointments' },
    
    // Prescriptions
    { id: 'prescription.create', name: 'สั่งยา', description: 'สามารถสั่งยาได้', category: 'Prescriptions' },
    { id: 'prescription.read', name: 'ดูใบสั่งยา', description: 'สามารถดูใบสั่งยาได้', category: 'Prescriptions' },
    { id: 'prescription.update', name: 'แก้ไขใบสั่งยา', description: 'สามารถแก้ไขใบสั่งยาได้', category: 'Prescriptions' },
    { id: 'prescription.delete', name: 'ลบใบสั่งยา', description: 'สามารถลบใบสั่งยาได้', category: 'Prescriptions' },
    
    // Lab Orders
    { id: 'lab.create', name: 'สั่งแลป', description: 'สามารถสั่งแลปได้', category: 'Lab Orders' },
    { id: 'lab.read', name: 'ดูผลแลป', description: 'สามารถดูผลแลปได้', category: 'Lab Orders' },
    { id: 'lab.update', name: 'แก้ไขผลแลป', description: 'สามารถแก้ไขผลแลปได้', category: 'Lab Orders' },
    { id: 'lab.delete', name: 'ลบผลแลป', description: 'สามารถลบผลแลปได้', category: 'Lab Orders' },
    
    // System Administration
    { id: 'system.settings', name: 'จัดการการตั้งค่าระบบ', description: 'สามารถจัดการการตั้งค่าระบบได้', category: 'System Administration' },
    { id: 'system.backup', name: 'สำรองข้อมูล', description: 'สามารถสำรองข้อมูลได้', category: 'System Administration' },
    { id: 'system.audit', name: 'ดูบันทึกการใช้งาน', description: 'สามารถดูบันทึกการใช้งานได้', category: 'System Administration' },
    { id: 'system.reports', name: 'ดูรายงาน', description: 'สามารถดูรายงานได้', category: 'System Administration' }
  ];

  // Mock role permissions
  const mockRolePermissions: RolePermission[] = [
    {
      role: 'admin',
      permissions: mockPermissions.map(p => p.id) // Admin has all permissions
    },
    {
      role: 'doctor',
      permissions: [
        'patient.read', 'patient.update',
        'medical.create', 'medical.read', 'medical.update',
        'appointment.create', 'appointment.read', 'appointment.update',
        'prescription.create', 'prescription.read', 'prescription.update',
        'lab.create', 'lab.read', 'lab.update'
      ]
    },
    {
      role: 'nurse',
      permissions: [
        'patient.read', 'patient.update',
        'medical.read', 'medical.update',
        'appointment.read', 'appointment.update',
        'prescription.read',
        'lab.read'
      ]
    },
    {
      role: 'pharmacist',
      permissions: [
        'prescription.read', 'prescription.update',
        'patient.read'
      ]
    },
    {
      role: 'lab_technician',
      permissions: [
        'lab.create', 'lab.read', 'lab.update',
        'patient.read'
      ]
    },
    {
      role: 'staff',
      permissions: [
        'patient.create', 'patient.read', 'patient.update',
        'appointment.create', 'appointment.read', 'appointment.update'
      ]
    },
    {
      role: 'patient',
      permissions: [
        'patient.read', 'appointment.read', 'prescription.read', 'lab.read'
      ]
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call real API to get permissions
      const response = await fetch('/api/admin/role-permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      
      const data = await response.json();
      
      setPermissions(data.data.permissions || mockPermissions);
      setRolePermissions(data.data.rolePermissions || mockRolePermissions);
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
      // Fallback to mock data
      setPermissions(mockPermissions);
      setRolePermissions(mockRolePermissions);
    } finally {
      setLoading(false);
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

  const hasPermission = (role: string, permissionId: string) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role);
    return rolePermission?.permissions.includes(permissionId) || false;
  };

  const togglePermission = (role: string, permissionId: string) => {
    setRolePermissions(prev => {
      const updated = prev.map(rp => {
        if (rp.role === role) {
          const permissions = rp.permissions.includes(permissionId)
            ? rp.permissions.filter(p => p !== permissionId)
            : [...rp.permissions, permissionId];
          return { ...rp, permissions };
        }
        return rp;
      });
      return updated;
    });
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      
      // Call API to save permissions
      const response = await fetch('/api/admin/role-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          rolePermissions: rolePermissions
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save permissions');
      }
      
      alert('บันทึกการตั้งค่าสิทธิ์เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categories = Array.from(new Set(permissions.map(p => p.category)));
    return categories.map(category => ({
      category,
      permissions: permissions.filter(p => p.category === category)
    }));
  };

  if (loading) {
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
              <h1 className="text-2xl font-bold text-gray-900">จัดการสิทธิ์การเข้าถึง</h1>
              <p className="text-gray-600">กำหนดสิทธิ์การเข้าถึงระบบสำหรับแต่ละบทบาท</p>
            </div>
          </div>
        </div>

        {/* Role Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">เลือกบทบาท</h2>
          <div className="flex flex-wrap gap-2">
            {rolePermissions.map((rolePermission) => (
              <button
                key={rolePermission.role}
                onClick={() => setSelectedRole(rolePermission.role)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedRole === rolePermission.role
                    ? getRoleColor(rolePermission.role)
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getRoleDisplayName(rolePermission.role)}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              สิทธิ์สำหรับ: {getRoleDisplayName(selectedRole)}
            </h2>
            <button
              onClick={savePermissions}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {getPermissionsByCategory().map(({ category, permissions: categoryPermissions }) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPermissions.map((permission) => {
                    const hasAccess = hasPermission(selectedRole, permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                          hasAccess
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => togglePermission(selectedRole, permission.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{permission.name}</h4>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            hasAccess
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {hasAccess && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
