'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
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
  Save,
  Info
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
  is_expired: boolean;
  urgency_level: 'normal' | 'urgent' | 'emergency';
}

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

export default function RespondToConsentRequestPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [response, setResponse] = useState<'approved' | 'rejected' | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const request = data.data.consent_request;
      
      if (request.status !== 'pending') {
        setError('คำขอนี้ได้รับการตอบสนองแล้ว');
        return;
      }
      
      if (request.is_expired) {
        setError('คำขอนี้หมดอายุแล้ว');
        return;
      }
      
      setConsentRequest(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response) {
      setError('กรุณาเลือกการตอบสนอง');
      return;
    }

    if (response === 'rejected' && !reason.trim()) {
      setError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const responseData = await fetch(`/api/patients/${user?.id}/consent-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          response,
          reason: reason.trim() || undefined
        })
      });

      if (!responseData.ok) {
        const errorData = await responseData.json();
        throw new Error(errorData.error?.message || 'เกิดข้อผิดพลาดในการตอบสนอง');
      }

      setSuccess(true);
      
      // Redirect to consent requests list after 3 seconds
      setTimeout(() => {
        router.push('/accounts/patient/consent-requests');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
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

  if (error && !consentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/accounts/patient/consent-requests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปรายการคำขอ
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ตอบสนองสำเร็จ!</h2>
          <p className="text-gray-600 mb-4">
            การตอบสนองของคุณได้รับการบันทึกเรียบร้อยแล้ว
          </p>
          <p className="text-sm text-gray-500">
            กำลังเปลี่ยนเส้นทางไปยังหน้ารายการคำขอ...
          </p>
        </div>
      </div>
    );
  }

  if (!consentRequest) {
    return null;
  }

  const urgencyInfo = getUrgencyConfig(consentRequest.urgency_level);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ตอบสนองคำขอเข้าถึงข้อมูล</h1>
              <p className="text-gray-600 mt-1">ID: {consentRequest.request_id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                รายละเอียดคำขอ
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">องค์กร</label>
                    <p className="text-gray-900 flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      {consentRequest.requester_organization}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ผู้ขอ</label>
                    <p className="text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {consentRequest.requester_name}
                    </p>
                  </div>
                </div>
                
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">วันที่สร้าง</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(consentRequest.requested_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">หมดอายุ</label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDate(consentRequest.expires_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">การตอบสนอง</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    คุณต้องการตอบสนองอย่างไร? *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="response"
                        value="approved"
                        checked={response === 'approved'}
                        onChange={(e) => setResponse(e.target.value as 'approved')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <div className="ml-3 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">อนุมัติ</p>
                          <p className="text-sm text-gray-500">อนุญาตให้เข้าถึงข้อมูลตามที่ร้องขอ</p>
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="response"
                        value="rejected"
                        checked={response === 'rejected'}
                        onChange={(e) => setResponse(e.target.value as 'rejected')}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <div className="ml-3 flex items-center">
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">ปฏิเสธ</p>
                          <p className="text-sm text-gray-500">ไม่อนุญาตให้เข้าถึงข้อมูล</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {response === 'rejected' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผลในการปฏิเสธ *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="กรุณาระบุเหตุผลในการปฏิเสธคำขอ..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !response}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        บันทึกการตอบสนอง
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Important Notice */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                ข้อมูลสำคัญ
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>• การตอบสนองของคุณจะถูกส่งไปยังองค์กรที่ร้องขอทันที</p>
                <p>• คุณสามารถเปลี่ยนแปลงการตอบสนองได้ก่อนที่คำขอจะหมดอายุ</p>
                <p>• หากอนุมัติ องค์กรจะสามารถเข้าถึงข้อมูลตามที่ระบุได้</p>
                <p>• หากปฏิเสธ กรุณาระบุเหตุผลเพื่อความชัดเจน</p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h3 className="text-lg font-medium text-yellow-900 mb-2">ข้อควรระวัง</h3>
              <div className="space-y-2 text-sm text-yellow-800">
                <p>• ตรวจสอบให้แน่ใจว่าองค์กรที่ร้องขอเป็นองค์กรที่เชื่อถือได้</p>
                <p>• วัตถุประสงค์การใช้งานข้อมูลต้องชัดเจนและเหมาะสม</p>
                <p>• คุณมีสิทธิ์ในการปฏิเสธคำขอได้เสมอ</p>
                <p>• หากมีข้อสงสัย กรุณาติดต่อโรงพยาบาล</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">ต้องการความช่วยเหลือ?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📞 โทรศัพท์: 02-123-4567</p>
                <p>📧 อีเมล: support@hospital.com</p>
                <p>🕒 เวลาทำการ: จันทร์-ศุกร์ 8:00-17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
