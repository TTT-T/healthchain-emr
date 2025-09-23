"use client";
import React from "react";
import MedicalHeader from "@/components/MedicalHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function DoctorDashboard() {
  const { user } = useAuth();

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "แพทย์";
    
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
    return user.email?.split('@')[0] || "แพทย์";
  };

  return (
    <>
      <MedicalHeader title="แดชบอร์ดแพทย์" userType="doctor" />
      
      {/* Main Container with responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Welcome Section - Mobile First */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
            ยินดีต้อนรับ, ดร.{getDisplayName()}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            วันนี้ {new Date().toLocaleDaring('th-TH')} • {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {user?.id && (
            <p className="text-xs text-slate-500 mt-1">
              ID: {user.id} • Role: {user.role}
            </p>
          )}
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Stats Cards - Optimized for all screen sizes */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-2xl">👥</span>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">ผู้ป่วยทั้งหมด</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">145</p>
                <p className="text-xs text-green-600 hidden sm:block">+12 จากเดือนที่แล้ว</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-2xl">📅</span>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">นัดหมายวันนี้</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">12</p>
                <p className="text-xs text-blue-600 hidden sm:block">2 นัดรอยืนยัน</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-2xl">⏰</span>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">กำลังรอ</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-yellow-600 hidden sm:block">เฉลี่ย 15 นาที</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-2xl">✅</span>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">เสร็จสิ้นแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">9</p>
                <p className="text-xs text-green-600 hidden sm:block">ของวันนี้</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule - Mobile Priority */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">ตารางนัดหมายวันนี้</h3>
            <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
              ดูทั้งหมด
            </button>
          </div>
          <div className="space-y-3">
            {/* Appointment Item - Responsive */}
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm sm:text-base font-medium text-blue-600">09:00</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-slate-800 truncate">นายสมศักดิ์ ใจดี</p>
                <p className="text-xs sm:text-sm text-slate-600">ตรวจสุขภาพประจำปี • ห้อง 201</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  พร้อม
                </span>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm sm:text-base font-medium text-yellow-600">10:30</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium text-slate-800 truncate">นางสาวพิมพ์ใจ สวยงาม</p>
                <p className="text-xs sm:text-sm text-slate-600">ตรวจติดตาม • ห้อง 201</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  รอ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Responsive Grid */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Quick Action Buttons - Mobile Optimized */}
            <button className="flex flex-col sm:flex-row items-center p-3 sm:p-4 text-center sm:text-left hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:bg-green-200 transition-colors">
                <span className="text-lg sm:text-xl">👨‍⚕️</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-slate-800">ดูผู้ป่วย</p>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">รายชื่อผู้ป่วยทั้งหมด</p>
              </div>
            </button>

            <button className="flex flex-col sm:flex-row items-center p-3 sm:p-4 text-center sm:text-left hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:bg-blue-200 transition-colors">
                <span className="text-lg sm:text-xl">📅</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-slate-800">นัดหมาย</p>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">จัดการนัดหมาย</p>
              </div>
            </button>

            <button className="flex flex-col sm:flex-row items-center p-3 sm:p-4 text-center sm:text-left hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:bg-purple-200 transition-colors">
                <span className="text-lg sm:text-xl">📝</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-slate-800">เขียนใบสั่งยา</p>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">สร้างใบสั่งยาใหม่</p>
              </div>
            </button>

            <button className="flex flex-col sm:flex-row items-center p-3 sm:p-4 text-center sm:text-left hover:bg-slate-50 rounded-lg transition-colors group">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3 group-hover:bg-orange-200 transition-colors">
                <span className="text-lg sm:text-xl">📊</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-slate-800">รายงาน</p>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">ดูรายงานสถิติ</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activities - Desktop/Tablet Only */}
        <div className="hidden lg:block bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">กิจกรรมล่าสุด</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-medium text-blue-600">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">บันทึกการรักษาผู้ป่วย นายสมชาย ใจดี</p>
                <p className="text-xs text-slate-600">15 นาทีที่แล้ว</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-medium text-green-600">💊</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">เขียนใบสั่งยาให้ นางสาวพิมพ์ใจ สวยงาม</p>
                <p className="text-xs text-slate-600">1 ชั่วโมงที่แล้ว</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
