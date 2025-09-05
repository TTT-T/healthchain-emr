'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Shield, 
  Eye, 
  EyeOff,
  LogIn,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function ExternalRequesterLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginResult, setLoginResult] = useState<{
    success: boolean
    message: string
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
      if (!formData.email.trim() || !formData.password.trim()) {
        setLoginResult({
          success: false,
          message: 'กรุณากรอกอีเมลและรหัสผ่าน'
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setLoginResult({
          success: false,
          message: 'รูปแบบอีเมลไม่ถูกต้อง'
        })
        return
      }

      // Submit to API
      const response = await fetch('/api/external-requesters/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setLoginResult({
          success: true,
          message: 'เข้าสู่ระบบสำเร็จ! กำลังนำไปยังหน้าหลัก...'
        })
        
        // Store token/session and redirect
        if (result.token) {
          localStorage.setItem('external-requester-token', result.token)
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/external-requesters/dashboard'
        }, 2000)
        
      } else {
        setLoginResult({
          success: false,
          message: result.error || 'การเข้าสู่ระบบล้มเหลว'
        })
      }

    } catch (error) {
      console.error('Login error:', error)
      setLoginResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-3 sm:p-4 bg-blue-600 rounded-full">
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            External Requester
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            เข้าสู่ระบบ Consent Engine
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="text-center pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              สำหรับองค์กรที่ได้รับการอนุมัติแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    placeholder="your-email@organization.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Result */}
              {loginResult && (
                <Alert className={`${loginResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                  {loginResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={`${loginResult.success ? 'text-green-800' : 'text-red-800'} font-medium`}>
                    {loginResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                disabled={isLoading || (loginResult?.success === true)}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : loginResult?.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    เข้าสู่ระบบสำเร็จ
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <div className="text-sm text-gray-600">
                <Link href="/external-requesters/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  ยังไม่ได้ลงทะเบียน?
                </p>
                <Link href="/external-requesters/register">
                  <Button variant="outline" className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                    ลงทะเบียนองค์กร
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
            <Shield className="h-4 w-4" />
            <span>การเชื่อมต่อที่ปลอดภัยด้วย SSL</span>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <p>ต้องการความช่วยเหลือ? ติดต่อ support@emr-system.com</p>
            <p>หรือโทร 02-123-4567 (วันจันทร์-ศุกร์ 8:00-17:00)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
