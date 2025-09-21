import { apiClient } from '@/lib/api'

export interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

export interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error'
  uptime: string
  lastCheck: string
  responseTime?: number
}

export interface AlertItem {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  resolved: boolean
}

export interface SystemOverview {
  systemHealth: string
  activeServices: number
  totalServices: number
  activeAlerts: number
  uptime: string
}

export interface SystemMonitoringData {
  overview: SystemOverview
  metrics: SystemMetric[]
  services: ServiceStatus[]
  alerts: AlertItem[]
}

class SystemMonitoringService {
  private apiClient = apiClient

  async getSystemOverview(): Promise<SystemOverview> {
    try {
      console.log('🔍 SystemMonitoringService: Getting system overview...')
      const response = await this.apiClient.get('/admin/system-monitoring/overview')
      console.log('📊 SystemMonitoringService: Overview response:', response)
      return response.data as any as SystemOverview
    } catch (error) {
      console.error('❌ SystemMonitoringService: Error getting overview:', error)
      throw error
    }
  }

  async getSystemMetrics(): Promise<SystemMetric[]> {
    try {
      console.log('🔍 SystemMonitoringService: Getting system metrics...')
      const response = await this.apiClient.get('/admin/system-monitoring/metrics')
      console.log('📊 SystemMonitoringService: Metrics response:', response)
      return response.data as any
    } catch (error) {
      console.error('❌ SystemMonitoringService: Error getting metrics:', error)
      throw error
    }
  }

  async getServiceStatus(): Promise<ServiceStatus[]> {
    try {
      console.log('🔍 SystemMonitoringService: Getting service status...')
      const response = await this.apiClient.get('/admin/system-monitoring/services')
      console.log('📊 SystemMonitoringService: Services response:', response)
      return response.data as any
    } catch (error) {
      console.error('❌ SystemMonitoringService: Error getting services:', error)
      throw error
    }
  }

  async getSystemAlerts(): Promise<AlertItem[]> {
    try {
      console.log('🔍 SystemMonitoringService: Getting system alerts...')
      const response = await this.apiClient.get('/admin/system-monitoring/alerts')
      console.log('📊 SystemMonitoringService: Alerts response:', response)
      return response.data as any
    } catch (error) {
      console.error('❌ SystemMonitoringService: Error getting alerts:', error)
      throw error
    }
  }

  async getAllSystemData(): Promise<SystemMonitoringData> {
    const response = await this.apiClient.get('/admin/system-monitoring/all')
    return response.data as any
  }

  async resolveAlert(alertId: string): Promise<{ success: boolean }> {
    const response = await this.apiClient.post(`/admin/system-monitoring/alerts/${alertId}/resolve`)
    return response.data as any
  }
}

export const systemMonitoringService = new SystemMonitoringService()
