'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  User, 
  Calendar, 
  Shield, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Building2,
  Clock,
  Send,
  FileCheck,
  Info
} from 'lucide-react'

interface PatientSearchResult {
  id: string
  patientId: string
  name: string
  age: number
  gender: string
  lastVisit: string
  hospital: string
}

interface DataRequestForm {
  // Patient Information
  patientId: string
  patientName: string
  
  // Request Details
  requestType: 'medical_records' | 'lab_results' | 'prescription_history' | 'diagnosis' | 'treatment_history' | 'insurance_claim' | 'research'
  dataTypes: string[]
  purpose: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  validUntil: string
  
  // Legal and Compliance
  legalBasis: string
  consentMethod: 'direct' | 'implied' | 'emergency' | 'legal_guardian'
  dataProtectionMeasures: string[]
  
  // Supporting Documents
  supportingDocuments: {
    fileName: string
    fileType: string
    fileSize: number
    uploadDate: string
  }[]
  
  // Contact Information
  requesterName: string
  requesterEmail: string
  requesterPhone: string
  organizationName: string
}

const dataTypeOptions = [
  { value: 'medical_records', label: 'ประวัติการรักษา', description: 'ข้อมูลการรักษาและประวัติทางการแพทย์' },
  { value: 'lab_results', label: 'ผลตรวจทางห้องปฏิบัติการ', description: 'ผลการตรวจเลือด, ปัสสาวะ, และอื่นๆ' },
  { value: 'prescription_history', label: 'ประวัติการจ่ายยา', description: 'รายการยาที่ได้รับและประวัติการใช้ยา' },
  { value: 'diagnosis', label: 'การวินิจฉัยโรค', description: 'การวินิจฉัยและโรคประจำตัว' },
  { value: 'treatment_history', label: 'ประวัติการรักษา', description: 'รายละเอียดการรักษาและการผ่าตัด' },
  { value: 'vital_signs', label: 'สัญญาณชีพ', description: 'ความดัน, ชีพจร, อุณหภูมิ' },
  { value: 'allergies', label: 'ประวัติการแพ้', description: 'ข้อมูลการแพ้ยาและสารต่างๆ' },
  { value: 'emergency_contact', label: 'ข้อมูลติดต่อฉุกเฉิน', description: 'ข้อมูลผู้ติดต่อในกรณีฉุกเฉิน' }
]

const urgencyConfig = {
  low: { label: 'ปกติ', color: 'bg-gray-100 text-gray-800', description: 'ไม่เร่งด่วน' },
  medium: { label: 'ปานกลาง', color: 'bg-blue-100 text-blue-800', description: 'ควรดำเนินการใน 1-2 วัน' },
  high: { label: 'ด่วน', color: 'bg-orange-100 text-orange-800', description: 'ควรดำเนินการใน 24 ชั่วโมง' },
  emergency: { label: 'ฉุกเฉิน', color: 'bg-red-100 text-red-800', description: 'ต้องดำเนินการทันที' }
}

export default function NewRequestPage() {
  const [formData, setFormData] = useState<DataRequestForm>({
    patientId: '',
    patientName: '',
    requestType: 'medical_records',
    dataTypes: [],
    purpose: '',
    urgencyLevel: 'medium',
    validUntil: '',
    legalBasis: '',
    consentMethod: 'direct',
    dataProtectionMeasures: [],
    supportingDocuments: [],
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    organizationName: ''
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Mock patient search
  const handlePatientSearch = () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      const mockResults: PatientSearchResult[] = [
        {
          id: '1',
          patientId: 'HN-2025-001234',
          name: 'สมชาย ใจดี',
          age: 45,
          gender: 'ชาย',
          lastVisit: '2024-12-15',
          hospital: 'โรงพยาบาลกรุงเทพ'
        },
        {
          id: '2',
          patientId: 'HN-2025-001235',
          name: 'สมหญิง รักสุขภาพ',
          age: 38,
          gender: 'หญิง',
          lastVisit: '2024-12-10',
          hospital: 'โรงพยาบาลกรุงเทพ'
        }
      ]
      setSearchResults(mockResults)
      setIsSearching(false)
    }, 1000)
  }

  const handlePatientSelect = (patient: PatientSearchResult) => {
    setSelectedPatient(patient)
    setFormData(prev => ({
      ...prev,
      patientId: patient.patientId,
      patientName: patient.name
    }))
    setSearchResults([])
    setSearchQuery('')
  }

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dataTypes: checked 
        ? [...prev.dataTypes, dataType]
        : prev.dataTypes.filter(type => type !== dataType)
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newDocuments = Array.from(files).map(file => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadDate: new Date().toISOString()
    }))

    setFormData(prev => ({
      ...prev,
      supportingDocuments: [...prev.supportingDocuments, ...newDocuments]
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      console.log('Submitting request:', formData)
      setSubmitSuccess(true)
      setIsSubmitting(false)
    }, 2000)
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  ส่งคำขอสำเร็จ!
                </h1>
                <p className="text-gray-600 mb-6">
                  คำขอของคุณได้รับการส่งเรียบร้อยแล้ว และอยู่ระหว่างการพิจารณา
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium">
                    รหัสคำขอ: REQ-2025-001234
                  </p>
                  <p className="text-blue-600 text-sm">
                    ระยะเวลาการพิจารณา: 3-5 วันทำการ
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/external-requesters/my-requests'}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    ดูคำขอของฉัน
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/external-requesters'}
                  >
                    กลับหน้าแรก
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              ส่งคำขอเข้าถึงข้อมูลผู้ป่วย
            </h1>
            <p className="text-gray-600">
              กรอกข้อมูลและส่งคำขอเข้าถึงข้อมูลทางการแพทย์ของผู้ป่วย
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-8">
            {/* Patient Search */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>ค้นหาผู้ป่วย</span>
                </CardTitle>
                <CardDescription>
                  ค้นหาผู้ป่วยที่ต้องการขอข้อมูล
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาด้วยชื่อ, HN, หรือหมายเลขบัตรประชาชน"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handlePatientSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-3"
                  >
                    {isSearching ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    ค้นหา
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">ผลการค้นหา:</h4>
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{patient.name}</h5>
                            <p className="text-sm text-gray-600">
                              HN: {patient.patientId} | อายุ: {patient.age} ปี | เพศ: {patient.gender}
                            </p>
                            <p className="text-sm text-gray-500">
                              โรงพยาบาล: {patient.hospital} | มาครั้งล่าสุด: {patient.lastVisit}
                            </p>
                          </div>
                          <Button type="button" size="sm" variant="outline">
                            เลือก
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Patient */}
                {selectedPatient && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>ผู้ป่วยที่เลือก:</strong> {selectedPatient.name} (HN: {selectedPatient.patientId})
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span>รายละเอียดคำขอ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Request Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทคำขอ
                  </label>
                  <select
                    value={formData.requestType}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestType: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="medical_records">ประวัติการรักษา</option>
                    <option value="lab_results">ผลตรวจทางห้องปฏิบัติการ</option>
                    <option value="prescription_history">ประวัติการจ่ายยา</option>
                    <option value="diagnosis">การวินิจฉัยโรค</option>
                    <option value="treatment_history">ประวัติการรักษา</option>
                    <option value="insurance_claim">การเคลมประกัน</option>
                    <option value="research">การวิจัย</option>
                  </select>
                </div>

                {/* Data Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ประเภทข้อมูลที่ต้องการ
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dataTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.dataTypes.includes(option.value)}
                          onChange={(e) => handleDataTypeChange(option.value, e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วัตถุประสงค์
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="ระบุวัตถุประสงค์ในการใช้ข้อมูล..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ระดับความเร่งด่วน
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(urgencyConfig).map(([level, config]) => (
                      <label key={level} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="urgencyLevel"
                          value={level}
                          checked={formData.urgencyLevel === level}
                          onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value as any }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <Badge className={`${config.color} border`}>
                            {config.label}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">{config.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ใช้ได้ถึง
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Legal and Compliance */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <span>ข้อมูลทางกฎหมายและความปลอดภัย</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ฐานทางกฎหมาย
                  </label>
                  <select
                    value={formData.legalBasis}
                    onChange={(e) => setFormData(prev => ({ ...prev, legalBasis: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">เลือกฐานทางกฎหมาย</option>
                    <option value="consent">ความยินยอมจากผู้ป่วย</option>
                    <option value="legal_obligation">ภาระผูกพันทางกฎหมาย</option>
                    <option value="vital_interests">ผลประโยชน์สำคัญ</option>
                    <option value="public_task">ภารกิจสาธารณะ</option>
                    <option value="legitimate_interests">ผลประโยชน์ที่ชอบธรรม</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วิธีการขอความยินยอม
                  </label>
                  <select
                    value={formData.consentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, consentMethod: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="direct">ขอความยินยอมโดยตรงจากผู้ป่วย</option>
                    <option value="implied">ความยินยอมโดยปริยาย</option>
                    <option value="emergency">กรณีฉุกเฉิน</option>
                    <option value="legal_guardian">ผ่านผู้ปกครองตามกฎหมาย</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Supporting Documents */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>เอกสารสนับสนุน</span>
                </CardTitle>
                <CardDescription>
                  อัปโหลดเอกสารที่เกี่ยวข้องกับคำขอ (ถ้ามี)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">ลากไฟมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    เลือกไฟล์
                  </label>
                </div>

                {formData.supportingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">ไฟล์ที่อัปโหลด:</h4>
                    {formData.supportingDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileCheck className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.fileName}</p>
                            <p className="text-sm text-gray-600">
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
                          }))}
                        >
                          ลบ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>ข้อมูลติดต่อ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อผู้ส่งคำขอ
                    </label>
                    <input
                      type="text"
                      value={formData.requesterName}
                      onChange={(e) => setFormData(prev => ({ ...prev, requesterName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={formData.requesterEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, requesterEmail: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={formData.requesterPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, requesterPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      องค์กร
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedPatient || formData.dataTypes.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 px-8"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin mr-2" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    ส่งคำขอ
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Information Alert */}
          <Alert className="mt-8 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>หมายเหตุ:</strong> คำขอของคุณจะถูกส่งไปยังผู้ป่วยเพื่อขอความยินยอม 
              และจะได้รับการพิจารณาจากทีมแพทย์และเจ้าหน้าที่ที่เกี่ยวข้อง 
              ระยะเวลาการพิจารณาโดยทั่วไปคือ 3-5 วันทำการ
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
