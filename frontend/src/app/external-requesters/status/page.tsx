'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Clock, UserCheck, AlertCircle, Mail, Shield, ArrowRight } from 'lucide-react'

interface RegistrationStatus {
  id: string
  requestId: string
  email: string
  organizationName: string
  status: 'pending_email_verification' | 'pending_admin_approval' | 'approved' | 'rejected'
  emailVerified: boolean
  adminApproved: boolean
  created_at: string
  updated_at: string
}

function RegistrationStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<RegistrationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const requestId = searchParams.get('requestId')
    const email = searchParams.get('email')
    
    if (requestId && email) {
      fetchStatus(requestId, email)
    } else {
      setError('ไม่พบข้อมูลการลงทะเบียน')
      setIsLoading(false)
    }
  }, [searchParams])

  const fetchStatus = async (requestId: string, email: string) => {
    try {
      const response = await fetch(`/api/external-requesters/status?requestId=${requestId}&email=${email}`)
      const result = await response.json()
      
      if (result.success) {
        setStatus(result.data)
      } else {
        setError(result.message || 'ไม่พบข้อมูลการลงทะเบียน')
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusInfo = (status: RegistrationStatus['status']) => {
    switch (status) {
      case 'pending_email_verification':
        return {
          title: 'รอการยืนยันอีเมล',
          description: 'กรุณาตรวจสอบอีเมลและคลิกลิงก์ยืนยัน',
          icon: <Mail className="h-8 w-8 text-blue-500" />,
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        }
      case 'pending_admin_approval':
        return {
          title: 'รอการอนุมัติจาก Admin',
          description: 'บัญชีของคุณอยู่ระหว่างการตรวจสอบจากผู้ดูแลระบบ',
          icon: <Shield className="h-8 w-8 text-yellow-500" />,
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        }
      case 'approved':
        return {
          title: 'อนุมัติแล้ว - พร้อมเข้าสู่ระบบ',
          description: 'บัญชีของคุณได้รับการอนุมัติแล้ว สามารถเข้าสู่ระบบได้',
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        }
      case 'rejected':
        return {
          title: 'การลงทะเบียนถูกปฏิเสธ',
          description: 'บัญชีของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ',
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
    }
  }

  const handleGoToLogin = () => {
    router.push('/external-requesters/login')
  }

  const handleResendEmail = async () => {

    alert('ฟีเจอร์ส่งอีเมลซ้ำจะเปิดใช้งานเร็วๆ นี้')
  }

  const handleContactSupport = () => {

    alert('ฟีเจอร์ติดต่อสนับสนุนจะเปิดใช้งานเร็วๆ นี้')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดสถานะ...</p>
        </div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการลงทะเบียน</h1>
          <p className="text-gray-600 mb-6">{error || 'กรุณาลองลงทะเบียนใหม่อีกครั้ง'}</p>
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

  const statusInfo = getStatusInfo(status.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            สถานะการลงทะเบียน
          </h1>
          <p className="text-lg text-gray-600">
            ติดตามสถานะการลงทะเบียนของคุณ
          </p>
        </div>

        {/* Status Card */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 rounded-xl p-8 mb-8`}>
          <div className="flex items-center mb-6">
            {statusInfo.icon}
            <div className="ml-4">
              <h2 className={`text-2xl font-bold ${statusInfo.textColor}`}>
                {statusInfo.title}
              </h2>
              <p className={`${statusInfo.textColor} opacity-80`}>
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">ข้อมูลการลงทะเบียน</h3>
              <div className="space-y-2">
                <p><span className="font-medium">รหัสคำขอ:</span> {status.requestId}</p>
                <p><span className="font-medium">อีเมล:</span> {status.email}</p>
                <p><span className="font-medium">องค์กร:</span> {status.organizationName}</p>
                 <p><span className="font-medium">วันที่ลงทะเบียน:</span> {new Date(status.created_at).toLocaleString('th-TH')}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">สถานะปัจจุบัน</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className={`h-4 w-4 mr-2 ${status.emailVerified ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={status.emailVerified ? 'text-green-600' : 'text-gray-500'}>
                    {status.emailVerified ? 'ยืนยันอีเมลแล้ว' : 'ยังไม่ยืนยันอีเมล'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Shield className={`h-4 w-4 mr-2 ${status.adminApproved ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={status.adminApproved ? 'text-green-600' : 'text-gray-500'}>
                    {status.adminApproved ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">ขั้นตอนการลงทะเบียน</h3>
          
          <div className="space-y-6">
            {/* Step 1: Email Verification */}
            <div className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.emailVerified ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {status.emailVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">1</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${status.emailVerified ? 'text-green-800' : 'text-gray-900'}`}>
                  ยืนยันอีเมล
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  ตรวจสอบอีเมลและคลิกลิงก์ยืนยันที่ส่งไปให้
                </p>
                {!status.emailVerified && (
                  <button
                    onClick={handleResendEmail}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    ส่งอีเมลยืนยันซ้ำ
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Admin Approval */}
            <div className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.adminApproved ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {status.adminApproved ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">2</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${status.adminApproved ? 'text-green-800' : 'text-gray-900'}`}>
                  รอการอนุมัติจาก Admin
                </h4>
                <p className="text-sm text-gray-600">
                  ระบบจะส่งคำขอไปยังผู้ดูแลระบบเพื่อตรวจสอบและอนุมัติ
                </p>
              </div>
            </div>

            {/* Step 3: Login */}
            <div className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status.status === 'approved' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {status.status === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">3</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${status.status === 'approved' ? 'text-green-800' : 'text-gray-900'}`}>
                  เข้าสู่ระบบ
                </h4>
                <p className="text-sm text-gray-600">
                  หลังจากยืนยันอีเมลและได้รับการอนุมัติแล้ว สามารถเข้าสู่ระบบได้
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {status.status === 'approved' ? (
            <button
              onClick={handleGoToLogin}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              เข้าสู่ระบบ
            </button>
          ) : status.status === 'rejected' ? (
            <button
              onClick={handleContactSupport}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              ติดต่อสนับสนุน
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              รีเฟรชสถานะ
            </button>
          )}
          
          <button
            onClick={() => router.push('/external-requesters')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <RegistrationStatusContent />
    </Suspense>
  )
}