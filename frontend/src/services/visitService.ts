import { apiClient } from '@/lib/api';
import { 
  MedicalVisit, 
  CreateVisitRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Visit Service
 * จัดการข้อมูลการมาพบแพทย์
 */
export class VisitService {
  /**
   * สร้างการมาพบแพทย์ใหม่
   */
  static async createVisit(data: CreateVisitRequest): Promise<APIResponse<MedicalVisit>> {
    try {
      const response = await apiClient.createVisit(data);
      return response;
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการมาพบแพทย์โดย ID
   */
  static async getVisit(id: string): Promise<APIResponse<MedicalVisit>> {
    try {
      const response = await apiClient.getVisit(id);
      return response;
    } catch (error) {
      console.error('Error getting visit:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลการมาพบแพทย์
   */
  static async updateVisit(id: string, data: Partial<MedicalVisit>): Promise<APIResponse<MedicalVisit>> {
    try {
      const response = await apiClient.updateVisit(id, data);
      return response;
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  }

  /**
   * ปิดการมาพบแพทย์
   */
  static async completeVisit(id: string): Promise<APIResponse<MedicalVisit>> {
    try {
      const response = await apiClient.completeVisit(id);
      return response;
    } catch (error) {
      console.error('Error completing visit:', error);
      throw error;
    }
  }

  /**
   * ดึงประวัติการมาพบแพทย์ของผู้ป่วย
   */
  static async getPatientVisits(patientId: string): Promise<APIResponse<MedicalVisit[]>> {
    try {
      const response = await apiClient.getPatientVisits(patientId);
      return response;
    } catch (error) {
      console.error('Error getting patient visits:', error);
      throw error;
    }
  }

  /**
   * ค้นหาการมาพบแพทย์
   */
  static async searchVisits(params?: {
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<APIResponse<MedicalVisit[]>> {
    try {
      const response = await apiClient.searchVisits(params);
      return response;
    } catch (error) {
      console.error('Error searching visits:', error);
      throw error;
    }
  }

  /**
   * สร้าง Visit Number แบบจำลอง (สำหรับ UI เท่านั้น)
   */
  static generateVisitNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `V${year}${month}${day}${random}`;
  }

  /**
   * แปลงสถานะการมาพบเป็นภาษาไทย
   */
  static getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'นัดหมาย',
      'checked_in': 'เช็คอิน',
      'in_progress': 'กำลังตรวจ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก',
      'no_show': 'ไม่มาตามนัด'
    };
    return statusMap[status] || status;
  }

  /**
   * แปลงประเภทการมาพบเป็นภาษาไทย
   */
  static getVisitTypeLabel(visitType: string): string {
    const typeMap: { [key: string]: string } = {
      'walk_in': 'Walk-in',
      'appointment': 'นัดหมาย',
      'emergency': 'ฉุกเฉิน',
      'follow_up': 'ติดตาม',
      'referral': 'ส่งต่อ'
    };
    return typeMap[visitType] || visitType;
  }

  /**
   * แปลงระดับความสำคัญเป็นภาษาไทย
   */
  static getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'ต่ำ',
      'normal': 'ปกติ',
      'high': 'สูง',
      'urgent': 'ฉุกเฉิน'
    };
    return priorityMap[priority] || priority;
  }

  /**
   * แปลงระดับความสำคัญเป็นสี
   */
  static getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'low': 'text-green-600',
      'normal': 'text-blue-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colorMap[priority] || 'text-gray-600';
  }
}

export default VisitService;
