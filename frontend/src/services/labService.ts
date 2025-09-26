import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { 
  MedicalLabOrder, 
  CreateLabOrderRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Lab Service
 * จัดการข้อมูลห้องปฏิบัติการ
 */
export class LabService {
  /**
   * สร้างใบสั่งตรวจ
   */
  static async createLabOrder(data: CreateLabOrderRequest): Promise<APIResponse<MedicalLabOrder>> {
    try {
      const response = await apiClient.createLabOrder(data);
      return response;
    } catch (error) {
      logger.error('Error creating lab order:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลใบสั่งตรวจโดย ID
   */
  static async getLabOrder(id: string): Promise<APIResponse<MedicalLabOrder>> {
    try {
      const response = await apiClient.getLabOrder(id);
      return response;
    } catch (error) {
      logger.error('Error getting lab order:', error);
      throw error;
    }
  }

  /**
   * อัปเดตใบสั่งตรวจ
   */
  static async updateLabOrder(id: string, data: Partial<MedicalLabOrder>): Promise<APIResponse<MedicalLabOrder>> {
    try {
      const response = await apiClient.updateLabOrder(id, data);
      return response;
    } catch (error) {
      logger.error('Error updating lab order:', error);
      throw error;
    }
  }

  /**
   * ดึงใบสั่งตรวจของการมาพบแพทย์
   */
  static async getLabOrdersByVisit(visitId: string): Promise<APIResponse<MedicalLabOrder[]>> {
    try {
      const response = await apiClient.getLabOrdersByVisit(visitId);
      return response;
    } catch (error) {
      logger.error('Error getting lab orders by visit:', error);
      throw error;
    }
  }

  /**
   * บันทึกผลตรวจ
   */
  static async createLabResult(labOrderId: string, data: Record<string, unknown>): Promise<APIResponse<any>> {
    try {
      const response = await apiClient.createLabResult(labOrderId, data);
      return response;
    } catch (error) {
      logger.error('Error creating lab result:', error);
      throw error;
    }
  }

  /**
   * ดึงผลตรวจ
   */
  static async getLabResults(labOrderId: string): Promise<APIResponse<any[]>> {
    try {
      const response = await apiClient.getLabResults(labOrderId);
      return response;
    } catch (error) {
      logger.error('Error getting lab results:', error);
      throw error;
    }
  }

  /**
   * รายการประเภทการตรวจ
   */
  static getCategories(): { value: string; label: string }[] {
    return [
      { value: 'blood', label: 'ตรวจเลือด' },
      { value: 'urine', label: 'ตรวจปัสสาวะ' },
      { value: 'stool', label: 'ตรวจอุจจาระ' },
      { value: 'imaging', label: 'ตรวจทางภาพ' },
      { value: 'other', label: 'อื่นๆ' }
    ];
  }

  /**
   * รายการตรวจเลือด
   */
  static getBloods(): { code: string; name: string; normalRange?: string }[] {
    return [
      { code: 'CBC', name: 'Complete Blood Count', normalRange: 'ตามเกณฑ์' },
      { code: 'FBS', name: 'Fasting Blood Sugar', normalRange: '70-100 mg/dL' },
      { code: 'HbA1c', name: 'Hemoglobin A1c', normalRange: '< 5.7%' },
      { code: 'CHOL', name: 'Cholesterol', normalRange: '< 200 mg/dL' },
      { code: 'TG', name: 'Triglyceride', normalRange: '< 150 mg/dL' },
      { code: 'HDL', name: 'HDL Cholesterol', normalRange: '> 40 mg/dL (ชาย), > 50 mg/dL (หญิง)' },
      { code: 'LDL', name: 'LDL Cholesterol', normalRange: '< 100 mg/dL' },
      { code: 'BUN', name: 'Blood Urea Nitrogen', normalRange: '7-20 mg/dL' },
      { code: 'CREAT', name: 'Creatinine', normalRange: '0.6-1.2 mg/dL' },
      { code: 'SGOT', name: 'SGOT (AST)', normalRange: '< 40 U/L' },
      { code: 'SGPT', name: 'SGPT (ALT)', normalRange: '< 40 U/L' }
    ];
  }

  /**
   * รายการตรวจปัสสาวะ
   */
  static getUrines(): { code: string; name: string }[] {
    return [
      { code: 'UA', name: 'Urine Analysis' },
      { code: 'UPROT', name: 'Urine Protein' },
      { code: 'UGLUC', name: 'Urine Glucose' },
      { code: 'UKETO', name: 'Urine Ketone' },
      { code: 'UMC', name: 'Urine Microscopy' }
    ];
  }

  /**
   * รายการตรวจทางภาพ
   */
  static getImagings(): { code: string; name: string }[] {
    return [
      { code: 'CXR', name: 'Chest X-Ray' },
      { code: 'ECG', name: 'Electrocardiogram' },
      { code: 'ECHO', name: 'Echocardiogram' },
      { code: 'USG', name: 'Ultrasonography' },
      { code: 'CT', name: 'CT Scan' },
      { code: 'MRI', name: 'MRI' }
    ];
  }

  /**
   * แปลงระดับความสำคัญเป็นภาษาไทย
   */
  static getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'routine': 'ปกติ',
      'urgent': 'เร่งด่วน',
      'stat': 'ฉุกเฉิน'
    };
    return priorityMap[priority] || priority;
  }

  /**
   * แปลงสถานะเป็นภาษาไทย
   */
  static getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอดำเนินการ',
      'collected': 'เก็บตัวอย่างแล้ว',
      'processing': 'กำลังตรวจ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  }

  /**
   * แปลงสถานะเป็นสี
   */
  static getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'collected': 'text-blue-600 bg-blue-100',
      'processing': 'text-orange-600 bg-orange-100',
      'completed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * แปลงระดับความสำคัญเป็นสี
   */
  static getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'routine': 'text-green-600',
      'urgent': 'text-orange-600',
      'stat': 'text-red-600'
    };
    return colorMap[priority] || 'text-gray-600';
  }

  /**
   * สร้าง Order Number แบบจำลอง (สำหรับ UI เท่านั้น)
   */
  static generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `LAB${year}${month}${day}${random}`;
  }

  /**
   * คำนวณเวลาที่คาดว่าจะได้ผลตรวจ
   */
  static estimateResultTime(Category: string): string {
    const timeMap: { [key: string]: string } = {
      'blood': '2-4 ชั่วโมง',
      'urine': '1-2 ชั่วโมง',
      'stool': '2-3 ชั่วโมง',
      'imaging': '30 นาที - 2 ชั่วโมง',
      'other': '1-24 ชั่วโมง'
    };
    return timeMap[Category] || 'ติดต่อสอบถาม';
  }
}

export default LabService;
