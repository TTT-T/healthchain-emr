'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar,
  Building2,
  FileText,
  Filter,
  Search,
  RefreshCw,
  Bell,
  User
} from 'lucide-react';

interface ConsentRequest {
  id: string;
  request_id: string;
  requester_name: string;
  requester_organization: string;
  request_type: string;
  purpose: string;
  data_types: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  requested_at: string;
  expires_at: string;
  responded_at?: string;
  response_reason?: string;
  is_expired: boolean;
  urgency_level: 'normal' | 'urgent' | 'emergency';
}

const statusConfig = {
  pending: { 
    label: 'รอดำเนินการ', 
    color: 'text-yellow-600 bg-yellow-100', 
    icon: Clock 
  },
  approved: { 
    label: 'อนุมัติแล้ว', 
    color: 'text-green-600 bg-green-100', 
    icon: CheckCircle 
  },
  rejected: { 
    label: 'ปฏิเสธ', 
    color: 'text-red-600 bg-red-100', 
    icon: XCircle 
  },
  cancelled: { 
    label: 'ยกเลิก', 
    color: 'text-gray-600 bg-gray-100', 
    icon: XCircle 
  },
  expired: { 
    label: 'หมดอายุ', 
    color: 'text-orange-600 bg-orange-100', 
    icon: AlertCircle 
  }
};

const requestTypeLabels: { [key: string]: string } = {
  'patient_data': 'ข้อมูลผู้ป่วย',
  'medical_records': 'ประวัติการรักษา',
  'lab_results': 'ผลการตรวจ',
  'prescriptions': 'ใบสั่งยา',
  'appointments': 'ข้อมูลนัดหมาย',
  'research_data': 'ข้อมูลเพื่อการวิจัย'
};

const urgencyConfig = {
  normal: { label: 'ปกติ', color: 'text-blue-600 bg-blue-100' },
  urgent: { label: 'ด่วน', color: 'text-orange-600 bg-orange-100' },
  emergency: { label: 'ฉุกเฉิน', color: 'text-red-600 bg-red-100' }
};

export default function PatientConsentRequestsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated or not patient
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== 'patient')) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch consent requests
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConsentRequests();
    }
  }, [isAuthenticated, user]);

  const fetchConsentRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${user?.id}/consent-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }

      const data = await response.json();
      setConsentRequests(data.data.consent_requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = consentRequests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchQuery === '' || 
      request.requester_organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.request_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getUrgencyConfig = (urgency: string) => {
    return urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.normal;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">คำขอเข้าถึงข้อมูล</h1>
                <p className="text-gray-600">จัดการคำขอเข้าถึงข้อมูลของคุณ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchConsentRequests}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <Link
                href="/accounts/patient/notifications"
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="การแจ้งเตือน"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามองค์กร, วัตถุประสงค์, หรือประเภทคำขอ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'pending', label: 'รอดำเนินการ' },
                { key: 'approved', label: 'อนุมัติแล้ว' },
                { key: 'rejected', label: 'ปฏิเสธ' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Consent Requests List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const statusInfo = getStatusConfig(request.status);
                const StatusIcon = statusInfo.icon;
                const urgencyInfo = getUrgencyConfig(request.urgency_level);
                
                return (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {request.requester_organization}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyInfo.color}`}>
                            {urgencyInfo.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <Building2 className="h-4 w-4 inline mr-1" />
                              องค์กร: {request.requester_organization}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <User className="h-4 w-4 inline mr-1" />
                              ผู้ขอ: {request.requester_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <FileText className="h-4 w-4 inline mr-1" />
                              ประเภท: {requestTypeLabels[request.request_type] || request.request_type}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              สร้างเมื่อ: {formatDate(request.requested_at)}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <Clock className="h-4 w-4 inline mr-1" />
                              หมดอายุ: {formatDate(request.expires_at)}
                            </p>
                            {request.responded_at && (
                              <p className="text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                ตอบสนองเมื่อ: {formatDate(request.responded_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">วัตถุประสงค์:</p>
                          <p className="text-sm text-gray-600">{request.purpose}</p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">ประเภทข้อมูลที่ต้องการ:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.data_types.map((dataType) => (
                              <span
                                key={dataType}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {dataType}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {request.response_reason && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">เหตุผล:</p>
                            <p className="text-sm text-gray-600">{request.response_reason}</p>
                          </div>
                        )}
                        
                        {request.is_expired && request.status === 'pending' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                              <span className="text-sm text-orange-800">คำขอนี้หมดอายุแล้ว</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Link
                          href={`/accounts/patient/consent-requests/${request.id}`}
                          className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูรายละเอียด
                        </Link>
                        
                        {request.status === 'pending' && !request.is_expired && (
                          <Link
                            href={`/accounts/patient/consent-requests/${request.id}/respond`}
                            className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            ตอบสนอง
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบคำขอ</h3>
              <p className="text-gray-600">
                {searchQuery || filter !== 'all' 
                  ? 'ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา' 
                  : 'ยังไม่มีคำขอเข้าถึงข้อมูลของคุณ'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}