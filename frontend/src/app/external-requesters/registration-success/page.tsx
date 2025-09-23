'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Mail, Clock, UserCheck, AlertCircle } from 'lucide-react'

interface RegistrationStatus {
  success: boolean
  message: string
  requestId?: string
  email?: string
  requiresEmailVerification: boolean
  requiresAdminApproval: boolean
}

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<RegistrationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // รับข้อมูลจาก URL parameters หรือ localStorage
    const requestId = searchParams.get('requestId')
    const email = searchParams.get('email')
    const success = searchParams.get('success') === 'true'
    
    if (requestId && email) {
      setStatus({
        success: true,
        message: 'การลงทะเบียนสำเร็จ!',
        requestId,
        email,
        requiresEmailVerification: true,
        requiresAdminApproval: true
      })
    } else {
      // ตรวจสอบจาก localStorage
      const savedStatus = localStorage.getItem('registrationStatus')
      if (savedStatus) {
        setStatus(JSON.parse(savedStatus))
        localStorage.removeItem('registrationStatus')
      }
    }
    
    setIsLoading(false)
  }, [searchParams])

  const handleResendEmail = async () => {
    alert('ฟีเจอร์ส่งอีเมลซ้ำจะเปิดใช้งานเร็วๆ นี้')
  }

  const handleGoToLogin = () => {
    router.push('/external-requesters/login')
  }

  const handleGoToHome = () => {
    router.push('/external-requesters')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการลงทะเบียน</h1>
          <p className="text-gray-600 mb-6">กรุณาลองลงทะเบียนใหม่อีกครั้ง</p>
          <button
            onClick={() => router.push('/external-requesters/register')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            ลงทะเบียนใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Card */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-8">
          {/* Success Header */}
          <div className="flex items-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-green-800">
              ลงทะเบียนสำเร็จ!
            </h1>
          </div>
          
          {/* Request ID */}
          <div className="mb-4">
            <p className="text-green-700 font-medium">
              รหัสคำขอ: {status.requestId}
            </p>
          </div>
          
          {/* Processing Time */}
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-700">
              ระยะเวลาตรวจสอบโดยประมาณ: 3-5 วันทำการ
            </p>
          </div>
          
          {/* Next Steps */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <UserCheck className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-700 font-medium">ขั้นตอนต่อไป:</p>
            </div>
            <ol className="list-decimal list-inside text-green-700 space-y-1 ml-7">
              <li>ตรวจสอบอีเมลและยืนยันบัญชี</li>
              <li>รอการอนุมัติจากผู้ดูแลระบบ</li>
              <li>เข้าสู่ระบบด้วย Username และ Password ที่ตั้งไว้</li>
            </ol>
          </div>
          
          {/* Reference Code Box */}
          <div className="bg-white border border-green-300 rounded-lg p-4">
            <p className="text-green-700 font-medium">
              รหัสอ้างอิง: {status.requestId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* ส่งสำเร็จแล้ว - ปุ่มสีเขียว */}
          <button
            disabled
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium cursor-not-allowed opacity-90"
          >
            <CheckCircle className="h-5 w-5 inline mr-2" />
            ส่งสำเร็จแล้ว
          </button>
          
          {/* ไปหน้าเข้าสู่ระบบ - ปุ่มขาวขอบเขียว */}
          <button
            onClick={handleGoToLogin}
            className="bg-white border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
          
          {/* ดูสถานะการลงทะเบียน - ปุ่มขาวขอบเทา */}
          <button
            onClick={() => window.location.reload()}
            className="bg-white border-2 border-gray-400 text-gray-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ดูสถานะการลงทะเบียน
          </button>
          
          {/* กลับหน้าหลัก - ปุ่มขาวขอบเทา */}
          <button
            onClick={handleGoToHome}
            className="bg-white border-2 border-gray-400 text-gray-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  )
}
