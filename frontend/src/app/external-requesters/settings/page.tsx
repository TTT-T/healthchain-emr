'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Bell, 
  Shield,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Clock,
  Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [notifications, setNotifications] = useState({
    emailApproval: true,
    emailRejection: true,
    emailExpiration: true,
    emailSystemUpdates: false,
    pushNotifications: true,
    smsNotifications: false
  })

  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    sessionTimeout: '30',
    loginNotifications: true,
    dataAccessLogging: true
  })

  const [settings, setSettings] = useState({
    dataAccessLevel: 'basic',
    maxConcurrentRequests: 10,
    allowedRequestTypes: [],
    complianceCertifications: [],
    dataProtectionCertification: ''
  })

  // Load settings data
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getExternalRequesterSettings()
        
        if (response.statusCode === 200 && response.data) {
          const data = response.data as any
          setSettings({
            dataAccessLevel: data.dataAccessLevel || 'basic',
            maxConcurrentRequests: data.maxConcurrentRequests || 10,
            allowedRequestTypes: data.allowedRequestTypes || [],
            complianceCertifications: data.complianceCertifications || [],
            dataProtectionCertification: data.dataProtectionCertification || ''
          })
          
          if (data.notificationPreferences) {
            setNotifications({
              emailApproval: data.notificationPreferences.emailApproval ?? true,
              emailRejection: data.notificationPreferences.emailRejection ?? true,
              emailExpiration: data.notificationPreferences.emailExpiration ?? true,
              emailSystemUpdates: data.notificationPreferences.emailSystemUpdates ?? false,
              pushNotifications: data.notificationPreferences.pushNotifications ?? true,
              smsNotifications: data.notificationPreferences.smsNotifications ?? false
            })
          }
          
          if (data.privacySettings) {
            setSecurity({
              twoFactorAuth: data.privacySettings.twoFactorAuth ?? true,
              sessionTimeout: data.privacySettings.sessionTimeout ?? '30',
              loginNotifications: data.privacySettings.loginNotifications ?? true,
              dataAccessLogging: data.privacySettings.dataAccessLogging ?? true
            })
          }
        }
      } catch (error) {
        logger.error("Error loading settings data:", error)
        setError("เกิดข้อผิดพลาดในการโหลดการตั้งค่า")
      } finally {
        setIsLoading(false)
      }
    }

    loadSettingsData()
  }, [])

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (newPassword.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await apiClient.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      })

      if (response.statusCode === 200) {
        setSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
      }
    } catch (error: any) {
      logger.error('Error changing password:', error)
      setError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const updateData = {
        notificationPreferences: notifications,
        privacySettings: security,
        dataAccessLevel: settings.dataAccessLevel,
        maxConcurrentRequests: settings.maxConcurrentRequests,
        allowedRequestTypes: settings.allowedRequestTypes,
        complianceCertifications: settings.complianceCertifications,
        dataProtectionCertification: settings.dataProtectionCertification
      }

      const response = await apiClient.updateExternalRequesterSettings(updateData)
      
      if (response.statusCode === 200) {
        setSuccess('บันทึกการตั้งค่าสำเร็จ')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch (error: any) {
      logger.error('Error saving settings:', error)
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSecurityChange = (key: string, value: boolean | string) => {
    setSecurity(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Mobile Menu */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">
                    การตั้งค่า
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
                จัดการการตั้งค่าบัญชีและการแจ้งเตือน
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Password Change */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Key className="h-6 w-6 text-red-600" />
                      </div>
                      <span>เปลี่ยนรหัสผ่าน</span>
                    </CardTitle>
                    <CardDescription>
                      เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านปัจจุบัน
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="กรอกรหัสผ่านปัจจุบัน"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผ่านใหม่
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="กรอกรหัสผ่านใหม่"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ยืนยันรหัสผ่านใหม่
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ยืนยันรหัสผ่านใหม่"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังเปลี่ยนรหัสผ่าน...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          เปลี่ยนรหัสผ่าน
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-lg text-gray-900">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>ความปลอดภัย</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">2FA เปิดใช้งาน</span>
                      <Badge className={security.twoFactorAuth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {security.twoFactorAuth ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">การแจ้งเตือนการเข้าสู่ระบบ</span>
                      <Badge className={security.loginNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {security.loginNotifications ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">การบันทึกการเข้าถึงข้อมูล</span>
                      <Badge className={security.dataAccessLogging ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {security.dataAccessLogging ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-lg text-gray-900">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600" />
                      </div>
                      <span>การแจ้งเตือน</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">อีเมล</span>
                      <Badge className={notifications.emailApproval ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {notifications.emailApproval ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Push</span>
                      <Badge className={notifications.pushNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {notifications.pushNotifications ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">SMS</span>
                      <Badge className={notifications.smsNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {notifications.smsNotifications ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Notifications Settings */}
            <Card className="shadow-lg border-0 bg-white mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="h-6 w-6 text-green-600" />
                  </div>
                  <span>การแจ้งเตือน</span>
                </CardTitle>
                <CardDescription>
                  จัดการการแจ้งเตือนต่างๆ ของระบบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>การแจ้งเตือนทางอีเมล</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">การอนุมัติคำขอ</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailApproval}
                            onChange={(e) => handleNotificationChange('emailApproval', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">การปฏิเสธคำขอ</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailRejection}
                            onChange={(e) => handleNotificationChange('emailRejection', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">การหมดอายุคำขอ</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailExpiration}
                            onChange={(e) => handleNotificationChange('emailExpiration', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">การอัปเดตระบบ</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailSystemUpdates}
                            onChange={(e) => handleNotificationChange('emailSystemUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span>การแจ้งเตือนอื่นๆ</span>
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Push Notifications</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.pushNotifications}
                            onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">SMS Notifications</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.smsNotifications}
                            onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="shadow-lg border-0 bg-white mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <span>การตั้งค่าความปลอดภัย</span>
                </CardTitle>
                <CardDescription>
                  จัดการการตั้งค่าความปลอดภัยของบัญชี
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">การแจ้งเตือนการเข้าสู่ระบบ</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.loginNotifications}
                          onChange={(e) => handleSecurityChange('loginNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">การบันทึกการเข้าถึงข้อมูล</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={security.dataAccessLogging}
                          onChange={(e) => handleSecurityChange('dataAccessLogging', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (นาที)
                      </label>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="15">15 นาที</option>
                        <option value="30">30 นาที</option>
                        <option value="60">1 ชั่วโมง</option>
                        <option value="120">2 ชั่วโมง</option>
                        <option value="480">8 ชั่วโมง</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการตั้งค่า
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}