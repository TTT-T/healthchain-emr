'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { 
  Building2, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  RefreshCw,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  organizationName: string
  organizationType: string
  status: string
  dataAccessLevel: string
  lastLogin: string
  createdAt: string
}

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  monthlyUsage: number
  maxMonthlyUsage: number
  activeConnections: number
  dataTransferred: number
}

interface RecentRequest {
  id: string
  type: string
  patientId: string
  status: string
  requestedAt: string
  processedAt?: string
  purpose: string
}

export default function ExternalRequestersHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Load user profile data
        const profileResponse = await apiClient.getExternalRequesterProfile()
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data
          setUser({
            id: profileData.id,
            email: profileData.primaryContactEmail,
            organizationName: profileData.organizationName,
            organizationType: profileData.organizationType,
            status: profileData.status,
            dataAccessLevel: profileData.dataAccessLevel,
            lastLogin: profileData.lastLogin || new Date().toISOString(),
            createdAt: profileData.createdAt
          })
        }

        // Load dashboard overview
        const dashboardResponse = await apiClient.getExternalRequestersDashboardOverview()
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data
          setStats({
            totalRequests: dashboardData.totalRequests || 0,
            pendingRequests: dashboardData.pendingRequests || 0,
            approvedRequests: dashboardData.approvedRequests || 0,
            rejectedRequests: dashboardData.rejectedRequests || 0,
            monthlyUsage: dashboardData.monthlyUsage || 0,
            maxMonthlyUsage: dashboardData.maxMonthlyUsage || 100,
            activeConnections: dashboardData.activeConnections || 0,
            dataTransferred: dashboardData.dataTransferred || 0
          })

          // Set recent requests
          if (dashboardData.recentRequests) {
            setRecentRequests(dashboardData.recentRequests.map((req: any) => ({
              id: req.id,
              type: req.requestType,
              patientId: req.patientId,
              status: req.status,
              requestedAt: req.createdAt,
              processedAt: req.updatedAt,
              purpose: req.purpose
            })))
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set empty data if API fails
        setUser(null)
        setStats(null)
        setRecentRequests([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const refreshData = async () => {
    setLastRefresh(new Date())
    // Reload dashboard data
    try {
      const dashboardResponse = await apiClient.getExternalRequestersDashboardOverview()
      if (dashboardResponse.success && dashboardResponse.data) {
        const dashboardData = dashboardResponse.data
        setStats({
          totalRequests: dashboardData.totalRequests || 0,
          pendingRequests: dashboardData.pendingRequests || 0,
          approvedRequests: dashboardData.approvedRequests || 0,
          rejectedRequests: dashboardData.rejectedRequests || 0,
          monthlyUsage: dashboardData.monthlyUsage || 0,
          maxMonthlyUsage: dashboardData.maxMonthlyUsage || 100,
          activeConnections: dashboardData.activeConnections || 0,
          dataTransferred: dashboardData.dataTransferred || 0
        })

        if (dashboardData.recentRequests) {
          setRecentRequests(dashboardData.recentRequests.map((req: any) => ({
            id: req.id,
            type: req.requestType,
            patientId: req.patientId,
            status: req.status,
            requestedAt: req.createdAt,
            processedAt: req.updatedAt,
            purpose: req.purpose
          })))
        }
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว'
      case 'pending': return 'รอดำเนินการ'
      case 'rejected': return 'ปฏิเสธ'
      default: return 'ไม่ทราบสถานะ'
    }
  }

  const handleLogout = () => {
    // Handle logout logic
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  ยินดีต้อนรับ, {user?.organizationName}
                </h1>
                <p className="text-slate-600 mb-4">
                  สถานะ: <span className="font-semibold text-emerald-600">{user?.status}</span> | 
                  ระดับการเข้าถึง: <span className="font-semibold text-blue-600">{user?.dataAccessLevel}</span>
                </p>
                <p className="text-sm text-slate-500">
                  อัปเดตล่าสุด: {lastRefresh.toLocaleString('th-TH')}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={refreshData}
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">คำขอทั้งหมด</p>
                <p className="text-3xl font-bold text-slate-800">{stats?.totalRequests.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12% จากเดือนที่แล้ว</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">รอดำเนินการ</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingRequests}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-yellow-100 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">อนุมัติแล้ว</p>
                <p className="text-3xl font-bold text-green-600">{stats?.approvedRequests}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">การใช้งานรายเดือน</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.monthlyUsage}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats?.monthlyUsage}%` }}></div>
              </div>
            </div>
          </div>
        </div>


        {/* Recent Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">คำขอล่าสุด</h2>
            <Link
              href="/external-requesters/my-requests"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">ประเภท</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">ผู้ป่วย</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">วัตถุประสงค์</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">วันที่</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">สถานะ</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-slate-400 mr-2" />
                          <span className="text-sm font-medium text-slate-800">{request.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{request.patientId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{request.purpose}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(request.requestedAt).toLocaleDateString('th-TH')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">สถานะระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">API Gateway</h3>
                  <p className="text-slate-600 text-sm">Gateway สำหรับการเข้าถึง API</p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-600 font-medium">ปกติ</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Database</h3>
                  <p className="text-slate-600 text-sm">ฐานข้อมูลหลัก</p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-600 font-medium">ปกติ</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Security System</h3>
                  <p className="text-slate-600 text-sm">ระบบความปลอดภัย</p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-600 font-medium">ปกติ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}