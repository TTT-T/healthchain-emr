"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserCheck, ArrowRight, Home, Shield, Clock, AlertCircle, HelpCircle, Phone, MessageCircle, Users, Mail } from 'lucide-react';

function AdminApprovalRequiredContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const userType = searchParams.get('type') || 'บุคลากรทางการแพทย์';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12 text-center">
          {/* Admin Approval Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
              <UserCheck className="text-white" size={48} />
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ⏳ รอการอนุมัติจากผู้ดูแลระบบ
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              บัญชีของคุณกำลังรอการตรวจสอบและอนุมัติ
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="text-orange-600" size={32} />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-orange-900 mb-3">
                กำลังตรวจสอบข้อมูล
              </h2>
              <p className="text-orange-800 mb-4">
                บัญชีของคุณจะได้รับการตรวจสอบโดยผู้ดูแลระบบภายใน 1-2 วันทำการ
              </p>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 font-medium">
                  📧 {email}
                </p>
                <p className="text-sm text-orange-700 font-medium mt-2">
                  👤 ประเภท: {userType}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-orange-600">
                <Clock size={16} />
                <span>กระบวนการตรวจสอบใช้เวลาประมาณ 1-2 วันทำการ</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-yellow-700 focus:ring-4 focus:ring-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                    <li>• บัญชีของคุณจะได้รับการตรวจสอบโดยผู้ดูแลระบบ</li>
                    <li>• กระบวนการตรวจสอบใช้เวลาประมาณ 1-2 วันทำการ</li>
                    <li>• คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ</li>
                    <li>• สามารถเข้าสู่ระบบได้เมื่อบัญชีพร้อมใช้งาน</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-blue-800 mb-3">
                    ขั้นตอนการอนุมัติ
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">1.</span>
                      <span>ผู้ดูแลระบบตรวจสอบข้อมูลและเอกสารประกอบ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">2.</span>
                      <span>ตรวจสอบความถูกต้องของข้อมูลส่วนตัว</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">3.</span>
                      <span>ตรวจสอบเอกสารประกอบ (ถ้ามี)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">4.</span>
                      <span>อนุมัติหรือปฏิเสธบัญชี</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">5.</span>
                      <span>ส่งการแจ้งเตือนผลการอนุมัติ</span>
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

export default function AdminApprovalRequired() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <AdminApprovalRequiredContent />
    </Suspense>
  );
}
