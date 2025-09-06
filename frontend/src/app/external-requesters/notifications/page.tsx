'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Clock,
  Mail,
  Settings,
  Eye,
  Trash2,
  Loader2
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  timestamp: string
  isRead: boolean
  actionRequired?: boolean
  relatedRequestId?: string
}

const typeConfig = {
  success: {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50'
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50'
  },
  error: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50'
  }
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load notifications data
  useEffect(() => {
    const loadNotificationsData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getExternalRequesterNotifications({
          page: 1,
          limit: 50
        })
        
        if (response.success && response.data) {
          const notificationsData = response.data.notifications || []
          setNotifications(notificationsData.map((notif: any) => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type || 'info',
            timestamp: notif.createdAt,
            isRead: notif.isRead,
            relatedRequestId: notif.data?.requestId,
            actionRequired: notif.data?.actionRequired || false
          })))
        } else {
          setError('ไม่สามารถโหลดการแจ้งเตือนได้')
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
        setError('เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน')
      } finally {
        setLoading(false)
      }
    }

    loadNotificationsData()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const [filterType, setFilterType] = useState<string>('all')
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesRead = !showOnlyUnread || !notification.isRead
    return matchesType && matchesRead
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with Mobile Menu */}
            <div className="mb-6 sm:mb-8 lg:mb-12">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <div className="min-w-0 flex-1 flex items-center space-x-2 sm:space-x-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate">
                    การแจ้งเตือน
                  </h1>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs sm:text-sm px-2 py-1">
                      {unreadCount} ใหม่
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-800 leading-relaxed font-medium">
                ข่าวสารและการแจ้งเตือนสำคัญเกี่ยวกับคำขอและระบบ
              </p>
            </div>

          {/* Actions and Filters */}
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl text-gray-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <span>จัดการการแจ้งเตือน</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={unreadCount === 0}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>อ่านทั้งหมดแล้ว</span>
                  </Button>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyUnread}
                      onChange={(e) => setShowOnlyUnread(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">แสดงเฉพาะที่ยังไม่อ่าน</span>
                  </label>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">ประเภท:</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="success">สำเร็จ</option>
                    <option value="warning">คำเตือน</option>
                    <option value="info">ข้อมูล</option>
                    <option value="error">ข้อผิดพลาด</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`shadow-lg border-0 transition-all duration-200 ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50 border-l-4 border-l-blue-500'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${typeConfig[notification.type].color}`}>
                          {typeConfig[notification.type].icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${notification.isRead ? 'text-gray-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.actionRequired && (
                            <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
                              ต้องดำเนินการ
                            </Badge>
                          )}
                          {!notification.isRead && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-gray-700 mb-4 leading-relaxed ${notification.isRead ? '' : 'font-medium'}`}>
                        {notification.message}
                      </p>

                      {notification.relatedRequestId && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-600">
                            <strong>คำขอที่เกี่ยวข้อง:</strong> {notification.relatedRequestId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {notification.relatedRequestId && (
                        <Button size="sm" variant="outline">
                          ดูคำขอ
                        </Button>
                      )}
                      {notification.actionRequired && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                          ดำเนินการ
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {notification.isRead ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            ทำเครื่องหมายยังไม่อ่าน
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            ทำเครื่องหมายอ่านแล้ว
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่มีการแจ้งเตือน
                </h3>
                <p className="text-gray-600">
                  {showOnlyUnread ? 'คุณไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน' : 'ยังไม่มีการแจ้งเตือนในขณะนี้'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Email Settings Alert */}
          <Alert className="mt-8 bg-yellow-50 border-yellow-200">
            <Mail className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>การตั้งค่าอีเมล:</strong> คุณสามารถจัดการการแจ้งเตือนทางอีเมลได้ในหน้า 
              <Button variant="link" className="p-0 h-auto text-yellow-800 underline ml-1">
                การตั้งค่า
              </Button>
            </AlertDescription>
          </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
