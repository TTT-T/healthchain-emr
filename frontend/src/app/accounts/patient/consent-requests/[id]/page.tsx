'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Building2,
  User,
  FileText,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  RefreshCw
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

export default function ConsentRequestDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not patient
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== 'patient')) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch consent request details
  useEffect(() => {
    if (requestId && isAuthenticated && user) {
      fetchConsentRequest();
    }
  }, [requestId, isAuthenticated, user]);

  const fetchConsentRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${user?.id}/consent-requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('ไม่พบคำขอที่ระบุ');
        }
        throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }

      const data = await response.json();
      setConsentRequest(data.data.consent_request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              กลับ
            </button>
            <button
              onClick={fetchConsentRequest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!consentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mb-4">ไม่พบคำขอที่ระบุ</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusConfig(consentRequest.status);
  const StatusIcon = statusInfo.icon;
  const urgencyInfo = getUrgencyConfig(consentRequest.urgency_level);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">รายละเอียดคำขอ</h1>
                <p className="text-gray-600 mt-1">ID: {consentRequest.request_id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.label}
              </span>
              
              <button
                onClick={fetchConsentRequest}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                ข้อมูลองค์กรผู้ขอ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อองค์กร</label>
                  <p className="text-gray-900">{consentRequest.requester_organization}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">ผู้ติดต่อ</label>
                  <p className="text-gray-900">{consentRequest.requester_name}</p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                รายละเอียดคำขอ
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ประเภทคำขอ</label>
                    <p className="text-gray-900">
                      {requestTypeLabels[consentRequest.request_type] || consentRequest.request_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ระดับความเร่งด่วน</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyInfo.color}`}>
                      {urgencyInfo.label}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">วัตถุประสงค์</label>
                  <p className="text-gray-900">{consentRequest.purpose}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">ประเภทข้อมูลที่ต้องการ</label>
                  <div className="flex flex-wrap gap-2">
                    {consentRequest.data_types.map((dataType) => (
                      <span
                        key={dataType}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {dataType}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ไทม์ไลน์</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">สร้างคำขอ</p>
                    <p className="text-sm text-gray-600">{formatDate(consentRequest.requested_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">หมดอายุ</p>
                    <p className="text-sm text-gray-600">{formatDate(consentRequest.expires_at)}</p>
                  </div>
                </div>
                
                {consentRequest.responded_at && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">ตอบสนอง</p>
                      <p className="text-sm text-gray-600">{formatDate(consentRequest.responded_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Response Details */}
            {(consentRequest.status === 'approved' || consentRequest.status === 'rejected') && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">การตอบสนอง</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">สถานะ</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  {consentRequest.response_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">เหตุผล</label>
                      <p className="text-gray-900">{consentRequest.response_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">สถานะ</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">สถานะปัจจุบัน</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">วันที่สร้าง</span>
                  <span className="text-sm text-gray-900">{formatDate(consentRequest.requested_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">หมดอายุ</span>
                  <span className={`text-sm ${consentRequest.is_expired ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(consentRequest.expires_at)}
                  </span>
                </div>
                
                {consentRequest.is_expired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-800">คำขอนี้หมดอายุแล้ว</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการ</h3>
              
              <div className="space-y-3">
                {consentRequest.status === 'pending' && !consentRequest.is_expired && (
                  <Link
                    href={`/accounts/patient/consent-requests/${requestId}/respond`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ตอบสนองคำขอ
                  </Link>
                )}
                
                <button
                  onClick={fetchConsentRequest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรชข้อมูล
                </button>
                
                <Link
                  href="/accounts/patient/consent-requests"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับรายการคำขอ
                </Link>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">ข้อมูลสำคัญ</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• การตอบสนองของคุณจะถูกส่งไปยังองค์กรทันที</p>
                <p>• คุณมีสิทธิ์ในการปฏิเสธคำขอได้เสมอ</p>
                <p>• หากมีข้อสงสัย กรุณาติดต่อโรงพยาบาล</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
