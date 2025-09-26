"use client";

import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Bell, Search, User, Settings, LogOut, Heart } from 'lucide-react';
import { logger } from '@/lib/logger';

interface EMRHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export default function EMRHeader({ title, subtitle, onToggleSidebar }: EMRHeaderProps) {
  const { logout } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 min-w-0">
        {/* Left Section */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu size={20} className="text-gray-600" />
          </button>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2 truncate">
              <Heart className="text-blue-600 flex-shrink-0" size={20} />
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
              <p className="text-xs lg:text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Search */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาผู้ป่วย..."
              className="pl-10 pr-4 py-2 w-48 xl:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">5</span>
            </span>
          </button>

          {/* User Menu */}
          <div className="relative group flex-shrink-0">
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={14} />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-medium text-gray-900">แพทย์</div>
                <div className="text-xs text-gray-500">Medical Staff</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-900 text-sm">แพทย์</div>
                  <div className="text-xs text-gray-500">doctor@healthchain.com</div>
                </div>
                <div className="mt-2 space-y-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <User size={16} className="text-gray-400" />
                    โปรไฟล์
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <Settings size={16} className="text-gray-400" />
                    ตั้งค่า
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut size={16} className="text-red-500" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
