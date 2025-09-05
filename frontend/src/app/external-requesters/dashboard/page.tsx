"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function ExternalRequesterDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="text-gray-600">ระบบจัดการคำขอข้อมูลสุขภาพ</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12.5% จากเดือนที่แล้ว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              รอการอนุมัติ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อนุมัติแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              82.1% ของคำขอทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปฏิเสธ</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3.2% ของคำขอทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              คำขอข้อมูลใหม่
            </CardTitle>
            <CardDescription>
              สร้างคำขอข้อมูลสุขภาพใหม่
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">คำขอข้อมูลผู้ป่วย</div>
              <div className="text-sm text-gray-600">ขอข้อมูลประวัติการรักษา</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">คำขอผลแล็บ</div>
              <div className="text-sm text-gray-600">ขอข้อมูลผลการตรวจแล็บ</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">คำขอข้อมูลสถิติ</div>
              <div className="text-sm text-gray-600">ขอข้อมูลสถิติทางการแพทย์</div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              การติดตามคำขอ
            </CardTitle>
            <CardDescription>
              ติดตามสถานะคำขอข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">คำขอที่รอดำเนินการ</div>
              <div className="text-sm text-gray-600">ดูคำขอที่ยังไม่ได้รับการอนุมัติ</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">ประวัติคำขอ</div>
              <div className="text-sm text-gray-600">ดูประวัติคำขอทั้งหมด</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">รายงานการใช้งาน</div>
              <div className="text-sm text-gray-600">ดูสถิติการใช้งานระบบ</div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>คำขอล่าสุด</CardTitle>
          <CardDescription>
            คำขอข้อมูลสุขภาพล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">คำขอข้อมูลผู้ป่วย - ID: 12345</div>
                <div className="text-sm text-gray-600">รอดำเนินการ - ส่งเมื่อ 2 ชั่วโมงที่แล้ว</div>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">รอดำเนินการ</span>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">คำขอผลแล็บ - ID: 12344</div>
                <div className="text-sm text-gray-600">อนุมัติแล้ว - ส่งเมื่อ 1 วันที่แล้ว</div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">อนุมัติแล้ว</span>
            </div>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">คำขอข้อมูลสถิติ - ID: 12343</div>
                <div className="text-sm text-gray-600">ปฏิเสธ - ส่งเมื่อ 3 วันที่แล้ว</div>
              </div>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">ปฏิเสธ</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
