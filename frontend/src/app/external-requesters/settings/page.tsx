'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalRequesterSidebar, ExternalRequesterMobileSidebar } from '@/components/ExternalRequesterSidebar'
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
  Clock
} from 'lucide-react'

export default function SettingsPage() {
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

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (newPassword.length < 8) {
      alert('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    // Mock password change
    console.log('Changing password...')
    alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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

  const saveSettings = () => {
    // Mock save
    console.log('Saving settings...', { notifications, security })
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <ExternalRequesterSidebar className="hidden lg:block w-80 xl:w-96 flex-shrink-0" />
      
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
                <ExternalRequesterMobileSidebar />
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
                จัดการการตั้งค่าบัญชี ความปลอดภัย และการแจ้งเตือน
              </p>
            </div>

          <div className="space-y-8">
            {/* Password Change */}
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
                      placeholder="ใส่รหัสผ่านปัจจุบัน"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        placeholder="ใส่รหัสผ่านใหม่"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ
                  </AlertDescription>
                </Alert>

                <Button onClick={handlePasswordChange} className="bg-red-600 hover:bg-red-700">
                  <Save className="h-4 w-4 mr-2" />
                  เปลี่ยนรหัสผ่าน
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <span>ความปลอดภัย</span>
                </CardTitle>
                <CardDescription>
                  การตั้งค่าความปลอดภัยและการยืนยันตัวตน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">การยืนยันตัวตนแบบ 2 ขั้นตอน (2FA)</h3>
                      <p className="text-sm text-gray-600">เพิ่มความปลอดภัยด้วยการยืนยันทางโทรศัพท์</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={security.twoFactorAuth ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {security.twoFactorAuth ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSecurityChange('twoFactorAuth', !security.twoFactorAuth)}
                    >
                      {security.twoFactorAuth ? 'ปิด' : 'เปิด'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-purple-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">การแจ้งเตือนการเข้าสู่ระบบ</h3>
                      <p className="text-sm text-gray-600">รับแจ้งเตือนเมื่อมีการเข้าสู่ระบบใหม่</p>
                    </div>
                  </div>
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

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">บันทึกการเข้าถึงข้อมูล</h3>
                      <p className="text-sm text-gray-600">บันทึกประวัติการเข้าถึงข้อมูลผู้ป่วย</p>
                    </div>
                  </div>
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

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-red-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">หมดเวลาเซสชัน</h3>
                      <p className="text-sm text-gray-600">เวลาก่อนออกจากระบบอัตโนมัติ (นาที)</p>
                    </div>
                  </div>
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="15">15 นาที</option>
                    <option value="30">30 นาที</option>
                    <option value="60">1 ชั่วโมง</option>
                    <option value="120">2 ชั่วโมง</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>การแจ้งเตือน</span>
                </CardTitle>
                <CardDescription>
                  จัดการการแจ้งเตือนทางอีเมล SMS และแอปพลิเคชัน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-3">อีเมล</h4>
                  
                  {[

                    { key: 'emailApproval', label: 'คำขอได้รับการอนุมัติ', desc: 'แจ้งเตือนเมื่อคำขอได้รับการอนุมัติ' },
                    { key: 'emailRejection', label: 'คำขอถูกปฏิเสธ', desc: 'แจ้งเตือนเมื่อคำขอถูกปฏิเสธ' },
                    { key: 'emailExpiration', label: 'คำขอใกล้หมดอายุ', desc: 'แจ้งเตือนก่อนคำขอหมดอายุ 3 วัน' },
                    { key: 'emailSystemUpdates', label: 'อัปเดตระบบ', desc: 'แจ้งเตือนการปรับปรุงระบบและฟีเจอร์ใหม่' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">{item.label}</h5>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}

                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">อื่นๆ</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">การแจ้งเตือนแบบ Push</h5>
                        <p className="text-sm text-gray-600">แจ้งเตือนผ่านเบราว์เซอร์</p>
                      </div>
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

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">SMS</h5>
                        <p className="text-sm text-gray-600">แจ้งเตือนผ่านข้อความ SMS</p>
                      </div>
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
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                บันทึกการตั้งค่า
              </Button>
            </div>

            {/* Help Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>เคล็ดลับ:</strong> การตั้งค่าความปลอดภัยที่แนะนำคือเปิดใช้งาน 2FA และการแจ้งเตือนการเข้าสู่ระบบ 
                เพื่อป้องกันการเข้าถึงที่ไม่ได้รับอนุญาต
              </AlertDescription>
            </Alert>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
