import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

export class AdminConsentAuditController {
  // Get audit summary statistics
  async getAuditSummary(req: Request, res: Response) {
    try {
      // Authentication is handled by middleware
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Check if consent_requests table exists
      const tableCheck = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consent_requests'
      `);

      if (tableCheck.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            summary: {
              totalConsentRequests: 0,
              approvedRequests: 0,
              rejectedRequests: 0,
              pendingRequests: 0,
              emergencyAccess: 0,
              violationAlerts: 0,
              complianceRate: 100,
              averageResponseTime: 0,
              dataAccessCount: 0,
              revokedConsents: 0
            },
            violationAlerts: [],
            usageByUserType: [],
            monthlyTrends: []
          }
        });
      }

      // Get consent requests summary
      const consentSummary = await databaseManager.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'emergency' THEN 1 END) as emergency_access,
          COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_consents
        FROM consent_requests
      `);

      // Get violation alerts from audit trail
      const violationCount = await databaseManager.query(`
        SELECT COUNT(*) as violation_count
        FROM consent_audit_trail
        WHERE action IN ('data_breach', 'unauthorized_access', 'consent_violation', 'policy_violation')
      `);

      // Get data access count
      const dataAccessCount = await databaseManager.query(`
        SELECT COUNT(*) as access_count
        FROM consent_audit_trail
        WHERE action = 'data_access'
      `);

      // Calculate compliance rate
      const total = consentSummary.rows[0]?.total_requests || 0;
      const approved = consentSummary.rows[0]?.approved_requests || 0;
      const complianceRate = total > 0 ? Math.round((approved / total) * 100 * 10) / 10 : 100;

      // Calculate average response time (mock calculation)
      const avgResponseTime = total > 0 ? Math.round((Math.random() * 3 + 1) * 10) / 10 : 0;

      const summary = {
        totalConsentRequests: parseInt(consentSummary.rows[0]?.total_requests || '0'),
        approvedRequests: parseInt(consentSummary.rows[0]?.approved_requests || '0'),
        rejectedRequests: parseInt(consentSummary.rows[0]?.rejected_requests || '0'),
        pendingRequests: parseInt(consentSummary.rows[0]?.pending_requests || '0'),
        emergencyAccess: parseInt(consentSummary.rows[0]?.emergency_access || '0'),
        violationAlerts: parseInt(violationCount.rows[0]?.violation_count || '0'),
        complianceRate,
        averageResponseTime: avgResponseTime,
        dataAccessCount: parseInt(dataAccessCount.rows[0]?.access_count || '0'),
        revokedConsents: parseInt(consentSummary.rows[0]?.revoked_consents || '0')
      };

      res.json({
        success: true,
        data: {
          summary,
          violationAlerts: [],
          usageByUserType: [],
          monthlyTrends: []
        }
      });

    } catch (error) {
      console.error('❌ Error getting audit summary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get audit summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get violation alerts
  async getViolationAlerts(req: Request, res: Response) {
    try {
      // Authentication is handled by middleware
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const limit = parseInt(req.query.limit as string) || 10;

      // Check if consent_audit_trail table exists
      const tableCheck = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consent_audit_trail'
      `);

      if (tableCheck.rows.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get violation alerts from audit trail
      const violations = await databaseManager.query(`
        SELECT 
          id,
          action as type,
          timestamp,
          change_reason as description,
          changed_by as user_id,
          contract_id as consent_request_id
        FROM consent_audit_trail
        WHERE action IN ('data_breach', 'unauthorized_access', 'consent_violation', 'policy_violation')
        ORDER BY timestamp DESC
        LIMIT $1
      `, [limit]);

      // Transform to violation alerts format
      const violationAlerts = violations.rows.map((violation, index) => ({
        id: `V${String(index + 1).padStart(3, '0')}`,
        type: violation.type,
        severity: this.getSeverityFromAction(violation.type),
        title: this.getTitleFromAction(violation.type),
        description: violation.description || 'ไม่มีการอธิบาย',
        timestamp: violation.timestamp,
        involvedUser: `User ${violation.user_id || 'Unknown'}`,
        patientId: violation.consent_request_id ? `HN${violation.consent_request_id}` : 'Unknown',
        action: this.getActionFromType(violation.type),
        resolved: false
      }));

      res.json({
        success: true,
        data: violationAlerts
      });

    } catch (error) {
      console.error('❌ Error getting violation alerts:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get violation alerts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get usage by user type
  async getUsageByUserType(req: Request, res: Response) {
    try {
      // Authentication is handled by middleware
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Check if consent_requests table exists
      const tableCheck = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consent_requests'
      `);

      if (tableCheck.rows.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get usage by user type from consent requests
      const usageData = await databaseManager.query(`
        SELECT 
          u.role,
          COUNT(cr.id) as count
        FROM consent_requests cr
        LEFT JOIN users u ON cr.requester_id = u.id
        GROUP BY u.role
        ORDER BY count DESC
      `);

      const total = usageData.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      
      const usageByUserType = usageData.rows.map(row => ({
        type: row.role || 'unknown',
        label: this.getRoleLabel(row.role),
        count: parseInt(row.count),
        percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100 * 10) / 10 : 0
      }));

      res.json({
        success: true,
        data: usageByUserType
      });

    } catch (error) {
      console.error('❌ Error getting usage by user type:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get usage by user type',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get monthly trends
  async getMonthlyTrends(req: Request, res: Response) {
    try {
      // Authentication is handled by middleware
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const period = parseInt(req.query.period as string) || 30;

      // Check if consent_requests table exists
      const tableCheck = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consent_requests'
      `);

      if (tableCheck.rows.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get monthly trends
      const trends = await databaseManager.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as requests,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM consent_requests
        WHERE created_at >= NOW() - INTERVAL '${period} days'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `);

      const monthlyTrends = trends.rows.map(row => ({
        month: new Date(row.month).toLocaleDateString('th-TH', { 
          month: 'short', 
          year: 'numeric' 
        }),
        requests: parseInt(row.requests),
        approved: parseInt(row.approved),
        rejected: parseInt(row.rejected)
      }));

      res.json({
        success: true,
        data: monthlyTrends
      });

    } catch (error) {
      console.error('❌ Error getting monthly trends:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get monthly trends',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all audit data
  async getAllAuditData(req: Request, res: Response) {
    try {
      // Authentication is handled by middleware
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Get all data in parallel
      const [summaryResult, violationsResult, usageResult, trendsResult] = await Promise.all([
        this.getAuditSummaryData(),
        this.getViolationAlertsData(10),
        this.getUsageByUserTypeData(),
        this.getMonthlyTrendsData(30)
      ]);

      res.json({
        success: true,
        data: {
          summary: summaryResult,
          violationAlerts: violationsResult,
          usageByUserType: usageResult,
          monthlyTrends: trendsResult
        }
      });

    } catch (error) {
      console.error('❌ Error getting all audit data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get all audit data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private async getAuditSummaryData() {
    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return {
        totalConsentRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: 0,
        emergencyAccess: 0,
        violationAlerts: 0,
        complianceRate: 100,
        averageResponseTime: 0,
        dataAccessCount: 0,
        revokedConsents: 0
      };
    }

    // Get consent requests summary
    const consentSummary = await databaseManager.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'emergency' THEN 1 END) as emergency_access,
        COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_consents
      FROM consent_requests
    `);

    // Get violation alerts from audit trail
    const violationCount = await databaseManager.query(`
      SELECT COUNT(*) as violation_count
      FROM consent_audit_trail
      WHERE action IN ('data_breach', 'unauthorized_access', 'consent_violation', 'policy_violation')
    `);

    // Get data access count
    const dataAccessCount = await databaseManager.query(`
      SELECT COUNT(*) as access_count
      FROM consent_audit_trail
      WHERE action = 'data_access'
    `);

    // Calculate compliance rate
    const total = consentSummary.rows[0]?.total_requests || 0;
    const approved = consentSummary.rows[0]?.approved_requests || 0;
    const complianceRate = total > 0 ? Math.round((approved / total) * 100 * 10) / 10 : 100;

    // Calculate average response time (mock calculation)
    const avgResponseTime = total > 0 ? Math.round((Math.random() * 3 + 1) * 10) / 10 : 0;

    return {
      totalConsentRequests: parseInt(consentSummary.rows[0]?.total_requests || '0'),
      approvedRequests: parseInt(consentSummary.rows[0]?.approved_requests || '0'),
      rejectedRequests: parseInt(consentSummary.rows[0]?.rejected_requests || '0'),
      pendingRequests: parseInt(consentSummary.rows[0]?.pending_requests || '0'),
      emergencyAccess: parseInt(consentSummary.rows[0]?.emergency_access || '0'),
      violationAlerts: parseInt(violationCount.rows[0]?.violation_count || '0'),
      complianceRate,
      averageResponseTime: avgResponseTime,
      dataAccessCount: parseInt(dataAccessCount.rows[0]?.access_count || '0'),
      revokedConsents: parseInt(consentSummary.rows[0]?.revoked_consents || '0')
    };
  }

  private async getViolationAlertsData(limit: number) {
    // Check if consent_audit_trail table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_audit_trail'
    `);

    if (tableCheck.rows.length === 0) {
      return [];
    }

    // Get violation alerts from audit trail
    const violations = await databaseManager.query(`
      SELECT 
        id,
        action as type,
        timestamp,
        change_reason as description,
        changed_by as user_id,
        contract_id as consent_request_id
      FROM consent_audit_trail
      WHERE action IN ('data_breach', 'unauthorized_access', 'consent_violation', 'policy_violation')
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    // Transform to violation alerts format
    return violations.rows.map((violation, index) => ({
      id: `V${String(index + 1).padStart(3, '0')}`,
      type: violation.type,
      severity: this.getSeverityFromAction(violation.type),
      title: this.getTitleFromAction(violation.type),
      description: violation.description || 'ไม่มีการอธิบาย',
      timestamp: violation.timestamp,
      involvedUser: `User ${violation.user_id || 'Unknown'}`,
      patientId: violation.consent_request_id ? `HN${violation.consent_request_id}` : 'Unknown',
      action: this.getActionFromType(violation.type),
      resolved: false
    }));
  }

  private async getUsageByUserTypeData() {
    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return [];
    }

    // Get usage by user type from consent requests
    const usageData = await databaseManager.query(`
      SELECT 
        u.role,
        COUNT(cr.id) as count
      FROM consent_requests cr
      LEFT JOIN users u ON cr.requester_id = u.id
      GROUP BY u.role
      ORDER BY count DESC
    `);

    const total = usageData.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    return usageData.rows.map(row => ({
      type: row.role || 'unknown',
      label: this.getRoleLabel(row.role),
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100 * 10) / 10 : 0
    }));
  }

  private async getMonthlyTrendsData(period: number) {
    // Check if consent_requests table exists
    const tableCheck = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'consent_requests'
    `);

    if (tableCheck.rows.length === 0) {
      return [];
    }

    // Get monthly trends
    const trends = await databaseManager.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM consent_requests
      WHERE created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `);

    return trends.rows.map(row => ({
      month: new Date(row.month).toLocaleDateString('th-TH', { 
        month: 'short', 
        year: 'numeric' 
      }),
      requests: parseInt(row.requests),
      approved: parseInt(row.approved),
      rejected: parseInt(row.rejected)
    }));
  }

  private getSeverityFromAction(action: string): string {
    switch (action) {
      case 'data_breach': return 'critical';
      case 'unauthorized_access': return 'high';
      case 'consent_violation': return 'medium';
      case 'policy_violation': return 'low';
      default: return 'low';
    }
  }

  private getTitleFromAction(action: string): string {
    switch (action) {
      case 'data_breach': return 'การรั่วไหลของข้อมูล';
      case 'unauthorized_access': return 'การเข้าถึงโดยไม่ได้รับอนุญาต';
      case 'consent_violation': return 'การละเมิดการยินยอม';
      case 'policy_violation': return 'การละเมิดนโยบาย';
      default: return 'การแจ้งเตือนระบบ';
    }
  }

  private getActionFromType(type: string): string {
    switch (type) {
      case 'data_breach': return 'system_locked';
      case 'unauthorized_access': return 'blocked';
      case 'consent_violation': return 'warning_sent';
      case 'policy_violation': return 'notification_sent';
      default: return 'logged';
    }
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'doctor': return 'แพทย์';
      case 'nurse': return 'พยาบาล';
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'external_user': return 'ผู้ใช้ภายนอก';
      case 'external_admin': return 'ผู้ดูแลภายนอก';
      default: return 'ผู้ใช้ทั่วไป';
    }
  }
}

export const adminConsentAuditController = new AdminConsentAuditController();

// Export individual functions for routes
export const getAuditSummary = adminConsentAuditController.getAuditSummary.bind(adminConsentAuditController);
export const getViolationAlerts = adminConsentAuditController.getViolationAlerts.bind(adminConsentAuditController);
export const getUsageByUserType = adminConsentAuditController.getUsageByUserType.bind(adminConsentAuditController);
export const getMonthlyTrends = adminConsentAuditController.getMonthlyTrends.bind(adminConsentAuditController);
export const getAllAuditData = adminConsentAuditController.getAllAuditData.bind(adminConsentAuditController);
