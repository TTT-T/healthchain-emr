'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Eye, 
  EyeOff,
  LogIn,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  Crown,
  Settings
} from 'lucide-react'

export default function AdminLogin() {
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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.statusCode === 200) {
        setLoginResult({
          success: true,
          message: 'เข้าสู่ระบบสำเร็จ! กำลังนำไปยังหน้าหลัก...'
        })
        
        // Store token/session and redirect
        if (result.token) {
          localStorage.setItem('admin-token', result.token)
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 2000)
        
      } else {
        setLoginResult({
          success: false,
          message: result.message || 'การเข้าสู่ระบบล้มเหลว'
        })
      }

    } catch (error) {
      logger.error('Login error:', error)
      setLoginResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Crown className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600 text-lg">
            ระบบจัดการสำหรับผู้ดูแลระบบ
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              เข้าสู่ระบบ
            </CardTitle>
            <CardDescription className="text-gray-600">
              สำหรับผู้ดูแลระบบเท่านั้น
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลผู้ดูแลระบบ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-4 text-gray-900 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="admin@healthchain.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-4 text-gray-900 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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

              <button
                type="submit"
                disabled={isLoading || (loginResult?.success === true)}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white transition-all duration-200 transform ${
                  isLoading || loginResult?.success === true
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-purple-200'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-6 w-6 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : loginResult?.success ? (
                  <>
                    <CheckCircle className="h-6 w-6 mr-3" />
                    เข้าสู่ระบบสำเร็จ
                  </>
                ) : (
                  <>
                    <LogIn className="h-6 w-6 mr-3" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
            <Shield className="h-4 w-4" />
            <span>การเชื่อมต่อที่ปลอดภัยด้วย SSL</span>
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <p>ต้องการความช่วยเหลือ? ติดต่อ admin@healthchain.com</p>
            <p>หรือโทร 02-123-4567 (วันจันทร์-ศุกร์ 8:00-17:00)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
