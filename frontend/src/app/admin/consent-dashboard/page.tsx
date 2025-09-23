"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  FileText,
  Activity,
  Bell,
  Zap,
  Loader2
} from 'lucide-react';
import { 
  consentDashboardService, 
  ConsentStats, 
  ConsentRequest, 
  ConsentContract, 
  ComplianceAlert,
  ConsentDashboardOverview 
} from '@/services/consentDashboardService';

export default function ConsentDashboardPage() {
  const [stats, setStats] = useState<ConsentStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    activeContracts: 0,
    expiredContracts: 0,
    dailyAccess: 0,
    violationAlerts: 0
  });
  const [recentRequests, setRecentRequests] = useState<ConsentRequest[]>([]);
  const [activeContracts, setActiveContracts] = useState<ConsentContract[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const overview = await consentDashboardService.getOverview();
      setStats(overview.stats);
      setRecentRequests(overview.recentRequests);
      setActiveContracts(overview.activeContracts);
      setComplianceAlerts(overview.complianceAlerts);
    } catch (err: any) {
      console.error('Error fetching consent dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'approved': 
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': 
      case 'patient_reviewing':
      case 'sent_to_patient':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected': 
      case 'revoked': 
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expired': 
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'suspended': 
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default: 
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': 
      case 'approved': 
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': 
      case 'patient_reviewing':
      case 'sent_to_patient':
        return <Clock size={16} className="text-yellow-600" />;
      case 'rejected': 
      case 'revoked': 
        return <XCircle size={16} className="text-red-600" />;
      case 'expired': 
        return <XCircle size={16} className="text-gray-600" />;
      case 'suspended': 
        return <AlertTriangle size={16} className="text-orange-600" />;
      default: 
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertColor = (type: string) => {
    if (type === 'violation') return 'text-red-600 bg-red-50 border-red-200';
    if (type === 'warning') return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  const unreadAlerts = complianceAlerts.filter(alert => !alert.is_read).length;

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
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
              Consent Engine Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              จัดการระบบการยินยอมและการเข้าถึงข้อมูลทางการแพทย์
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">คำขอทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">รออนุมัติ: {stats.pendingRequests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">สัญญาที่ใช้งาน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.activeContracts}</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">หมดอายุ: {stats.expiredContracts}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">การเข้าถึงวันนี้</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.dailyAccess}</p>
              <p className="text-xs sm:text-sm text-purple-600 mt-1 hidden sm:block">+12% จากเมื่อวาน</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="text-purple-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">แจ้งเตือน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.violationAlerts}</p>
              <p className="text-xs sm:text-sm text-red-600 mt-1 hidden sm:block">ต้องตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
              <AlertTriangle className="text-red-600" size={16} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="text-blue-600" size={20} />
            การดำเนินการด่วน
          </h3>
          <div className="space-y-2">
            <Link href="/admin/consent-requests" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="text-blue-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">ตรวจสอบคำขอใหม่</div>
                <div className="text-sm text-gray-500">{stats.pendingRequests} คำขอรออนุมัติ</div>
              </div>
            </Link>
            <Link href="/admin/consent-contracts" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Shield className="text-green-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">จัดการสัญญา</div>
                <div className="text-sm text-gray-500">{stats.activeContracts} สัญญาที่ใช้งาน</div>
              </div>
            </Link>
            <Link href="/admin/consent-audit" className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <AlertTriangle className="text-red-600" size={20} />
              <div className="text-left">
                <div className="font-medium text-gray-900">รายงานการตรวจสอบ</div>
                <div className="text-sm text-gray-500">{stats.violationAlerts} แจ้งเตือน</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="text-orange-600" size={20} />
              คำขอล่าสุด
            </h3>
            <Link href="/admin/consent-requests" className="text-sm text-blue-600 hover:text-blue-800">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{request.requester_name}</div>
                    <div className="text-sm text-gray-500">ผู้ป่วย: {request.patient_name}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {getStatusIcon(request.status)}
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                      {request.status === 'patient_reviewing' && 'ผู้ป่วยกำลังพิจารณา'}
                      {request.status === 'pending' && 'รออนุมัติ'}
                      {request.status === 'approved' && 'อนุมัติแล้ว'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(request.urgency_level)}`}>
                    {request.urgency_level === 'emergency' && 'ฉุกเฉิน'}
                    {request.urgency_level === 'urgent' && 'เร่งด่วน'}
                    {request.urgency_level === 'normal' && 'ปกติ'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDaring('th-TH')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="text-red-600" size={20} />
              แจ้งเตือน Compliance
              {unreadAlerts > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {unreadAlerts} ใหม่
                </span>
              )}
            </h3>
            <Link href="/admin/consent-compliance" className="text-sm text-blue-600 hover:text-blue-800">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {complianceAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-3 ${!alert.is_read ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1">
                    {alert.type === 'violation' && <AlertTriangle className="text-red-600" size={16} />}
                    {alert.type === 'warning' && <AlertTriangle className="text-orange-600" size={16} />}
                    {alert.type === 'info' && <Bell className="text-blue-600" size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{alert.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{alert.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getAlertColor(alert.type)}`}>
                        {alert.severity === 'high' && 'สูง'}
                        {alert.severity === 'medium' && 'กลาง'}
                        {alert.severity === 'low' && 'ต่ำ'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleDaring('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Contracts Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            สัญญาการยินยอมที่ใช้งาน
          </h3>
          <Link href="/admin/consent-contracts" className="text-sm text-blue-600 hover:text-blue-800">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Contract ID</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">ผู้ป่วย</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">ผู้ขอข้อมูล</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">การใช้งาน</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">วันหมดอายุ</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-sm font-medium text-blue-600">{contract.contract_id}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    <div>{contract.patient_name}</div>
                    <div className="text-xs text-gray-500">{contract.patient_hn}</div>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">{contract.requester_name}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: contract.max_access_count 
                              ? `${(contract.access_count / contract.max_access_count) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {contract.access_count}/{contract.max_access_count || '∞'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {new Date(contract.valid_until).toLocaleDaring('th-TH')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(contract.status)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(contract.status)}`}>
                        {contract.status === 'active' && 'ใช้งานได้'}
                        {contract.status === 'expired' && 'หมดอายุ'}
                        {contract.status === 'revoked' && 'ยกเลิก'}
                        {contract.status === 'suspended' && 'ระงับ'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}