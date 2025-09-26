"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Mail, ArrowRight, Home, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setError('ลิงก์ยืนยันไม่ถูกต้อง');
      return;
    }

    verifyEmail();
  }, [token, email]);

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('ยืนยันอีเมลเรียบร้อยแล้ว');
        logger.info('Email verification successful', { email });
      } else {
        setStatus('error');
        setError(data.message || 'เกิดข้อผิดพลาดในการยืนยันอีเมล');
        logger.error('Email verification failed', { email, error: data.message });
      }
    } catch (error) {
      setStatus('error');
      setError('เกิดข้อผิดพลาดในการยืนยันอีเมล');
      logger.error('Email verification error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        );
      case 'success':
        return (
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'กำลังยืนยันอีเมล...';
      case 'success':
        return 'ยืนยันอีเมลเรียบร้อยแล้ว!';
      case 'error':
        return 'เกิดข้อผิดพลาด';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'กรุณารอสักครู่ กำลังตรวจสอบข้อมูลของคุณ';
      case 'success':
        return 'อีเมลของคุณได้รับการยืนยันเรียบร้อยแล้ว ตอนนี้คุณสามารถเข้าสู่ระบบได้';
      case 'error':
        return error || 'เกิดข้อผิดพลาดในการยืนยันอีเมล';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'from-blue-50 via-indigo-50 to-purple-50';
      case 'success':
        return 'from-green-50 via-emerald-50 to-teal-50';
      case 'error':
        return 'from-red-50 via-rose-50 to-pink-50';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getStatusColor()} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getStatusTitle()}
          </h1>
          <p className="text-gray-600 text-lg">
            {getStatusMessage()}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <div className="space-y-6">
            {status === 'success' && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div className="text-green-700 font-medium">
                    <div className="space-y-2">
                      <p>✅ อีเมลได้รับการยืนยันเรียบร้อยแล้ว</p>
                      <p>🔐 ตอนนี้คุณสามารถเข้าสู่ระบบได้แล้ว</p>
                      <p>🛡️ บัญชีของคุณได้รับการรักษาความปลอดภัยแล้ว</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <div className="text-red-700 font-medium">
                    <div className="space-y-2">
                      <p>❌ ไม่สามารถยืนยันอีเมลได้</p>
                      <p>🔗 ลิงก์อาจหมดอายุหรือไม่ถูกต้อง</p>
                      <p>📧 กรุณาขอส่งอีเมลยืนยันใหม่</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
                  <div className="text-blue-700 font-medium">
                    <div className="space-y-2">
                      <p>⏳ กำลังตรวจสอบข้อมูล...</p>
                      <p>📧 กำลังยืนยันอีเมลของคุณ</p>
                      <p>🔄 กรุณารอสักครู่</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {status === 'success' && (
                <Link
                  href="/login"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  เข้าสู่ระบบ
                </Link>
              )}

              {status === 'error' && (
                <Link
                  href="/resend-verification"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  ส่งอีเมลยืนยันใหม่
                </Link>
              )}

              <Link
                href="/"
                className="w-full h-12 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
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

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}