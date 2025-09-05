"use client";

import React from 'react';
import Link from 'next/link';
import { Users, Activity, Database, Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Building2, FileCheck, Heart } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-sm sm:text-base text-gray-600">จัดการและควบคุมระบบ HealthChain</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">จำนวนผู้ใช้</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">3</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">+12% จากเดือนที่แล้ว</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">รออนุมัติ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">2</p>
              <p className="text-xs sm:text-sm text-orange-600 mt-1 hidden sm:block">ต้องการการตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-orange-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">อนุมัติแล้ว</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">1</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">ผ่านการตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ถูกปฏิเสธ</p>
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-gray-600 mt-1">ไม่ผ่านการตรวจสอบ</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
          <div className="space-y-2">
            <Link href="/admin/pending-personnel" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="text-blue-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">ตรวจสอบบุคลากรใหม่</div>
                <div className="text-sm text-gray-500">2 คำขอรออนุมัติ</div>
              </div>
            </Link>
            <Link href="/admin/external-requesters" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="text-orange-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">จัดการผู้ขอข้อมูลภายนอก</div>
                <div className="text-sm text-gray-500">ตรวจสอบและอนุมัติองค์กร</div>
              </div>
            </Link>
            <Link href="/admin/role-management" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Shield className="text-purple-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">จัดการบทบาทและสิทธิ์</div>
                <div className="text-sm text-gray-500">กำหนดสิทธิ์การเข้าถึงระบบ</div>
              </div>
            </Link>
            <Link href="/admin/consent-dashboard" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileCheck className="text-indigo-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">จัดการการยินยอม</div>
                <div className="text-sm text-gray-500">ควบคุมและตรวจสอบการยินยอม</div>
              </div>
            </Link>
            <Link href="/admin/activity-logs" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="text-green-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">ดูกิจกรรมล่าสุด</div>
                <div className="text-sm text-gray-500">เช็คการใช้งานระบบ</div>
              </div>
            </Link>
            <Link href="/admin/database" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Database className="text-purple-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">จัดการฐานข้อมูล</div>
                <div className="text-sm text-gray-500">สำรองและบำรุงรักษา</div>
              </div>
            </Link>
            <Link href="/health" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="text-red-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">ตรวจสอบสถานะระบบ</div>
                <div className="text-sm text-gray-500">เช็คสุขภาพระบบและการเชื่อมต่อ</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">สถานะระบบ</h3>
            <Link href="/health" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ดูรายละเอียดทั้งหมด
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="font-medium text-green-900">เซิร์ฟเวอร์</span>
              </div>
              <span className="text-sm text-green-700">ออนไลน์</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="font-medium text-green-900">ฐานข้อมูล</span>
              </div>
              <span className="text-sm text-green-700">เชื่อมต่อแล้ว</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-600" size={16} />
                <span className="font-medium text-blue-900">การใช้งาน CPU</span>
              </div>
              <span className="text-sm text-blue-700">23%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="text-blue-600" size={16} />
                <span className="font-medium text-blue-900">พื้นที่เก็บข้อมูล</span>
              </div>
              <span className="text-sm text-blue-700">67% ใช้แล้ว</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="text-blue-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">นาย สมชาย ใจดี ขอสมัครเป็นแพทย์</p>
              <p className="text-sm text-gray-500">15/1/2567 - รออนุมัติ</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">รออนุมัติ</span>
          </div>
          <div className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">นางสาว มาลี สุใส ได้รับอนุมัติเป็นพยาบาล</p>
              <p className="text-sm text-gray-500">14/1/2567 - อนุมัติแล้ว</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">อนุมัติแล้ว</span>
          </div>
          <div className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="text-purple-600" size={16} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">ระบบสำรองข้อมูลอัตโนมัติเสร็จสิ้น</p>
              <p className="text-sm text-gray-500">13/1/2567 - ความถี่รายวัน</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">สำเร็จ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
