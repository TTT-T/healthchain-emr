'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Building2,
  User,
  FileText,
  BarChart3
} from 'lucide-react';

interface ConsentRequest {
  id: string;
  request_id: string;
  requester_name: string;
  requester_type: string;
  patient_name: string;
  patient_hn: string;
  request_type: string;
  data_types: string[];
  purpose: string;
  urgency_level: 'emergency' | 'urgent' | 'normal';
  status: 'pending' | 'sent_to_patient' | 'patient_reviewing' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  updated_at: string;
  is_compliant: boolean;
  compliance_notes?: string;
  is_expired: boolean;
}

interface ConsentRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
}

const requestTypeLabels = {
  patient_data: 'ข้อมูลผู้ป่วย',
  medical_records: 'ประวัติการรักษา',
  lab_results: 'ผลการตรวจ',
  prescriptions: 'ใบสั่งยา',
  appointments: 'ข้อมูลนัดหมาย',
  research_data: 'ข้อมูลเพื่อการวิจัย'
};

const urgencyLabels = {
  emergency: 'ฉุกเฉิน',
  urgent: 'ด่วน',
  normal: 'ปกติ'
};

const statusLabels = {
  pending: 'รอดำเนินการ',
  sent_to_patient: 'ส่งให้ผู้ป่วยแล้ว',
  patient_reviewing: 'ผู้ป่วยกำลังพิจารณา',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  expired: 'หมดอายุ',
  cancelled: 'ยกเลิก'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent_to_patient: 'bg-blue-100 text-blue-800',
  patient_reviewing: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const urgencyColors = {
  emergency: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800'
};

export default function ExternalConsentRequestsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [stats, setStats] = useState<ConsentRequestStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    request_type: '',
    urgency_level: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Redirect if not authenticated or not external requester
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || !['external_requester', 'external_admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch consent requests
  const fetchConsentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await fetch(`/api/external-requesters/consent-requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch consent requests');
      }
      
      const data = await response.json();
      setConsentRequests(data.data.consent_requests || []);
      setPagination(data.data.pagination || pagination);
      
      // Calculate stats from the data
      const newStats = {
        total: data.data.pagination?.total || 0,
        pending: data.data.status_summary?.find((s: any) => s.status === 'pending')?.count || 0,
        approved: data.data.status_summary?.find((s: any) => s.status === 'approved')?.count || 0,
        rejected: data.data.status_summary?.find((s: any) => s.status === 'rejected')?.count || 0,
        expired: data.data.status_summary?.find((s: any) => s.status === 'expired')?.count || 0
      };
      setStats(newStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConsentRequests();
    }
  }, [isAuthenticated, user, pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการคำขอเข้าถึงข้อมูล</h1>
              <p className="text-gray-600 mt-1">ส่งและติดตามคำขอเข้าถึงข้อมูลผู้ป่วย</p>
            </div>
            <button
              onClick={() => router.push('/external-requesters/consent-requests/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              ส่งคำขอใหม่
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ปฏิเสธ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">หมดอายุ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อผู้ป่วย, รหัสคำขอ..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทข้อมูล</label>
              <select
                value={filters.request_type}
                onChange={(e) => handleFilterChange('request_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(requestTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ระดับความเร่งด่วน</label>
              <select
                value={filters.urgency_level}
                onChange={(e) => handleFilterChange('urgency_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                {Object.entries(urgencyLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Consent Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">รายการคำขอเข้าถึงข้อมูล</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 bg-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchConsentRequests}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          ) : consentRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">ยังไม่มีคำขอเข้าถึงข้อมูล</p>
              <button
                onClick={() => router.push('/external-requesters/consent-requests/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ส่งคำขอแรก
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รหัสคำขอ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้ป่วย
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ประเภทข้อมูล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วัตถุประสงค์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สร้าง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หมดอายุ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consentRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.request_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.patient_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                HN: {request.patient_hn}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {requestTypeLabels[request.request_type as keyof typeof requestTypeLabels] || request.request_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.data_types.length} ประเภท
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.purpose}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status as keyof typeof statusColors]}`}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{statusLabels[request.status as keyof typeof statusLabels]}</span>
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyColors[request.urgency_level as keyof typeof urgencyColors]}`}>
                              {urgencyLabels[request.urgency_level as keyof typeof urgencyLabels]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.expires_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/external-requesters/consent-requests/${request.id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => router.push(`/external-requesters/consent-requests/${request.id}/edit`)}
                                  className="text-yellow-600 hover:text-yellow-900 p-1"
                                  title="แก้ไข"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('คุณต้องการยกเลิกคำขอนี้หรือไม่?')) {
                                      // Handle cancel
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="ยกเลิก"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        ก่อนหน้า
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        หน้า {pagination.page} จาก {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
