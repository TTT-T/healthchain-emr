"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Mail, ArrowRight, Home, Shield, Clock, AlertCircle, HelpCircle, Phone, MessageCircle, UserCheck, Building2, Stethoscope, Users } from 'lucide-react';

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const requiresVerification = searchParams.get('verification') === 'true';
  const adminApproval = searchParams.get('adminApproval') === 'true';
  const userType = searchParams.get('type') || 'patient';
  const requestId = searchParams.get('requestId');

  // ฟังก์ชันสำหรับแสดงสถานะตามประเภทผู้ใช้
  const getStatusInfo = () => {
    if (userType === 'external_requester') {
      return {
        title: '🎉 ส่งคำขอสมัครสมาชิกสำเร็จ!',
        subtitle: 'ยินดีต้อนรับสู่ระบบ HealthChain',
        icon: Building2,
        iconColor: 'from-blue-500 to-indigo-600',
        statusCard: {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-800'
        },
        statusTitle: 'รอการตรวจสอบและอนุมัติ',
        statusMessage: 'คำขอของคุณจะได้รับการตรวจสอบโดยทีมงานภายใน 1-3 วันทำการ',
        additionalInfo: requestId ? `หมายเลขคำขอ: ${requestId}` : null,
        nextSteps: [
          'ตรวจสอบอีเมลเพื่อยืนยันบัญชี',
          'รอการตรวจสอบเอกสารและข้อมูล',
          'รับการแจ้งเตือนเมื่อได้รับการอนุมัติ',
          'เข้าสู่ระบบเมื่อบัญชีพร้อมใช้งาน'
        ]
      };
    } else if (userType === 'doctor' || userType === 'nurse' || userType === 'staff') {
      return {
        title: '🎉 สมัครสมาชิกสำเร็จ!',
        subtitle: 'ยินดีต้อนรับสู่ระบบ HealthChain',
        icon: Stethoscope,
        iconColor: 'from-green-500 to-emerald-600',
        statusCard: {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          textColor: 'text-green-800'
        },
        statusTitle: 'รอการตรวจสอบและอนุมัติ',
        statusMessage: 'บัญชีของคุณจะได้รับการตรวจสอบโดยผู้ดูแลระบบภายใน 1-2 วันทำการ',
        additionalInfo: `ประเภท: ${userType === 'doctor' ? 'แพทย์' : userType === 'nurse' ? 'พยาบาล' : 'เจ้าหน้าที่'}`,
        nextSteps: [
          'ตรวจสอบอีเมลเพื่อยืนยันบัญชี',
          'รอการตรวจสอบข้อมูลและเอกสารประกอบ',
          'รับการแจ้งเตือนเมื่อได้รับการอนุมัติ',
          'เข้าสู่ระบบเมื่อบัญชีพร้อมใช้งาน'
        ]
      };
    } else {
      // Patient
      return {
        title: '🎉 สมัครสมาชิกสำเร็จ!',
        subtitle: 'ยินดีต้อนรับสู่ระบบ HealthChain',
        icon: CheckCircle,
        iconColor: 'from-green-500 to-emerald-600',
        statusCard: {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-800'
        },
        statusTitle: 'กรุณายืนยันอีเมลของคุณ',
        statusMessage: 'เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว',
        additionalInfo: null,
        nextSteps: [
          'ตรวจสอบอีเมลเพื่อยืนยันบัญชี',
          'คลิกลิงก์ในอีเมลเพื่อยืนยัน',
          'เข้าสู่ระบบเมื่อยืนยันเสร็จสิ้น'
        ]
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 bg-gradient-to-r ${statusInfo.iconColor} rounded-full flex items-center justify-center shadow-lg`}>
              <StatusIcon className="text-white" size={48} />
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {statusInfo.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {statusInfo.subtitle}
            </p>
            
            <div className={`${statusInfo.statusCard.bgColor} border ${statusInfo.statusCard.borderColor} rounded-2xl p-6 mb-6`}>
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 ${statusInfo.statusCard.iconBg} rounded-full flex items-center justify-center`}>
                  <StatusIcon className={statusInfo.statusCard.iconColor} size={32} />
                </div>
              </div>
              <h2 className={`text-xl font-semibold ${statusInfo.statusCard.titleColor} mb-3`}>
                {statusInfo.statusTitle}
              </h2>
              <p className={`${statusInfo.statusCard.textColor} mb-4`}>
                {statusInfo.statusMessage}
              </p>
              
              {email && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <p className="text-sm text-gray-700 font-medium">
                    📧 {email}
                  </p>
                </div>
              )}
              
              {statusInfo.additionalInfo && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                  <p className="text-sm text-gray-700 font-medium">
                    ℹ️ {statusInfo.additionalInfo}
                  </p>
                </div>
              )}
              
              {requiresVerification && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                  <Clock size={16} />
                  <span>ลิงก์จะหมดอายุใน 24 ชั่วโมง</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {userType === 'external_requester' ? (
              <>
                <Link
                  href="/external-requesters/status"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ArrowRight size={20} />
                  ตรวจสอบสถานะคำขอ
                </Link>
                
                {requiresVerification && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      ไม่ได้รับอีเมล?
                    </p>
                    <Link
                      href={`/resend-verification?email=${encodeURIComponent(email || '')}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                    >
                      ส่งอีเมลยืนยันใหม่
                    </Link>
                  </div>
                )}
              </>
            ) : (adminApproval || userType === 'doctor' || userType === 'nurse' || userType === 'staff') ? (
              <>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ArrowRight size={20} />
                  ไปยังหน้าล็อกอิน
                </Link>
                
                {requiresVerification && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      ไม่ได้รับอีเมล?
                    </p>
                    <Link
                      href={`/resend-verification?email=${encodeURIComponent(email || '')}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                    >
                      ส่งอีเมลยืนยันใหม่
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ArrowRight size={20} />
                  ไปยังหน้าล็อกอิน
                </Link>
                
                {requiresVerification && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      ไม่ได้รับอีเมล?
                    </p>
                    <Link
                      href={`/resend-verification?email=${encodeURIComponent(email || '')}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                    >
                      ส่งอีเมลยืนยันใหม่
                    </Link>
                  </div>
                )}
              </>
            )}

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
            {/* Next Steps */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <UserCheck className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-blue-800 mb-3">
                    ขั้นตอนถัดไป
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    {statusInfo.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            {requiresVerification && (
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
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Approval Notice */}
            {(adminApproval || userType === 'doctor' || userType === 'nurse' || userType === 'staff') && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Users className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-left">
                    <h3 className="font-medium text-orange-800 mb-2">
                      การอนุมัติจากผู้ดูแลระบบ
                    </h3>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• บัญชีของคุณจะได้รับการตรวจสอบโดยผู้ดูแลระบบ</li>
                      <li>• กระบวนการตรวจสอบใช้เวลาประมาณ 1-2 วันทำการ</li>
                      <li>• คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ</li>
                      <li>• สามารถเข้าสู่ระบบได้เมื่อบัญชีพร้อมใช้งาน</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

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

export default function RegisterSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <RegisterSuccessContent />
    </Suspense>
  );
}
