"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, Home, Shield, Clock, AlertCircle, HelpCircle, Phone, MessageCircle, Send, CheckCircle } from 'lucide-react';

function EmailVerificationRequiredContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12 text-center">
          {/* Email Verification Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="text-white" size={48} />
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              📧 กรุณายืนยันอีเมลของคุณ
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              คุณต้องยืนยันอีเมลก่อนเข้าสู่ระบบ
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="text-blue-600" size={32} />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                ตรวจสอบอีเมลของคุณ
              </h2>
              <p className="text-blue-800 mb-4">
                เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว
              </p>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  📧 {email}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                <Clock size={16} />
                <span>ลิงก์จะหมดอายุใน 24 ชั่วโมง</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href={`/resend-verification?email=${encodeURIComponent(email)}&fromLogin=true`}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Send size={20} />
              ส่งอีเมลยืนยันใหม่
            </Link>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              <ArrowRight size={20} />
              กลับไปหน้าเข้าสู่ระบบ
            </Link>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all duration-200"
            >
              <Home size={20} />
              กลับหน้าหลัก
            </Link>
          </div>

          {/* Additional Information */}
          <div className="mt-8 space-y-4">
            {/* Important Notes */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    หมายเหตุสำคัญ
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• ตรวจสอบในโฟลเดอร์ Spam/Junk หากไม่พบอีเมล</li>
                    <li>• คลิกลิงก์ในอีเมลเพื่อยืนยันบัญชี</li>
                    <li>• หลังจากยืนยันแล้วจึงจะสามารถเข้าสู่ระบบได้</li>
                    <li>• ลิงก์ยืนยันจะหมดอายุใน 24 ชั่วโมง</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-green-800 mb-3">
                    ขั้นตอนการยืนยันอีเมล
                  </h3>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">1.</span>
                      <span>ตรวจสอบอีเมลที่ {email}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">2.</span>
                      <span>คลิกลิงก์ยืนยันในอีเมล</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">3.</span>
                      <span>กลับมาหน้าเข้าสู่ระบบ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">4.</span>
                      <span>เข้าสู่ระบบด้วยข้อมูลเดิม</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <HelpCircle className="text-gray-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-gray-800 mb-3">
                    ต้องการความช่วยเหลือ?
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>โทรศัพท์: <strong>02-xxx-xxxx</strong> (จันทร์-ศุกร์ 8:00-17:00)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} />
                      <span>Facebook: <strong>HealthChain EMR Support</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>อีเมล: <strong>support@healthchain.co.th</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 HealthChain. สงวนลิขสิทธิ์ทั้งหมด.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationRequired() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <EmailVerificationRequiredContent />
    </Suspense>
  );
}
