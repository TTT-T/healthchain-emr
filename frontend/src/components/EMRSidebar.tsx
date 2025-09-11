'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { 
  Home, Users, UserPlus, Activity, Heart, Stethoscope, 
  Pill, FileText, Calendar, ClipboardList, Search, 
  Menu, X, ChevronRight, ChevronDown, LogOut, BarChart3
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'main' | 'patient' | 'clinical' | 'admin';
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'หน้าแรก',
    href: '/emr',
    icon: Home,
    description: 'หน้าแรกระบบ EMR',
    category: 'main'
  },
  {
    id: 'dashboard',
    label: 'แดชบอร์ด',
    href: '/emr/dashboard',
    icon: BarChart3,
    description: 'ภาพรวมระบบ EMR',
    category: 'main'
  },
  {
    id: 'register-patient',
    label: 'ลงทะเบียนผู้ป่วยใหม่',
    href: '/emr/register-patient',
    icon: UserPlus,
    description: 'ลงทะเบียนผู้ป่วยใหม่เข้าระบบ',
    category: 'patient'
  },
  {
    id: 'patient-summary',
    label: 'ดูประวัติผู้ป่วย',
    href: '/emr/patient-summary',
    icon: Users,
    description: 'ดูประวัติและข้อมูลผู้ป่วยย้อนหลัง',
    category: 'patient'
  },
  {
    id: 'checkin',
    label: 'เช็คอิน/สร้างคิว',
    href: '/emr/checkin',
    icon: ClipboardList,
    description: 'เช็คอินผู้ป่วยและสร้างคิวรอ',
    category: 'clinical'
  },
  {
    id: 'vital-signs',
    label: 'วัดสัญญาณชีพ',
    href: '/emr/vital-signs',
    icon: Activity,
    description: 'บันทึกสัญญาณชีพของผู้ป่วย',
    category: 'clinical'
  },
  {
    id: 'history-taking',
    label: 'ซักประวัติ',
    href: '/emr/history-taking',
    icon: Search,
    description: 'ซักประวัติและอาการของผู้ป่วย',
    category: 'clinical'
  },
  {
    id: 'doctor-visit',
    label: 'ตรวจโดยแพทย์',
    href: '/emr/doctor-visit',
    icon: Stethoscope,
    description: 'บันทึกการตรวจและวินิจฉัยโดยแพทย์',
    category: 'clinical'
  },
  {
    id: 'pharmacy',
    label: 'จ่ายยา',
    href: '/emr/pharmacy',
    icon: Pill,
    description: 'จ่ายยาและบันทึกการจ่ายยา',
    category: 'clinical'
  },
  {
    id: 'lab-result',
    label: 'ผลแลบ/แนบไฟล์',
    href: '/emr/lab-result',
    icon: FileText,
    description: 'บันทึกผลตรวจทางห้องปฏิบัติการ',
    category: 'clinical'
  },
  {
    id: 'appointments',
    label: 'นัดหมาย',
    href: '/emr/appointments',
    icon: Calendar,
    description: 'จัดการนัดหมายผู้ป่วย',
    category: 'admin'
  },
  {
    id: 'documents',
    label: 'ออกเอกสาร',
    href: '/emr/documents',
    icon: FileText,
    description: 'ออกเอกสารทางการแพทย์',
    category: 'admin'
  }
];

const categoryLabels = {
  main: 'หลัก',
  patient: 'ข้อมูลผู้ป่วย',
  clinical: 'การรักษา',
  admin: 'การจัดการ'
};

const categoryColors = {
  main: 'text-blue-600',
  patient: 'text-green-600',
  clinical: 'text-purple-600',
  admin: 'text-orange-600'
};

interface EMRSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function EMRSidebar({ 
  isCollapsed = false, 
  onToggle, 
  isMobile = false, 
  isOpen = false, 
  onClose 
}: EMRSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main', 'clinical']);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

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
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">EMR</h1>
                <p className="text-xs text-gray-500">Medical Record</p>
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
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } ${(isCollapsed && !isMobile) ? 'justify-center' : ''}`}
                          title={(isCollapsed && !isMobile) ? item.label : item.description}
                        >
                          <Icon className={`h-4 w-4 ${(isCollapsed && !isMobile) ? '' : 'mr-2'} ${
                            isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
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

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
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
