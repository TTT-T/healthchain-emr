import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreateLabResultRequest {
  patientId: string;
  visitId?: string;
  labOrderId?: string;
  Type: string;
  Name: string;
  Results: Array<{
    parameter: string;
    value: string;
    unit?: string;
    normalRange?: string;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
  }>;
  overallResult: 'normal' | 'abnormal' | 'critical';
  interpretation?: string;
  recommendations?: string;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }>;
  edBy: string;
  edTime?: string;
  reviewedBy?: string;
  reviewedTime?: string;
  notes?: string;
}

export interface UpdateLabResultRequest {
  Results?: any[];
  overallResult?: string;
  interpretation?: string;
  recommendations?: string;
  attachments?: any[];
  edBy?: string;
  edTime?: string;
  reviewedBy?: string;
  reviewedTime?: string;
  notes?: string;
  status?: string;
}

export interface LabResultRecord {
  id: string;
  patientId: string;
  visitId?: string;
  labOrderId?: string;
  recordType: string;
  Type: string;
  Name: string;
  Results: any[];
  overallResult: string;
  interpretation?: string;
  recommendations?: string;
  attachments: any[];
  notes?: string;
  edBy: string;
  edTime: string;
  reviewedBy?: string;
  reviewedTime?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
}

/**
 * Lab Result Service
 * จัดการข้อมูลผลแลบ
 */
export class LabResultService {
  /**
   * สร้างบันทึกผลแลบ
   */
  static async createLabResult(data: CreateLabResultRequest): Promise<APIResponse<LabResultRecord>> {
    try {
      const response = await apiClient.post(`/medical/patients/${data.patientId}/lab-results`, data);
      return response as APIResponse<LabResultRecord>;
    } catch (error) {
      logger.error('Error creating lab result record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผลแลบโดย ID
   */
  static async getLabResultById(id: string): Promise<APIResponse<LabResultRecord>> {
    try {
      const response = await apiClient.get(`/medical/lab-results/${id}`);
      return response as APIResponse<LabResultRecord>;
    } catch (error) {
      logger.error('Error retrieving lab result record:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผลแลบของผู้ป่วย
   */
  static async getLabResultsByPatient(patientId: string): Promise<APIResponse<LabResultRecord[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/lab-results`);
      return response as APIResponse<LabResultRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient lab results:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลผลแลบ
   */
  static async updateLabResult(id: string, data: UpdateLabResultRequest): Promise<APIResponse<LabResultRecord>> {
    try {
      const response = await apiClient.post(`/medical/lab-results/${id}/update`, data);
      return response as APIResponse<LabResultRecord>;
    } catch (error) {
      logger.error('Error updating lab result record:', error);
      throw error;
    }
  }

  /**
   * ลบบันทึกผลแลบ
   */
  static async deleteLabResult(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.post(`/medical/lab-results/${id}/delete`, {});
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting lab result record:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatLabResultDataForAPI(labResultData: any, patientId: string, edBy: string): CreateLabResultRequest {
    return {
      patientId,
      visitId: labResultData.visitId,
      labOrderId: labResultData.labOrderId,
      Type: labResultData.Type,
      Name: labResultData.Name,
      Results: labResultData.Results || [],
      overallResult: labResultData.overallResult,
      interpretation: labResultData.interpretation,
      recommendations: labResultData.recommendations,
      attachments: labResultData.attachments || [],
      edBy,
      edTime: labResultData.edTime || new Date().toISOString(),
      reviewedBy: labResultData.reviewedBy,
      reviewedTime: labResultData.reviewedTime,
      notes: labResultData.notes
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatLabResultDataFromAPI(record: LabResultRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      visitId: record.visitId,
      labOrderId: record.labOrderId,
      Type: record.Type,
      Name: record.Name,
      Results: record.Results || [],
      overallResult: record.overallResult,
      interpretation: record.interpretation,
      recommendations: record.recommendations,
      attachments: record.attachments || [],
      notes: record.notes,
      edBy: record.edBy,
      edTime: record.edTime,
      reviewedBy: record.reviewedBy,
      reviewedTime: record.reviewedTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      patient: record.patient
    };
  }

  /**
   * สร้างข้อมูลเริ่มต้นสำหรับฟอร์ม
   */
  static createEmptyLabResultData(): any {
    return {
      Type: '',
      Name: '',
      Results: [],
      overallResult: 'normal',
      interpretation: '',
      recommendations: '',
      attachments: [],
      notes: '',
      edTime: new Date().toISOString().slice(0, 16)
    };
  }

  /**
   * เพิ่มผลการตรวจลงในรายการ
   */
  static addResult(Results: any[]): any[] {
    return [
      ...Results,
      {
        parameter: '',
        value: '',
        unit: '',
        normalRange: '',
        status: 'normal',
        notes: ''
      }
    ];
  }

  /**
   * ลบผลการตรวจออกจากรายการ
   */
  static removeResult(Results: any[], index: number): any[] {
    return Results.filter((_, i) => i !== index);
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลผลการตรวจ
   */
  static validateResult(Result: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Result.parameter?.trim()) {
      errors.push('กรุณากรอกชื่อพารามิเตอร์');
    }
    if (!Result.value?.trim()) {
      errors.push('กรุณากรอกค่าผลการตรวจ');
    }
    if (!Result.status) {
      errors.push('กรุณาเลือกสถานะผลการตรวจ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลทั้งหมด
   */
  static validateLabResultData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.Type?.trim()) {
      errors.push('กรุณากรอกประเภทการตรวจ');
    }
    if (!data.Name?.trim()) {
      errors.push('กรุณากรอกชื่อการตรวจ');
    }
    if (!data.Results || data.Results.length === 0) {
      errors.push('กรุณาเพิ่มผลการตรวจอย่างน้อย 1 รายการ');
    } else {
      data.Results.forEach((result: any, index: number) => {
        const validation = this.validateResult(result);
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push(`ผลการตรวจ ${index + 1}: ${error}`);
          });
        }
      });
    }
    if (!data.overallResult) {
      errors.push('กรุณาเลือกผลการตรวจโดยรวม');
    }
    if (!data.edBy?.trim()) {
      errors.push('กรุณากรอกชื่อผู้ตรวจ');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * กำหนดสีตามสถานะผลการตรวจ
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'abnormal':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * กำหนดข้อความสถานะเป็นภาษาไทย
   */
  static getStatusLabel(status: string): string {
    switch (status) {
      case 'normal':
        return 'ปกติ';
      case 'abnormal':
        return 'ผิดปกติ';
      case 'critical':
        return 'วิกฤต';
      default:
        return 'ไม่ระบุ';
    }
  }

  /**
   * ประมวลผลไฟล์ที่อัปโหลด
   */
  static processUploadedFile(file: File): Promise<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          fileName: file.name,
          filePath: result, // ในระบบจริงจะต้องอัปโหลดไปยัง server
          fileType: file.type,
          fileSize: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
