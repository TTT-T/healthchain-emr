'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from "@/contexts/AuthContext"
import { 
  Search, 
  FileText, 
  Clock, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Building2,
  Shield,
  Bell,
  BarChart3,
  History,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ExternalRequesterSidebarProps {
  className?: string
}

export function ExternalRequesterSidebar({ className = '' }: ExternalRequesterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = [
    {
      name: 'ค้นหาผู้ป่วย',
      href: '/external-requesters/search',
      icon: <Search className="h-5 w-5" />,
      description: 'ค้นหาและส่งคำขอข้อมูล'
    },
    {
      name: 'ตรวจสอบสถานะ',
      href: '/external-requesters/status',
      icon: <Clock className="h-5 w-5" />,
      description: 'ติดตามสถานะคำขอ',
      badge: '3'
    },
    {
      name: 'คำขอของฉัน',
      href: '/external-requesters/my-requests',
      icon: <FileText className="h-5 w-5" />,
      description: 'ประวัติคำขอทั้งหมด'
    },
    {
      name: 'รายงาน',
      href: '/external-requesters/reports',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'สถิติและรายงาน'
    },
    {
      name: 'การแจ้งเตือน',
      href: '/external-requesters/notifications',
      icon: <Bell className="h-5 w-5" />,
      description: 'การแจ้งเตือนและข่าวสาร',
      badge: '5'
    }
  ]

  const bottomNavigation = [
    {
      name: 'ข้อมูลองค์กร',
      href: '/external-requesters/profile',
      icon: <Building2 className="h-5 w-5" />,
      description: 'จัดการข้อมูลองค์กร'
    },
    {
      name: 'การตั้งค่า',
      href: '/external-requesters/settings',
      icon: <Settings className="h-5 w-5" />,
      description: 'ตั้งค่าระบบ'
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className={`bg-white border-r border-gray-200 min-h-screen ${className}`}>
      <div className="flex min-h-screen flex-col">
        {/* Status Card */}
        {!isCollapsed && (
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 lg:p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2">
                <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                <span className="font-semibold text-green-800 text-sm lg:text-base">สถานะการอนุมัติ</span>
              </div>
              <p className="text-xs lg:text-sm text-green-700 mb-2 lg:mb-3">อนุมัติแล้ว - ใช้งานได้ปกติ</p>
              <div className="grid grid-cols-2 gap-2 lg:gap-3 text-xs">
                <div>
                  <span className="text-green-600 font-medium block">คำขอเดือนนี้</span>
                  <div className="text-green-800 font-bold">12/50</div>
                </div>
                <div>
                  <span className="text-green-600 font-medium block">อัตราความสำเร็จ</span>
                  <div className="text-green-800 font-bold">94%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-4 lg:px-6 py-3 lg:py-4 space-y-1 lg:space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center px-2 lg:px-3 py-2.5 lg:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="ml-2 lg:ml-3 flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        className={`ml-2 text-xs px-1.5 py-0.5 ${
                          isActive(item.href) 
                            ? 'bg-blue-200 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {!isCollapsed && !isActive(item.href) && (
                <p className="ml-8 lg:ml-11 mt-1 text-xs text-gray-500 truncate">{item.description}</p>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 px-4 lg:px-6 py-3 lg:py-4 space-y-1 lg:space-y-2">
          {bottomNavigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center px-2 lg:px-3 py-2.5 lg:py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`flex-shrink-0 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="ml-2 lg:ml-3 flex-1 truncate">{item.name}</span>
                )}
              </div>
              {!isCollapsed && !isActive(item.href) && (
                <p className="ml-8 lg:ml-11 mt-1 text-xs text-gray-500 truncate">{item.description}</p>
              )}
            </Link>
          ))}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-2 lg:px-3 py-2.5 lg:py-3 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="flex-shrink-0 h-5 w-5" />
            {!isCollapsed && (
              <span className="ml-2 lg:ml-3 flex-1 text-left truncate">ออกจากระบบ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mobile Sidebar Component
export function ExternalRequesterMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-gray-700 p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">External Portal</h2>
                    <p className="text-sm text-gray-600">โรงพยาบาลจุฬาลงกรณ์</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ExternalRequesterSidebar className="h-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
