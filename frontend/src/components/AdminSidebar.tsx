"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Building2,
  FileCheck,
  UserCheck,
  FileText,
  BarChart3,
  Menu,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  category: 'main' | 'management' | 'monitoring' | 'admin';
}

const menuItems: MenuItem[] = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'ภาพรวมระบบ',
    category: 'main'
  },
  {
    href: '/admin/pending-personnel',
    icon: Users,
    label: 'Pending Personnel',
    description: 'อนุมัติบุคลากร',
    category: 'management'
  },
  {
    href: '/admin/role-management',
    icon: Shield,
    label: 'Role Management',
    description: 'จัดการบทบาทและสิทธิ์',
    category: 'management'
  },
  {
    href: '/admin/external-requesters',
    icon: Building2,
    label: 'External Requesters',
    description: 'จัดการผู้ขอข้อมูลภายนอก',
    category: 'management'
  },
  {
    href: '/admin/consent-dashboard',
    icon: FileCheck,
    label: 'Consent Management',
    description: 'จัดการการยินยอม',
    category: 'management'
  },
  {
    href: '/admin/consent-requests',
    icon: UserCheck,
    label: 'Consent Requests',
    description: 'คำขอการยินยอม',
    category: 'management'
  },
  {
    href: '/admin/consent-contracts',
    icon: FileText,
    label: 'Consent Contracts',
    description: 'สัญญาการยินยอม',
    category: 'management'
  },
  {
    href: '/admin/consent-audit',
    icon: BarChart3,
    label: 'Consent Audit',
    description: 'รายงานการตรวจสอบ',
    category: 'monitoring'
  },
  {
    href: '/admin/system-monitoring',
    icon: Monitor,
    label: 'System Monitoring',
    description: 'ตรวจสอบระบบ',
    category: 'monitoring'
  },
  {
    href: '/admin/database-management',
    icon: Database,
    label: 'Database Management',
    description: 'จัดการฐานข้อมูล',
    category: 'monitoring'
  },
  {
    href: '/admin/activity-logs',
    icon: Activity,
    label: 'Activity Logs',
    description: 'บันทึกกิจกรรม',
    category: 'monitoring'
  },
  {
    href: '/admin/notifications',
    icon: Mail,
    label: 'Notifications',
    description: 'การแจ้งเตือน',
    category: 'admin'
  },
  {
    href: '/admin/settings',
    icon: Settings,
    label: 'Settings',
    description: 'ตั้งค่าระบบ',
    category: 'admin'
  }
];

const categoryLabels = {
  main: 'หลัก',
  management: 'การจัดการ',
  monitoring: 'การตรวจสอบ',
  admin: 'การดูแลระบบ'
};

const categoryColors = {
  main: 'text-blue-600',
  management: 'text-green-600',
  monitoring: 'text-purple-600',
  admin: 'text-orange-600'
};

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ 
  isCollapsed = false, 
  onToggle, 
  isMobile = false, 
  isOpen = false, 
  onClose 
}: AdminSidebarProps) {
  // Use props directly
  const sidebarIsOpen = isOpen;
  const sidebarIsCollapsed = isCollapsed;
  const handleToggle = onToggle || (() => {});
  const handleClose = onClose || (() => {});
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main', 'management']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const categorizedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarIsOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={handleClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 transition-all duration-300 z-40 ${
        isMobile 
          ? `${sidebarIsOpen ? 'translate-x-0' : '-translate-x-full'} w-56 lg:translate-x-0 lg:static lg:w-56` 
          : sidebarIsCollapsed ? 'w-12' : 'w-56'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          {(!sidebarIsCollapsed || sidebarIsOpen) && (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center mr-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Admin</h1>
                <p className="text-xs text-gray-500">Management</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {isMobile && (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                title="ปิดเมนู"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
            
            {!isMobile && (
              <button
                onClick={handleToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={sidebarIsCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
              >
                <Menu className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-3">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => !sidebarIsCollapsed && toggleCategory(category)}
                  className={`flex items-center justify-between w-full p-1.5 text-left text-xs font-medium transition-colors ${
                    (sidebarIsCollapsed && !sidebarIsOpen) ? 'justify-center' : ''
                  } ${categoryColors[category as keyof typeof categoryColors]} hover:bg-gray-50 rounded-lg`}
                >
                  {(!sidebarIsCollapsed || sidebarIsOpen) && (
                    <>
                      <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </>
                  )}
                  {(sidebarIsCollapsed && !sidebarIsOpen) && (
                    <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                  )}
                </button>

                {/* Menu Items */}
                {(expandedCategories.includes(category) || (sidebarIsCollapsed && !sidebarIsOpen) || sidebarIsOpen) && (
                  <div className={`space-y-1 ${(sidebarIsCollapsed && !sidebarIsOpen) ? 'mt-1' : 'mt-1 ml-1'}`}>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={sidebarIsOpen ? handleClose : undefined}
                          className={`flex items-center p-2 rounded-lg transition-colors group ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 border-l-2 border-purple-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } ${(sidebarIsCollapsed && !sidebarIsOpen) ? 'justify-center' : ''}`}
                          title={(sidebarIsCollapsed && !sidebarIsOpen) ? item.label : item.description}
                        >
                          <Icon className={`h-4 w-4 ${(sidebarIsCollapsed && !sidebarIsOpen) ? '' : 'mr-2'} ${
                            isActive ? 'text-purple-700' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          {(!sidebarIsCollapsed || sidebarIsOpen) && (
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {item.description}
                              </div>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            className={`flex items-center w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
              (sidebarIsCollapsed && !sidebarIsOpen) ? 'justify-center' : ''
            }`}
            title="ออกจากระบบ"
          >
            <LogOut className={`h-5 w-5 ${(sidebarIsCollapsed && !sidebarIsOpen) ? '' : 'mr-3'}`} />
            {(!sidebarIsCollapsed || sidebarIsOpen) && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    </>
  );
}