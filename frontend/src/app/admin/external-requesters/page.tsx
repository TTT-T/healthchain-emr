'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, UserCheck, Mail } from 'lucide-react'

interface ExternalRequesterRegistration {
  id: string
  requestId: string
  email: string
  organizationName: string
  requesterName: string
  status: 'pending_review' | 'approved' | 'rejected'
  emailVerified: boolean
  created_at: string
  updated_at: string
}

export default function ExternalRequestersAdminPage() {
  const [registrations, setRegistrations] = useState<ExternalRequesterRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<ExternalRequesterRegistration | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {

      const mockData: ExternalRequesterRegistration[] = [
        {
          id: '1',
          requestId: 'REQ-001',
          email: '@hospital.com',
          organizationName: 'โรงพยาบาลทดสอบ',
          requesterName: 'นาย ทดสอบ ระบบ',
          status: 'pending_review',
          emailVerified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          requestId: 'REQ-002',
          email: 'admin@clinic.com',
          organizationName: 'คลินิกทดสอบ',
          requesterName: 'นาง สมบูรณ์ ครบถ้วน',
          status: 'approved',
          emailVerified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      setRegistrations(mockData)
    } catch (error) {
      console.error('Error fetching registrations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (registration: ExternalRequesterRegistration) => {
    try {

      // Approving registration
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registration.id 
            ? { ...reg, status: 'approved' as const, updated_at: new Date().toISOString() }
            : reg
        )
      )
      
      setShowModal(false)
      setSelectedRegistration(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error approving registration:', error)
    }
  }

  const handleReject = async (registration: ExternalRequesterRegistration) => {
    try {

      // Rejecting registration
      
      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registration.id 
            ? { ...reg, status: 'rejected' as const, updated_at: new Date().toISOString() }
            : reg
        )
      )
      
      setShowModal(false)
      setSelectedRegistration(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error rejecting registration:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว'
      case 'rejected':
        return 'ปฏิเสธ'
      default:
        return 'รอการตรวจสอบ'
    }
  }

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการการลงทะเบียน External Requesters</h1>
          <p className="mt-2 text-gray-600">ตรวจสอบและอนุมัติการลงทะเบียนของผู้ขอข้อมูลภายนอก</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รอการตรวจสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'pending_review').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ปฏิเสธ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">รายการการลงทะเบียน</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสคำขอ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    องค์กร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ติดต่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่ลงทะเบียน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {registration.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.organizationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.requesterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {registration.email}
                        {registration.emailVerified && (
                          <Mail className="h-4 w-4 text-green-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(registration.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                          {getStatusText(registration.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registration.created_at).toLocaleString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRegistration(registration)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูรายละเอียด
                        </button>
                        {registration.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => handleApprove(registration)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRegistration(registration)
                                setShowModal(true)
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              ปฏิเสธ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedRegistration && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedRegistration.status === 'pending_review' ? 'อนุมัติ/ปฏิเสธการลงทะเบียน' : 'รายละเอียดการลงทะเบียน'}
                </h3>
                
                <div className="mb-4">
                  <p><strong>รหัสคำขอ:</strong> {selectedRegistration.requestId}</p>
                  <p><strong>องค์กร:</strong> {selectedRegistration.organizationName}</p>
                  <p><strong>ผู้ติดต่อ:</strong> {selectedRegistration.requesterName}</p>
                  <p><strong>อีเมล:</strong> {selectedRegistration.email}</p>
                  <p><strong>สถานะ:</strong> {getStatusText(selectedRegistration.status)}</p>
                </div>

                {selectedRegistration.status === 'pending_review' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุ (สำหรับการปฏิเสธ)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="ระบุเหตุผลในการปฏิเสธ (ถ้ามี)"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedRegistration(null)
                      setAdminNotes('')
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    ยกเลิก
                  </button>
                  
                  {selectedRegistration.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedRegistration)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        อนุมัติ
                      </button>
                      <button
                        onClick={() => handleReject(selectedRegistration)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        ปฏิเสธ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}