"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send, HelpCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

function ResendVerificationContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fromLogin, setFromLogin] = useState(false);

  // Get email from URL parameters if available
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const fromLoginParam = searchParams.get('fromLogin');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    if (fromLoginParam === 'true') {
      setFromLogin(true);
    }
    
    // Check if email is stored in localStorage (from login)
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (storedEmail && !emailParam) {
      setEmail(storedEmail);
      setFromLogin(true);
      localStorage.removeItem('pendingVerificationEmail');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the actual API now that SMTP is configured
      const response = await apiClient.resendVerificationEmail(email);

      if (response.statusCode === 200 && !response.error) {
        setMessage('ส่งอีเมลยืนยันเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ');
      } else {
        const errorMessage = response.error?.message || 'เกิดข้อผิดพลาดในการส่งอีเมล';
        setError(errorMessage);
      }
    } catch (error: any) {
      logger.error('Resend verification error:', error);
      const errorMessage = (error as any).response?.data?.error?.message || 'เกิดข้อผิดพลาดในการส่งอีเมล';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {fromLogin ? 'ยืนยันอีเมลก่อนเข้าสู่ระบบ' : 'ส่งอีเมลยืนยันใหม่'}
          </h1>
          <p className="text-gray-600 text-lg">
            {fromLogin 
              ? 'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ' 
              : 'กรอกอีเมลของคุณเพื่อรับลิงก์ยืนยันอีเมลใหม่'
            }
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                อีเมลของคุณ
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 text-lg px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="กรอกอีเมลของคุณ"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังส่งอีเมล...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  ส่งอีเมลยืนยัน
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>

          {fromLogin && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">💡 ไม่ได้รับอีเมลยืนยัน?</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-start">
                      <span className="mr-2">📧</span>
                      <span>ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">⏰</span>
                      <span>รอสักครู่แล้วลองส่งใหม่</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">📞</span>
                      <span>ติดต่อเจ้าหน้าที่หากยังไม่ได้รับอีเมล</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 HealthChain. ระบบบันทึกสุขภาพอิเล็กทรอนิกส์
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResendVerification() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <ResendVerificationContent />
    </Suspense>
  );
}