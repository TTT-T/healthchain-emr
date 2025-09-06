'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
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
  Search,
  Loader2
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
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Load requests data
  useEffect(() => {
    const loadRequestsData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getAllDataRequests()
        
        if (response.success && response.data) {
          const requestsData = response.data.requests || response.data
          setRequests(requestsData.map((req: any) => ({
            id: req.id,
            requestId: req.id,
            patientName: req.patientName || 'ไม่ระบุ',
            patientId: req.patientId || 'ไม่ระบุ',
            requestType: req.requestType,
            dataTypes: req.requestedDataTypes || [],
            status: req.status,
            submittedAt: req.createdAt,
            updatedAt: req.updatedAt,
            purpose: req.purpose,
            urgencyLevel: req.urgencyLevel || 'medium',
            validUntil: req.validUntil || req.expiresAt,
            approvalDate: req.approvedAt,
            downloadCount: req.downloadCount || 0,
            lastDownload: req.lastDownload
          })))
        }
      } catch (error) {
        console.error('Error loading requests data:', error)
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอ')
      } finally {
        setLoading(false)
      }
    }

    loadRequestsData()
  }, [])

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

  const handleDownload = async (requestId: string) => {
    try {
      setDownloadError(null)
      setDownloadSuccess(null)
      
      // Get data request details first
      const response = await apiClient.getDataRequestById(requestId)
      
      if (response.success && response.data) {
        const requestData = response.data
        
        // Check if request is approved
        if (requestData.status !== 'approved') {
          setDownloadError('คำขอนี้ยังไม่ได้รับการอนุมัติ ไม่สามารถดาวน์โหลดข้อมูลได้')
          return
        }
        
        // Generate report for download
        const reportResponse = await apiClient.generateDataRequestReport(requestId)
        
        if (reportResponse.success && reportResponse.data) {
          // Create download link
          const blob = new Blob([JSON.stringify(reportResponse.data, null, 2)], { 
            type: 'application/json' 
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `data-request-${requestId}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          setDownloadSuccess('ดาวน์โหลดข้อมูลสำเร็จ')
          setTimeout(() => setDownloadSuccess(null), 3000)
        } else {
          setDownloadError('ไม่สามารถสร้างรายงานได้: ' + (reportResponse.error?.message || 'ไม่ทราบสาเหตุ'))
        }
      } else {
        setDownloadError('ไม่พบข้อมูลคำขอ: ' + (response.error?.message || 'ไม่ทราบสาเหตุ'))
      }
    } catch (error) {
      console.error('Error downloading data:', error)
      setDownloadError('เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูล')
    }
  }

  const handleViewDetails = async (requestId: string) => {
    try {
      setDetailsError(null)
      
      const response = await apiClient.getDataRequestById(requestId)
      
      if (response.success && response.data) {
        const requestData = response.data
        
        // Show detailed information in a modal or redirect to details page
        const details = `
รายละเอียดคำขอ: ${requestId}
สถานะ: ${requestData.status}
ประเภทคำขอ: ${requestData.requestType}
วัตถุประสงค์: ${requestData.purpose}
วันที่ส่ง: ${new Date(requestData.createdAt).toLocaleDateString('th-TH')}
วันที่อัปเดต: ${new Date(requestData.updatedAt).toLocaleDateString('th-TH')}
        `
        
        // For now, we'll use alert but in a real app, this should be a modal
        alert(details)
      } else {
        setDetailsError('ไม่พบข้อมูลคำขอ: ' + (response.error?.message || 'ไม่ทราบสาเหตุ'))
      }
    } catch (error) {
      console.error('Error viewing details:', error)
      setDetailsError('เกิดข้อผิดพลาดในการดูรายละเอียด')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลคำขอ...</p>
        </div>
      </div>
    )
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

          {/* Error Messages */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {downloadError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{downloadError}</AlertDescription>
            </Alert>
          )}

          {downloadSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{downloadSuccess}</AlertDescription>
            </Alert>
          )}

          {detailsError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{detailsError}</AlertDescription>
            </Alert>
          )}

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
