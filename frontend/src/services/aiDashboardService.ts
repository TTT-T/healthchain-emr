import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

/**
 * AI Dashboard Service
 * จัดการ API calls สำหรับ AI Dashboard
 */

export interface DiabetesRiskResult {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  riskPercentage: number;
  contributingFactors: string[];
  recommendations: string[];
  nextScreeningDate?: string;
  urgencyLevel: 'routine' | 'urgent' | 'immediate';
}

export interface PatientWithRisk {
  id: string;
  first_name: string;
  last_name: string;
  thai_name?: string;
  hospital_number: string;
  age: number;
  gender: string;
  visit_count: number;
  last_visit_date?: string;
  diabetesRisk: DiabetesRiskResult | null;
}

export interface AIDashboardOverview {
  overview: {
    totalPatients: number;
    riskStats: {
      low: number;
      moderate: number;
      high: number;
      very_high: number;
      no_data: number;
    };
    highRiskCount: number;
    lastUpdated: string;
  };
  patients: PatientWithRisk[];
  highRiskPatients: PatientWithRisk[];
  summary: {
    averageRiskScore: number;
    urgentCases: number;
    needsFollowUp: number;
  };
}

export interface PatientDiabetesRiskDetail {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    thai_name?: string;
    age: number;
    gender: string;
  };
  diabetesRisk: DiabetesRiskResult;
  additionalData: {
    latestVitalSigns: any;
    recentLabResults: any[];
    recentVisits: any[];
  };
  riskHistory: any[];
}

export interface AIAnalytics {
  period: string;
  riskTrends: any[];
  ageStatistics: any[];
  genderStatistics: any[];
  summary: {
    totalAssessments: number;
    averageRiskScore: number;
    highRiskPercentage: number;
  };
}

export class AIDashboardService {
  /**
   * Get AI Dashboard Overview
   */
  static async getDashboardOverview(params: {
    riskLevel?: string;
    limit?: number;
  } = {}): Promise<AIDashboardOverview> {
    try {
      logger.info('Getting AI Dashboard Overview:', params);
      
      const queryParams = new URLSearchParams();
      if (params.riskLevel) queryParams.append('riskLevel', params.riskLevel);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/medical/ai/dashboard/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      logger.info('AI Dashboard Overview retrieved successfully');
      return response.data as AIDashboardOverview;
    } catch (error) {
      logger.error('Error getting AI Dashboard Overview:', error);
      throw error;
    }
  }

  /**
   * Get detailed diabetes risk for a patient
   */
  static async getPatientDiabetesRisk(patientId: string): Promise<PatientDiabetesRiskDetail> {
    try {
      logger.info('Getting diabetes risk for patient:', patientId);
      
      const response = await apiClient.get(`/medical/ai/dashboard/patients/${patientId}/diabetes-risk`);
      
      logger.info('Patient diabetes risk retrieved successfully');
      return response.data as PatientDiabetesRiskDetail;
    } catch (error) {
      logger.error('Error getting patient diabetes risk:', error);
      throw error;
    }
  }

  /**
   * Get AI Analytics
   */
  static async getAIAnalytics(period: string = '30d'): Promise<AIAnalytics> {
    try {
      logger.info('Getting AI Analytics:', period);
      
      const response = await apiClient.get(`/medical/ai/dashboard/analytics?period=${period}`);
      
      logger.info('AI Analytics retrieved successfully');
      return response.data as AIAnalytics;
    } catch (error) {
      logger.error('Error getting AI Analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk assess diabetes risk for multiple patients
   */
  static async bulkAssessDiabetesRisk(patientIds: string[], forceRecalculate: boolean = false): Promise<any> {
    try {
      logger.info('Bulk assessing diabetes risk:', { patientCount: patientIds.length, forceRecalculate });
      
      const response = await apiClient.post('/medical/ai/dashboard/bulk-assess', {
        patientIds,
        forceRecalculate
      });
      
      logger.info('Bulk diabetes risk assessment completed');
      return response.data;
    } catch (error) {
      logger.error('Error in bulk diabetes risk assessment:', error);
      throw error;
    }
  }

  /**
   * Get risk level color for UI
   */
  static getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'very_high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Get risk level icon for UI
   */
  static getRiskLevelIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'very_high':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'moderate':
        return '⚡';
      case 'low':
        return '✅';
      default:
        return '❓';
    }
  }

  /**
   * Get urgency level color for UI
   */
  static getUrgencyLevelColor(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'immediate':
        return 'text-red-600 bg-red-100';
      case 'urgent':
        return 'text-orange-600 bg-orange-100';
      case 'routine':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Format risk percentage for display
   */
  static formatRiskPercentage(percentage: number): string {
    if (percentage >= 50) {
      return `${percentage}% (สูงมาก)`;
    } else if (percentage >= 25) {
      return `${percentage}% (สูง)`;
    } else if (percentage >= 10) {
      return `${percentage}% (ปานกลาง)`;
    } else {
      return `${percentage}% (ต่ำ)`;
    }
  }

  /**
   * Get risk level description in Thai
   */
  static getRiskLevelDescription(riskLevel: string): string {
    switch (riskLevel) {
      case 'very_high':
        return 'ความเสี่ยงสูงมาก';
      case 'high':
        return 'ความเสี่ยงสูง';
      case 'moderate':
        return 'ความเสี่ยงปานกลาง';
      case 'low':
        return 'ความเสี่ยงต่ำ';
      default:
        return 'ไม่ทราบความเสี่ยง';
    }
  }

  /**
   * Get urgency level description in Thai
   */
  static getUrgencyLevelDescription(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'immediate':
        return 'ต้องดำเนินการทันที';
      case 'urgent':
        return 'เร่งด่วน';
      case 'routine':
        return 'ตามปกติ';
      default:
        return 'ไม่ระบุ';
    }
  }
}
