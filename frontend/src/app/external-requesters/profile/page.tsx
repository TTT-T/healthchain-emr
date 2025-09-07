'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { ExternalRequesterProfile } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  User, 
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  CheckCircle,
  Shield,
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState({
    organizationName: '',
    organizationType: 'hospital',
    registrationNumber: '',
    licenseNumber: '',
    taxId: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    address: {
      streetAddress: '',
      subDistrict: '',
      district: '',
      province: '',
      postalCode: '',
      country: 'Thailand'
    },
    allowedRequestTypes: [],
    dataAccessLevel: 'basic',
    maxConcurrentRequests: 10,
    complianceCertifications: [],
    dataProtectionCertification: '',
    status: 'pending',
    isVerified: false
  })

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getExternalRequesterProfile()
        
        if (response.statusCode === 200 && response.data) {
          const data = response.data
          setProfileData({
            organizationName: data.organizationName || '',
            organizationType: data.organizationType || 'hospital',
            registrationNumber: data.registrationNumber || '',
            licenseNumber: data.licenseNumber || '',
            taxId: data.taxId || '',
            primaryContactName: data.primaryContactName || '',
            primaryContactEmail: data.primaryContactEmail || '',
            primaryContactPhone: data.primaryContactPhone || '',
            address: data.address || {
              streetAddress: '',
              subDistrict: '',
              district: '',
              province: '',
              postalCode: '',
              country: 'Thailand'
            },
            allowedRequestTypes: data.allowedRequestTypes || [],
            dataAccessLevel: data.dataAccessLevel || 'basic',
            maxConcurrentRequests: data.maxConcurrentRequests || 10,
            complianceCertifications: data.complianceCertifications || [],
            dataProtectionCertification: data.dataProtectionCertification || '',
            status: data.status || 'pending',
            isVerified: data.isVerified || false
          })
        }
      } catch (error) {
        logger.error("Error loading profile data:", error)
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Prepare data for API
      const updateData = {
        organizationName: profileData.organizationName,
        organizationType: profileData.organizationType,
        registrationNumber: profileData.registrationNumber,
        licenseNumber: profileData.licenseNumber,
        taxId: profileData.taxId,
        primaryContactName: profileData.primaryContactName,
        primaryContactEmail: profileData.primaryContactEmail,
        primaryContactPhone: profileData.primaryContactPhone,
        address: profileData.address,
        allowedRequestTypes: profileData.allowedRequestTypes,
        dataAccessLevel: profileData.dataAccessLevel,
        maxConcurrentRequests: profileData.maxConcurrentRequests,
        complianceCertifications: profileData.complianceCertifications,
        dataProtectionCertification: profileData.dataProtectionCertification
      }

      const response = await apiClient.updateExternalRequesterProfile(updateData)
      
      if (response.statusCode === 200 && response.data) {
        setSuccess('บันทึกข้อมูลโปรไฟล์สำเร็จ')
        setIsEditing(false)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch (error: any) {
      logger.error('Error saving profile:', error)
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }))
    }
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
          <p className="text-gray-600">กำลังโหลดข้อมูลโปรไฟล์...</p>
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
                    ข้อมูลองค์กร
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
                จัดการข้อมูลองค์กรและรายละเอียดการติดต่อ
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

          {/* Status Card */}
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    profileData.isVerified ? 'bg-green-100' : 
                    profileData.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <CheckCircle className={`h-8 w-8 ${
                      profileData.isVerified ? 'text-green-600' : 
                      profileData.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">สถานะการอนุมัติ</h3>
                    <p className={`font-medium ${
                      profileData.isVerified ? 'text-green-600' : 
                      profileData.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {profileData.isVerified ? 'อนุมัติแล้ว - ใช้งานได้ปกติ' : 
                       profileData.status === 'pending' ? 'รอการอนุมัติ' : 'ถูกระงับ'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">ระดับการเข้าถึงข้อมูล</p>
                  <p className="font-semibold text-gray-900 capitalize">{profileData.dataAccessLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <span>ข้อมูลองค์กร</span>
                    </CardTitle>
                    <Button
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      disabled={loading}
                      className={isEditing ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          บันทึก
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          แก้ไข
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อองค์กร
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.organizationName}
                          onChange={(e) => handleInputChange('organizationName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.organizationName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภทองค์กร
                      </label>
                      {isEditing ? (
                        <select
                          value={profileData.organizationType}
                          onChange={(e) => handleInputChange('organizationType', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="hospital">โรงพยาบาล</option>
                          <option value="clinic">คลินิก</option>
                          <option value="insurance">บริษัทประกัน</option>
                          <option value="research">สถาบันวิจัย</option>
                          <option value="government">หน่วยงานราชการ</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 font-medium capitalize">
                          {profileData.organizationType === 'hospital' ? 'โรงพยาบาล' :
                           profileData.organizationType === 'clinic' ? 'คลินิก' :
                           profileData.organizationType === 'insurance_company' ? 'บริษัทประกัน' :
                           profileData.organizationType === 'research_institute' ? 'สถาบันวิจัย' :
                           profileData.organizationType === 'government_agency' ? 'หน่วยงานราชการ' :
                           profileData.organizationType === 'legal_entity' ? 'นิติบุคคล' :
                           profileData.organizationType === 'audit_organization' ? 'องค์กรตรวจสอบ' :
                           profileData.organizationType}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเลขลงทะเบียน
                      </label>
                      <p className="text-gray-900 font-medium">{profileData.registrationNumber}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขที่ใบอนุญาตประกอบกิจการ
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.licenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบายองค์กร
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profileData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ที่อยู่
                    </label>
                    {isEditing ? (
                      <textarea
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เว็บไซต์
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profileData.website}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="shadow-lg border-0 bg-white mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <span>ข้อมูลผู้ติดต่อ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อผู้ติดต่อ
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.contactPerson}
                          onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.contactPerson}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ตำแหน่ง
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.position}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์โทรศัพท์
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profileData.phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">สถิติการใช้งาน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">คำขอทั้งหมด</span>
                    <span className="font-semibold text-gray-900">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">อนุมัติแล้ว</span>
                    <span className="font-semibold text-green-600">38</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">อัตราความสำเร็จ</span>
                    <span className="font-semibold text-blue-600">81%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg text-gray-900">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>ความปลอดภัย</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">การยืนยันตัวตน 2FA เปิดใช้งาน</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">ใบรับรองดิจิทัลที่ถูกต้อง</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">การเข้ารหัสข้อมูลระดับสูง</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg text-gray-900">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>กิจกรรมล่าสุด</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">ส่งคำขอข้อมูล</p>
                    <p className="text-gray-500">2 ชั่วโมงที่แล้ว</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">ดาวน์โหลดข้อมูลผู้ป่วย</p>
                    <p className="text-gray-500">1 วันที่แล้ว</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">อัปเดตข้อมูลองค์กร</p>
                    <p className="text-gray-500">3 วันที่แล้ว</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Help Alert */}
          <Alert className="mt-8 bg-blue-50 border-blue-200">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>การอัปเดตข้อมูล:</strong> การเปลี่ยนแปลงข้อมูลองค์กรสำคัญ (เช่น ชื่อองค์กร, ประเภท) 
              อาจต้องได้รับการตรวจสอบจากผู้ดูแลระบบก่อนการอนุมัติ
            </AlertDescription>
          </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
