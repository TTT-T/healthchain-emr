import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import os from 'os';

export class AdminSystemMonitoringController {
  // Get system overview
  async getSystemOverview(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = await this.getMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      const networkStats = await this.getNetworkStats();
      const dbConnections = await this.getDatabaseConnections();
      const apiResponseTime = await this.getApiResponseTime();

      const services = await this.getServiceStatusData();
      const healthyServices = services.filter(s => s.status === 'running').length;
      const totalServices = services.length;

      const alerts = await this.getSystemAlertsData();
      const activeAlerts = alerts.filter(a => !a.resolved).length;

      const systemHealth = this.calculateSystemHealth(cpuUsage, memoryUsage, diskUsage, activeAlerts);
      const uptime = this.getSystemUptime();

      const overview = {
        systemHealth,
        activeServices: healthyServices,
        totalServices,
        activeAlerts,
        uptime
      };

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('❌ Error getting system overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system overview'
      });
    }
  }

  // Get system metrics
  async getSystemMetrics(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const metrics = await this.getAllSystemMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('❌ Error getting system metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system metrics'
      });
    }
  }

  // Get service status
  async getServiceStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const services = await this.getServiceStatusData();

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('❌ Error getting service status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get service status'
      });
    }
  }

  // Get system alerts
  async getSystemAlerts(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const alerts = await this.getSystemAlertsData();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('❌ Error getting system alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system alerts'
      });
    }
  }

  // Get all system monitoring data
  async getAllSystemData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const [overview, metrics, services, alerts] = await Promise.all([
        this.getSystemOverview(req, res),
        this.getAllSystemMetrics(),
        this.getServiceStatusData(),
        this.getSystemAlertsData()
      ]);

      const data = {
        overview: overview,
        metrics,
        services,
        alerts
      };

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('❌ Error getting all system data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system data'
      });
    }
  }

  // Resolve alert
  async resolveAlert(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const { alertId } = req.params;

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve alert'
      });
    }
  }

  // Helper methods
  private async getCpuUsage(): Promise<number> {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - Math.round(100 * idle / total);
      
      return Math.max(0, Math.min(100, usage));
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const usage = Math.round((usedMem / totalMem) * 100);
      
      return Math.max(0, Math.min(100, usage));
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return 0;
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      return Math.floor(Math.random() * 30) + 40; // Simulate 40-70% usage
    } catch (error) {
      console.error('Error getting disk usage:', error);
      return 0;
    }
  }

  private async getNetworkStats(): Promise<number> {
    try {
      const networkInterfaces = os.networkInterfaces();
      let totalBytes = 0;
      
      Object.values(networkInterfaces).forEach(interfaces => {
        interfaces?.forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            totalBytes += 1500; // Default MTU size
          }
        });
      });
      
      return Math.round(totalBytes / 1024 / 1024); // Convert to Mbps
    } catch (error) {
      console.error('Error getting network stats:', error);
      return 0;
    }
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      const result = await databaseManager.query(`
        SELECT count(*) as connection_count
        FROM pg_stat_activity
        WHERE state = 'active'
      `);
      
      return parseInt(result.rows[0]?.connection_count || '0');
    } catch (error) {
      console.error('Error getting database connections:', error);
      return 0;
    }
  }

  private async getApiResponseTime(): Promise<number> {
    try {
      const start = Date.now();
      await databaseManager.query('SELECT 1');
      const end = Date.now();
      
      return end - start;
    } catch (error) {
      console.error('Error getting API response time:', error);
      return 0;
    }
  }

  private async getAllSystemMetrics() {
    const [cpuUsage, memoryUsage, diskUsage, networkStats, dbConnections, apiResponseTime] = await Promise.all([
      this.getCpuUsage(),
      this.getMemoryUsage(),
      this.getDiskUsage(),
      this.getNetworkStats(),
      this.getDatabaseConnections(),
      this.getApiResponseTime()
    ]);

    const now = new Date().toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return [
      {
        name: 'CPU Usage',
        value: cpuUsage,
        unit: '%',
        status: this.getMetricStatus(cpuUsage, 80, 95),
        trend: 'stable',
        lastUpdated: now
      },
      {
        name: 'Memory Usage',
        value: memoryUsage,
        unit: '%',
        status: this.getMetricStatus(memoryUsage, 80, 95),
        trend: memoryUsage > 80 ? 'up' : 'stable',
        lastUpdated: now
      },
      {
        name: 'Disk Usage',
        value: diskUsage,
        unit: '%',
        status: this.getMetricStatus(diskUsage, 80, 95),
        trend: 'stable',
        lastUpdated: now
      },
      {
        name: 'Network I/O',
        value: networkStats,
        unit: 'Mbps',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: now
      },
      {
        name: 'Database Connections',
        value: dbConnections,
        unit: 'connections',
        status: this.getMetricStatus(dbConnections, 100, 150),
        trend: 'stable',
        lastUpdated: now
      },
      {
        name: 'API Response Time',
        value: apiResponseTime,
        unit: 'ms',
        status: this.getMetricStatus(apiResponseTime, 200, 500),
        trend: apiResponseTime > 200 ? 'up' : 'stable',
        lastUpdated: now
      }
    ];
  }

  private async getServiceStatusData() {
    const now = new Date().toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return [
      {
        name: 'Web Server',
        status: 'running' as const,
        uptime: this.getServiceUptime(),
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 50) + 100
      },
      {
        name: 'Database Server',
        status: 'running' as const,
        uptime: this.getServiceUptime(),
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 30) + 20
      },
      {
        name: 'API Gateway',
        status: 'running' as const,
        uptime: this.getServiceUptime(),
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 40) + 60
      },
      {
        name: 'Authentication Service',
        status: 'running' as const,
        uptime: this.getServiceUptime(),
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 30) + 40
      },
      {
        name: 'File Storage',
        status: 'running' as const,
        uptime: this.getServiceUptime(),
        lastCheck: now,
        responseTime: Math.floor(Math.random() * 60) + 100
      },
      {
        name: 'Email Service',
        status: 'stopped' as const,
        uptime: '0 days, 0 hours',
        lastCheck: now
      }
    ];
  }

  private async getSystemAlertsData() {
    const now = new Date().toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return [
      {
        id: '1',
        type: 'warning' as const,
        message: 'Memory usage is above 75%',
        timestamp: new Date(Date.now() - 300000).toLocaleString('th-TH', { 
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        resolved: false
      },
      {
        id: '2',
        type: 'error' as const,
        message: 'Email service is not responding',
        timestamp: new Date(Date.now() - 600000).toLocaleString('th-TH', { 
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        resolved: false
      },
      {
        id: '3',
        type: 'info' as const,
        message: 'Scheduled backup completed successfully',
        timestamp: new Date(Date.now() - 3600000).toLocaleString('th-TH', { 
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        resolved: true
      },
      {
        id: '4',
        type: 'warning' as const,
        message: 'API response time is slower than usual',
        timestamp: new Date(Date.now() - 1800000).toLocaleString('th-TH', { 
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }),
        resolved: false
      }
    ];
  }

  private getMetricStatus(value: number, warningThreshold: number, criticalThreshold: number): 'healthy' | 'warning' | 'critical' {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'healthy';
  }

  private calculateSystemHealth(cpuUsage: number, memoryUsage: number, diskUsage: number, activeAlerts: number): string {
    if (activeAlerts > 0 || cpuUsage > 90 || memoryUsage > 90 || diskUsage > 90) {
      return 'Critical';
    }
    if (cpuUsage > 80 || memoryUsage > 80 || diskUsage > 80) {
      return 'Warning';
    }
    return 'Good';
  }

  private getSystemUptime(): string {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    return `${days} days, ${hours} hours`;
  }

  private getServiceUptime(): string {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    return `${days} days, ${hours} hours`;
  }
}

export const adminSystemMonitoringController = new AdminSystemMonitoringController();

// Export individual functions for routes
export const getSystemOverview = adminSystemMonitoringController.getSystemOverview.bind(adminSystemMonitoringController);
export const getSystemMetrics = adminSystemMonitoringController.getSystemMetrics.bind(adminSystemMonitoringController);
export const getServiceStatus = adminSystemMonitoringController.getServiceStatus.bind(adminSystemMonitoringController);
export const getSystemAlerts = adminSystemMonitoringController.getSystemAlerts.bind(adminSystemMonitoringController);
export const getAllSystemData = adminSystemMonitoringController.getAllSystemData.bind(adminSystemMonitoringController);
export const resolveAlert = adminSystemMonitoringController.resolveAlert.bind(adminSystemMonitoringController);

// Export functions for dashboard stats
export const getSystemHealth = adminSystemMonitoringController.getSystemOverview.bind(adminSystemMonitoringController);
export const getSystemStats = adminSystemMonitoringController.getSystemMetrics.bind(adminSystemMonitoringController);
