"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from '@/lib/logger';

interface SidebarProps {
  userType?: "patient" | "doctor" | "admin";
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ResponsiveSidebar({ userType = "patient", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "ผู้ใช้";
    
    // Try Thai names first, then English names, then fallback
    if (user.thaiFirstName || user.thaiLastName) {
      return `${user.thaiFirstName || ''} ${user.thaiLastName || ''}`.trim();
    }
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user.username) {
      return user.username;
    }
    return user.email?.split('@')[0] || "ผู้ใช้";
  };

  // Get user role display
  const getRoleDisplay = () => {
    if (!user?.role) return "ผู้ใช้";
    
    const roleMap: Record<string, string> = {
      'patient': 'ผู้ป่วย',
      'doctor': 'แพทย์',
      'nurse': 'พยาบาล',
      'admin': 'ผู้ดูแลระบบ',
      'external_requester': 'ผู้ขอข้อมูลภายนอก'
    };
    
    return roleMap[user.role] || user.role;
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.thaiFirstName && user.thaiLastName) {
      return user.thaiFirstName.charAt(0) + user.thaiLastName.charAt(0);
    }
    if (user.firstName && user.lastName) {
      return user.firstName.charAt(0) + user.lastName.charAt(0);
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      if (onClose) onClose();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  // Handle link click for mobile
  const handleLinkClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const menuItems = {
    patient: [
      { href: "/accounts/patient/dashboard", label: "แดชบอร์ด", icon: "🏠" },
      { href: "/accounts/patient/appointments", label: "การนัดหมาย", icon: "📅" },
      { href: "/accounts/patient/medications", label: "การจัดการยา", icon: "💊" },
      { href: "/accounts/patient/lab-results", label: "ผลตรวจ", icon: "🧪" },
      { href: "/accounts/patient/documents", label: "เอกสารการแพทย์", icon: "📄" },
      { href: "/accounts/patient/records", label: "บันทึกสุขภาพ", icon: "📋" },
      { href: "/accounts/patient/ai-insights", label: "AI Health Insights", icon: "🤖" },
      { href: "/accounts/patient/notifications", label: "การแจ้งเตือน", icon: "🔔" },
      { href: "/accounts/patient/consent-requests", label: "คำขอเข้าถึงข้อมูล", icon: "🔐" },
      { href: "/accounts/patient/profile", label: "ข้อมูลส่วนตัว", icon: "👤" },
    ],
    doctor: [
      { href: "/accounts/doctor/dashboard", label: "แดชบอร์ด", icon: "🏥" },
      { href: "/accounts/doctor/patients", label: "ผู้ป่วย", icon: "👥" },
      { href: "/accounts/doctor/appointments", label: "การนัดหมาย", icon: "📅" },
    ],
    admin: [
      { href: "/admin", label: "แดชบอร์ด", icon: "⚙️" },
      { href: "/accounts/admin/users", label: "ผู้ใช้งาน", icon: "👥" },
      { href: "/accounts/admin/reports", label: "รายงาน", icon: "📊" },
    ]
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/50 z-30 shadow-lg">
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="px-4 xl:px-6 py-4 border-b border-slate-200">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm xl:text-base">H</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-base xl:text-lg font-bold text-slate-800 truncate block">HealthChain</span>
                <p className="text-xs xl:text-sm text-slate-500 truncate">Health Management</p>
              </div>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 xl:px-4 py-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems[userType].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 xl:px-4 py-2.5 xl:py-3 text-sm xl:text-base rounded-lg transition-all duration-150 ease-out font-medium ${
                    pathname === item.href 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-slate-700 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg xl:text-xl">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="px-3 xl:px-4 py-3 border-t border-slate-200">
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs xl:text-sm">{getUserInitials()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm xl:text-base font-medium text-slate-700 block truncate" title={getDisplayName()}>
                  {getDisplayName()}
                </span>
                <p className="text-xs xl:text-sm text-slate-500 truncate" title={getRoleDisplay()}>
                  {getRoleDisplay()}
                </p>
                {user?.id && (
                  <p className="text-xs text-slate-400 truncate" title={`ID: ${user.id}`}>
                    ID: {user.id.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs xl:text-sm text-slate-600 hover:text-red-600 transition-all duration-150 ease-out rounded-lg hover:bg-red-50"
              >
                <span className="text-base xl:text-lg">🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 w-80 sm:w-72 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-200/50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
            <Link href="/" className="flex items-center space-x-3 flex-1 min-w-0" onClick={handleLinkClick}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">H</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg sm:text-xl font-bold text-slate-800 block truncate">HealthChain</span>
                <p className="text-xs sm:text-sm text-slate-500 truncate">Health Management System</p>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <div className="space-y-1 sm:space-y-2">
              {menuItems[userType].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 sm:py-4 text-base rounded-lg transition-all duration-150 ease-out font-medium ${
                    pathname === item.href 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-slate-700 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="px-4 py-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-lg">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">{getUserInitials()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-base sm:text-lg font-medium text-slate-700 block truncate" title={getDisplayName()}>
                  {getDisplayName()}
                </span>
                <p className="text-sm text-slate-500 truncate" title={getRoleDisplay()}>
                  {getRoleDisplay()}
                </p>
                {user?.id && (
                  <p className="text-xs text-slate-400 truncate" title={`ID: ${user.id}`}>
                    ID: {user.id.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-base text-slate-600 hover:text-red-600 transition-all duration-150 ease-out rounded-lg hover:bg-red-50"
              >
                <span className="text-lg sm:text-xl">🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
