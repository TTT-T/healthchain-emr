'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Stethoscope, 
  Eye, 
  EyeOff,
  LogIn,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  User,
  Shield
} from 'lucide-react'

export default function DoctorLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginResult, setLoginResult] = useState<{
    success: boolean
    message: string
    requiresEmailVerification?: boolean
    requiresAdminApproval?: boolean
    email?: string
  } | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginResult(null)

    try {
      // Client-side validation
      if (!formData.username.trim() || !formData.password.trim()) {
        setLoginResult({
          success: false,
          message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        })
        return
      }

      // Submit to API
      const response = await fetch('/api/doctor/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLoginResult({
          success: true,
          message: 'เข้าสู่ระบบสำเร็จ! กำลังนำไปยังระบบ EMR...'
        })
        
        // Store token/session and redirect
        if (result.data?.accessToken) {
          // Store in localStorage for API client
          localStorage.setItem('access_token', result.data.accessToken)
          // Store in sessionStorage as backup
          sessionStorage.setItem('access_token', result.data.accessToken)
          // Set cookie for middleware compatibility with proper settings
          document.cookie = `access_token=${result.data.accessToken}; path=/; max-age=${60 * 60}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
          
          // Also store refresh token if available
          if (result.data?.refreshToken) {
            localStorage.setItem('refresh_token', result.data.refreshToken)
            sessionStorage.setItem('refresh_token', result.data.refreshToken)
            document.cookie = `refresh_token=${result.data.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
          }
        }
        
        // Use Next.js router for proper navigation
        setTimeout(() => {
          window.location.replace('/emr/dashboard')
        }, 1500)
        
      } else {
        // Handle different error cases
        if (result.requiresEmailVerification) {
          setLoginResult({
            success: false,
            message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
            requiresEmailVerification: true,
            email: result.email
          })
        } else if (result.requiresAdminApproval) {
          setLoginResult({
            success: false,
            message: 'บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ',
            requiresAdminApproval: true
          })
        } else {
          setLoginResult({
            success: false,
            message: result.message || 'การเข้าสู่ระบบล้มเหลว'
          })
        }
      }

    } catch (error) {
      logger.error('Doctor login error:', error)
      setLoginResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Stethoscope className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Doctor Portal
          </h1>
          <p className="text-gray-600 text-lg">
            ระบบเข้าสู่ระบบสำหรับแพทย์
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              เข้าสู่ระบบแพทย์
            </CardTitle>
            <CardDescription className="text-gray-600">
              กรุณาเข้าสู่ระบบเพื่อเข้าถึงระบบ EMR
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Result Alert */}
            {loginResult && (
              <Alert className={`border-0 ${loginResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center gap-2">
                  {loginResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertDescription className="font-medium">
                    {loginResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Email Verification Required */}
            {loginResult?.requiresEmailVerification && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-6 w-6 text-amber-600 mt-0.5" />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-amber-800">กรุณายืนยันอีเมล</h3>
                      <p className="text-amber-700 text-sm">
                        เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมลและคลิกลิงก์เพื่อยืนยันบัญชี
                      </p>
                      {loginResult.email && (
                        <p className="text-amber-600 text-sm font-medium">
                          อีเมล: {loginResult.email}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() => {
                            alert('ฟีเจอร์ส่งอีเมลยืนยันซ้ำจะเปิดใช้งานเร็วๆ นี้')
                          }}
                        >
                          ส่งอีเมลยืนยันซ้ำ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() => setLoginResult(null)}
                        >
                          ลองเข้าสู่ระบบใหม่
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Approval Required */}
            {loginResult?.requiresAdminApproval && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-blue-600 mt-0.5" />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-800">รอการอนุมัติจากผู้ดูแลระบบ</h3>
                      <p className="text-blue-700 text-sm">
                        บัญชีของคุณได้รับการยืนยันอีเมลแล้ว แต่ยังรอการอนุมัติจากผู้ดูแลระบบ
                        คุณจะได้รับการแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={() => setLoginResult(null)}
                        >
                          ลองเข้าสู่ระบบใหม่
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="กรอกชื่อผู้ใช้"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="กรอกรหัสผ่าน"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังเข้าสู่ระบบ...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    เข้าสู่ระบบ
                  </div>
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="text-center space-y-4">
              <div className="text-sm">
                <Link 
                  href="/forgot-password"
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  ยังไม่มีบัญชี?{' '}
                  <Link 
                    href="/medical-staff/register" 
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    สมัครสมาชิกแพทย์
                  </Link>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  ไม่ใช่แพทย์?{' '}
                  <Link 
                    href="/login" 
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    เข้าสู่ระบบผู้ป่วย
                  </Link>
                </p>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>สำหรับเจ้าหน้าที่การแพทย์:</p>
                <div className="flex justify-center gap-4">
                  <Link 
                    href="/admin/login" 
                    className="text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Admin
                  </Link>
                  <Link 
                    href="/external-requesters/login" 
                    className="text-purple-600 hover:text-purple-500 transition-colors"
                  >
                    External
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 HealthChain. ระบบบันทึกสุขภาพอิเล็กทรอนิกส์
          </p>
        </div>
      </div>
    </div>
  )
}
