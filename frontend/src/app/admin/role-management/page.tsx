"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Shield, Settings, UserPlus, Edit3, Trash2, Search, Filter, Plus, MoreVertical, Eye, Key, CheckCircle } from 'lucide-react';

export default function RoleManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // ตัวอย่างข้อมูลบทบาท
  const roles = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์เข้าถึงทุกฟีเจอร์',
      userCount: 1,
      permissions: ['จัดการผู้ใช้', 'จัดการระบบ', 'จัดการฐานข้อมูล', 'ดูรายงาน'],
      color: 'red',
      status: 'active'
    },
    {
      id: 2,
      name: 'Admin',
      description: 'ผู้ดูแลระบบ มีสิทธิ์จัดการผู้ใช้และการตั้งค่า',
      userCount: 2,
      permissions: ['จัดการผู้ใช้', 'ดูรายงาน', 'อนุมัติคำขอ'],
      color: 'blue',
      status: 'active'
    },
    {
      id: 3,
      name: 'Doctor',
      description: 'แพทย์ มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยและระบบ EMR',
      userCount: 15,
      permissions: ['ดูข้อมูลผู้ป่วย', 'บันทึกการรักษา', 'สั่งยา'],
      color: 'green',
      status: 'active'
    },
    {
      id: 4,
      name: 'Nurse',
      description: 'พยาบาล มีสิทธิ์ช่วยในการดูแลผู้ป่วย',
      userCount: 8,
      permissions: ['ดูข้อมูลผู้ป่วย', 'บันทึกอาการเบื้องต้น'],
      color: 'purple',
      status: 'active'
    },
    {
      id: 5,
      name: 'Patient',
      description: 'ผู้ป่วย มีสิทธิ์ดูข้อมูลส่วนตัวเท่านั้น',
      userCount: 250,
      permissions: ['ดูข้อมูลส่วนตัว', 'นัดหมาย'],
      color: 'gray',
      status: 'active'
    },
    {
      id: 6,
      name: 'Pharmacist',
      description: 'เภสัชกร มีสิทธิ์จัดการยาและใบสั่งยา',
      userCount: 4,
      permissions: ['ดูใบสั่งยา', 'จัดจ่ายยา', 'ตรวจสอบยา'],
      color: 'orange',
      status: 'active'
    },
    {
      id: 7,
      name: 'Lab Technician',
      description: 'นักเทคนิคแลป มีสิทธิ์จัดการผลแลป',
      userCount: 6,
      permissions: ['ดูใบสั่งแลป', 'บันทึกผลแลป', 'ตรวจสอบผลแลป'],
      color: 'teal',
      status: 'active'
    }
  ];

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

  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">การจัดการบทบาทและสิทธิ์</h1>
        <p className="text-sm sm:text-base text-gray-600">จัดการบทบาท สิทธิ์การเข้าถึง และกำหนดสิทธิ์ผู้ใช้ในระบบ HealthChain</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">บทบาททั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{roles.length}</p>
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
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{roles.reduce((sum, role) => sum + role.userCount, 0)}</p>
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
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">3.2</p>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">บทบาทใช้งาน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{roles.filter(role => role.status === 'active').length}</p>
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
                placeholder="ค้นหาบทบาท..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">บทบาททั้งหมด</option>
              <option value="active">ใช้งานอยู่</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              <span className="hidden sm:inline">เพิ่มบทบาท</span>
            </button>
            <Link href="/admin/role-management/advanced" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings size={16} />
              <span className="hidden sm:inline">ขั้นสูง</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getColorClasses(role.color)}`}>
                  {role.name}
                </div>
                <span className="text-sm text-gray-500">{role.userCount} คน</span>
              </div>
              <div className="relative">
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">สิทธิ์การเข้าถึง</h4>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    {permission}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    +{role.permissions.length - 3} อื่น ๆ
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-1 justify-center">
                <Eye size={14} />
                ดูรายละเอียด
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Edit3 size={14} />
                แก้ไข
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
