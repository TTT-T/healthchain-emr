'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, UserCheck, Mail, Search, Filter, RefreshCw, AlertTriangle, Shield, Building2, Users, TrendingUp } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@/lib/logger'

interface ExternalRequester {
  id: string
  organization_name: string
  organization_type: string
  registration_number: string
  license_number?: string
  tax_id?: string
  primary_contact_name: string
  primary_contact_email: string
  primary_contact_phone?: string
  address?: string
  is_verified: boolean
  verification_date?: string
  verified_by?: string
  allowed_request_types: string[]
  data_access_level: string
  max_concurrent_requests: number
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  suspension_reason?: string
  compliance_certifications?: string[]
  data_protection_certification?: string
  last_compliance_audit?: string
  created_at: string
  updated_at: string
  last_login?: string
  total_requests: number
  approved_requests: number
  pending_requests: number
  rejected_requests: number
}

interface ExternalRequestersStats {
  total_requesters: number
  active_requesters: number
  pending_requesters: number
  suspended_requesters: number
  revoked_requesters: number
  verified_requesters: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ExternalRequestersAdminPage() {
  const [requesters, setRequesters] = useState<ExternalRequester[]>([])
  const [stats, setStats] = useState<ExternalRequestersStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequester, setSelectedRequester] = useState<ExternalRequester | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [orgTypeFilter, setOrgTypeFilter] = useState('')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRequesters()
    fetchStats()
  }, [pagination.page, searchTerm, statusFilter, orgTypeFilter])

  const fetchRequesters = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(orgTypeFilter && { organizationType: orgTypeFilter })
      })

      const response = await apiClient.get(`/admin/external-requesters?${queryParams}`)
      
      if (response.statusCode === 200 && response.data) {
        setRequesters(response.data.requesters || [])
        setPagination(response.data.pagination || pagination)
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้')
      }
    } catch (error) {
      logger.error('Error fetching external requesters:', error)
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/external-requesters/stats')
      
      if (response.statusCode === 200 && response.data) {
        setStats(response.data.overall)
      }
    } catch (error) {
      logger.error('Error fetching stats:', error)
    }
  }

  const handleStatusUpdate = async (requester: ExternalRequester, newStatus: string) => {
    try {
      const response = await apiClient.put(`/admin/external-requesters/${requester.id}/status`, {
        status: newStatus,
        reason: adminNotes || undefined
      })

      if (response.statusCode === 200) {
        // Refresh data
        await fetchRequesters()
        await fetchStats()
        
        setShowModal(false)
        setSelectedRequester(null)
        setAdminNotes('')
      } else {
        setError('ไม่สามารถอัปเดตสถานะได้')
      }
    } catch (error) {
      logger.error('Error updating requester status:', error)
      setError('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  const handleRefresh = async () => {
    await fetchRequesters()
    await fetchStats()
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'status') {
      setStatusFilter(value)
    } else if (type === 'orgType') {
      setOrgTypeFilter(value)
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'revoked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'revoked':
        return 'bg-red-200 text-red-900'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ใช้งานได้'
      case 'suspended':
        return 'ระงับการใช้งาน'
      case 'revoked':
        return 'ยกเลิกสิทธิ์'
      default:
        return 'รอการตรวจสอบ'
    }
  }

  const getOrgTypeText = (orgType: string) => {
    switch (orgType) {
      case 'external_user':
        return 'ผู้ใช้ภายนอก'
      case 'external_admin':
        return 'ผู้ดูแลภายนอก'
      default:
        return orgType
    }
  }

  if (isLoading && requesters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="text-blue-600" />
              จัดการ External Requesters
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              ตรวจสอบและจัดการผู้ขอข้อมูลภายนอก
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>
      </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">รอการตรวจสอบ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">
                {stats?.pending_requesters || 0}
              </p>
              <p className="text-xs sm:text-sm text-yellow-600 mt-1 hidden sm:block">ต้องตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-yellow-600" size={16} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ใช้งานได้</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {stats?.active_requesters || 0}
              </p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">ใช้งานปกติ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ระงับการใช้งาน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                {stats?.suspended_requesters || 0}
              </p>
              <p className="text-xs sm:text-sm text-red-600 mt-1 hidden sm:block">ถูกระงับ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="text-red-600" size={16} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats?.total_requesters || 0}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">ทุกสถานะ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-blue-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อองค์กร, ผู้ติดต่อ, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอการตรวจสอบ</option>
              <option value="active">ใช้งานได้</option>
              <option value="suspended">ระงับการใช้งาน</option>
              <option value="revoked">ยกเลิกสิทธิ์</option>
            </select>
          </div>

          {/* Organization Type Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={orgTypeFilter}
              onChange={(e) => handleFilterChange('orgType', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกประเภทองค์กร</option>
              <option value="external_user">ผู้ใช้ภายนอก</option>
              <option value="external_admin">ผู้ดูแลภายนอก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requesters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">รายการ External Requesters</h3>
            {isLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                กำลังโหลด...
              </div>
            )}
          </div>
        </div>
          
        {requesters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
            <p className="mt-1 text-sm text-gray-500">ไม่มี External Requesters ที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">องค์กร</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ผู้ติดต่อ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">ประเภท</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">สถานะ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">คำขอ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">วันที่ลงทะเบียน</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requesters.map((requester) => (
                  <tr key={requester.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {requester.organization_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {requester.primary_contact_email}
                          </div>
                        </div>
                      </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {requester.primary_contact_name}
                        </div>
                        {requester.primary_contact_phone && (
                          <div className="text-sm text-gray-500">
                            {requester.primary_contact_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                        {getOrgTypeText(requester.organization_type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(requester.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(requester.status)}`}>
                          {getStatusText(requester.status)}
                        </span>
                      </div>
                      {requester.is_verified && (
                        <div className="flex items-center mt-1">
                          <Mail className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">ยืนยันแล้ว</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{requester.total_requests}</div>
                          <div className="text-xs text-gray-500">ทั้งหมด</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{requester.approved_requests}</div>
                          <div className="text-xs text-gray-500">อนุมัติ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-yellow-600">{requester.pending_requests}</div>
                          <div className="text-xs text-gray-500">รอดำเนินการ</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {new Date(requester.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequester(requester)
                            setShowModal(true)
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          ดูรายละเอียด
                        </button>
                        {requester.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(requester, 'active')}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequester(requester)
                                setShowModal(true)
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                              ปฏิเสธ
                            </button>
                          </>
                        )}
                        {requester.status === 'active' && (
                          <button
                            onClick={() => handleStatusUpdate(requester, 'suspended')}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            ระงับ
                          </button>
                        )}
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    แสดง <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> ถึง{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    จาก <span className="font-medium">{pagination.total}</span> รายการ
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ก่อนหน้า
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Modal */}
      {showModal && selectedRequester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  รายละเอียด External Requester
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedRequester(null)
                    setAdminNotes('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Organization Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      ข้อมูลองค์กร
                    </h4>
                    <div className="pl-7 space-y-2 text-sm">
                      <p><strong>ชื่อองค์กร:</strong> {selectedRequester.organization_name}</p>
                      <p><strong>ประเภท:</strong> {getOrgTypeText(selectedRequester.organization_type)}</p>
                      <p><strong>เลขทะเบียน:</strong> {selectedRequester.registration_number || '-'}</p>
                      {selectedRequester.license_number && (
                        <p><strong>เลขใบอนุญาต:</strong> {selectedRequester.license_number}</p>
                      )}
                      {selectedRequester.tax_id && (
                        <p><strong>เลขประจำตัวผู้เสียภาษี:</strong> {selectedRequester.tax_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2" />
                      ข้อมูลผู้ติดต่อ
                    </h4>
                    <div className="pl-7 space-y-2 text-sm">
                      <p><strong>ชื่อ-นามสกุล:</strong> {selectedRequester.primary_contact_name}</p>
                      <p><strong>อีเมล:</strong> {selectedRequester.primary_contact_email}</p>
                      {selectedRequester.primary_contact_phone && (
                        <p><strong>เบอร์โทร:</strong> {selectedRequester.primary_contact_phone}</p>
                      )}
                      {selectedRequester.address && (
                        <p><strong>ที่อยู่:</strong> {selectedRequester.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Status & Access */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      สถานะและสิทธิ์
                    </h4>
                    <div className="pl-7 space-y-2 text-sm">
                      <p><strong>สถานะ:</strong> 
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequester.status)}`}>
                          {getStatusText(selectedRequester.status)}
                        </span>
                      </p>
                      <p><strong>ระดับการเข้าถึง:</strong> {selectedRequester.data_access_level}</p>
                      <p><strong>คำขอพร้อมกันสูงสุด:</strong> {selectedRequester.max_concurrent_requests}</p>
                      <p><strong>ยืนยันอีเมล:</strong> 
                        <span className={`ml-2 ${selectedRequester.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedRequester.is_verified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Request Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      สถิติคำขอ
                    </h4>
                    <div className="pl-7 space-y-2 text-sm">
                      <p><strong>คำขอทั้งหมด:</strong> {selectedRequester.total_requests}</p>
                      <p><strong>อนุมัติแล้ว:</strong> {selectedRequester.approved_requests}</p>
                      <p><strong>รอดำเนินการ:</strong> {selectedRequester.pending_requests}</p>
                      <p><strong>ปฏิเสธ:</strong> {selectedRequester.rejected_requests}</p>
                      <p><strong>ลงทะเบียนเมื่อ:</strong> {new Date(selectedRequester.created_at).toLocaleString('th-TH')}</p>
                      {selectedRequester.last_login && (
                        <p><strong>เข้าสู่ระบบล่าสุด:</strong> {new Date(selectedRequester.last_login).toLocaleString('th-TH')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedRequester.status === 'pending' && (
                  <div className="border-t pt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเหตุ (สำหรับการปฏิเสธหรือระงับ)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="ระบุเหตุผลในการปฏิเสธหรือระงับ (ถ้ามี)"
                      />
                    </div>
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedRequester(null)
                    setAdminNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ปิด
                </button>
                
                {selectedRequester.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequester, 'active')}
                      className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequester, 'suspended')}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                  </>
                )}
                {selectedRequester.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedRequester, 'suspended')}
                    className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    ระงับการใช้งาน
                  </button>
                )}
                {selectedRequester.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedRequester, 'active')}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    เปิดใช้งาน
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}