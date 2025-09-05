'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Monitor,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  uptime: string
  lastCheck: string
  responseTime?: number
}

interface AlertItem {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}

const mockSystemMetrics: SystemMetric[] = [
  {
    name: 'CPU Usage',
    value: 45,
    unit: '%',
    status: 'healthy',
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'Memory Usage',
    value: 78,
    unit: '%',
    status: 'warning',
    trend: 'up',
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'Disk Usage',
    value: 62,
    unit: '%',
    status: 'healthy',
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'Network I/O',
    value: 23,
    unit: 'Mbps',
    status: 'healthy',
    trend: 'down',
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'Database Connections',
    value: 156,
    unit: 'connections',
    status: 'healthy',
    trend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'API Response Time',
    value: 245,
    unit: 'ms',
    status: 'warning',
    trend: 'up',
    lastUpdated: new Date().toISOString()
  }
]

const mockServices: ServiceStatus[] = [
  {
    name: 'Web Server',
    status: 'running',
    uptime: '15 days, 8 hours',
    lastCheck: new Date().toISOString(),
    responseTime: 120
  },
  {
    name: 'Database Server',
    status: 'running',
    uptime: '15 days, 8 hours',
    lastCheck: new Date().toISOString(),
    responseTime: 45
  },
  {
    name: 'API Gateway',
    status: 'running',
    uptime: '12 days, 3 hours',
    lastCheck: new Date().toISOString(),
    responseTime: 89
  },
  {
    name: 'Authentication Service',
    status: 'running',
    uptime: '15 days, 8 hours',
    lastCheck: new Date().toISOString(),
    responseTime: 67
  },
  {
    name: 'File Storage',
    status: 'running',
    uptime: '15 days, 8 hours',
    lastCheck: new Date().toISOString(),
    responseTime: 156
  },
  {
    name: 'Email Service',
    status: 'stopped',
    uptime: '0 days, 0 hours',
    lastCheck: new Date().toISOString()
  }
]

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'warning',
    message: 'Memory usage is above 75%',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    resolved: false
  },
  {
    id: '2',
    type: 'error',
    message: 'Email service is not responding',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    resolved: false
  },
  {
    id: '3',
    type: 'info',
    message: 'Scheduled backup completed successfully',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    resolved: true
  },
  {
    id: '4',
    type: 'warning',
    message: 'API response time is slower than usual',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    resolved: false
  }
]

export default function SystemMonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>(mockSystemMetrics)
  const [services, setServices] = useState<ServiceStatus[]>(mockServices)
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setLastRefresh(new Date())
      setIsRefreshing(false)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'error':
      case 'stopped':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
      case 'error':
      case 'stopped':
        return <XCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
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

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved)
  const healthyServices = services.filter(service => service.status === 'running').length
  const totalServices = services.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="py-4 sm:py-6 lg:py-8 xl:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  System Monitoring
                </h1>
                <p className="text-gray-600">
                  Monitor system performance, services, and alerts in real-time
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleString('th-TH')}
                </div>
                <Button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
                    <p className="text-2xl font-bold text-green-600">Good</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Services</p>
                    <p className="text-2xl font-bold text-blue-600">{healthyServices}/{totalServices}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Server className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Alerts</p>
                    <p className="text-2xl font-bold text-orange-600">{activeAlerts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Uptime</p>
                    <p className="text-2xl font-bold text-purple-600">99.9%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Metrics */}
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <span>System Metrics</span>
              </CardTitle>
              <CardDescription>
                Real-time system performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map((metric, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(metric.trend)}
                        <Badge className={`${getStatusColor(metric.status)} border`}>
                          {getStatusIcon(metric.status)}
                          <span className="ml-1">{metric.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {metric.value} {metric.unit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metric.status === 'healthy' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Updated: {formatTimestamp(metric.lastUpdated)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Status */}
          <Card className="shadow-lg border-0 bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
                <span>Services Status</span>
              </CardTitle>
              <CardDescription>
                Monitor the status of all system services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <span className="font-medium text-gray-900">{service.name}</span>
                      </div>
                      <Badge className={`${getStatusColor(service.status)} border`}>
                        {service.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Uptime: {service.uptime}</p>
                      {service.responseTime && (
                        <p className="text-sm text-gray-600">
                          Response: {service.responseTime}ms
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Last check: {formatTimestamp(service.lastCheck)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <span>System Alerts</span>
              </CardTitle>
              <CardDescription>
                Recent system alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={`${getAlertColor(alert.type)} border`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <AlertDescription className="font-medium">
                            {alert.message}
                          </AlertDescription>
                          <p className="text-xs opacity-75 mt-1">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
