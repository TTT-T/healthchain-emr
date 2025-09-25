"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api'
import { DashboardData } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ExternalRequesterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getExternalRequestersDashboardOverview();
        
        if (response.statusCode === 200 && response.data) {
          setDashboardData(response.data as DashboardData);
        } else {
          setError('ไม่สามารถโหลดข้อมูลได้');
        }
      } catch (error) {
        logger.error('Error loading dashboard data:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{dashboardData?.totalRequests || 0}</div>
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
            <div className="text-2xl font-bold">{dashboardData?.pendingRequests || 0}</div>
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
            <div className="text-2xl font-bold">{dashboardData?.approvedRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.totalRequests ? Math.round((dashboardData.approvedRequests / dashboardData.totalRequests) * 100) : 0}% ของคำขอทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปฏิเสธ</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.rejectedRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.totalRequests ? Math.round((dashboardData.rejectedRequests / dashboardData.totalRequests) * 100) : 0}% ของคำขอทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              การใช้งานรายเดือน
            </CardTitle>
            <CardDescription>
              จำนวนคำขอที่ใช้ในเดือนนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData?.monthlyUsage || 0}</div>
            <div className="text-sm text-gray-600">
              จาก {dashboardData?.maxMonthlyUsage || 100} คำขอที่อนุญาต
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${dashboardData?.maxMonthlyUsage ? (dashboardData.monthlyUsage / dashboardData.maxMonthlyUsage) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

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
            {dashboardData?.recentRequests && dashboardData.recentRequests.length > 0 ? (
              dashboardData.recentRequests.map((request, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    request.status === 'approved' ? 'bg-green-500' :
                    request.status === 'pending' ? 'bg-yellow-500' :
                    request.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{request.requestType} - ID: {request.id}</div>
                    <div className="text-sm text-gray-600">
                      {request.status === 'approved' ? 'อนุมัติแล้ว' :
                       request.status === 'pending' ? 'รอดำเนินการ' :
                       request.status === 'rejected' ? 'ปฏิเสธ' : request.status} - 
                      ส่งเมื่อ {request.createdAt ? new Date(request.createdAt).toLocaleString('th-TH') : 'ไม่ระบุ'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status === 'approved' ? 'อนุมัติแล้ว' :
                     request.status === 'pending' ? 'รอดำเนินการ' :
                     request.status === 'rejected' ? 'ปฏิเสธ' : request.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มีคำขอข้อมูล</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}