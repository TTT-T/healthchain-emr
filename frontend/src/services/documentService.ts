import { apiClient } from '@/lib/api';
import { 
  MedicalDocument, 
  CreateDocumentRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Document Service
 * จัดการเอกสารแพทย์
 */
export class DocumentService {
  /**
   * สร้างเอกสารแพทย์
   */
  static async createDocument(data: CreateDocumentRequest): Promise<APIResponse<MedicalDocument>> {
    try {
      const response = await apiClient.createDocument(data);
      return response;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลเอกสารโดย ID
   */
  static async getDocument(id: string): Promise<APIResponse<MedicalDocument>> {
    try {
      const response = await apiClient.getDocument(id);
      return response;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารของผู้ป่วย
   */
  static async getPatientDocuments(patientId: string): Promise<APIResponse<MedicalDocument[]>> {
    try {
      const response = await apiClient.getPatientDocuments(patientId);
      return response;
    } catch (error) {
      console.error('Error getting patient documents:', error);
      throw error;
    }
  }

  /**
   * อัปเดตเอกสาร
   */
  static async updateDocument(id: string, data: any): Promise<APIResponse<MedicalDocument>> {
    try {
      const response = await apiClient.updateDocument(id, data);
      return response;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสาร
   */
  static async deleteDocument(id: string): Promise<APIResponse<void>> {
    try {
      const response = await apiClient.deleteDocument(id);
      return response;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * ดาวน์โหลดเอกสาร
   */
  static async downloadDocument(id: string): Promise<Blob> {
    try {
      const response = await apiClient.downloadDocument(id);
      return response;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * อัปโหลดเอกสาร
   */
  static async uploadDocument(file: File, metadata: any): Promise<APIResponse<MedicalDocument>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await apiClient.uploadDocument(formData);
      return response;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * ประเภทเอกสาร
   */
  static getDocumentCategories(): { value: string; label: string }[] {
    return [
      { value: 'lab-results', label: 'ผลตรวจทางห้องปฏิบัติการ' },
      { value: 'prescriptions', label: 'ใบสั่งยา' },
      { value: 'certificates', label: 'ใบรับรองแพทย์' },
      { value: 'imaging', label: 'ภาพถ่ายทางการแพทย์' },
      { value: 'reports', label: 'รายงานแพทย์' },
      { value: 'consent', label: 'ใบยินยอม' },
      { value: 'discharge', label: 'ใบสรุปการรักษา' },
      { value: 'insurance', label: 'เอกสารประกัน' },
      { value: 'other', label: 'อื่นๆ' }
    ];
  }

  /**
   * สถานะเอกสาร
   */
  static getDocumentStatuses(): { value: string; label: string }[] {
    return [
      { value: 'draft', label: 'ร่าง' },
      { value: 'pending', label: 'รอดำเนินการ' },
      { value: 'completed', label: 'เสร็จสิ้น' },
      { value: 'cancelled', label: 'ยกเลิก' },
      { value: 'expired', label: 'หมดอายุ' }
    ];
  }

  /**
   * รองรับไฟล์ประเภทใด
   */
  static getSupportedFileTypes(): { value: string; label: string; extensions: string[] }[] {
    return [
      { value: 'pdf', label: 'PDF', extensions: ['.pdf'] },
      { value: 'image', label: 'รูปภาพ', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'] },
      { value: 'document', label: 'เอกสาร', extensions: ['.doc', '.docx', '.txt', '.rtf'] },
      { value: 'spreadsheet', label: 'ตารางคำนวณ', extensions: ['.xls', '.xlsx', '.csv'] },
      { value: 'presentation', label: 'งานนำเสนอ', extensions: ['.ppt', '.pptx'] }
    ];
  }

  /**
   * ตรวจสอบประเภทไฟล์
   */
  static validateFileType(file: File): { isValid: boolean; message?: string } {
    const supportedTypes = this.getSupportedFileTypes();
    const allExtensions = supportedTypes.flatMap(type => type.extensions);
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        message: `ไฟล์ประเภท ${fileExtension} ไม่รองรับ`
      };
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: 'ขนาดไฟล์ต้องไม่เกิน 10MB'
      };
    }

    return { isValid: true };
  }

  /**
   * แปลงขนาดไฟล์เป็นรูปแบบอ่านง่าย
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
