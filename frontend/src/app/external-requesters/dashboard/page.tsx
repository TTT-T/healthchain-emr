'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Mail,
  Bell,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  thisMonthRequests: number;
  lastMonthRequests: number;
  averageResponseTime: number;
}

interface RecentRequest {
  id: string;
  patient: {
    name: string;
    hn: string;
  };
  request_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

const statusConfig = {
  pending: { 
    label: 'รอดำเนินการ', 
    color: 'text-yellow-600 bg-yellow-100', 
    icon: Clock 
  },
  approved: { 
    label: 'อนุมัติแล้ว', 
    color: 'text-green-600 bg-green-100', 
    icon: CheckCircle 
  },
  rejected: { 
    label: 'ปฏิเสธ', 
    color: 'text-red-600 bg-red-100', 
    icon: XCircle 
  },
  cancelled: { 
    label: 'ยกเลิก', 
    color: 'text-gray-600 bg-gray-100', 
    icon: XCircle 
  },
  expired: { 
    label: 'หมดอายุ', 
    color: 'text-orange-600 bg-orange-100', 
    icon: AlertCircle 
  }
};

const requestTypeLabels: { [key: string]: string } = {
  'patient_data': 'ข้อมูลผู้ป่วย',
  'medical_records': 'ประวัติการรักษา',
  'lab_results': 'ผลการตรวจ',
  'prescriptions': 'ใบสั่งยา',
  'appointments': 'ข้อมูลนัดหมาย',
  'research_data': 'ข้อมูลเพื่อการวิจัย'
};

export default function ExternalRequestersDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not external requester
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || !['external_requester', 'external_admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard overview
      const overviewResponse = await fetch('/api/external-requesters/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setStats(overviewData.data);
      }

      // Fetch recent consent requests
      const requestsResponse = await fetch('/api/external-requesters/consent-requests?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRecentRequests(requestsData.data.consent_requests || []);
      }

      // Fetch notifications
      const notificationsResponse = await fetch('/api/external-requesters/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.data.notifications || []);
      }

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <p className="text-gray-600">กำลังโหลดแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                <p className="text-gray-600">ผู้ขอเข้าถึงข้อมูลจากภายนอก</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <Link
                href="/external-requesters/notifications"
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="การแจ้งเตือน"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </Link>
              
              <Link
                href="/external-requesters/settings"
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="การตั้งค่า"
              >
                <Settings className="h-5 w-5" />
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/external-requesters/consent-requests/new"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">ส่งคำขอใหม่</h3>
                <p className="text-sm text-gray-600">สร้างคำขอเข้าถึงข้อมูลผู้ป่วย</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/external-requesters/consent-requests"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">คำขอของฉัน</h3>
                <p className="text-sm text-gray-600">ดูและจัดการคำขอทั้งหมด</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/external-requesters/search/patients"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">ค้นหาผู้ป่วย</h3>
                <p className="text-sm text-gray-600">ค้นหาผู้ป่วยเพื่อส่งคำขอ</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">คำขอทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">รอดำเนินการ</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.approvedRequests}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ปฏิเสธ</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequests}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Requests */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">คำขอล่าสุด</h3>
                  <Link
                    href="/external-requesters/consent-requests"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ดูทั้งหมด
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => {
                    const statusInfo = getStatusConfig(request.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{request.patient.name}</h4>
                              <span className="text-sm text-gray-500">HN: {request.patient.hn}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {requestTypeLabels[request.request_type] || request.request_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              สร้างเมื่อ: {formatDate(request.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </span>
                            
                            <Link
                              href={`/external-requesters/consent-requests/${request.id}`}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ยังไม่มีคำขอ</p>
                    <Link
                      href="/external-requesters/consent-requests/new"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      สร้างคำขอแรกของคุณ
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">การแจ้งเตือน</h3>
                  <Link
                    href="/external-requesters/notifications"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ดูทั้งหมด
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start">
                        <div className={`p-1 rounded-full mr-3 ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'warning' ? 'bg-yellow-100' :
                          notification.type === 'error' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          <Bell className={`h-3 w-3 ${
                            notification.type === 'success' ? 'text-green-600' :
                            notification.type === 'warning' ? 'text-yellow-600' :
                            notification.type === 'error' ? 'text-red-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">สถิติเพิ่มเติม</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">คำขอเดือนนี้</span>
                    <span className="font-medium text-gray-900">{stats.thisMonthRequests}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">คำขอเดือนที่แล้ว</span>
                    <span className="font-medium text-gray-900">{stats.lastMonthRequests}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">เวลาตอบสนองเฉลี่ย</span>
                    <span className="font-medium text-gray-900">{stats.averageResponseTime} ชม.</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">คำขอหมดอายุ</span>
                    <span className="font-medium text-orange-600">{stats.expiredRequests}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Help & Support */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">ต้องการความช่วยเหลือ?</h3>
              <p className="text-sm text-blue-800 mb-4">
                หากมีคำถามหรือต้องการความช่วยเหลือ
              </p>
              <div className="space-y-2 text-sm text-blue-700">
                <p>📧 อีเมล: support@hospital.com</p>
                <p>📞 โทรศัพท์: 02-123-4567</p>
                <p>🕒 เวลาทำการ: จันทร์-ศุกร์ 8:00-17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}