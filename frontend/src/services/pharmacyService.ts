import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreatePharmacyRequest {
  patientId: string;
  visitId?: string;
  prescriptionId?: string;
  medications: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    unit: string;
    instructions?: string;
    dispensedQuantity?: number;
    dispensedBy?: string;
    dispensedTime?: string;
  }>;
  totalAmount?: number;
  paymentMethod?: string;
  dispensedBy: string;
  dispensedTime?: string;
  notes?: string;
}

export interface UpdatePharmacyRequest {
  medications?: any[];
  totalAmount?: number;
  paymentMethod?: string;
  dispensedBy?: string;
  dispensedTime?: string;
  notes?: string;
  status?: string;
}

export interface PharmacyRecord {
  id: string;
  patientId: string;
  visitId?: string;
  prescriptionId?: string;
  recordType: string;
  medications: any[];
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  dispensedBy: string;
  dispensedTime: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
}

/**
 * Pharmacy Service
 * จัดการข้อมูลการจ่ายยา
 */
export class PharmacyService {
  /**
   * สร้างบันทึกการจ่ายยา
   */
  static async createPharmacyDispensing(data: CreatePharmacyRequest): Promise<APIResponse<PharmacyRecord>> {
    try {
      const response = await apiClient.post('/medical/pharmacy', data);
      return response as APIResponse<PharmacyRecord>;
    } catch (error) {
      logger.error('Error creating pharmacy dispensing record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการจ่ายยาโดย ID
   */
  static async getPharmacyDispensingById(id: string): Promise<APIResponse<PharmacyRecord>> {
    try {
      const response = await apiClient.get(`/medical/pharmacy/${id}`);
      return response as APIResponse<PharmacyRecord>;
    } catch (error) {
      logger.error('Error retrieving pharmacy dispensing record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการจ่ายยาของผู้ป่วย
   */
  static async getPharmacyDispensingsByPatient(patientId: string): Promise<APIResponse<PharmacyRecord[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/pharmacy`);
      return response as APIResponse<PharmacyRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient pharmacy dispensings:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลการจ่ายยา
   */
  static async updatePharmacyDispensing(id: string, data: UpdatePharmacyRequest): Promise<APIResponse<PharmacyRecord>> {
    try {
      const response = await apiClient.post(`/medical/pharmacy/${id}/update`, data);
      return response as APIResponse<PharmacyRecord>;
    } catch (error) {
      logger.error('Error updating pharmacy dispensing record:', error);
      throw error;
    }
  }

  /**
   * ลบบันทึกการจ่ายยา
   */
  static async deletePharmacyDispensing(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.post(`/medical/pharmacy/${id}/delete`, {});
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting pharmacy dispensing record:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatPharmacyDataForAPI(pharmacyData: any, patientId: string, dispensedBy: string): CreatePharmacyRequest {
    return {
      patientId,
      visitId: pharmacyData.visitId,
      prescriptionId: pharmacyData.prescriptionId,
      medications: pharmacyData.medications || [],
      totalAmount: pharmacyData.totalAmount || 0,
      paymentMethod: pharmacyData.paymentMethod || 'cash',
      dispensedBy,
      dispensedTime: pharmacyData.dispensedTime || new Date().toISOString(),
      notes: pharmacyData.notes
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatPharmacyDataFromAPI(record: PharmacyRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      visitId: record.visitId,
      prescriptionId: record.prescriptionId,
      medications: record.medications || [],
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      notes: record.notes,
      dispensedBy: record.dispensedBy,
      dispensedTime: record.dispensedTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      patient: record.patient
    };
  }

  /**
   * สร้างข้อมูลเริ่มต้นสำหรับฟอร์ม
   */
  static createEmptyPharmacyData(): any {
    return {
      medications: [],
      totalAmount: 0,
      paymentMethod: 'cash',
      notes: '',
      dispensedTime: new Date().toISOString().slice(0, 16)
    };
  }

  /**
   * เพิ่มยาลงในรายการ
   */
  static addMedication(medications: any[]): any[] {
    return [
      ...medications,
      {
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
        unit: 'tablet',
        instructions: '',
        dispensedQuantity: 1
      }
    ];
  }

  /**
   * ลบยาออกจากรายการ
   */
  static removeMedication(medications: any[], index: number): any[] {
    return medications.filter((_, i) => i !== index);
  }

  /**
   * คำนวณยอดรวม
   */
  static calculateTotalAmount(medications: any[]): number {
    return medications.reduce((total, med) => {
      const price = med.price || 0;
      const quantity = med.dispensedQuantity || med.quantity || 1;
      return total + (price * quantity);
    }, 0);
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลยา
   */
  static validateMedication(medication: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!medication.medicationName?.trim()) {
      errors.push('กรุณากรอกชื่อยา');
    }
    if (!medication.dosage?.trim()) {
      errors.push('กรุณากรอกขนาดยา');
    }
    if (!medication.frequency?.trim()) {
      errors.push('กรุณากรอกความถี่ในการใช้ยา');
    }
    if (!medication.duration?.trim()) {
      errors.push('กรุณากรอกระยะเวลาในการใช้ยา');
    }
    if (!medication.quantity || medication.quantity <= 0) {
      errors.push('กรุณากรอกจำนวนยาที่ถูกต้อง');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลทั้งหมด
   */
  static validatePharmacyData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.medications || data.medications.length === 0) {
      errors.push('กรุณาเพิ่มยาอย่างน้อย 1 รายการ');
    } else {
      data.medications.forEach((med: any, index: number) => {
        const validation = this.validateMedication(med);
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push(`ยา ${index + 1}: ${error}`);
          });
        }
      });
    }

    if (!data.dispensedBy?.trim()) {
      errors.push('กรุณากรอกชื่อผู้จ่ายยา');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}