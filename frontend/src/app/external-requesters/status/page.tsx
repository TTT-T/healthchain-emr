'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  FileText,
  Mail,
  Phone
} from 'lucide-react'

interface RegistrationStatus {
  requestId: string
  organizationName: string
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'requires_clarification'
  submittedAt: string
  lastUpdated: string
  estimatedCompletion?: string
  adminNotes?: string
  contactEmail?: string
  contactPhone?: string
}

const statusConfig = {
  pending_review: {
    label: 'รอการตรวจสอบ',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-4 w-4" />,
    description: 'คำขอของคุณอยู่ในคิวรอการตรวจสอบจากผู้ดูแลระบบ'
  },
  under_review: {
    label: 'กำลังตรวจสอบ',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Search className="h-4 w-4" />,
    description: 'ผู้ดูแลระบบกำลังตรวจสอบเอกสารและข้อมูลของคุณ'
  },
  approved: {
    label: 'อนุมัติแล้ว',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'คำขอได้รับการอนุมัติ คุณสามารถเข้าใช้งานระบบได้แล้ว'
  },
  rejected: {
    label: 'ปฏิเสธ',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
    description: 'คำขอไม่ได้รับการอนุมัติ โปรดดูหมายเหตุด้านล่าง'
  },
  requires_clarification: {
    label: 'ต้องการข้อมูลเพิ่มเติม',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'จำเป็นต้องให้ข้อมูลหรือเอกสารเพิ่มเติม'
  }
}

export default function ExternalRequesterStatusCheck() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'requestId' | 'email'>('requestId')
  const [isSearching, setIsSearching] = useState(false)
  const [statusData, setStatusData] = useState<RegistrationStatus | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('กรุณาใส่ข้อมูลที่ต้องการค้นหา')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setStatusData(null)

    try {
      const params = new URLSearchParams()
      if (searchType === 'requestId') {
        params.set('requestId', searchQuery.trim())
      } else {
        params.set('email', searchQuery.trim())
      }

      const response = await fetch(`/api/external-requesters/register?${params.toString()}`)
      const result = await response.json()

      if (result.statusCode === 200) {
        setStatusData(result.data)
      } else {
        setSearchError(result.error || 'ไม่พบข้อมูลที่ค้นหา')
      }

    } catch (error) {
      logger.error('Search error:', error)
      setSearchError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentStatus = statusData ? statusConfig[statusData.status] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Mobile Menu */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">
                    ตรวจสอบสถานะการลงทะเบียน
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
                ค้นหาและติดตามสถานะคำขอลงทะเบียนผู้ขอเข้าถึงข้อมูลจากภายนอก
              </p>
            </div>

        {/* Search Form */}
        <Card className="mb-6 sm:mb-8 shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="flex items-center space-x-2 lg:space-x-3 text-lg lg:text-xl text-gray-900">
              <div className="p-1.5 lg:p-2 bg-blue-100 rounded-lg">
                <Search className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <span>ค้นหาสถานะ</span>
            </CardTitle>
            <CardDescription className="text-gray-700 text-sm lg:text-base mt-2">
              ใส่รหัสคำขอหรืออีเมลที่ใช้ลงทะเบียน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <label className="flex items-center space-x-2 lg:space-x-3 p-3 lg:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="searchType"
                  value="requestId"
                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 flex-shrink-0"
                  checked={searchType === 'requestId'}
                  onChange={(e) => setSearchType(e.target.value as 'requestId' | 'email')}
                />
                <span className="font-medium text-gray-800 text-sm lg:text-base">รหัสคำขอ</span>
              </label>
              <label className="flex items-center space-x-2 lg:space-x-3 p-3 lg:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="searchType"
                  value="email"
                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 flex-shrink-0"
                  checked={searchType === 'email'}
                  onChange={(e) => setSearchType(e.target.value as 'requestId' | 'email')}
                />
                <span className="font-medium text-gray-800 text-sm lg:text-base">อีเมล</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                className="flex-1 p-4 text-gray-900 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                placeholder={
                  searchType === 'requestId' 
                    ? 'เช่น REQ-1234567890-ABCDEF123'
                    : 'เช่น organization@example.com'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all duration-200"
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

            {searchError && (
              <Alert className="border-2 border-red-300 bg-red-50 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-medium text-base">
                  {searchError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status Result */}
        {statusData && currentStatus && (
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="break-all">{statusData.organizationName}</span>
                </CardTitle>
                <Badge className={`${currentStatus.color} text-base px-4 py-2 font-semibold`}>
                  <div className="flex items-center space-x-2">
                    {currentStatus.icon}
                    <span>{currentStatus.label}</span>
                  </div>
                </Badge>
              </div>
              <CardDescription className="text-gray-700 text-base mt-3 leading-relaxed">
                {currentStatus.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6 lg:p-8">
              {/* Request Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">รหัสคำขอ</div>
                  <div className="font-mono text-base bg-gray-100 px-4 py-3 rounded-lg border font-medium text-gray-900">
                    {statusData.requestId}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">วันที่ส่งคำขอ</div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{formatDate(statusData.submittedAt)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">อัปเดตล่าสุด</div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{formatDate(statusData.lastUpdated)}</span>
                  </div>
                </div>
                {statusData.estimatedCompletion && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">คาดว่าจะเสร็จสิ้น</div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-900">{formatDate(statusData.estimatedCompletion)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(statusData.contactEmail || statusData.contactPhone) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">ข้อมูลติดต่อ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statusData.contactEmail && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{statusData.contactEmail}</span>
                      </div>
                    )}
                    {statusData.contactPhone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{statusData.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {statusData.adminNotes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>หมายเหตุจากผู้ดูแลระบบ</span>
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    {statusData.adminNotes}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">ขั้นตอนถัดไป</h4>
                <div className="text-sm text-gray-600">
                  {statusData.status === 'pending_review' && (
                    <p>คำขอของคุณอยู่ในคิวรอการตรวจสอบ ผู้ดูแลระบบจะติดต่อกลับภายใน 3-5 วันทำการ</p>
                  )}
                  {statusData.status === 'under_review' && (
                    <p>ผู้ดูแลระบบกำลังตรวจสอบข้อมูลของคุณ หากต้องการข้อมูลเพิ่มเติมจะติดต่อทางอีเมล</p>
                  )}
                  {statusData.status === 'approved' && (
                    <p>คุณสามารถเข้าสู่ระบบและใช้งาน Consent Engine ได้แล้ว ข้อมูลการเข้าสู่ระบบได้ส่งไปทางอีเมลแล้ว</p>
                  )}
                  {statusData.status === 'rejected' && (
                    <p>หากต้องการอุทธรณ์หรือสอบถามเพิ่มเติม โปรดติดต่อผู้ดูแลระบบ</p>
                  )}
                  {statusData.status === 'requires_clarification' && (
                    <p>โปรดตรวจสอบอีเมลและส่งข้อมูลเพิ่มเติมตามที่ระบุในหมายเหตุ</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Alert className="mt-6  text-gray-500" >
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>เคล็ดลับ:</strong> หากคุณมีคำถามหรือต้องการความช่วยเหลือ 
            สามารถติดต่อทีมสนับสนุนได้ที่ support@emr-system.com หรือ โทร 02-123-4567
          </AlertDescription>
        </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
