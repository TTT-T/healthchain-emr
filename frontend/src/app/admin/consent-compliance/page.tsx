"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Users, 
  Building2, 
  Calendar, 
  RefreshCw, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { consentDashboardService, ComplianceAlert } from '@/services/consentDashboardService';
import { complianceService, ComplianceReport, ComplianceTrend, ComplianceStats } from '@/services/complianceService';

// Remove duplicate interfaces - using from complianceService

export default function ConsentCompliancePage() {
  const [stats, setStats] = useState<ComplianceStats>({
    totalAlerts: 0,
    highPriorityAlerts: 0,
    mediumPriorityAlerts: 0,
    lowPriorityAlerts: 0,
    resolvedAlerts: 0,
    pendingAlerts: 0,
    complianceScore: 0,
    lastAuditDate: '',
    trends: {
      scoreChange: 0,
      alertChange: 0,
      resolutionRate: 0
    }
  });
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [trends, setTrends] = useState<ComplianceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch alerts with fallback
      try {
        const alertsData = await consentDashboardService.getComplianceAlerts();
        setAlerts(alertsData || []);
      } catch (alertsError) {
        console.warn('Could not fetch compliance alerts, using fallback:', alertsError);
        setAlerts([]);
      }

      // Try to fetch reports with fallback
      try {
        const reportsData = await complianceService.getComplianceReports();
        setReports(reportsData?.data?.reports || []);
      } catch (reportsError) {
        console.warn('Could not fetch compliance reports, using fallback:', reportsError);
        setReports([]);
      }

      // Try to fetch trends with fallback
      try {
        const trendsData = await complianceService.getComplianceTrends();
        setTrends(trendsData?.data?.trends || []);
      } catch (trendsError) {
        console.warn('Could not fetch compliance trends, using fallback:', trendsError);
        setTrends([]);
      }

      // Try to fetch stats with fallback
      try {
        const statsData = await complianceService.getComplianceStats();
        setStats(statsData?.data || {
          totalAlerts: 0,
          highPriorityAlerts: 0,
          mediumPriorityAlerts: 0,
          lowPriorityAlerts: 0,
          resolvedAlerts: 0,
          pendingAlerts: 0,
          complianceScore: 0,
          lastAuditDate: '',
          trends: {
            scoreChange: 0,
            alertChange: 0,
            resolutionRate: 0
          }
        });
      } catch (statsError) {
        console.warn('Could not fetch compliance stats, using fallback:', statsError);
        setStats({
          totalAlerts: 0,
          highPriorityAlerts: 0,
          mediumPriorityAlerts: 0,
          lowPriorityAlerts: 0,
          resolvedAlerts: 0,
          pendingAlerts: 0,
          complianceScore: 0,
          lastAuditDate: '',
          trends: {
            scoreChange: 0,
            alertChange: 0,
            resolutionRate: 0
          }
        });
      }

    } catch (err) {
      console.error('Failed to fetch compliance data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium': return <Clock size={16} className="text-orange-600" />;
      case 'low': return <FileText size={16} className="text-blue-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      high: 'สูง',
      medium: 'ปานกลาง',
      low: 'ต่ำ'
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'scheduled': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      completed: 'เสร็จสิ้น',
      in_progress: 'กำลังดำเนินการ',
      scheduled: 'กำหนดการ'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeLabel = (type: string) => {
    const types = {
      audit: 'การตรวจสอบ',
      assessment: 'การประเมิน',
      review: 'การทบทวน'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="text-blue-600" />
              การปฏิบัติตามกฎเกณฑ์
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              ตรวจสอบและจัดการการปฏิบัติตามกฎหมาย PDPA และมาตรฐานความปลอดภัยข้อมูล
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Download size={16} />
              ส่งออกรายงาน
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">คะแนนการปฏิบัติตาม</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.complianceScore}%</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">คะแนนรวม</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">แจ้งเตือนทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalAlerts}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">ต้องตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-gray-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ความเสี่ยงสูง</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.highPriorityAlerts}</p>
              <p className="text-xs sm:text-sm text-red-600 mt-1 hidden sm:block">ต้องเร่งด่วน</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">แก้ไขแล้ว</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.resolvedAlerts}</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">จากทั้งหมด</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              แจ้งเตือนการปฏิบัติตาม
            </h3>
          </div>
          <div className="p-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
                <p className="text-gray-600">ไม่มีแจ้งเตือนการปฏิบัติตาม</p>
                <p className="text-sm text-gray-500">ระบบปฏิบัติตามกฎเกณฑ์อย่างถูกต้อง</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.is_resolved 
                          ? 'text-green-600 bg-green-50 border border-green-200' 
                          : 'text-yellow-600 bg-yellow-50 border border-yellow-200'
                      }`}>
                        {alert.is_resolved ? 'แก้ไขแล้ว' : 'รอแก้ไข'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                        <Eye size={14} />
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compliance Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              รายงานการตรวจสอบ
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {getTypeLabel(report.type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>
                    {report.score > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{report.score}%</div>
                        <div className="text-xs text-gray-500">คะแนน</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{new Date(report.date).toLocaleDateString('th-TH')}</span>
                    <div className="flex items-center gap-4">
                      {report.findings > 0 && (
                        <span>{report.findings} การพบ</span>
                      )}
                      {report.recommendations > 0 && (
                        <span>{report.recommendations} คำแนะนำ</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Trends */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} />
          แนวโน้มการปฏิบัติตาม
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="mx-auto mb-2 text-green-600" size={24} />
            <div className={`text-2xl font-bold ${stats.trends.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.trends.scoreChange >= 0 ? '+' : ''}{stats.trends.scoreChange}%
            </div>
            <div className="text-sm text-gray-600">คะแนนการปฏิบัติตาม</div>
            <div className="text-xs text-gray-500">เทียบกับเดือนที่แล้ว</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Activity className="mx-auto mb-2 text-blue-600" size={24} />
            <div className={`text-2xl font-bold ${stats.trends.alertChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.trends.alertChange >= 0 ? '+' : ''}{stats.trends.alertChange}
            </div>
            <div className="text-sm text-gray-600">จำนวนแจ้งเตือน</div>
            <div className="text-xs text-gray-500">เทียบกับเดือนที่แล้ว</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <CheckCircle className="mx-auto mb-2 text-purple-600" size={24} />
            <div className="text-2xl font-bold text-purple-600">{stats.trends.resolutionRate}%</div>
            <div className="text-sm text-gray-600">อัตราการแก้ไข</div>
            <div className="text-xs text-gray-500">ภายใน 7 วัน</div>
          </div>
        </div>
      </div>
    </div>
  );
}
