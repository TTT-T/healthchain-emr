"use client";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, showBackButton = false, backHref = "/", onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { notificationCount } = useNotifications();

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

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 w-full sticky top-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 w-0 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 ease-out"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            {/* Back button */}
            {showBackButton && (
              <Link
                href={backHref}
                className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-all duration-150 ease-out flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">กลับ</span>
              </Link>
            )}
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 truncate">{title}</h1>
          </div>
          
          {/* Right side content */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Notification bell with counter */}
            <Link 
              href="/accounts/patient/notifications"
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-150 ease-out group"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5v-5a5 5 0 00-10 0v5l-5 5h5m5 0v1a3 3 0 01-6 0v-1m6 0H9" />
              </svg>
              
              {/* Notification counter badge */}
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                  <span className="text-[10px] sm:text-xs leading-none">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                </div>
              )}
              
              {/* Hover tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {/* Arrow pointing up */}
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800 mx-auto"></div>
                {/* Tooltip content */}
                <div className="px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  {notificationCount > 0 ? `${notificationCount} การแจ้งเตือนใหม่` : 'ไม่มีการแจ้งเตือนใหม่'}
                </div>
              </div>
            </Link>
            {/* User menu */}
            <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">{getUserInitials()}</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <span className="text-sm font-medium text-slate-700 block truncate" title={getDisplayName()}>
                  {getDisplayName()}
                </span>
                <p className="text-xs text-slate-500 truncate" title={getRoleDisplay()}>
                  {getRoleDisplay()}
                </p>
                {user?.id && (
                  <p className="text-xs text-slate-400 truncate" title={`ID: ${user.id}`}>
                    ID: {user.id.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
