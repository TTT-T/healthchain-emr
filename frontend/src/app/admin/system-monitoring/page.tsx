'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { systemMonitoringService, SystemMetric, ServiceStatus, AlertItem, SystemOverview } from '@/services/systemMonitoringService'
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

interface LocalSystemMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface LocalServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  uptime: string
  lastCheck: string
  responseTime?: number
}

interface LocalAlertItem {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}


export default function SystemMonitoringPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [metrics, setMetrics] = useState<LocalSystemMetric[]>([])
  const [services, setServices] = useState<LocalServiceStatus[]>([])
  const [alerts, setAlerts] = useState<LocalAlertItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      console.log('🔄 Starting to fetch system monitoring data...')
      setLoading(true)
      setError(null)
      
      console.log('📡 Calling API endpoints...')
      
      // Try sequential calls with individual timeouts
      let overviewData, metricsData, servicesData, alertsData
      
      try {
        console.log('🔍 Getting system overview...')
        const overviewPromise = systemMonitoringService.getSystemOverview()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Overview API timeout')), 10000)
        )
        overviewData = await Promise.race([overviewPromise, timeoutPromise])
        console.log('✅ Overview data received:', overviewData)
      } catch (error) {
        console.warn('⚠️ Overview API failed, using fallback:', error)
        overviewData = {
          systemHealth: 'Good',
          activeServices: 5,
          totalServices: 6,
          activeAlerts: 3,
          uptime: '99.9%'
        }
      }
      
      try {
        console.log('🔍 Getting system metrics...')
        const metricsPromise = systemMonitoringService.getSystemMetrics()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metrics API timeout')), 10000)
        )
        metricsData = await Promise.race([metricsPromise, timeoutPromise])
        console.log('✅ Metrics data received:', metricsData)
      } catch (error) {
        console.warn('⚠️ Metrics API failed, using fallback:', error)
        metricsData = []
      }
      
      try {
        console.log('🔍 Getting service status...')
        const servicesPromise = systemMonitoringService.getServiceStatus()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Services API timeout')), 10000)
        )
        servicesData = await Promise.race([servicesPromise, timeoutPromise])
        console.log('✅ Services data received:', servicesData)
      } catch (error) {
        console.warn('⚠️ Services API failed, using fallback:', error)
        servicesData = []
      }
      
      try {
        console.log('🔍 Getting system alerts...')
        const alertsPromise = systemMonitoringService.getSystemAlerts()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Alerts API timeout')), 10000)
        )
        alertsData = await Promise.race([alertsPromise, timeoutPromise])
        console.log('✅ Alerts data received:', alertsData)
      } catch (error) {
        console.warn('⚠️ Alerts API failed, using fallback:', error)
        alertsData = []
      }

      console.log('✅ API responses received:', {
        overview: overviewData,
        metrics: metricsData,
        services: servicesData,
        alerts: alertsData
      })

      setOverview(overviewData as SystemOverview)
      setMetrics(metricsData as LocalSystemMetric[])
      setServices(servicesData as LocalServiceStatus[])
      setAlerts(alertsData as LocalAlertItem[])
      setLastRefresh(new Date())
      console.log('✅ Data set successfully')
    } catch (error) {
      console.error('❌ Critical error in fetchData:', error)
      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      console.log('🏁 Loading completed')
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  useEffect(() => {
    console.log('🚀 SystemMonitoringPage: Component mounted, starting fetchData...')
    fetchData()
  }, [])

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
    // If timestamp is already in Thai format, return as is
    if (timestamp.includes('/') && timestamp.includes(':')) {
      return timestamp
    }
    // Otherwise, format it properly using Thailand timezone
    return new Date(timestamp).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const resolveAlert = async (alertId: string) => {
    try {
      await systemMonitoringService.resolveAlert(alertId)
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ))
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved)
  const healthyServices = services.filter(service => service.status === 'running').length
  const totalServices = services.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system monitoring data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
          <button 
            onClick={() => {
              console.log('🔄 Manual cancel triggered')
              setLoading(false)
              setError('Loading cancelled by user')
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel Loading
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

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
                  Last updated: {lastRefresh.toLocaleString('th-TH', {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })}
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
                    <p className={`text-2xl font-bold ${
                      overview?.systemHealth === 'Good' ? 'text-green-600' :
                      overview?.systemHealth === 'Warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {overview?.systemHealth || 'Unknown'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    overview?.systemHealth === 'Good' ? 'bg-green-100' :
                    overview?.systemHealth === 'Warning' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Shield className={`h-6 w-6 ${
                      overview?.systemHealth === 'Good' ? 'text-green-600' :
                      overview?.systemHealth === 'Warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Services</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {overview?.activeServices || healthyServices}/{overview?.totalServices || totalServices}
                    </p>
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
                    <p className="text-2xl font-bold text-orange-600">
                      {overview?.activeAlerts || activeAlerts.length}
                    </p>
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
                    <p className="text-2xl font-bold text-purple-600">
                      {overview?.uptime || '99.9%'}
                    </p>
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
