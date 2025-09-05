'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Eye, 
  Download, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  Building2,
  Filter,
  Search
} from 'lucide-react'

interface DataRequest {
  id: string
  requestId: string
  patientName: string
  patientId: string
  requestType: string
  dataTypes: string[]
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired'
  submittedAt: string
  updatedAt: string
  purpose: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency'
  validUntil: string
  approvalDate?: string
  downloadCount?: number
  lastDownload?: string
}

const statusConfig = {
  pending: {
    label: 'รอการอนุมัติ',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-4 w-4" />
  },
  approved: {
    label: 'อนุมัติแล้ว',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-4 w-4" />
  },
  rejected: {
    label: 'ปฏิเสธ',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-4 w-4" />
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle className="h-4 w-4" />
  },
  expired: {
    label: 'หมดอายุ',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <AlertTriangle className="h-4 w-4" />
  }
}

const urgencyConfig = {
  low: { label: 'ปกติ', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'ปานกลาง', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'ด่วน', color: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'ฉุกเฉิน', color: 'bg-red-100 text-red-800' }
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([
    {
      id: 'req-001',
      requestId: 'REQ-2025-001234',
      patientName: 'สมชาย ใจดี',
      patientId: 'HN-2025-001234',
      requestType: 'medical_records',
      dataTypes: ['diagnosis', 'lab_results', 'medications'],
      status: 'approved',
      submittedAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-16T14:20:00Z',
      purpose: 'การรักษาต่อเนื่องและการส่งต่อผู้ป่วย',
      urgencyLevel: 'high',
      validUntil: '2025-02-15T23:59:59Z',
      approvalDate: '2025-01-16T14:20:00Z',
      downloadCount: 2,
      lastDownload: '2025-01-17T09:15:00Z'
    },
    {
      id: 'req-002',
      requestId: 'REQ-2025-001235',
      patientName: 'สมหญิง รักสุขภาพ',
      patientId: 'HN-2025-001235',
      requestType: 'insurance_claim',
      dataTypes: ['diagnosis', 'treatment_history'],
      status: 'pending',
      submittedAt: '2025-01-17T15:45:00Z',
      updatedAt: '2025-01-17T15:45:00Z',
      purpose: 'การเคลมประกันสุขภาพ',
      urgencyLevel: 'medium',
      validUntil: '2025-02-17T23:59:59Z'
    },
    {
      id: 'req-003',
      requestId: 'REQ-2025-001236',
      patientName: 'สมปอง แข็งแรง',
      patientId: 'HN-2025-001236',
      requestType: 'research',
      dataTypes: ['demographics', 'diagnosis', 'lab_results'],
      status: 'rejected',
      submittedAt: '2025-01-10T11:00:00Z',
      updatedAt: '2025-01-12T16:30:00Z',
      purpose: 'การวิจัยเพื่อพัฒนาการรักษา',
      urgencyLevel: 'low',
      validUntil: '2025-03-10T23:59:59Z'
    }
  ])

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesSearch = searchQuery === '' || 
      request.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.patientId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = (requestId: string) => {
    // Mock download functionality
    console.log('Downloading data for request:', requestId)
    alert(`เริ่มดาวน์โหลดข้อมูลสำหรับคำขอ ${requestId}`)
  }

  const handleViewDetails = (requestId: string) => {
    // Mock view details functionality
    console.log('Viewing details for request:', requestId)
    alert(`แสดงรายละเอียดคำขอ ${requestId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="mb-3 lg:mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
                คำขอของฉัน
              </h1>
            </div>
            <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
              จัดการและติดตามคำขอเข้าถึงข้อมูลทางการแพทย์ทั้งหมดของคุณ
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = requests.filter(req => req.status === status).length
              return (
                <Card key={status} className="shadow-lg border-0 bg-white">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                          {config.label}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{count}</p>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-lg ${config.color} flex-shrink-0`}>
                        {config.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filters and Search */}
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Filter className="h-6 w-6 text-blue-600" />
                </div>
                <span>ตัวกรองและการค้นหา</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหา
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาด้วยชื่อผู้ป่วย, รหัสคำขอ, หรือ HN"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">รอการอนุมัติ</option>
                    <option value="approved">อนุมัติแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="expired">หมดอายุ</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg text-gray-900 mb-2">
                        {request.requestId}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{request.patientName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{request.patientId}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>ส่งเมื่อ {formatDate(request.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`${statusConfig[request.status].color} border`}>
                        {statusConfig[request.status].icon}
                        <span className="ml-1">{statusConfig[request.status].label}</span>
                      </Badge>
                      <Badge className={`${urgencyConfig[request.urgencyLevel].color} border`}>
                        {urgencyConfig[request.urgencyLevel].label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">วัตถุประสงค์</h4>
                    <p className="text-gray-700">{request.purpose}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ประเภทข้อมูลที่ขอ</h4>
                    <div className="flex flex-wrap gap-2">
                      {request.dataTypes.map((type, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">วันที่อัปเดตล่าสุด:</span>
                      <span className="ml-2 text-gray-700">{formatDate(request.updatedAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">ใช้ได้ถึง:</span>
                      <span className="ml-2 text-gray-700">{formatDate(request.validUntil)}</span>
                    </div>
                    {request.downloadCount && (
                      <div>
                        <span className="font-medium text-gray-900">จำนวนดาวน์โหลด:</span>
                        <span className="ml-2 text-gray-700">{request.downloadCount} ครั้ง</span>
                      </div>
                    )}
                    {request.lastDownload && (
                      <div>
                        <span className="font-medium text-gray-900">ดาวน์โหลดล่าสุด:</span>
                        <span className="ml-2 text-gray-700">{formatDate(request.lastDownload)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(request.requestId)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>ดูรายละเอียด</span>
                    </Button>
                    {request.status === 'approved' && (
                      <Button
                        onClick={() => handleDownload(request.requestId)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="h-4 w-4" />
                        <span>ดาวน์โหลดข้อมูล</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่พบคำขอที่ตรงกับเงื่อนไข
                </h3>
                <p className="text-gray-600">
                  ลองเปลี่ยนตัวกรองหรือคำค้นหาเพื่อดูผลลัพธ์ที่แตกต่าง
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help Alert */}
          <Alert className="mt-8 bg-blue-50 border-blue-200">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>เคล็ดลับ:</strong> คำขอที่ได้รับการอนุมัติแล้วสามารถดาวน์โหลดข้อมูลได้ทันที 
              หากมีปัญหาในการเข้าถึงข้อมูล โปรดติดต่อทีมสนับสนุนได้ที่ support@emr-system.com
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
