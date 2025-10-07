'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Calendar
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
  created_at: string;
  updated_at: string;
  is_expired: boolean;
}

interface ConsentRequestForm {
  request_type: string;
  purpose: string;
  data_types: string[];
  expires_in_days: number;
}

const requestTypeOptions = [
  { value: 'patient_data', label: 'ข้อมูลผู้ป่วย' },
  { value: 'medical_records', label: 'ประวัติการรักษา' },
  { value: 'lab_results', label: 'ผลการตรวจ' },
  { value: 'prescriptions', label: 'ใบสั่งยา' },
  { value: 'appointments', label: 'ข้อมูลนัดหมาย' },
  { value: 'research_data', label: 'ข้อมูลเพื่อการวิจัย' }
];

const dataTypeOptions = [
  { value: 'personal_info', label: 'ข้อมูลส่วนตัว' },
  { value: 'medical_history', label: 'ประวัติการรักษา' },
  { value: 'diagnosis', label: 'การวินิจฉัยโรค' },
  { value: 'lab_results', label: 'ผลการตรวจทางห้องปฏิบัติการ' },
  { value: 'imaging_results', label: 'ผลการตรวจภาพ' },
  { value: 'medications', label: 'ยาที่ใช้' },
  { value: 'allergies', label: 'ประวัติการแพ้ยา' },
  { value: 'vital_signs', label: 'สัญญาณชีพ' },
  { value: 'appointments', label: 'ข้อมูลนัดหมาย' },
  { value: 'emergency_contacts', label: 'ข้อมูลผู้ติดต่อฉุกเฉิน' }
];

export default function EditConsentRequestPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [form, setForm] = useState<ConsentRequestForm>({
    request_type: '',
    purpose: '',
    data_types: [],
    expires_in_days: 30
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const request = data.data.consent_request;
      setConsentRequest(request);
      
      // Calculate days until expiration
      const expiresAt = new Date(request.expires_at);
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      setForm({
        request_type: request.request_details.type,
        purpose: request.request_details.purpose,
        data_types: request.request_details.data_types,
        expires_in_days: Math.max(1, daysUntilExpiration)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDataTypeToggle = (dataType: string) => {
    setForm(prev => ({
      ...prev,
      data_types: prev.data_types.includes(dataType)
        ? prev.data_types.filter(dt => dt !== dataType)
        : [...prev.data_types, dataType]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.request_type) {
      setError('กรุณาเลือกประเภทคำขอ');
      return;
    }

    if (!form.purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์');
      return;
    }

    if (form.data_types.length === 0) {
      setError('กรุณาเลือกประเภทข้อมูลอย่างน้อย 1 ประเภท');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/external-requesters/consent-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'เกิดข้อผิดพลาดในการอัปเดตคำขอ');
      }

      setSuccess(true);
      
      // Redirect to detail page after 2 seconds
      setTimeout(() => {
        router.push(`/external-requesters/consent-requests/${requestId}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
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

  if (consentRequest.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่สามารถแก้ไขได้</h2>
          <p className="text-gray-600 mb-4">
            คำขอนี้ไม่สามารถแก้ไขได้เนื่องจากสถานะเป็น "{consentRequest.status}"
          </p>
          <button
            onClick={() => router.push(`/external-requesters/consent-requests/${requestId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปดูรายละเอียด
          </button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">แก้ไขคำขอเข้าถึงข้อมูล</h1>
              <p className="text-gray-600 mt-1">ID: {consentRequest.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">อัปเดตสำเร็จ!</h2>
            <p className="text-gray-600 mb-4">
              คำขอเข้าถึงข้อมูลของคุณได้รับการอัปเดตเรียบร้อยแล้ว
            </p>
            <p className="text-sm text-gray-500">
              กำลังเปลี่ยนเส้นทางไปยังหน้ารายละเอียด...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Information (Read-only) */}
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
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                รายละเอียดคำขอ
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทคำขอ *
                  </label>
                  <select
                    value={form.request_type}
                    onChange={(e) => setForm(prev => ({ ...prev, request_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกประเภทคำขอ</option>
                    {requestTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วัตถุประสงค์การใช้งาน *
                  </label>
                  <textarea
                    value={form.purpose}
                    onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="อธิบายวัตถุประสงค์การใช้งานข้อมูลอย่างละเอียด..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทข้อมูลที่ต้องการ *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {dataTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.data_types.includes(option.value)}
                          onChange={() => handleDataTypeToggle(option.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {form.data_types.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">กรุณาเลือกประเภทข้อมูลอย่างน้อย 1 ประเภท</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระยะเวลาหมดอายุ (วัน) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={form.expires_in_days}
                    onChange={(e) => setForm(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    คำขอจะหมดอายุใน {form.expires_in_days} วัน ({new Date(Date.now() + form.expires_in_days * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')})
                  </p>
                </div>
              </div>
            </div>

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
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
