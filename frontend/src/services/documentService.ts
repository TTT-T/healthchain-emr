import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreateDocumentRequest {
  patientId: string;
  visitId?: string;
  documentType: string;
  documentTitle: string;
  content: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }>;
  status: 'draft' | 'signed' | 'issued' | 'cancelled';
  issuedBy: string;
  issuedDate?: string;
  validUntil?: string;
  notes?: string;
  recipientInfo?: {
    name?: string;
    organization?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface UpdateDocumentRequest {
  documentTitle?: string;
  content?: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: any[];
  status?: string;
  issuedBy?: string;
  issuedDate?: string;
  validUntil?: string;
  notes?: string;
  recipientInfo?: any;
}

export interface DocumentRecord {
  id: string;
  patientId: string;
  visitId?: string;
  recordType: string;
  documentType: string;
  documentTitle: string;
  content: string;
  template?: string;
  variables: Record<string, any>;
  attachments: any[];
  status: string;
  notes?: string;
  issuedBy: string;
  issuedDate: string;
  validUntil?: string;
  recipientInfo?: any;
  createdAt: string;
  updatedAt: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
}

/**
 * Document Service
 * จัดการข้อมูลเอกสารทางการแพทย์
 */
export class DocumentService {
  /**
   * สร้างเอกสาร
   */
  static async createDocument(data: CreateDocumentRequest): Promise<APIResponse<DocumentRecord>> {
    try {
      const response = await apiClient.post('/medical/documents', data);
      return response as APIResponse<DocumentRecord>;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลเอกสารโดย ID
   */
  static async getDocumentById(id: string): Promise<APIResponse<DocumentRecord>> {
    try {
      const response = await apiClient.get(`/medical/documents/${id}`);
      return response as APIResponse<DocumentRecord>;
    } catch (error) {
      logger.error('Error retrieving document:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลเอกสารของผู้ป่วย
   */
  static async getDocumentsByPatient(patientId: string, documentType?: string): Promise<APIResponse<DocumentRecord[]>> {
    try {
      // Use the correct route that queries medical_records table (not medical_documents)
      const url = documentType 
        ? `/medical/patients/${patientId}/medical-documents?documentType=${documentType}`
        : `/medical/patients/${patientId}/medical-documents`;
      const response = await apiClient.get(url);
      return response as APIResponse<DocumentRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient documents:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลเอกสาร
   */
  static async updateDocument(id: string, data: UpdateDocumentRequest): Promise<APIResponse<DocumentRecord>> {
    try {
      const response = await apiClient.put(`/medical/documents/${id}`, data);
      return response as APIResponse<DocumentRecord>;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * ลบเอกสาร
   */
  static async deleteDocument(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.delete(`/medical/documents/${id}`);
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatDocumentDataForAPI(documentData: any, patientId: string, issuedBy: string): CreateDocumentRequest {
    return {
      patientId,
      visitId: documentData.visitId,
      documentType: documentData.documentType,
      documentTitle: documentData.documentTitle,
      content: documentData.content,
      template: documentData.template,
      variables: documentData.variables || {},
      attachments: documentData.attachments || [],
      status: documentData.status || 'draft',
      issuedBy,
      issuedDate: documentData.issuedDate || new Date().toISOString(),
      validUntil: documentData.validUntil,
      notes: documentData.notes,
      recipientInfo: documentData.recipientInfo
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatDocumentDataFromAPI(record: DocumentRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      visitId: record.visitId,
      documentType: record.documentType,
      documentTitle: record.documentTitle,
      content: record.content,
      template: record.template,
      variables: record.variables || {},
      attachments: record.attachments || [],
      status: record.status,
      notes: record.notes,
      issuedBy: record.issuedBy,
      issuedDate: record.issuedDate,
      validUntil: record.validUntil,
      recipientInfo: record.recipientInfo,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      patient: record.patient
    };
  }

  /**
   * สร้างข้อมูลเริ่มต้นสำหรับฟอร์ม
   */
  static createEmptyDocumentData(): any {
    return {
      documentType: '',
      documentTitle: '',
      content: '',
      template: '',
      variables: {},
      attachments: [],
      status: 'draft',
      notes: '',
      issuedDate: new Date().toISOString().split('T')[0],
      validUntil: '',
      recipientInfo: {
        name: '',
        organization: '',
        address: '',
        phone: '',
        email: ''
      }
    };
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลเอกสาร
   */
  static validateDocumentData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.documentType?.trim()) {
      errors.push('กรุณาเลือกประเภทเอกสาร');
    }
    if (!data.documentTitle?.trim()) {
      errors.push('กรุณากรอกชื่อเอกสาร');
    }
    if (!data.content?.trim()) {
      errors.push('กรุณากรอกเนื้อหาเอกสาร');
    }
    if (!data.issuedBy?.trim()) {
      errors.push('กรุณากรอกชื่อผู้ออกเอกสาร');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * กำหนดสีตามสถานะเอกสาร
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'signed':
        return 'text-blue-600 bg-blue-100';
      case 'issued':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
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
      case 'draft':
        return 'ร่าง';
      case 'signed':
        return 'ลงนามแล้ว';
      case 'issued':
        return 'ออกแล้ว';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return 'ไม่ระบุ';
    }
  }

  /**
   * กำหนดสีตามประเภทเอกสาร
   */
  static getDocumentTypeColor(documentType: string): string {
    switch (documentType) {
      case 'medical_certificate':
        return 'bg-blue-500';
      case 'referral_letter':
        return 'bg-green-500';
      case 'sick_leave':
        return 'bg-orange-500';
      case 'prescription':
        return 'bg-purple-500';
      case 'lab_report':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * กำหนดข้อความประเภทเอกสารเป็นภาษาไทย
   */
  static getDocumentTypeLabel(documentType: string): string {
    switch (documentType) {
      case 'medical_certificate':
        return 'ใบรับรองแพทย์';
      case 'referral_letter':
        return 'ใบส่งตัว';
      case 'sick_leave':
        return 'ใบรับรองการป่วย';
      case 'prescription':
        return 'ใบสั่งยา';
      case 'lab_report':
        return 'รายงานผลแลบ';
      case 'discharge_summary':
        return 'สรุปการจำหน่าย';
      case 'consultation_report':
        return 'รายงานการปรึกษา';
      default:
        return 'เอกสารอื่นๆ';
    }
  }

  /**
   * สร้างเนื้อหาเอกสารจากเทมเพลต
   */
  static generateDocumentContent(template: string, variables: Record<string, any>, patientInfo: any): string {
    let content = template;
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value || '');
    });

    // Replace patient info
    if (patientInfo) {
      content = content.replace(/\{\{patientName\}\}/g, patientInfo.thaiName || `${patientInfo.firstName} ${patientInfo.lastName}`);
      content = content.replace(/\{\{patientHn\}\}/g, patientInfo.hn || patientInfo.hospital_number || '');
      content = content.replace(/\{\{patientNationalId\}\}/g, patientInfo.national_id || '');
      content = content.replace(/\{\{patientAge\}\}/g, patientInfo.age || '');
      content = content.replace(/\{\{patientGender\}\}/g, patientInfo.gender || '');
    }

    // Replace current date
    const currentDate = new Date().toLocaleDaring('th-TH');
    content = content.replace(/\{\{currentDate\}\}/g, currentDate);

    return content;
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

  /**
   * ดาวน์โหลดเอกสารเป็น PDF
   */
  static downloadDocumentAsPDF(content: string, filename: string): void {
    // ในระบบจริงจะต้องใช้ library เช่น jsPDF หรือ html2pdf
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * ตรวจสอบวันหมดอายุของเอกสาร
   */
  static isDocumentExpired(validUntil: string): boolean {
    if (!validUntil) return false;
    const expiryDate = new Date(validUntil);
    const currentDate = new Date();
    return expiryDate < currentDate;
  }

  /**
   * คำนวณจำนวนวันที่เหลือก่อนหมดอายุ
   */
  static getDaysUntilExpiry(validUntil: string): number {
    if (!validUntil) return -1;
    const expiryDate = new Date(validUntil);
    const currentDate = new Date();
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
