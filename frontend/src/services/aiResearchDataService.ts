import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

/**
 * AI Research Data Service
 * จัดการ API calls สำหรับ AI Research Data
 */

export interface AIResearchData {
  id?: string;
  recordType: 'doctor_visit' | 'pharmacy' | 'lab_result' | 'appointment';
  recordId?: string;
  researchData: any;
  dataVersion?: string;
  isActive?: boolean;
  recordedTime?: string;
  recordedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAIResearchDataRequest {
  recordType: 'doctor_visit' | 'pharmacy' | 'lab_result' | 'appointment';
  recordId?: string;
  researchData: any;
  dataVersion?: string;
}

export interface UpdateAIResearchDataRequest {
  researchData?: any;
  isActive?: boolean;
}

export interface GetAIResearchDataParams {
  page?: number;
  limit?: number;
  recordType?: string;
  isActive?: boolean;
}

export class AIResearchDataService {
  /**
   * Create AI research data
   */
  static async createAIResearchData(
    patientId: string, 
    data: CreateAIResearchDataRequest
  ): Promise<any> {
    try {
      logger.info('Creating AI research data:', { patientId, recordType: data.recordType });
      
      const response = await apiClient.post(`/medical/patients/${patientId}/ai-research-data`, data);
      
      logger.info('AI research data created successfully:', response.data);
      return response;
    } catch (error) {
      logger.error('Error creating AI research data:', error);
      throw error;
    }
  }

  /**
   * Get AI research data for a patient
   */
  static async getPatientAIResearchData(
    patientId: string, 
    params: GetAIResearchDataParams = {}
  ): Promise<any> {
    try {
      logger.info('Getting AI research data for patient:', { patientId, params });
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.recordType) queryParams.append('recordType', params.recordType);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      
      const url = `/medical/patients/${patientId}/ai-research-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      logger.info('AI research data retrieved successfully:', response.data);
      return response;
    } catch (error) {
      logger.error('Error getting AI research data:', error);
      throw error;
    }
  }

  /**
   * Update AI research data
   */
  static async updateAIResearchData(
    patientId: string,
    researchId: string,
    data: UpdateAIResearchDataRequest
  ): Promise<any> {
    try {
      logger.info('Updating AI research data:', { patientId, researchId, data });
      
      const response = await apiClient.put(`/medical/patients/${patientId}/ai-research-data/${researchId}`, data);
      
      logger.info('AI research data updated successfully:', response.data);
      return response;
    } catch (error) {
      logger.error('Error updating AI research data:', error);
      throw error;
    }
  }

  /**
   * Delete AI research data
   */
  static async deleteAIResearchData(
    patientId: string,
    researchId: string
  ): Promise<any> {
    try {
      logger.info('Deleting AI research data:', { patientId, researchId });
      
      const response = await apiClient.delete(`/medical/patients/${patientId}/ai-research-data/${researchId}`);
      
      logger.info('AI research data deleted successfully:', response.data);
      return response;
    } catch (error) {
      logger.error('Error deleting AI research data:', error);
      throw error;
    }
  }

  /**
   * Save AI research data from EMR form
   */
  static async saveEMRFormData(
    patientId: string,
    recordType: 'doctor_visit' | 'pharmacy' | 'lab_result' | 'appointment',
    recordId: string | undefined,
    aiResearchData: any
  ): Promise<any> {
    try {
      logger.info('Saving EMR form AI research data:', { 
        patientId, 
        recordType, 
        recordId,
        hasData: !!aiResearchData 
      });

      // Check if there's any meaningful data to save
      const hasData = Object.values(aiResearchData).some(value => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value && value.toString().trim() !== '';
      });

      if (!hasData) {
        logger.info('No AI research data to save, skipping');
        return { data: null, message: 'No data to save' };
      }

      const createData: CreateAIResearchDataRequest = {
        recordType,
        recordId,
        researchData: aiResearchData,
        dataVersion: '1.0'
      };

      const response = await this.createAIResearchData(patientId, createData);
      
      logger.info('EMR form AI research data saved successfully');
      return response;
    } catch (error) {
      logger.error('Error saving EMR form AI research data:', error);
      throw error;
    }
  }
}
