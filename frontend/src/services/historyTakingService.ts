import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreateHistoryTakingRequest {
  patientId: string;
  visitId?: string;
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  drugAllergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  socialHistory?: string;
  pregnancyHistory?: string;
  dietaryHistory?: string;
  lifestyleFactors?: string;
  reviewOfSystems?: string;
  notes?: string;
  recordedBy: string;
  recordedTime?: string;
}

export interface UpdateHistoryTakingRequest {
  chiefComplaint?: string;
  presentIllness?: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  drugAllergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  socialHistory?: string;
  pregnancyHistory?: string;
  dietaryHistory?: string;
  lifestyleFactors?: string;
  reviewOfSystems?: string;
  notes?: string;
  recordedBy?: string;
}

export interface HistoryTakingRecord {
  id: string;
  patientId: string;
  visitId?: string;
  recordType: string;
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  surgicalHistory?: string;
  drugAllergies?: string;
  currentMedications?: string;
  familyHistory?: string;
  socialHistory?: string;
  pregnancyHistory?: string;
  dietaryHistory?: string;
  lifestyleFactors?: string;
  reviewOfSystems?: string;
  notes?: string;
  recordedBy: string;
  recordedTime: string;
  created_at: string;
  updated_at: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
}

/**
 * History Taking Service
 * จัดการข้อมูลการซักประวัติผู้ป่วย
 */
export class HistoryTakingService {
  /**
   * สร้างบันทึกการซักประวัติ
   */
  static async createHistoryTaking(data: CreateHistoryTakingRequest): Promise<APIResponse<HistoryTakingRecord>> {
    try {
      const response = await apiClient.post('/medical/history-taking', data);
      return response as APIResponse<HistoryTakingRecord>;
    } catch (error) {
      logger.error('Error creating history taking record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการซักประวัติโดย ID
   */
  static async getHistoryTakingById(id: string): Promise<APIResponse<HistoryTakingRecord>> {
    try {
      const response = await apiClient.get(`/medical/history-taking/${id}`);
      return response as APIResponse<HistoryTakingRecord>;
    } catch (error) {
      logger.error('Error retrieving history taking record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการซักประวัติของผู้ป่วย
   */
  static async getHistoryTakingByPatient(patientId: string): Promise<APIResponse<HistoryTakingRecord[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/history-taking`);
      return response as APIResponse<HistoryTakingRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient history taking records:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลการซักประวัติ
   */
  static async updateHistoryTaking(id: string, data: UpdateHistoryTakingRequest): Promise<APIResponse<HistoryTakingRecord>> {
    try {
      const response = await apiClient.post(`/medical/history-taking/${id}/update`, data);
      return response as APIResponse<HistoryTakingRecord>;
    } catch (error) {
      logger.error('Error updating history taking record:', error);
      throw error;
    }
  }

  /**
   * ลบบันทึกการซักประวัติ
   */
  static async deleteHistoryTaking(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.post(`/medical/history-taking/${id}/delete`, {});
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting history taking record:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatHistoryDataForAPI(medicalHistory: any, patientId: string, recordedBy: string): CreateHistoryTakingRequest {
    return {
      patientId,
      chiefComplaint: medicalHistory.chiefComplaint,
      presentIllness: medicalHistory.hpi,
      pastMedicalHistory: medicalHistory.pmh?.previousIllness || null,
      surgicalHistory: medicalHistory.pmh?.surgicalHistory || null,
      drugAllergies: medicalHistory.drugAllergy?.hasAllergy === 'yes' ? medicalHistory.drugAllergy.allergyDetails : 'ไม่แพ้ยา',
      currentMedications: medicalHistory.currentMedications,
      familyHistory: JSON.stringify(medicalHistory.familyHistory),
      socialHistory: JSON.stringify(medicalHistory.socialHistory),
      pregnancyHistory: medicalHistory.pregnancyHistory ? JSON.stringify(medicalHistory.pregnancyHistory) : undefined,
      dietaryHistory: JSON.stringify(medicalHistory.dietaryHistory),
      lifestyleFactors: JSON.stringify(medicalHistory.lifestyleFactors),
      reviewOfSystems: JSON.stringify(medicalHistory.reviewOfSystems),
      notes: medicalHistory.notes || null,
      recordedBy,
      recordedTime: medicalHistory.recordedTime || new Date().toISOString()
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatHistoryDataFromAPI(record: HistoryTakingRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      visitId: record.visitId,
      chiefComplaint: record.chiefComplaint,
      hpi: record.presentIllness,
      pmh: {
        previousIllness: record.pastMedicalHistory || '',
        surgicalHistory: record.surgicalHistory || '',
        hospitalization: ''
      },
      drugAllergy: {
        hasAllergy: record.drugAllergies && record.drugAllergies !== 'ไม่แพ้ยา' ? 'yes' : 'no',
        allergyDetails: record.drugAllergies || ''
      },
      currentMedications: record.currentMedications || '',
      familyHistory: record.familyHistory ? JSON.parse(record.familyHistory) : {
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        cancer: false,
        other: ''
      },
      socialHistory: record.socialHistory ? JSON.parse(record.socialHistory) : {
        smoking: 'never',
        alcohol: 'never',
        occupation: '',
        exercise: 'none',
        other: ''
      },
      pregnancyHistory: record.pregnancyHistory ? JSON.parse(record.pregnancyHistory) : undefined,
      dietaryHistory: record.dietaryHistory ? JSON.parse(record.dietaryHistory) : {
        dailySugarIntake: 'moderate',
        processedFoodFrequency: 'sometimes',
        fruitVegetableServings: '',
        fastFoodFrequency: 'monthly',
        mealFrequency: '3'
      },
      lifestyleFactors: record.lifestyleFactors ? JSON.parse(record.lifestyleFactors) : {
        sleepDuration: '',
        sleepQuality: 'good',
        stressLevel: 'moderate',
        physicalActivityDetails: '',
        sedentaryHours: ''
      },
      reviewOfSystems: record.reviewOfSystems ? JSON.parse(record.reviewOfSystems) : {
        general: '',
        cardiovascular: '',
        respiratory: '',
        gastroininal: '',
        genitourinary: '',
        neurological: '',
        musculoskeletal: '',
        dermatological: ''
      },
      notes: record.notes || '',
      recordedBy: record.recordedBy,
      recordedTime: record.recordedTime,
      created_at: record.created_at,
      updated_at: record.updated_at,
      patient: record.patient
    };
  }
}
