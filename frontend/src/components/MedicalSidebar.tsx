"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from '@/lib/logger';

interface MedicalSidebarProps {
  userType: "doctor" | "nurse";
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalSidebar({ userType, isOpen, onClose }: MedicalSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const menuItems = userType === "doctor" ? [
    { href: "/accounts/doctor/dashboard", label: "แดชบอร์ด", icon: "🏥" },
    { href: "/accounts/doctor/patients", label: "ผู้ป่วยของฉัน", icon: "👥" },
    { href: "/accounts/doctor/appointments", label: "การนัดหมาย", icon: "📅" },
    { href: "/accounts/doctor/profile", label: "ข้อมูลส่วนตัว", icon: "👨‍⚕️" },
  ] : [
    { href: "/accounts/nurse/dashboard", label: "แดชบอร์ด", icon: "🏥" },
    { href: "/accounts/nurse/patients", label: "ผู้ป่วยในความดูแล", icon: "👥" },
    { href: "/accounts/nurse/schedules", label: "ตารางการทำงาน", icon: "📅" },
    { href: "/accounts/nurse/profile", label: "ข้อมูลส่วนตัว", icon: "👩‍⚕️" },
  ];

  const themeConfig = {
    doctor: {
      color: "green",
      bgColor: "bg-green-500",
      bgGradient: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:text-green-600",
      activeColor: "bg-green-100 text-green-700 border-green-300",
      userBg: "bg-green-300",
      userText: "text-green-700",
      letter: "D",
      title: "Doctor Panel",
      userName: "หมอสมชาย",
      userRole: "แพทย์",
      iconBg: "bg-green-50",
      iconColor: "text-green-600"
    },
    nurse: {
      color: "pink",
      bgColor: "bg-pink-500",
      bgGradient: "bg-gradient-to-br from-pink-500 to-pink-600",
      hoverColor: "hover:text-pink-600",
      activeColor: "bg-pink-100 text-pink-700 border-pink-300",
      userBg: "bg-pink-300",
      userText: "text-pink-700",
      letter: "N",
      title: "Nurse Panel",
      userName: "พยาบาลสมหญิง",
      userRole: "พยาบาล",
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600"
    }
  };

  const theme = themeConfig[userType];

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      if (window.innerWidth < 768) {
        onClose();
      }
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  // Close sidebar when clicking on a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Close sidebar when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/50 z-40 shadow-sm">
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="px-4 xl:px-6 py-4 border-b border-slate-200/70 h-[73px] flex items-center">
            <Link href={`/accounts/${userType}/dashboard`} className="flex items-center space-x-3 group w-full">
              <div className={`w-10 h-10 xl:w-12 xl:h-12 ${theme.bgGradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-200`}>
                <span className="text-white font-bold text-lg xl:text-xl">{theme.letter}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lg xl:text-xl font-bold text-slate-800 tracking-tight block truncate">{theme.title}</span>
                <p className="text-xs xl:text-sm text-slate-500 truncate">HealthChain System</p>
              </div>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 xl:px-4 py-4 xl:py-6 overflow-y-auto">
            <div className="space-y-1 xl:space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 xl:px-4 py-2.5 xl:py-3 text-sm xl:text-base text-slate-700 hover:bg-slate-50 ${theme.hoverColor} rounded-xl transition-all duration-200 ease-out group font-medium border border-transparent ${
                    pathname === item.href ? `${theme.activeColor} shadow-sm border-current` : "hover:shadow-sm"
                  }`}
                >
                  <div className={`w-7 h-7 xl:w-8 xl:h-8 ${pathname === item.href ? theme.iconBg : 'bg-slate-100'} rounded-lg flex items-center justify-center ${pathname === item.href ? theme.iconColor : 'text-slate-600'} transition-all duration-200 flex-shrink-0`}>
                    <span className="text-base xl:text-lg">{item.icon}</span>
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="px-3 xl:px-4 py-4 border-t border-slate-200/70">
            <div className="flex items-center space-x-3 p-3 xl:p-4 bg-slate-50/80 rounded-xl border border-slate-200/50 backdrop-blur-sm">
              <div className={`w-10 h-10 xl:w-12 xl:h-12 ${theme.userBg} rounded-full flex items-center justify-center shadow-sm flex-shrink-0`}>
                <span className={`${theme.userText} font-bold text-sm xl:text-base`}>{userType === "doctor" ? "Dr" : "Nu"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm xl:text-base font-semibold text-slate-800 truncate">{theme.userName}</p>
                <p className="text-xs xl:text-sm text-slate-500 truncate">{theme.userRole}</p>
              </div>
            </div>
            
            <div className="mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 xl:px-4 py-2.5 xl:py-3 text-sm xl:text-base text-slate-600 hover:text-red-600 font-medium transition-all duration-200 ease-out rounded-xl hover:bg-red-50 group"
              >
                <div className="w-7 h-7 xl:w-8 xl:h-8 bg-slate-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0">
                  <span className="text-base xl:text-lg">🚪</span>
                </div>
                <span className="truncate">ออกจากระบบ</span>
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
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/70 h-[73px]">
            <Link href={`/accounts/${userType}/dashboard`} className="flex items-center space-x-3 flex-1 min-w-0" onClick={handleLinkClick}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.bgGradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <span className="text-white font-bold text-lg sm:text-xl">{theme.letter}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lg sm:text-xl font-bold text-slate-800 block truncate">{theme.title}</span>
                <p className="text-xs sm:text-sm text-slate-500 truncate">HealthChain System</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 sm:py-6 overflow-y-auto">
            <div className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center space-x-3 px-4 py-3 sm:py-4 text-base text-slate-700 hover:bg-slate-50 ${theme.hoverColor} rounded-xl transition-all duration-200 ease-out group font-medium border border-transparent ${
                    pathname === item.href ? `${theme.activeColor} shadow-sm border-current` : "hover:shadow-sm"
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${pathname === item.href ? theme.iconBg : 'bg-slate-100'} rounded-lg flex items-center justify-center ${pathname === item.href ? theme.iconColor : 'text-slate-600'} transition-all duration-200 flex-shrink-0`}>
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Mobile User Section */}
          <div className="px-4 py-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/50">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${theme.userBg} rounded-full flex items-center justify-center shadow-sm flex-shrink-0`}>
                <span className={`${theme.userText} font-bold text-sm sm:text-base`}>{userType === "doctor" ? "Dr" : "Nu"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-slate-800 truncate">{theme.userName}</p>
                <p className="text-sm text-slate-500 truncate">{theme.userRole}</p>
              </div>
            </div>
            
            <div className="mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 sm:py-4 text-base text-slate-600 hover:text-red-600 font-medium transition-all duration-200 ease-out rounded-xl hover:bg-red-50 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0">
                  <span className="text-lg sm:text-xl">🚪</span>
                </div>
                <span className="truncate">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
