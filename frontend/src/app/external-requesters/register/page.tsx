'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Shield, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Hospital,
  Users,
  Scale,
  Building
} from 'lucide-react'

interface ExternalRequesterRegistration {
  // Organization Information (ตาม external_requesters table)
  organizationName: string
  organizationType: 'hospital' | 'clinic' | 'insurance_company' | 'research_institute' | 'government_agency' | 'legal_entity' | 'audit_organization'
  
  // Registration Details
  registrationNumber: string
  licenseNumber: string
  taxId: string
  
  // Contact Information
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  
  // Login Credentials
  loginEmail: string
  password: string
  confirmPassword: string
  
  // Address (JSONB ใน database)
  address: {
    streetAddress: string
    subDistrict: string      // ตำบล/แขวง
    district: string         // อำเภอ/เขต
    province: string         // จังหวัด
    postalCode: string       // รหัสไปรษณีย์
    country: string          // ประเทศ
  }
  
  // Access Permissions (ตาม database schema)
  allowedRequestTypes: string[]              // JSONB array
  dataAccessLevel: 'basic' | 'standard' | 'premium'
  maxConcurrentRequests: number
  
  // Compliance Information (JSONB arrays)
  complianceCertifications: string[]         // JSONB array
  dataProtectionCertification: string
  
  // Supporting Documents (JSONB array ของ file references)
  verificationDocuments: {
    fileName: string
    fileType: string
    fileSize: number
    uploadDate: string
  }[]
}

export default function ExternalRequesterRegistration() {
  const [formData, setFormData] = useState<ExternalRequesterRegistration>({
    // Organization Information
    organizationName: '',
    organizationType: 'hospital' as const,
    
    // Registration Details
    registrationNumber: '',
    licenseNumber: '',
    taxId: '',
    
    // Contact Information
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    
    // Login Credentials
    loginEmail: '',
    password: '',
    confirmPassword: '',
    
    // Address (JSONB ใน database)
    address: {
      streetAddress: '',
      subDistrict: '',
      district: '',
      province: '',
      postalCode: '',
      country: 'Thailand'
    },
    dataAccessLevel: 'basic',
    allowedRequestTypes: [],
    maxConcurrentRequests: 5,
    complianceCertifications: [],
    dataProtectionCertification: '',
    verificationDocuments: [],
  })

  const organizationTypes = [
    {
      value: 'hospital',
      label: 'โรงพยาบาล',
      icon: <Hospital className="h-5 w-5" />,
      description: 'โรงพยาบาลรัฐ/เอกชน ที่ต้องการข้อมูลผู้ป่วยสำหรับการรักษาต่อเนื่อง'
    },
    {
      value: 'clinic',
      label: 'คลินิก',
      icon: <Building2 className="h-5 w-5" />,
      description: 'คลินิกเอกชน ศูนย์การแพทย์เฉพาะทาง'
    },
    {
      value: 'insurance_company',
      label: 'บริษัทประกัน',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'บริษัทประกันชีวิต/สุขภาพ สำหรับการเคลมประกัน'
    },
    {
      value: 'research_institute',
      label: 'สถาบันวิจัย',
      icon: <FileText className="h-5 w-5" />,
      description: 'มหาวิทยาลัย สถาบันวิจัยทางการแพทย์'
    },
    {
      value: 'government_agency',
      label: 'หน่วยงานราชการ',
      icon: <Building className="h-5 w-5" />,
      description: 'กระทรวงสาธารณสุข สำนักงานประกันสังคม'
    },
    {
      value: 'legal_entity',
      label: 'หน่วยงานกฎหมาย',
      icon: <Scale className="h-5 w-5" />,
      description: 'สำนักงานทนายความ ด้านคดีทางการแพทย์'
    },
    {
      value: 'audit_organization',
      label: 'หน่วยงานตรวจสอบ',
      icon: <Shield className="h-5 w-5" />,
      description: 'หน่วยงานรับรองคุณภาพ องค์กรตรวจสอบ'
    }
  ]

  const requestTypes = [
    { value: 'hospital_transfer', label: 'การส่งต่อผู้ป่วย', category: 'medical' },
    { value: 'insurance_claim', label: 'การเคลมประกัน', category: 'business' },
    { value: 'research', label: 'การวิจัยทางการแพทย์', category: 'research' },
    { value: 'legal', label: 'กระบวนการทางกฎหมาย', category: 'legal' },
    { value: 'emergency', label: 'กรณีฉุกเฉิน', category: 'emergency' },
    { value: 'audit', label: 'การตรวจสอบคุณภาพ', category: 'compliance' },
    { value: 'government_reporting', label: 'การรายงานภาครัฐ', category: 'government' }
  ]

  const accessLevels = [
    {
      value: 'basic',
      label: 'Basic Access',
      description: 'ข้อมูลพื้นฐาน เช่น ชื่อ-นามสกุล วันเกิด',
      maxRequests: 10,
      features: ['ข้อมูลพื้นฐาน', 'ประวัติการรักษาทั่วไป']
    },
    {
      value: 'standard',
      label: 'Standard Access',
      description: 'ข้อมูลการรักษา ผลตรวจ ข้อมูลการจ่ายยา',
      maxRequests: 50,
      features: ['ข้อมูลพื้นฐาน', 'ประวัติการรักษา', 'ผลตรวจทางห้องปฏิบัติการ', 'ข้อมูลการจ่ายยา']
    },
    {
      value: 'premium',
      label: 'Premium Access',
      description: 'ข้อมูลครบถ้วนทั้งหมด รวมถึงข้อมูลละเอียดอ่อน',
      maxRequests: 200,
      features: ['ข้อมูลทั้งหมด', 'ข้อมูลการรักษาพิเศษ', 'ภาพถ่ายทางการแพทย์', 'ข้อมูลจิตเวช']
    }
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ExternalRequesterRegistration] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRequestTypeToggle = (requestType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRequestTypes: prev.allowedRequestTypes.includes(requestType)
        ? prev.allowedRequestTypes.filter(type => type !== requestType)
        : [...prev.allowedRequestTypes, requestType]
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newDocuments = Array.from(files).map(file => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toISOString()
      }))
      
      setFormData(prev => ({
        ...prev,
        verificationDocuments: [...prev.verificationDocuments, ...newDocuments]
      }))
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    requestId?: string
  } | null>(null)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitResult(null)
    
    try {
      // Client-side validation
      const requiredFields = [
        formData.organizationName,
        formData.registrationNumber,
        formData.primaryContactName,
        formData.primaryContactEmail,
        formData.primaryContactPhone,
        formData.address.streetAddress,
        formData.address.subDistrict,
        formData.address.district,
        formData.address.province,
        formData.address.postalCode,
        formData.loginEmail,
        formData.password,
        formData.confirmPassword
      ]
      
      if (requiredFields.some(field => !field.trim())) {
        setSubmitResult({
          success: false,
          message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
        })
        return
      }

      // Basic validation
      if (!formData.organizationName || !formData.primaryContactName || !formData.primaryContactEmail) {
        setSubmitResult({
          success: false,
          message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
        })
        return
      }
      
      // Login credentials validation
      if (!formData.loginEmail || !formData.password || !formData.confirmPassword) {
        setSubmitResult({
          success: false,
          message: 'กรุณากรอกข้อมูลเข้าสู่ระบบให้ครบถ้วน'
        })
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        setSubmitResult({
          success: false,
          message: 'รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง'
        })
        return
      }
      
      if (formData.password.length < 8) {
        setSubmitResult({
          success: false,
          message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
        })
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.loginEmail)) {
        setSubmitResult({
          success: false,
          message: 'รูปแบบอีเมลสำหรับเข้าสู่ระบบไม่ถูกต้อง'
        })
        return
      }
      
      if (formData.allowedRequestTypes.length === 0) {
        setSubmitResult({
          success: false,
          message: 'กรุณาเลือกประเภทคำขออย่างน้อย 1 ประเภท'
        })
        return
      }

      // Submit to API
      const response = await apiClient.registerExternalRequester(formData)

      if (response.statusCode === 200) {
        setSubmitResult({
          success: true,
          message: `ลงทะเบียนสำเร็จ\n\nรหัสคำขอ: ${response.data?.requestId || response.data?.id}\nระยะเวลาตรวจสอบโดยประมาณ: 3-5 วันทำการ`,
          requestId: response.data?.requestId || response.data?.id
        })
        
        // เคลียร์ฟอร์มหลังจากส่งสำเร็จ
        // (อาจจะเก็บไว้ให้ผู้ใช้ดูข้อมูลที่ส่งไป)
      } else {
        setSubmitResult({
          success: false,
          message: response.error?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล'
        })
      }

    } catch (error) {
      logger.error('Submit error:', error)
      setSubmitResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8 xl:py-12">
      <div className="max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            ลงทะเบียนผู้ขอเข้าถึงข้อมูลจากภายนอก
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            สำหรับองค์กรภายนอกที่ต้องการเข้าถึงข้อมูลทางการแพทย์ผ่านระบบ Consent Engine
          </p>
        </div>

        {/* Single Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 sm:space-y-6 lg:space-y-8">
          
          {/* Section 1: Organization Information */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <span>ข้อมูลองค์กร</span>
              </CardTitle>
              <CardDescription className="text-gray-700 text-base mt-2">
                ชื่อและประเภทองค์กร รวมถึงข้อมูลทะเบียน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">ชื่อองค์กร *</label>
                <input
                  type="text"
                  className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                  placeholder="เช่น โรงพยาบาลจุฬาลงกรณ์"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">ประเภทองค์กร *</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {organizationTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        formData.organizationType === type.value
                          ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('organizationType', type.value)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${
                          formData.organizationType === type.value
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-base mb-1">{type.label}</div>
                          <div className="text-sm text-gray-700 leading-relaxed">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">หมายเลขทะเบียน *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น REG-2025-001"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">หมายเลขใบอนุญาต</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น LIC-12345"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น 0123456789012"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contact Information */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <span>ข้อมูลผู้ติดต่อและที่อยู่</span>
              </CardTitle>
              <CardDescription className="text-gray-700 text-base mt-2">
                ผู้ติดต่อหลักและที่อยู่องค์กร
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">ชื่อผู้ติดต่อหลัก *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น นายสมชาย ใจดี"
                    value={formData.primaryContactName}
                    onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">อีเมล *</label>
                  <input
                    type="email"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="contact@hospital.com"
                    value={formData.primaryContactEmail}
                    onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">หมายเลขโทรศัพท์ *</label>
                  <input
                    type="tel"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="02-123-4567"
                    value={formData.primaryContactPhone}
                    onChange={(e) => handleInputChange('primaryContactPhone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">ที่อยู่ *</label>
                <textarea
                  className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm resize-none"
                  rows={3}
                  placeholder="เช่น 123 ถนนพญาไท แขวงวังใหม่"
                  value={formData.address.streetAddress}
                  onChange={(e) => handleInputChange('address.streetAddress', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">ตำบล/แขวง *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น วังใหม่"
                    value={formData.address.subDistrict}
                    onChange={(e) => handleInputChange('address.subDistrict', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">เขต/อำเภอ *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น ปทุมวัน"
                    value={formData.address.district}
                    onChange={(e) => handleInputChange('address.district', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">จังหวัด *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น กรุงเทพมหานคร"
                    value={formData.address.province}
                    onChange={(e) => handleInputChange('address.province', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">รหัสไปรษณีย์ *</label>
                  <input
                    type="text"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    placeholder="เช่น 10330"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">ประเทศ *</label>
                  <select
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white shadow-sm"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                  >
                    <option value="Thailand">ประเทศไทย</option>
                    <option value="Malaysia">มาเลเซีย</option>
                    <option value="Singapore">สิงคโปร์</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Data Access Requirements */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <span>ความต้องการการเข้าถึงข้อมูล</span>
              </CardTitle>
              <CardDescription className="text-gray-700 text-base mt-2">
                ระดับการเข้าถึงและประเภทคำขอที่ต้องการ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-6">ระดับการเข้าถึงข้อมูล</h4>
                <div className="space-y-4">
                  {accessLevels.map((level) => (
                    <div
                      key={level.value}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        formData.dataAccessLevel === level.value
                          ? 'border-purple-500 bg-purple-50 shadow-md transform scale-[1.02]'
                          : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleInputChange('dataAccessLevel', level.value)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="font-bold text-lg text-gray-900">{level.label}</div>
                            <Badge 
                              variant="outline" 
                              className={`${
                                formData.dataAccessLevel === level.value
                                  ? 'border-purple-400 text-purple-700 bg-purple-100'
                                  : 'border-gray-400 text-gray-700'
                              }`}
                            >
                              {level.maxRequests} คำขอ/วัน
                            </Badge>
                          </div>
                          <div className="text-base text-gray-700 mb-4">{level.description}</div>
                          <div className="flex flex-wrap gap-2">
                            {level.features.map((feature) => (
                              <Badge 
                                key={feature} 
                                variant="secondary" 
                                className="text-sm py-1 px-3 bg-gray-100 text-gray-800"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-6">ประเภทคำขอที่ต้องการ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requestTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        formData.allowedRequestTypes.includes(type.value)
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleRequestTypeToggle(type.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-base">{type.label}</div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-2 ${
                              formData.allowedRequestTypes.includes(type.value)
                                ? 'border-purple-400 text-purple-700 bg-purple-100'
                                : 'border-gray-400 text-gray-600'
                            }`}
                          >
                            {type.category}
                          </Badge>
                        </div>
                        {formData.allowedRequestTypes.includes(type.value) && (
                          <CheckCircle className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">จำนวนคำขอพร้อมกันสูงสุด</label>
                <select
                  className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white shadow-sm"
                  value={formData.maxConcurrentRequests}
                  onChange={(e) => handleInputChange('maxConcurrentRequests', parseInt(e.target.value))}
                >
                  <option value={5}>5 คำขอ</option>
                  <option value={10}>10 คำขอ</option>
                  <option value={20}>20 คำขอ</option>
                  <option value={50}>50 คำขอ</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Compliance & Documents */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <span>การรับรองและเอกสารประกอบ</span>
              </CardTitle>
              <CardDescription className="text-gray-700 text-base mt-2">
                ข้อมูลการรับรองและเอกสารที่ใช้ยืนยันตัวตน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">การรับรองการปกป้องข้อมูล</label>
                <select
                  className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white shadow-sm"
                  value={formData.dataProtectionCertification}
                  onChange={(e) => handleInputChange('dataProtectionCertification', e.target.value)}
                >
                  <option value="">เลือกการรับรอง</option>
                  <option value="PDPA">PDPA Certified</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="SOC2">SOC 2</option>
                  <option value="HIPAA">HIPAA Compliant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">การรับรองอื่นๆ</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['HA Certificate', 'JCI Accreditation', 'ISO 9001', 'TGA License'].map((cert) => (
                    <label key={cert} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                        checked={formData.complianceCertifications.includes(cert)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              complianceCertifications: [...prev.complianceCertifications, cert]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              complianceCertifications: prev.complianceCertifications.filter(c => c !== cert)
                            }))
                          }
                        }}
                      />
                      <span className="text-gray-800 font-medium">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-4">เอกสารประกอบ</label>
                <div className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center bg-orange-50/50 hover:bg-orange-50 transition-colors">
                  <Upload className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                  <div className="text-base text-gray-700 mb-2 font-medium">
                    อัปโหลดเอกสาร เช่น ใบอนุญาต, หนังสือรับรอง, ใบจดทะเบียน
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    รองรับ PDF, JPG, PNG ขนาดไม่เกิน 10MB ต่อไฟล์
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="document-upload"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <label
                    htmlFor="document-upload"
                    className="inline-flex items-center px-6 py-3 border-2 border-orange-300 rounded-lg shadow-sm text-base font-semibold text-orange-700 bg-white hover:bg-orange-50 hover:border-orange-400 cursor-pointer transition-colors"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    เลือกไฟล์
                  </label>
                </div>
                
                {formData.verificationDocuments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">ไฟล์ที่อัปโหลด:</h4>
                    <div className="space-y-3">
                      {formData.verificationDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">{file.fileName}</div>
                              <div className="text-sm text-gray-600">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                verificationDocuments: prev.verificationDocuments.filter((_, i) => i !== index)
                              }))
                            }}
                          >
                            ลบ
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Account Setup */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Mail className="h-6 w-6 text-teal-600" />
                </div>
                <span>การตั้งค่าบัญชีผู้ใช้</span>
              </CardTitle>
              <CardDescription className="text-gray-700 text-base mt-2">
                ตั้งค่าข้อมูลสำหรับเข้าสู่ระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">อีเมลสำหรับเข้าสู่ระบบ *</label>
                <input
                  type="email"
                  name="loginEmail"
                  className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white shadow-sm"
                  placeholder="อีเมลที่ใช้สำหรับเข้าสู่ระบบ"
                  value={formData.loginEmail}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">รหัสผ่าน *</label>
                  <input
                    type="password"
                    name="password"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white shadow-sm"
                    placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">ยืนยันรหัสผ่าน *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white shadow-sm"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                <h4 className="text-base font-semibold text-teal-800 mb-3">หมายเหตุเกี่ยวกับความปลอดภัย:</h4>
                <ul className="text-sm text-teal-700 space-y-2 list-disc list-inside">
                  <li>รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร</li>
                  <li>แนะนำให้ใช้รหัสผ่านที่มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์</li>
                  <li>อีเมลนี้จะใช้สำหรับการเข้าสู่ระบบและรับการแจ้งเตือน</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit Result */}
          {submitResult && (
            <Alert className={`shadow-lg border-2 ${submitResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              {submitResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className={`text-base font-medium ${submitResult.success ? "text-green-800" : "text-red-800"}`}>
                <div className="whitespace-pre-line">{submitResult.message}</div>
                {submitResult.success && submitResult.requestId && (
                  <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-lg">
                    <div className="font-bold text-green-900 mb-1">รหัสอ้างอิง:</div>
                    <div className="font-mono text-lg text-green-800">{submitResult.requestId}</div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || (submitResult?.success === true)}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-6 w-6 mr-3 border-3 border-white border-t-transparent rounded-full"></div>
                  กำลังส่งข้อมูล...
                </>
              ) : submitResult?.success ? (
                <>
                  <CheckCircle className="h-6 w-6 mr-3" />
                  ส่งสำเร็จแล้ว
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 mr-3" />
                  ส่งคำขอลงทะเบียน
                </>
              )}
            </Button>
            
            {!submitResult?.success && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-8 py-4 text-lg font-medium hover:bg-gray-50"
                onClick={() => window.history.back()}
              >
                ย้อนกลับ
              </Button>
            )}
          </div>
        </form>

        {/* Info Alert */}
        <Alert className="mt-8 border-2 border-blue-200 bg-blue-50 shadow-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800 text-base font-medium">
            <strong>หมายเหตุ:</strong> หลังจากส่งคำขอลงทะเบียนแล้ว ทางทีมงานจะตรวจสอบข้อมูลและเอกสารประกอบ 
            กรอบเวลาการอนุมัติ 3-5 วันทำการ คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อสถานะมีการเปลี่ยนแปลง
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
