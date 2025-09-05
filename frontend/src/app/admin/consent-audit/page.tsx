"use client";

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Shield,
  Activity,
  Database,
  Search,
  Building2,
  User
} from 'lucide-react';

// Mock data สำหรับรายงานการตรวจสอบ
const auditSummary = {
  totalConsentRequests: 1247,
  approvedRequests: 892,
  rejectedRequests: 67,
  pendingRequests: 23,
  emergencyAccess: 15,
  violationAlerts: 3,
  complianceRate: 94.2,
  averageResponseTime: 2.3, // วัน
  dataAccessCount: 2156,
  revokedConsents: 34
};

// Mock data สำหรับการละเมิดและการแจ้งเตือน
const violationAlerts = [
  {
    id: 'V001',
    type: 'unauthorized_access',
    severity: 'high',
    title: 'การเข้าถึงโดยไม่ได้รับอนุญาต',
    description: 'มีการพยายามเข้าถึงข้อมูลผู้ป่วย นาย สมชาย ใจดี โดยไม่มีการยินยอม',
    timestamp: '2024-01-15T14:30:00Z',
    involvedUser: 'Dr. ศิริชัย วงศ์ใหญ่',
    patientId: 'HN001234',
    action: 'blocked',
    resolved: false
  },
  {
    id: 'V002',
    type: 'expired_consent',
    severity: 'medium',
    title: 'การใช้งานการยินยอมที่หมดอายุ',
    description: 'การยินยอมของผู้ป่วย นางสาว มาลี สุใส หมดอายุแล้ว แต่ยังมีการเข้าถึงข้อมูล',
    timestamp: '2024-01-15T10:15:00Z',
    involvedUser: 'พย. สุภาพร ใจดี',
    patientId: 'HN005678',
    action: 'warning_sent',
    resolved: true
  },
  {
    id: 'V003',
    type: 'data_breach_attempt',
    severity: 'critical',
    title: 'ความพยายามในการรั่วไหลของข้อมูล',
    description: 'ตรวจพบการพยายามส่งออกข้อมูลผู้ป่วยจำนวนมากโดยไม่ได้รับอนุญาต',
    timestamp: '2024-01-14T16:45:00Z',
    involvedUser: 'Unknown User',
    patientId: 'Multiple',
    action: 'system_locked',
    resolved: false
  }
];

// Mock data สำหรับการใช้งานตามประเภทผู้ใช้
const usageByUserType = [
  { type: 'doctor', label: 'แพทย์', count: 156, percentage: 45.2 },
  { type: 'nurse', label: 'พยาบาล', count: 98, percentage: 28.4 },
  { type: 'insurance', label: 'บริษัทประกัน', count: 67, percentage: 19.4 },
  { type: 'research', label: 'การวิจัย', count: 24, percentage: 7.0 }
];

// Mock data สำหรับแนวโน้มรายเดือน
const monthlyTrends = [
  { month: 'ต.ค. 2023', requests: 89, approved: 82, rejected: 7 },
  { month: 'พ.ย. 2023', requests: 102, approved: 95, rejected: 7 },
  { month: 'ธ.ค. 2023', requests: 118, approved: 108, rejected: 10 },
  { month: 'ม.ค. 2024', requests: 145, approved: 134, rejected: 11 }
];

export default function ConsentAudit() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReportType, setSelectedReportType] = useState('compliance');
  const [searchTerm, setSearchTerm] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="text-red-600" size={16} />;
      case 'high': return <AlertTriangle className="text-orange-600" size={16} />;
      case 'medium': return <Clock className="text-yellow-600" size={16} />;
      case 'low': return <CheckCircle className="text-blue-600" size={16} />;
      default: return <CheckCircle className="text-gray-600" size={16} />;
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'doctor': return <User className="text-blue-600" size={16} />;
      case 'nurse': return <Users className="text-green-600" size={16} />;
      case 'insurance': return <Building2 className="text-purple-600" size={16} />;
      case 'research': return <FileText className="text-orange-600" size={16} />;
      default: return <User className="text-gray-600" size={16} />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              รายงานการตรวจสอบการยินยอม
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              วิเคราะห์และตรวจสอบการปฏิบัติตามกฎหมายการคุ้มครองข้อมูลส่วนบุคคล
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">7 วันที่ผ่านมา</option>
              <option value="30d">30 วันที่ผ่านมา</option>
              <option value="90d">90 วันที่ผ่านมา</option>
              <option value="1y">1 ปีที่ผ่านมา</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={16} />
              <span className="hidden sm:inline">ส่งออกรายงาน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="text-blue-600" size={16} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{auditSummary.totalConsentRequests.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600">คำขอทั้งหมด</p>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="text-green-600" size={16} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{auditSummary.complianceRate}%</p>
            <p className="text-xs sm:text-sm text-gray-600">อัตราการปฏิบัติตาม</p>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="text-yellow-600" size={16} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{auditSummary.averageResponseTime}</p>
            <p className="text-xs sm:text-sm text-gray-600">วัน (เฉลี่ย)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="text-red-600" size={16} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{auditSummary.violationAlerts}</p>
            <p className="text-xs sm:text-sm text-gray-600">การแจ้งเตือน</p>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Database className="text-purple-600" size={16} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{auditSummary.dataAccessCount.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600">การเข้าถึงข้อมูล</p>
          </div>
        </div>
      </div>

      {/* Charts and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">แนวโน้มรายเดือน</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-2" />
              <p>แผนภูมิการอนุมัติรายเดือน</p>
              <div className="mt-4 space-y-2">
                {monthlyTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{trend.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-600">{trend.requests} คำขอ</span>
                      <span className="text-green-600">{trend.approved} อนุมัติ</span>
                      <span className="text-red-600">{trend.rejected} ปฏิเสธ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Usage by User Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">การใช้งานตามประเภทผู้ใช้</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Eye size={16} className="text-gray-600" />
            </button>
          </div>
          <div className="space-y-3">
            {usageByUserType.map((usage, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {getUserTypeIcon(usage.type)}
                  <div>
                    <div className="font-medium text-gray-900">{usage.label}</div>
                    <div className="text-sm text-gray-600">{usage.count} คำขอ</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{usage.percentage}%</div>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${usage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Violation Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือนการละเมิด</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ค้นหาการแจ้งเตือน..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {violationAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <span className="px-2 py-1 bg-white border border-gray-200 text-xs rounded-full font-medium">
                        {alert.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ผู้ใช้: {alert.involvedUser}</span>
                      <span>ผู้ป่วย: {alert.patientId}</span>
                      <span>การดำเนินการ: {alert.action}</span>
                      <span>{new Date(alert.timestamp).toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.resolved ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      แก้ไขแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      รอการแก้ไข
                    </span>
                  )}
                  <button className="p-2 hover:bg-white rounded-lg transition-colors">
                    <Eye size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการปฏิบัติตาม PDPA</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="font-medium text-green-900">การยินยอมที่ถูกต้อง</span>
              </div>
              <span className="text-sm text-green-700">{auditSummary.approvedRequests} รายการ</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-600" size={16} />
                <span className="font-medium text-yellow-900">รออนุมัติ</span>
              </div>
              <span className="text-sm text-yellow-700">{auditSummary.pendingRequests} รายการ</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={16} />
                <span className="font-medium text-red-900">การละเมิด</span>
              </div>
              <span className="text-sm text-red-700">{auditSummary.violationAlerts} รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการที่แนะนำ</h3>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="text-blue-600" size={16} />
                <h4 className="font-medium text-gray-900">ปรับปรุงความปลอดภัย</h4>
              </div>
              <p className="text-sm text-gray-600">เพิ่มการตรวจสอบสิทธิ์แบบสองขั้นตอน</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="text-green-600" size={16} />
                <h4 className="font-medium text-gray-900">ติดตามการใช้งาน</h4>
              </div>
              <p className="text-sm text-gray-600">ตั้งค่าการแจ้งเตือนแบบเรียลไทม์</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="text-purple-600" size={16} />
                <h4 className="font-medium text-gray-900">อัปเดตนโยบาย</h4>
              </div>
              <p className="text-sm text-gray-600">ทบทวนเทมเพลตการยินยอมทุก 6 เดือน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
