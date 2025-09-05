'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Search, FileText, BarChart3, Settings, User, 
  Menu, X, ChevronRight, ChevronDown, LogOut, Building2,
  Shield, Database, Clock, CheckCircle, AlertCircle, Plus
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'main' | 'requests' | 'reports' | 'admin';
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'แดชบอร์ด',
    href: '/external-requesters',
    icon: BarChart3,
    description: 'ภาพรวมการใช้งานระบบ',
    category: 'main'
  },
  {
    id: 'new-request',
    label: 'ส่งคำขอใหม่',
    href: '/external-requesters/new-request',
    icon: Plus,
    description: 'ส่งคำขอเข้าถึงข้อมูลผู้ป่วยใหม่',
    category: 'requests'
  },
  {
    id: 'search-data',
    label: 'ค้นหาข้อมูล',
    href: '/external-requesters/search',
    icon: Search,
    description: 'ค้นหาข้อมูลผู้ป่วยและข้อมูลสุขภาพ',
    category: 'requests'
  },
  {
    id: 'my-requests',
    label: 'คำขอของฉัน',
    href: '/external-requesters/my-requests',
    icon: FileText,
    description: 'ดูและจัดการคำขอข้อมูลของฉัน',
    category: 'requests'
  },
  {
    id: 'reports',
    label: 'รายงาน',
    href: '/external-requesters/reports',
    icon: BarChart3,
    description: 'ดูรายงานการใช้งานและสถิติ',
    category: 'reports'
  },
  {
    id: 'profile',
    label: 'โปรไฟล์',
    href: '/external-requesters/profile',
    icon: User,
    description: 'จัดการข้อมูลส่วนตัวและองค์กร',
    category: 'admin'
  },
  {
    id: 'settings',
    label: 'ตั้งค่า',
    href: '/external-requesters/settings',
    icon: Settings,
    description: 'ตั้งค่าระบบและความปลอดภัย',
    category: 'admin'
  }
];

const categoryLabels = {
  main: 'หลัก',
  requests: 'คำขอข้อมูล',
  reports: 'รายงาน',
  admin: 'การจัดการ'
};

const categoryColors = {
  main: 'text-blue-600',
  requests: 'text-emerald-600',
  reports: 'text-purple-600',
  admin: 'text-orange-600'
};

interface ExternalRequestersSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ExternalRequestersSidebar({ 
  isCollapsed = false, 
  onToggle, 
  isMobile = false, 
  isOpen = false, 
  onClose 
}: ExternalRequestersSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main', 'requests']);

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
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 transition-all duration-300 z-40 ${
        isMobile 
          ? `${isOpen ? 'translate-x-0' : '-translate-x-full'} w-56 lg:translate-x-0 lg:static lg:w-56` 
          : isCollapsed ? 'w-12' : 'w-56'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center mr-2">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">External</h1>
                <p className="text-xs text-gray-500">Requesters</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                title="ปิดเมนู"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
            
            {!isMobile && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
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
                  onClick={() => (!isCollapsed && !isMobile) && toggleCategory(category)}
                  className={`flex items-center justify-between w-full p-1.5 text-left text-xs font-medium transition-colors ${
                    (isCollapsed && !isMobile) ? 'justify-center' : ''
                  } ${categoryColors[category as keyof typeof categoryColors]} hover:bg-gray-50 rounded-lg`}
                >
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </>
                  )}
                  {(isCollapsed && !isMobile) && (
                    <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                  )}
                </button>

                {/* Menu Items */}
                {(expandedCategories.includes(category) || (isCollapsed && !isMobile) || isMobile) && (
                  <div className={`space-y-1 ${(isCollapsed && !isMobile) ? 'mt-1' : 'mt-1 ml-1'}`}>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={isMobile ? onClose : undefined}
                          className={`flex items-center p-2 rounded-lg transition-colors group ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
                          title={(isCollapsed && !isMobile) ? item.label : item.description}
                        >
                          <Icon className={`h-4 w-4 ${(isCollapsed && !isMobile) ? '' : 'mr-2'} ${
                            isActive ? 'text-emerald-700' : 'text-gray-500 group-hover:text-gray-700'
                          }`} />
                          {(!isCollapsed || isMobile) && (
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

        {/* System Status */}
        {(!isCollapsed || isMobile) && (
          <div className="border-t border-gray-200 p-3">
            <div className="text-xs font-medium text-gray-500 mb-2">สถานะระบบ</div>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600">API Gateway</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Database</span>
              </div>
              <div className="flex items-center text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Security</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            className={`flex items-center w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
              (isCollapsed && !isMobile) ? 'justify-center' : ''
            }`}
            title="ออกจากระบบ"
          >
            <LogOut className={`h-5 w-5 ${(isCollapsed && !isMobile) ? '' : 'mr-3'}`} />
            {(!isCollapsed || isMobile) && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    </>
  );
}
