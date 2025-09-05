'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  Send,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  Clock,
  User,
  Building2,
  Shield,
  Database,
  Server
} from 'lucide-react'

interface Notification {
  id: string
  type: 'email' | 'sms' | 'push' | 'system'
  category: 'security' | 'system' | 'user' | 'data' | 'compliance'
  title: string
  message: string
  recipient: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
}

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'push'
  subject: string
  content: string
  variables: string[]
  isActive: boolean
  createdAt: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'email',
    category: 'security',
    title: 'Login Attempt from New Device',
    message: 'A login attempt was detected from a new device for user admin@hospital.com',
    recipient: 'admin@hospital.com',
    status: 'delivered',
    priority: 'high',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    sentAt: new Date(Date.now() - 300000).toISOString(),
    deliveredAt: new Date(Date.now() - 299000).toISOString(),
    readAt: new Date(Date.now() - 250000).toISOString()
  },
  {
    id: '2',
    type: 'sms',
    category: 'system',
    title: 'System Maintenance Scheduled',
    message: 'System maintenance is scheduled for tonight at 2:00 AM. Expected downtime: 30 minutes.',
    recipient: '+66-123-456-789',
    status: 'sent',
    priority: 'medium',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    sentAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: '3',
    type: 'push',
    category: 'data',
    title: 'Data Backup Completed',
    message: 'Daily data backup has been completed successfully. 2.4 GB of data backed up.',
    recipient: 'admin@hospital.com',
    status: 'delivered',
    priority: 'low',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    deliveredAt: new Date(Date.now() - 3590000).toISOString()
  },
  {
    id: '4',
    type: 'email',
    category: 'compliance',
    title: 'Compliance Audit Due',
    message: 'Monthly compliance audit is due in 3 days. Please prepare the required documentation.',
    recipient: 'compliance@hospital.com',
    status: 'failed',
    priority: 'high',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    sentAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '5',
    type: 'system',
    category: 'system',
    title: 'Database Connection Pool Warning',
    message: 'Database connection pool is at 85% capacity. Consider scaling up.',
    recipient: 'system@hospital.com',
    status: 'delivered',
    priority: 'medium',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    sentAt: new Date(Date.now() - 10800000).toISOString(),
    deliveredAt: new Date(Date.now() - 10790000).toISOString()
  }
]

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Login Alert',
    type: 'email',
    subject: 'New Login Detected - {{userEmail}}',
    content: 'A new login was detected for your account {{userEmail}} from {{deviceInfo}} at {{timestamp}}.',
    variables: ['userEmail', 'deviceInfo', 'timestamp'],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'System Maintenance',
    type: 'sms',
    subject: 'System Maintenance Notice',
    content: 'System maintenance scheduled for {{date}} at {{time}}. Expected downtime: {{duration}}.',
    variables: ['date', 'time', 'duration'],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Data Backup Success',
    type: 'push',
    subject: 'Backup Completed',
    content: 'Data backup completed successfully. {{size}} of data backed up at {{timestamp}}.',
    variables: ['size', 'timestamp'],
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates)
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'settings'>('notifications')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600 bg-blue-100'
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'system':
        return <Server className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'data':
        return <Database className="h-4 w-4" />
      case 'compliance':
        return <Building2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Bell className="h-4 w-4" />
      case 'system':
        return <Server className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.recipient.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const retryNotification = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, status: 'pending' as const }
        : notification
    ))
  }

  const totalNotifications = notifications.length
  const deliveredNotifications = notifications.filter(n => n.status === 'delivered').length
  const failedNotifications = notifications.filter(n => n.status === 'failed').length
  const pendingNotifications = notifications.filter(n => n.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Notification Management
            </h1>
            <p className="text-gray-600">
              Manage system notifications, templates, and delivery settings
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Notifications</p>
                    <p className="text-2xl font-bold text-blue-600">{totalNotifications}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{deliveredNotifications}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{failedNotifications}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingNotifications}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'templates', label: 'Templates', icon: Settings },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search notifications..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="sm:w-48">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    <div className="sm:w-48">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications List */}
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    View and manage all system notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getTypeIcon(notification.type)}
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <Badge className={`${getStatusColor(notification.status)} border`}>
                                {getStatusIcon(notification.status)}
                                <span className="ml-1">{notification.status}</span>
                              </Badge>
                              <Badge className={`${getPriorityColor(notification.priority)} border`}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                {getCategoryIcon(notification.category)}
                                <span>{notification.category}</span>
                              </div>
                              <span>To: {notification.recipient}</span>
                              <span>Created: {formatTimestamp(notification.createdAt)}</span>
                              {notification.sentAt && (
                                <span>Sent: {formatTimestamp(notification.sentAt)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {notification.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryNotification(notification.id)}
                              >
                                Retry
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                  Manage notification templates for different types of messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(template.type)}
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <Badge className={template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            Test
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Content:</strong> {template.content}
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Variables:</strong> {template.variables.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure notification delivery settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Email Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">SMTP Server</span>
                          <span className="text-sm font-medium">smtp.hospital.com</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Port</span>
                          <span className="text-sm font-medium">587</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">SSL/TLS</span>
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">SMS Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Provider</span>
                          <span className="text-sm font-medium">Twilio</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Account Status</span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Credits Remaining</span>
                          <span className="text-sm font-medium">1,247</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Rate Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">Email per minute</div>
                        <div className="text-lg font-semibold">100</div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">SMS per minute</div>
                        <div className="text-lg font-semibold">50</div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">Push per minute</div>
                        <div className="text-lg font-semibold">200</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
