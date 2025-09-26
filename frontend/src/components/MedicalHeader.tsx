"use client";
import Link from "next/link";
import React from "react";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface MedicalHeaderProps {
  title: string;
  backHref?: string;
  userType: "doctor" | "nurse";
}

export default function MedicalHeader({ title, backHref, userType }: MedicalHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { notificationCount } = useNotifications();

  // Get user display name
  const getDisplayName = () => {
    if (!user) return userType === 'doctor' ? "แพทย์" : "พยาบาล";
    
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
    return user.email?.split('@')[0] || (userType === 'doctor' ? "แพทย์" : "พยาบาล");
  };

  // Get user title prefix
  const getUserTitle = () => {
    if (!user) return userType === 'doctor' ? "ดร." : "พ.";
    
    return userType === 'doctor' ? "ดร." : "พ.";
  };

  const themeConfig = {
    doctor: {
      color: "green",
      hoverColor: "hover:text-green-600",
      bgHover: "hover:bg-green-50",
      buttonHover: "hover:bg-green-50",
      iconColor: "text-green-600"
    },
    nurse: {
      color: "pink", 
      hoverColor: "hover:text-pink-600",
      bgHover: "hover:bg-pink-50",
      buttonHover: "hover:bg-pink-50",
      iconColor: "text-pink-600"
    }
  };

  const theme = themeConfig[userType];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm sticky top-0 z-30">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 ease-out"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Back Button */}
            {backHref && (
              <Link
                href={backHref}
                className={`text-slate-600 hover:text-slate-800 font-medium transition-all duration-200 ease-out flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 group`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm sm:text-base">กลับ</span>
              </Link>
            )}

            {/* Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`w-1.5 h-6 sm:w-2 sm:h-8 bg-gradient-to-b ${userType === 'doctor' ? 'from-green-400 to-green-600' : 'from-pink-400 to-pink-600'} rounded-full hidden sm:block`} />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Notifications with counter */}
            <Link
              href="/accounts/patient/notifications"
              className={`p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 ${theme.buttonHover} rounded-lg transition-all duration-200 ease-out relative group`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5v-5a5 5 0 00-10 0v5l-5 5h5m5 0v1a3 3 0 01-6 0v-1m6 0H9" />
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

            {/* Settings - Hidden on mobile */}
            <button className={`hidden md:block p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 ${theme.buttonHover} rounded-lg transition-all duration-200 ease-out group`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>

            {/* Profile */}
            <Link
              href={`/accounts/${userType}/profile`}
              className={`p-2 sm:p-2.5 ${theme.iconColor} ${theme.buttonHover} rounded-lg transition-all duration-200 ease-out group`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Mobile User Info - Only show on mobile */}
        <div className="mt-3 sm:hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${userType === 'doctor' ? 'bg-green-100' : 'bg-pink-100'} rounded-full flex items-center justify-center`}>
                <span className={`text-sm font-semibold ${userType === 'doctor' ? 'text-green-600' : 'text-pink-600'}`}>
                  {getUserTitle()}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{getUserTitle()}{getDisplayName()}</p>
                <p className="text-xs text-slate-600">{userType === 'doctor' ? 'แพทย์' : 'พยาบาล'}</p>
                {user?.id && (
                  <p className="text-xs text-slate-400" title={`ID: ${user.id}`}>
                    ID: {user.id.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">การแจ้งเตือน</p>
              <p className="text-sm font-medium text-slate-700">
                {notificationCount > 0 ? `${notificationCount} รายการ` : 'ไม่มี'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar (Optional) */}
        <div className="mt-4 hidden">
          <div className="w-full bg-slate-200 rounded-full h-1">
            <div className={`h-1 rounded-full ${userType === 'doctor' ? 'bg-green-500' : 'bg-pink-500'} transition-all duration-300`} style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    </header>
  );
}
