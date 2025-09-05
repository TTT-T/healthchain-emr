'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  Eye,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Building2,
  Phone,
  Mail,
  MapPin,
  Activity,
  Stethoscope,
  Pill,
  TestTube,
  Heart
} from 'lucide-react'

interface Patient {
  id: string
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  nationalId: string
  phone?: string
  email?: string
  address?: {
    district: string
    province: string
  }
  lastVisit?: string
  hasActiveConsent?: boolean
}

interface DataRequest {
  id: string
  patientId: string
  requestType: string
  dataTypes: string[]
  purpose: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  validUntil: string
  justification: string
}

export default function PatientSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'name' | 'patientId' | 'nationalId'>('name')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  
  const [requestData, setRequestData] = useState<Partial<DataRequest>>({
    requestType: 'medical_records',
    dataTypes: [],
    purpose: '',
    urgencyLevel: 'medium',
    validUntil: '',
    justification: ''
  })

  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    requestId?: string
  } | null>(null)

  // Mock search function
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock results
    const mockResults: Patient[] = [
      {
        id: 'pat-001',
        patientId: 'HN-2025-001234',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        dateOfBirth: '1985-03-15',
        nationalId: '1234567890123',
        phone: '081-234-5678',
        email: 'somchai@email.com',
        address: {
          district: 'ปทุมวัน',
          province: 'กรุงเทพมหานคร'
        },
        lastVisit: '2025-01-15',
        hasActiveConsent: true
      },
      {
        id: 'pat-002',
        patientId: 'HN-2025-001235',
        firstName: 'สมหญิง',
        lastName: 'รักดี',
        dateOfBirth: '1990-07-22',
        nationalId: '1234567890124',
        phone: '081-234-5679',
        address: {
          district: 'บางรัก',
          province: 'กรุงเทพมหานคร'
        },
        lastVisit: '2024-12-20',
        hasActiveConsent: false
      }
    ]
    
    setSearchResults(mockResults)
    setIsSearching(false)
  }

  const dataTypeOptions = [
    { value: 'basic_info', label: 'ข้อมูลพื้นฐาน', icon: <User className="h-4 w-4 text-blue-600" /> },
    { value: 'medical_history', label: 'ประวัติการรักษา', icon: <FileText className="h-4 w-4 text-green-600" /> },
    { value: 'lab_results', label: 'ผลตรวจทางห้องปฏิบัติการ', icon: <TestTube className="h-4 w-4 text-purple-600" /> },
    { value: 'medications', label: 'ข้อมูลการจ่ายยา', icon: <Pill className="h-4 w-4 text-orange-600" /> },
    { value: 'vital_signs', label: 'สัญญาณชีพ', icon: <Activity className="h-4 w-4 text-red-600" /> },
    { value: 'imaging', label: 'ผลการตรวจทางภาพ', icon: <Eye className="h-4 w-4 text-indigo-600" /> },
    { value: 'diagnosis', label: 'การวินิจฉัย', icon: <Stethoscope className="h-4 w-4 text-teal-600" /> },
    { value: 'procedures', label: 'หัตถการทางการแพทย์', icon: <Heart className="h-4 w-4 text-pink-600" /> }
  ]

  const requestTypes = [
    { value: 'medical_records', label: 'ขอเวชระเบียน' },
    { value: 'insurance_claim', label: 'เคลมประกัน' },
    { value: 'research', label: 'งานวิจัย' },
    { value: 'legal', label: 'กระบวนการทางกฎหมาย' },
    { value: 'emergency', label: 'กรณีฉุกเฉิน' },
    { value: 'audit', label: 'การตรวจสอบ' }
  ]

  const urgencyLevels = [
    { value: 'low', label: 'ปกติ', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'ปานกลาง', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'เร่งด่วน', color: 'bg-orange-100 text-orange-800' },
    { value: 'emergency', label: 'ฉุกเฉิน', color: 'bg-red-100 text-red-800' }
  ]

  const toggleDataType = (dataType: string) => {
    setRequestData(prev => ({
      ...prev,
      dataTypes: prev.dataTypes?.includes(dataType)
        ? prev.dataTypes.filter(type => type !== dataType)
        : [...(prev.dataTypes || []), dataType]
    }))
  }

  const handleSubmitRequest = async () => {
    if (!selectedPatient || !requestData.purpose || !requestData.justification || !requestData.dataTypes?.length) {
      setSubmitResult({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      })
      return
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const requestId = `REQ-${Date.now()}`
    
    setSubmitResult({
      success: true,
      message: 'ส่งคำขอสำเร็จ! ระบบจะดำเนินการขอความยินยอมจากผู้ป่วย',
      requestId
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="mb-3 lg:mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
                ค้นหาและขอเข้าถึงข้อมูลผู้ป่วย
              </h1>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
              ค้นหาผู้ป่วยและส่งคำขอเข้าถึงข้อมูลทางการแพทย์ผ่านระบบ Consent Engine
            </p>
          </div>

        {/* Search Section */}
        <Card className="shadow-lg border-0 bg-white mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <span>ค้นหาผู้ป่วย</span>
            </CardTitle>
            <CardDescription className="text-gray-800 text-base mt-2 font-medium">
              ใช้ชื่อ-นามสกุล หมายเลขผู้ป่วย หรือเลขบัตรประชาชนในการค้นหา
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  className="p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 font-medium"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'name' | 'patientId' | 'nationalId')}
                >
                  <option value="name">ชื่อ-นามสกุล</option>
                  <option value="patientId">หมายเลขผู้ป่วย</option>
                  <option value="nationalId">เลขบัตรประชาชน</option>
                </select>
                <input
                  type="text"
                  className="flex-1 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 font-medium"
                  placeholder={
                    searchType === 'name' ? 'เช่น นายสมชาย ใจดี' :
                    searchType === 'patientId' ? 'เช่น HN-2025-001234' :
                    'เช่น 1234567890123'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      ค้นหา...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      ค้นหา
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <span>ผลการค้นหา ({searchResults.length} ราย)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="space-y-4">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPatient?.id === patient.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedPatient(patient)
                      setShowRequestForm(false)
                      setSubmitResult(null)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <Badge variant="outline" className="text-sm font-semibold text-gray-900 border-gray-400">
                            {patient.patientId}
                          </Badge>
                          {patient.hasActiveConsent ? (
                            <Badge className="bg-green-700 text-green-900 border-green-400 font-semibold">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              มีความยินยอม
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-400 text-orange-800 font-semibold">
                              <Clock className="h-3 w-3 mr-1" />
                              ต้องขอความยินยอม
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-800 font-medium">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>เกิด: {new Date(patient.dateOfBirth).toLocaleDateString('th-TH')}</span>
                          </div>
                          {patient.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-green-600" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                          {patient.address && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span>{patient.address.district}, {patient.address.province}</span>
                            </div>
                          )}
                          {patient.lastVisit && (
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-purple-600" />
                              <span>เยี่ยมล่าสุด: {new Date(patient.lastVisit).toLocaleDateString('th-TH')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Form */}
        {selectedPatient && (
          <Card className="shadow-lg border-0 bg-white mb-8 text-gray-900">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Send className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>ส่งคำขอเข้าถึงข้อมูล</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestForm(!showRequestForm)}
                >
                  {showRequestForm ? 'ซ่อน' : 'แสดง'}ฟอร์มคำขอ
                </Button>
              </CardTitle>
              <CardDescription className="text-gray-800 text-base mt-2 font-medium">
                ผู้ป่วย: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
              </CardDescription>
            </CardHeader>

            {showRequestForm && (
              <CardContent className="p-6 lg:p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">ประเภทคำขอ *</label>
                    <select
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-900 font-medium"
                      value={requestData.requestType}
                      onChange={(e) => setRequestData(prev => ({ ...prev, requestType: e.target.value }))}
                    >
                      {requestTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">ระดับความเร่งด่วน *</label>
                    <select
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-900 font-medium"
                      value={requestData.urgencyLevel}
                      onChange={(e) => setRequestData(prev => ({ ...prev, urgencyLevel: e.target.value as any }))}
                    >
                      {urgencyLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-4">ประเภทข้อมูลที่ต้องการ *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dataTypeOptions.map(option => (
                      <div
                        key={option.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          requestData.dataTypes?.includes(option.value)
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleDataType(option.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            requestData.dataTypes?.includes(option.value)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {option.icon}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">{option.label}</span>
                          {requestData.dataTypes?.includes(option.value) && (
                            <CheckCircle className="h-5 w-5 text-purple-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">วัตถุประสงค์ *</label>
                  <textarea
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-900 font-medium resize-none"
                    rows={3}
                    placeholder="เช่น เพื่อการรักษาต่อเนื่อง, เพื่อการเคลมประกัน, เพื่อการวิจัย"
                    value={requestData.purpose}
                    onChange={(e) => setRequestData(prev => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">เหตุผลและความจำเป็น *</label>
                  <textarea
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-900 font-medium resize-none"
                    rows={4}
                    placeholder="อธิบายเหตุผลความจำเป็นในการขอเข้าถึงข้อมูลนี้"
                    value={requestData.justification}
                    onChange={(e) => setRequestData(prev => ({ ...prev, justification: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">ใช้ข้อมูลได้ถึงวันที่ *</label>
                  <input
                    type="date"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white text-gray-900 font-medium"
                    value={requestData.validUntil}
                    onChange={(e) => setRequestData(prev => ({ ...prev, validUntil: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Submit Result */}
                {submitResult && (
                  <Alert className={`border-2 ${submitResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                    {submitResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <AlertDescription className={`text-base font-medium ${submitResult.success ? "text-green-800" : "text-red-800"}`}>
                      {submitResult.message}
                      {submitResult.success && submitResult.requestId && (
                        <div className="mt-3 p-3 bg-white border border-green-300 rounded-lg">
                          <div className="font-bold text-green-900 mb-1">รหัสคำขอ:</div>
                          <div className="font-mono text-green-800">{submitResult.requestId}</div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={!requestData.purpose || !requestData.justification || !requestData.dataTypes?.length}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    ส่งคำขอ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRequestForm(false)
                      setSubmitResult(null)
                    }}
                    className="w-full sm:w-auto border-2 border-gray-400 text-gray-800 px-8 py-4 text-lg font-semibold hover:bg-gray-100"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Info Alert */}
        <Alert className="border-2 border-blue-200 bg-blue-50 shadow-lg">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800 text-base font-medium">
            <strong>หมายเหตุ:</strong> คำขอทั้งหมดจะผ่านระบบ Consent Engine เพื่อขอความยินยอมจากผู้ป่วยก่อน 
            คุณจะได้รับการแจ้งเตือนเมื่อผู้ป่วยให้ความยินยอมหรือปฏิเสธคำขอ
          </AlertDescription>
        </Alert>
        </div>
      </div>
    </div>
  )
}
