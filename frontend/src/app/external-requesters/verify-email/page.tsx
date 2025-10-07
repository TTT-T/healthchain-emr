'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Mail,
  RefreshCw,
  Clock,
  Shield,
  ExternalLink
} from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  email?: string;
  requiresResend?: boolean;
}

export default function EmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setVerificationResult({
        success: false,
        message: 'ไม่พบโทเค็นการยืนยัน กรุณาตรวจสอบลิงก์ที่ได้รับทางอีเมล',
        requiresResend: true
      });
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationResult({
          success: true,
          message: 'อีเมลได้รับการยืนยันเรียบร้อยแล้ว!',
          email: data.email || email
        });
      } else {
        setVerificationResult({
          success: false,
          message: data.message || 'การยืนยันอีเมลไม่สำเร็จ',
          requiresResend: true
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยืนยันอีเมล',
        requiresResend: true
      });
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setVerificationResult(prev => prev ? {
        ...prev,
        message: 'ไม่พบอีเมล กรุณาลงทะเบียนใหม่'
      } : null);
      return;
    }

    try {
      setResending(true);

      // For development mode, show appropriate message without calling API
      setVerificationResult(prev => prev ? {
        ...prev,
        message: 'ระบบส่งอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ'
      } : null);
      return;

      // Comment out API call for now
      // const response = await fetch('/api/auth/resend-verification', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ email })
      // });

      // const data = await response.json();

      // if (response.ok && data.success) {
      //   setVerificationResult(prev => prev ? {
      //     ...prev,
      //     message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ'
      //   } : null);
      // } else {
      //   setVerificationResult(prev => prev ? {
      //     ...prev,
      //     message: data.message || 'ไม่สามารถส่งอีเมลยืนยันใหม่ได้'
      //   } : null);
      // }
    } catch (error) {
      setVerificationResult(prev => prev ? {
        ...prev,
        message: 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่'
      } : null);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังยืนยันอีเมล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าแรก
          </Link>
          
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            ยืนยันอีเมล
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ยืนยันที่อยู่อีเมลของคุณเพื่อเปิดใช้งานบัญชี
          </p>
        </div>

        {/* Verification Result */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {verificationResult && (
            <div className="text-center">
              {/* Success State */}
              {verificationResult.success ? (
                <>
                  <div className="text-green-600 mb-4">
                    <CheckCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ยืนยันอีเมลสำเร็จ!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {verificationResult.message}
                  </p>
                  {verificationResult.email && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-green-800">
                        <strong>อีเมลที่ยืนยัน:</strong> {verificationResult.email}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Link
                      href="/external-requesters/login"
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      เข้าสู่ระบบ
                    </Link>
                    
                    <Link
                      href="/external-requesters/status"
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      ตรวจสอบสถานะการลงทะเบียน
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-red-600 mb-4">
                    <XCircle className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ยืนยันอีเมลไม่สำเร็จ
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {verificationResult.message}
                  </p>
                  
                  {verificationResult.requiresResend && (
                    <div className="space-y-3">
                      <button
                        onClick={resendVerificationEmail}
                        disabled={resending}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {resending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            กำลังส่ง...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2" />
                            ส่งอีเมลยืนยันใหม่
                          </>
                        )}
                      </button>
                      
                      <Link
                        href="/external-requesters/register"
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        ลงทะเบียนใหม่
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Help Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            ข้อมูลเพิ่มเติม
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <p>ลิงก์ยืนยันอีเมลจะมีอายุ 24 ชั่วโมง</p>
            </div>
            
            <div className="flex items-start">
              <Mail className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <p>ตรวจสอบโฟลเดอร์ Spam หรือ Junk Mail หากไม่พบอีเมล</p>
            </div>
            
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
              <p>หากยังมีปัญหา กรุณาติดต่อทีมสนับสนุน</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">ต้องการความช่วยเหลือ?</h3>
          <p className="text-sm text-blue-800 mb-4">
            หากมีปัญหาในการยืนยันอีเมลหรือต้องการความช่วยเหลือ
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <p>📧 อีเมล: support@hospital.com</p>
            <p>📞 โทรศัพท์: 02-123-4567</p>
            <p>🕒 เวลาทำการ: จันทร์-ศุกร์ 8:00-17:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
