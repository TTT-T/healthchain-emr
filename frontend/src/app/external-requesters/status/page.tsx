'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Mail,
  RefreshCw,
  ExternalLink,
  FileText,
  User,
  Building2,
  Calendar,
  Shield
} from 'lucide-react';

interface RegistrationStatus {
  requestId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  organizationName: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  requiresEmailVerification: boolean;
  emailVerified: boolean;
  nextSteps: string[];
  estimatedReviewTime: string;
}

const statusConfig = {
  pending: { 
    label: 'รอการตรวจสอบ', 
    color: 'text-yellow-600 bg-yellow-100', 
    icon: Clock,
    description: 'คำขอของคุณอยู่ระหว่างการตรวจสอบจากทีมงาน'
  },
  under_review: { 
    label: 'กำลังตรวจสอบ', 
    color: 'text-blue-600 bg-blue-100', 
    icon: RefreshCw,
    description: 'ทีมงานกำลังตรวจสอบข้อมูลและเอกสารประกอบ'
  },
  approved: { 
    label: 'อนุมัติแล้ว', 
    color: 'text-green-600 bg-green-100', 
    icon: CheckCircle,
    description: 'คำขอของคุณได้รับการอนุมัติแล้ว สามารถเข้าสู่ระบบได้'
  },
  rejected: { 
    label: 'ปฏิเสธ', 
    color: 'text-red-600 bg-red-100', 
    icon: XCircle,
    description: 'คำขอของคุณถูกปฏิเสธ กรุณาตรวจสอบเหตุผลและส่งใหม่'
  }
};

export default function RegistrationStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check localStorage for registration data first
  useEffect(() => {
    const savedData = localStorage.getItem('registrationStatus');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.success && parsedData.requestId) {
          setStatus({
            requestId: parsedData.requestId,
            email: parsedData.email || email || '',
            status: 'pending',
            organizationName: 'องค์กรของคุณ',
            submittedAt: new Date().toISOString(),
            requiresEmailVerification: parsedData.requiresEmailVerification || true,
            emailVerified: false,
            nextSteps: [
              'ตรวจสอบอีเมลและยืนยันบัญชี',
              'รอการอนุมัติจากผู้ดูแลระบบ',
              'เข้าสู่ระบบด้วย Username และ Password ที่ตั้งไว้'
            ],
            estimatedReviewTime: '3-5 วันทำการ'
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error parsing saved registration data:', err);
      }
    }

    // If no saved data, try to fetch from API
    if (requestId) {
      fetchRegistrationStatus();
    } else {
      setError('ไม่พบรหัสคำขอ กรุณาตรวจสอบ URL');
      setLoading(false);
    }
  }, [requestId, email]);

  const fetchRegistrationStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(`/api/external-requesters/register/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('ไม่พบคำขอที่ระบุ');
        }
        throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }

      const data = await response.json();
      setStatus(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (requestId) {
      fetchRegistrationStatus();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <p className="text-gray-600">กำลังโหลดสถานะการลงทะเบียน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ลองใหม่
            </button>
            <Link
              href="/external-requesters/register"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              ลงทะเบียนใหม่
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
          <p className="text-gray-600 mb-6">ไม่พบข้อมูลการลงทะเบียนที่ระบุ</p>
          <Link
            href="/external-requesters/register"
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            ลงทะเบียนใหม่
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusConfig(status.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/"
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">สถานะการลงทะเบียน</h1>
                <p className="text-gray-600 mt-1">รหัสคำขอ: {status.requestId}</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">สถานะปัจจุบัน</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusInfo.label}
                </span>
              </div>
              
              <p className="text-gray-600 mb-6">{statusInfo.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">วันที่ส่งคำขอ</label>
                  <p className="text-gray-900">{formatDate(status.submittedAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เวลาตรวจสอบโดยประมาณ</label>
                  <p className="text-gray-900">{status.estimatedReviewTime}</p>
                </div>
                {status.reviewedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">วันที่ตรวจสอบ</label>
                    <p className="text-gray-900">{formatDate(status.reviewedAt)}</p>
                  </div>
                )}
                {status.reviewedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ผู้ตรวจสอบ</label>
                    <p className="text-gray-900">{status.reviewedBy}</p>
                  </div>
                )}
              </div>

              {status.reviewNotes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-2">หมายเหตุจากผู้ตรวจสอบ</label>
                  <p className="text-gray-900">{status.reviewNotes}</p>
                </div>
              )}
            </div>

            {/* Organization Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                ข้อมูลองค์กร
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อองค์กร</label>
                  <p className="text-gray-900">{status.organizationName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อีเมลติดต่อ</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">{status.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ขั้นตอนต่อไป</h3>
              
              <div className="space-y-4">
                {status.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Verification Status */}
            {status.requiresEmailVerification && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  สถานะการยืนยันอีเมล
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700">
                      {status.emailVerified ? 'อีเมลได้รับการยืนยันแล้ว' : 'รอการยืนยันอีเมล'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      กรุณาตรวจสอบอีเมลและคลิกลิงก์ยืนยัน
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${status.emailVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {status.emailVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการ</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {refreshing ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  รีเฟรชสถานะ
                </button>
                
                {status.status === 'approved' && (
                  <Link
                    href="/external-requesters/login"
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    เข้าสู่ระบบ
                  </Link>
                )}
                
                {status.status === 'rejected' && (
                  <Link
                    href="/external-requesters/register"
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    ส่งคำขอใหม่
                  </Link>
                )}
                
                <Link
                  href="/"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับหน้าแรก
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">ต้องการความช่วยเหลือ?</h3>
              <p className="text-sm text-blue-800 mb-4">
                หากมีคำถามหรือต้องการความช่วยเหลือเกี่ยวกับการลงทะเบียน
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p>📧 อีเมล: support@hospital.com</p>
                <p>📞 โทรศัพท์: 02-123-4567</p>
                <p>🕒 เวลาทำการ: จันทร์-ศุกร์ 8:00-17:00</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h3 className="text-lg font-medium text-yellow-900 mb-2 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                ข้อควรระวัง
              </h3>
              <p className="text-sm text-yellow-800">
                อย่าแชร์รหัสคำขอหรือข้อมูลส่วนตัวกับผู้อื่น 
                ระบบจะส่งการแจ้งเตือนทางอีเมลเท่านั้น
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}