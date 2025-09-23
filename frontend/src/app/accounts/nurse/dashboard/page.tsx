"use client";
import React from "react";
import MedicalHeader from "@/components/MedicalHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function NurseDashboard() {
  const { user } = useAuth();

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "พยาบาล";
    
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
    return user.email?.split('@')[0] || "พยาบาล";
  };

  return (
    <>
      <MedicalHeader title="แดชบอร์ดพยาบาล" userType="nurse" />
      
      <div className="p-6 md:p-8">
        {/* Welcome Section */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
            ยินดีต้อนรับ, พ.{getDisplayName()}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">ผู้ป่วยในความดูแล</p>
                <p className="text-2xl font-bold text-slate-900">28</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">ยาที่ต้องให้</p>
                <p className="text-2xl font-bold text-slate-900">45</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">แจ้งเตือน</p>
                <p className="text-2xl font-bold text-slate-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">งานเสร็จแล้ว</p>
                <p className="text-2xl font-bold text-slate-900">23</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">การดำเนินการด่วน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-4 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-xl">👩‍⚕️</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">ผู้ป่วยของฉัน</p>
                <p className="text-sm text-slate-600">ดูรายชื่อผู้ป่วย</p>
              </div>
            </button>

            <button className="flex items-center p-4 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-xl">💊</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">ยาและการรักษา</p>
                <p className="text-sm text-slate-600">จัดการยาผู้ป่วย</p>
              </div>
            </button>

            <button className="flex items-center p-4 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">บันทึกการพยาบาล</p>
                <p className="text-sm text-slate-600">เขียนบันทึกรายวัน</p>
              </div>
            </button>

            <button className="flex items-center p-4 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-xl">📅</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">ตารางงาน</p>
                <p className="text-sm text-slate-600">ดูตารางการทำงาน</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
