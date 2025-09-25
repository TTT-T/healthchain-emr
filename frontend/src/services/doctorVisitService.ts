import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreateDoctorVisitRequest {
  patientId: string;
  visitId?: string;
  chiefComplaint: string;
  presentIllness: string;
  physicalExamination: {
    generalAppearance?: string;
    vitalSigns?: string;
    headNeck?: string;
    chest?: string;
    cardiovascular?: string;
    abdomen?: string;
    extremities?: string;
    neurological?: string;
    other?: string;
  };
  diagnosis: {
    primaryDiagnosis: string;
    secondaryDiagnosis?: string[];
    differentialDiagnosis?: string[];
    icd10Code?: string;
  };
  treatmentPlan: {
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    procedures?: Array<{
      name: string;
      description: string;
      scheduledDate?: string;
    }>;
    lifestyleModifications?: string[];
    followUpInstructions?: string;
  };
  advice: string;
  followUp?: {
    scheduledDate?: string;
    interval?: string;
    purpose?: string;
    notes?: string;
  };
  notes?: string;
  examinedBy: string;
  examinedTime?: string;
}

export interface UpdateDoctorVisitRequest {
  chiefComplaint?: string;
  presentIllness?: string;
  physicalExamination?: any;
  diagnosis?: any;
  treatmentPlan?: any;
  advice?: string;
  followUp?: any;
  notes?: string;
  examinedBy?: string;
}

export interface DoctorVisitRecord {
  id: string;
  patientId: string;
  visitId?: string;
  recordType: string;
  chiefComplaint: string;
  presentIllness: string;
  physicalExamination: any;
  diagnosis: any;
  treatmentPlan: any;
  advice: string;
  followUp?: any;
  notes?: string;
  examinedBy: string;
  examinedTime: string;
  created_at: string;
  updated_at: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
}

/**
 * Doctor Visit Service
 * จัดการข้อมูลการตรวจโดยแพทย์
 */
export class DoctorVisitService {
  /**
   * สร้างบันทึกการตรวจโดยแพทย์
   */
  static async createDoctorVisit(data: CreateDoctorVisitRequest): Promise<APIResponse<DoctorVisitRecord>> {
    try {
      const response = await apiClient.post('/medical/doctor-visit', data);
      return response as APIResponse<DoctorVisitRecord>;
    } catch (error) {
      logger.error('Error creating doctor visit record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการตรวจโดยแพทย์โดย ID
   */
  static async getDoctorVisitById(id: string): Promise<APIResponse<DoctorVisitRecord>> {
    try {
      const response = await apiClient.get(`/medical/doctor-visit/${id}`);
      return response as APIResponse<DoctorVisitRecord>;
    } catch (error) {
      logger.error('Error retrieving doctor visit record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการตรวจโดยแพทย์ของผู้ป่วย
   */
  static async getDoctorVisitsByPatient(patientId: string): Promise<APIResponse<DoctorVisitRecord[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/doctor-visits`);
      return response as APIResponse<DoctorVisitRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient doctor visits:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลการตรวจโดยแพทย์
   */
  static async updateDoctorVisit(id: string, data: UpdateDoctorVisitRequest): Promise<APIResponse<DoctorVisitRecord>> {
    try {
      const response = await apiClient.post(`/medical/doctor-visit/${id}/update`, data);
      return response as APIResponse<DoctorVisitRecord>;
    } catch (error) {
      logger.error('Error updating doctor visit record:', error);
      throw error;
    }
  }

  /**
   * ลบบันทึกการตรวจโดยแพทย์
   */
  static async deleteDoctorVisit(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.post(`/medical/doctor-visit/${id}/delete`, {});
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting doctor visit record:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatDoctorVisitDataForAPI(doctorVisitData: any, patientId: string, examinedBy: string): CreateDoctorVisitRequest {
    return {
      patientId,
      chiefComplaint: doctorVisitData.chiefComplaint,
      presentIllness: doctorVisitData.presentIllness,
      physicalExamination: {
        generalAppearance: doctorVisitData.physicalExamination?.generalAppearance,
        vitalSigns: doctorVisitData.physicalExamination?.vitalSigns,
        headNeck: doctorVisitData.physicalExamination?.headNeck,
        chest: doctorVisitData.physicalExamination?.chest,
        cardiovascular: doctorVisitData.physicalExamination?.cardiovascular,
        abdomen: doctorVisitData.physicalExamination?.abdomen,
        extremities: doctorVisitData.physicalExamination?.extremities,
        neurological: doctorVisitData.physicalExamination?.neurological,
        other: doctorVisitData.physicalExamination?.other
      },
      diagnosis: {
        primaryDiagnosis: doctorVisitData.diagnosis?.primaryDiagnosis,
        secondaryDiagnosis: doctorVisitData.diagnosis?.secondaryDiagnosis,
        differentialDiagnosis: doctorVisitData.diagnosis?.differentialDiagnosis,
        icd10Code: doctorVisitData.diagnosis?.icd10Code
      },
      treatmentPlan: {
        medications: doctorVisitData.treatmentPlan?.medications,
        procedures: doctorVisitData.treatmentPlan?.procedures,
        lifestyleModifications: doctorVisitData.treatmentPlan?.lifestyleModifications,
        followUpInstructions: doctorVisitData.treatmentPlan?.followUpInstructions
      },
      advice: doctorVisitData.advice,
      followUp: doctorVisitData.followUp,
      notes: doctorVisitData.notes,
      examinedBy,
      examinedTime: doctorVisitData.examinedTime || new Date().toISOString()
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatDoctorVisitDataFromAPI(record: DoctorVisitRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      visitId: record.visitId,
      chiefComplaint: record.chiefComplaint,
      presentIllness: record.presentIllness,
      physicalExamination: record.physicalExamination || {
        generalAppearance: '',
        vitalSigns: '',
        headNeck: '',
        chest: '',
        cardiovascular: '',
        abdomen: '',
        extremities: '',
        neurological: '',
        other: ''
      },
      diagnosis: record.diagnosis || {
        primaryDiagnosis: '',
        secondaryDiagnosis: [],
        differentialDiagnosis: [],
        icd10Code: ''
      },
      treatmentPlan: record.treatmentPlan || {
        medications: [],
        procedures: [],
        lifestyleModifications: [],
        followUpInstructions: ''
      },
      advice: record.advice,
      followUp: record.followUp,
      notes: record.notes,
      examinedBy: record.examinedBy,
      examinedTime: record.examinedTime,
      created_at: record.created_at,
      updated_at: record.updated_at,
      patient: record.patient
    };
  }

  /**
   * สร้างข้อมูลเริ่มต้นสำหรับฟอร์ม
   */
  static createEmptyDoctorVisitData(): any {
    return {
      chiefComplaint: '',
      presentIllness: '',
      physicalExamination: {
        generalAppearance: '',
        vitalSigns: '',
        headNeck: '',
        chest: '',
        cardiovascular: '',
        abdomen: '',
        extremities: '',
        neurological: '',
        other: ''
      },
      diagnosis: {
        primaryDiagnosis: '',
        secondaryDiagnosis: [],
        differentialDiagnosis: [],
        icd10Code: ''
      },
      treatmentPlan: {
        medications: [],
        procedures: [],
        lifestyleModifications: [],
        followUpInstructions: ''
      },
      advice: '',
      followUp: {
        scheduledDate: '',
        interval: '',
        purpose: '',
        notes: ''
      },
      notes: '',
      examinedTime: new Date().toISOString().slice(0, 16)
    };
  }
}
