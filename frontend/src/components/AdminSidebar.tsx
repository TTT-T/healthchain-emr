"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContextAdmin';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Database, 
  Settings, 
  Monitor, 
  Mail, 
  X,
  Shield,
  LogOut,
  User,
  Building2,
  FileCheck,
  UserCheck,
  FileText,
  BarChart3
} from 'lucide-react';

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'ภาพรวมระบบ'
  },
  {
    href: '/admin/pending-personnel',
    icon: Users,
    label: 'Pending Personnel',
    description: 'อนุมัติบุคลากร'
  },
  {
    href: '/admin/role-management',
    icon: Shield,
    label: 'Role Management',
    description: 'จัดการบทบาทและสิทธิ์'
  },
  {
    href: '/admin/external-requesters',
    icon: Building2,
    label: 'External Requesters',
    description: 'จัดการผู้ขอข้อมูลภายนอก'
  },
  {
    href: '/admin/consent-dashboard',
    icon: FileCheck,
    label: 'Consent Management',
    description: 'จัดการการยินยอม'
  },
  {
    href: '/admin/consent-requests',
    icon: UserCheck,
    label: 'Consent Requests',
    description: 'คำขอการยินยอม'
  },
  {
    href: '/admin/consent-contracts',
    icon: FileText,
    label: 'Consent Contracts',
    description: 'สัญญาการยินยอม'
  },
  {
    href: '/admin/consent-audit',
    icon: BarChart3,
    label: 'Consent Audit',
    description: 'รายงานการตรวจสอบ'
  },
  {
    href: '/admin/activity-logs',
    icon: Activity,
    label: 'Activity Logs',
    description: 'บันทึกกิจกรรม'
  },
  {
    href: '/admin/database',
    icon: Database,
    label: 'Database',
    description: 'จัดการฐานข้อมูล'
  },
  {
    href: '/admin/token-monitor',
    icon: Monitor,
    label: 'Token Monitor',
    description: 'ตรวจสอบ Token'
  },
  {
    href: '/admin/email-verification',
    icon: Mail,
    label: 'Email Verification',
    description: 'ยืนยันอีเมล'
  },
  {
    href: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    description: 'ตั้งค่าระบบ'
  }
];

export default function AdminSidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HealthChain</h1>
              <p className="text-sm text-blue-600 font-medium">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={`
                      transition-colors duration-200
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                    `} 
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-blue-700' : ''}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="text-gray-600" size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">Admin User</div>
              <div className="text-xs text-gray-500">admin@healthchain.com</div>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings size={16} className="text-gray-400" />
              <span>Account Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={16} className="text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
