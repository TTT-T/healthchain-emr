"use client";

import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';

interface ConsentStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeContracts: number;
  expiredContracts: number;
  violationAlerts: number;
  dailyAccess: number;
}

interface ConsentRequest {
  id: string;
  requestId: string;
  requesterName: string;
  requesterType: 'hospital' | 'clinic' | 'insurance' | 'research' | 'government';
  patientName: string;
  patientHN: string;
  requestType: 'hospital_transfer' | 'insurance_claim' | 'research' | 'legal' | 'emergency';
  requestedDataTypes: string[];
  purpose: string;
  urgencyLevel: 'emergency' | 'urgent' | 'normal';
  status: 'pending' | 'sent_to_patient' | 'patient_reviewing' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  isCompliant: boolean;
  complianceNotes?: string;
}

interface ConsentContract {
  id: string;
  contractId: string;
  patientName: string;
  patientHN: string;
  requesterName: string;
  contractType: string;
  allowedDataTypes: string[];
  validFrom: string;
  validUntil: string;
  accessCount: number;
  maxAccessCount?: number;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  lastAccessed?: string;
}

interface ComplianceAlert {
  id: string;
  type: 'violation' | 'warning' | 'info';
  title: string;
  description: string;
  contractId?: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  isRead: boolean;
}

const mockStats: ConsentStats = {
  totalRequests: 156,
  pendingRequests: 8,
  approvedRequests: 128,
  rejectedRequests: 20,
  activeContracts: 89,
  expiredContracts: 67,
  violationAlerts: 3,
  dailyAccess: 234
};

const mockRecentRequests: ConsentRequest[] = [
  {
    id: '1',
    requestId: 'CR-2025-001',
    requesterName: 'โรงพยาบาลศิริราช',
    requesterType: 'hospital',
    patientName: 'นายสมชาย ใจดี',
    patientHN: 'HN2024001',
    requestType: 'hospital_transfer',
    requestedDataTypes: ['medical_history', 'lab_results', 'vital_signs'],
    purpose: 'ส่งต่อผู้ป่วยเพื่อรักษาต่อเนื่อง - โรคหัวใจ',
    urgencyLevel: 'urgent',
    status: 'patient_reviewing',
    createdAt: '2025-07-03T09:30:00Z',
    expiresAt: '2025-07-10T09:30:00Z',
    isCompliant: true
  },
  {
    id: '2',
    requestId: 'CR-2025-002',
    requesterName: 'บริษัท ไทยประกันชีวิต จำกัด',
    requesterType: 'insurance',
    patientName: 'นางสาวมาลี สุขใส',
    patientHN: 'HN2024002',
    requestType: 'insurance_claim',
    requestedDataTypes: ['diagnosis', 'treatment_cost', 'discharge_summary'],
    purpose: 'ประกันสุขภาพ - เคลมค่ารักษา',
    urgencyLevel: 'normal',
    status: 'pending',
    createdAt: '2025-07-03T14:15:00Z',
    expiresAt: '2025-07-17T14:15:00Z',
    isCompliant: true
  },
  {
    id: '3',
    requestId: 'CR-2025-003',
    requesterName: 'โรงพยาบาลธรรมศาสตร์',
    requesterType: 'hospital',
    patientName: 'นายประยุทธ์ สุขสันต์',
    patientHN: 'HN2024003',
    requestType: 'emergency',
    requestedDataTypes: ['medical_history', 'current_medications', 'allergies'],
    purpose: 'อุบัติเหตุ - ต้องการข้อมูลเร่งด่วน',
    urgencyLevel: 'emergency',
    status: 'approved',
    createdAt: '2025-07-03T16:45:00Z',
    expiresAt: '2025-07-04T16:45:00Z',
    isCompliant: true
  }
];

const mockActiveContracts: ConsentContract[] = [
  {
    id: '1',
    contractId: 'CC-2025-001',
    patientName: 'นายสมชาย ใจดี',
    patientHN: 'HN2024001',
    requesterName: 'โรงพยาบาลศิริราช',
    contractType: 'hospital_transfer',
    allowedDataTypes: ['medical_history', 'lab_results'],
    validFrom: '2025-06-20T09:00:00Z',
    validUntil: '2025-07-20T09:00:00Z',
    accessCount: 8,
    maxAccessCount: 15,
    status: 'active',
    lastAccessed: '2025-07-02T14:30:00Z'
  },
  {
    id: '2',
    contractId: 'CC-2025-002',
    patientName: 'นางสาวมาลี สุขใส',
    patientHN: 'HN2024002',
    requesterName: 'บริษัท ไทยประกันชีวิต',
    contractType: 'insurance_claim',
    allowedDataTypes: ['diagnosis', 'billing'],
    validFrom: '2025-06-15T10:00:00Z',
    validUntil: '2025-07-15T10:00:00Z',
    accessCount: 3,
    maxAccessCount: 5,
    status: 'active',
    lastAccessed: '2025-07-01T11:20:00Z'
  }
];

const mockComplianceAlerts: ComplianceAlert[] = [
  {
    id: '1',
    type: 'violation',
    title: 'การเข้าถึงข้อมูลเกินขอบเขต',
    description: 'โรงพยาบาลภายนอกพยายามเข้าถึงข้อมูล lab results ที่ไม่ได้รับอনุญาต',
    contractId: 'CC-2025-001',
    severity: 'high',
    createdAt: '2025-07-03T10:15:00Z',
    isRead: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Consent ใกล้หมดอายุ',
    description: 'มี 5 consent contracts ที่จะหมดอายุในอีก 3 วัน',
    severity: 'medium',
    createdAt: '2025-07-03T08:30:00Z',
    isRead: false
  },
  {
    id: '3',
    type: 'info',
    title: 'การอัปเดต Compliance Template',
    description: 'มีการอัปเดต PDPA template สำหรับ consent forms',
    severity: 'low',
    createdAt: '2025-07-02T16:00:00Z',
    isRead: true
  }
];

export default function ConsentDashboardPage() {
  const [stats] = useState<ConsentStats>(mockStats);
  const [recentRequests] = useState<ConsentRequest[]>(mockRecentRequests);
  const [activeContracts] = useState<ConsentContract[]>(mockActiveContracts);
  const [complianceAlerts] = useState<ComplianceAlert[]>(mockComplianceAlerts);
  const [loading, setLoading] = useState(false);

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

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const unreadAlerts = complianceAlerts.filter(alert => !alert.isRead).length;

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
                    <div className="font-medium text-gray-900 truncate">{request.requesterName}</div>
                    <div className="text-sm text-gray-500">ผู้ป่วย: {request.patientName}</div>
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
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(request.urgencyLevel)}`}>
                    {request.urgencyLevel === 'emergency' && 'ฉุกเฉิน'}
                    {request.urgencyLevel === 'urgent' && 'เร่งด่วน'}
                    {request.urgencyLevel === 'normal' && 'ปกติ'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('th-TH')}
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
              <div key={alert.id} className={`border rounded-lg p-3 ${!alert.isRead ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
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
                        {new Date(alert.createdAt).toLocaleDateString('th-TH')}
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
                  <td className="py-3 px-3 text-sm font-medium text-blue-600">{contract.contractId}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    <div>{contract.patientName}</div>
                    <div className="text-xs text-gray-500">{contract.patientHN}</div>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">{contract.requesterName}</td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: contract.maxAccessCount 
                              ? `${(contract.accessCount / contract.maxAccessCount) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {contract.accessCount}/{contract.maxAccessCount || '∞'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {new Date(contract.validUntil).toLocaleDateString('th-TH')}
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
