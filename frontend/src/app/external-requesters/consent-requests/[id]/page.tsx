'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  FileText,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';

interface ConsentRequest {
  id: string;
  patient: {
    id: string;
    name: string;
    hn: string;
    email: string;
    phone: string;
  };
  requester_id: string;
  request_details: {
    type: string;
    purpose: string;
    data_types: string[];
    external_request_id?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  expires_at: string;
  responded_at?: string;
  response_reason?: string;
  created_at: string;
  updated_at: string;
  is_expired: boolean;
}

const requestTypeLabels: { [key: string]: string } = {
  'patient_data': 'ข้อมูลผู้ป่วย',
  'medical_records': 'ประวัติการรักษา',
  'lab_results': 'ผลการตรวจ',
  'prescriptions': 'ใบสั่งยา',
  'appointments': 'ข้อมูลนัดหมาย',
  'research_data': 'ข้อมูลเพื่อการวิจัย'
};

const dataTypeLabels: { [key: string]: string } = {
  'personal_info': 'ข้อมูลส่วนตัว',
  'medical_history': 'ประวัติการรักษา',
  'diagnosis': 'การวินิจฉัยโรค',
  'lab_results': 'ผลการตรวจทางห้องปฏิบัติการ',
  'imaging_results': 'ผลการตรวจภาพ',
  'medications': 'ยาที่ใช้',
  'allergies': 'ประวัติการแพ้ยา',
  'vital_signs': 'สัญญาณชีพ',
  'appointments': 'ข้อมูลนัดหมาย',
  'emergency_contacts': 'ข้อมูลผู้ติดต่อฉุกเฉิน'
};

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

export default function ConsentRequestDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirect if not authenticated or not external requester
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || !['external_requester', 'external_admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch consent request details
  useEffect(() => {
    if (requestId && isAuthenticated) {
      fetchConsentRequest();
    }
  }, [requestId, isAuthenticated]);

  const fetchConsentRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/external-requesters/consent-requests/${requestId}`, {
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

  const handleCancelRequest = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกคำขอนี้?')) {
      return;
    }

    try {
      setActionLoading('cancel');

      const response = await fetch(`/api/external-requesters/consent-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'เกิดข้อผิดพลาดในการยกเลิกคำขอ');
      }

      // Refresh the data
      await fetchConsentRequest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
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
                <p className="text-gray-600 mt-1">ID: {consentRequest.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.label}
              </span>
              
              {consentRequest.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/external-requesters/consent-requests/${requestId}/edit`)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    disabled={actionLoading === 'cancel'}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="ยกเลิก"
                  >
                    {actionLoading === 'cancel' ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                ข้อมูลผู้ป่วย
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อ-นามสกุล</label>
                  <p className="text-gray-900">{consentRequest.patient.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">HN</label>
                  <p className="text-gray-900">{consentRequest.patient.hn}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อีเมล</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{consentRequest.patient.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เบอร์โทรศัพท์</label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{consentRequest.patient.phone}</p>
                  </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-500">ประเภทคำขอ</label>
                  <p className="text-gray-900">
                    {requestTypeLabels[consentRequest.request_details.type] || consentRequest.request_details.type}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">วัตถุประสงค์</label>
                  <p className="text-gray-900">{consentRequest.request_details.purpose}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">ประเภทข้อมูลที่ต้องการ</label>
                  <div className="flex flex-wrap gap-2">
                    {consentRequest.request_details.data_types.map((dataType) => (
                      <span
                        key={dataType}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {dataTypeLabels[dataType] || dataType}
                      </span>
                    ))}
                  </div>
                </div>

                {consentRequest.request_details.external_request_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">รหัสคำขอภายนอก</label>
                    <p className="text-gray-900 font-mono text-sm">
                      {consentRequest.request_details.external_request_id}
                    </p>
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
                    <label className="block text-sm font-medium text-gray-500">วันที่ตอบสนอง</label>
                    <p className="text-gray-900">
                      {consentRequest.responded_at ? formatDate(consentRequest.responded_at) : '-'}
                    </p>
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
                  <span className="text-sm text-gray-900">{formatDate(consentRequest.created_at)}</span>
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
                {consentRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => router.push(`/external-requesters/consent-requests/${requestId}/edit`)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไขคำขอ
                    </button>
                    
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading === 'cancel'}
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'cancel' ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      ยกเลิกคำขอ
                    </button>
                  </>
                )}
                
                <button
                  onClick={fetchConsentRequest}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรชข้อมูล
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">ข้อมูลเพิ่มเติม</h3>
              <p className="text-sm text-blue-800">
                ผู้ป่วยจะได้รับการแจ้งเตือนทางอีเมลเมื่อมีการส่งคำขอ และสามารถตอบสนองได้ผ่านระบบ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
