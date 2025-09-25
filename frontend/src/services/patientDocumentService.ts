"use client";
import { logger } from '@/lib/logger';

// Interface สำหรับเอกสารของผู้ป่วย
export interface PatientDocument {
  id: string;
  patientHn: string;
  patientNationalId: string;
  documentType: 'vital_signs' | 'history_taking' | 'doctor_visit' | 'lab_result' | 'prescription' | 'appointment' | 'medical_certificate' | 'referral' | 'xray' | 'blood_' | 'other';
  documentTitle: string;
  documentDescription: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  created_at: string;
  createdBy: string;
  createdByName: string;
  visitId?: string;
  queueNumber?: string;
  doctorName?: string;
  department?: string;
  isDownloaded: boolean;
  downloadCount: number;
  lastAccessedAt?: string;
  tags: string[];
  metadata: {
    [key: string]: any;
  };
}

// Interface สำหรับการสร้างเอกสารใหม่
export interface CreatePatientDocumentRequest {
  patientHn: string;
  patientNationalId: string;
  documentType: string;
  documentTitle: string;
  documentDescription: string;
  fileContent: string; // Base64 encoded content
  fileName: string;
  mimeType: string;
  visitId?: string;
  queueNumber?: string;
  doctorName?: string;
  department?: string;
  createdBy: string;
  createdByName: string;
  tags?: string[];
  metadata?: { [key: string]: any };
}

// Interface สำหรับการค้นหาเอกสาร
export interface DocumentSearchQuery {
  patientHn?: string;
  patientNationalId?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorName?: string;
  department?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class PatientDocumentService {
  private static readonly STORAGE_KEY = 'patient_documents';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * สร้างเอกสารใหม่ให้ผู้ป่วย
   */
  public static async createDocument(request: CreatePatientDocumentRequest): Promise<PatientDocument> {
    try {
      logger.info('Creating patient document', { 
        patientHn: request.patientHn, 
        documentType: request.documentType,
        documentTitle: request.documentTitle 
      });

      // สร้างเอกสาร
      const document: PatientDocument = {
        id: this.generateDocumentId(),
        patientHn: request.patientHn,
        patientNationalId: request.patientNationalId,
        documentType: request.documentType as any,
        documentTitle: request.documentTitle,
        documentDescription: request.documentDescription,
        fileName: request.fileName,
        fileUrl: this.generateFileUrl(request.fileName, request.fileContent),
        fileSize: this.calculateFileSize(request.fileContent),
        mimeType: request.mimeType,
        created_at: new Date().toISOString(),
        createdBy: request.createdBy,
        createdByName: request.createdByName,
        visitId: request.visitId,
        queueNumber: request.queueNumber,
        doctorName: request.doctorName,
        department: request.department,
        isDownloaded: false,
        downloadCount: 0,
        tags: request.tags || [],
        metadata: request.metadata || {}
      };

      // บันทึกเอกสาร
      await this.saveDocument(document);

      // ส่งการแจ้งเตือนให้ผู้ป่วย
      await this.notifyPatientNewDocument(document);

      logger.info('Patient document created successfully', { documentId: document.id });
      return document;
    } catch (error) {
      logger.error('Failed to create patient document:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารทั้งหมดของผู้ป่วย
   */
  public static async getPatientDocuments(
    patientHn: string, 
    query: DocumentSearchQuery = {}
  ): Promise<{ documents: PatientDocument[]; total: number }> {
    try {
      const allDocuments = await this.getAllDocuments();
      
      // กรองเอกสารตาม patientHn
      let filteredDocuments = allDocuments.filter(doc => 
        doc.patientHn === patientHn || doc.patientNationalId === patientHn
      );

      // กรองตาม query parameters
      if (query.documentType) {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.documentType === query.documentType
        );
      }

      if (query.dateFrom) {
        const fromDate = new Date(query.dateFrom);
        filteredDocuments = filteredDocuments.filter(doc => 
          new Date(doc.created_at) >= fromDate
        );
      }

      if (query.dateTo) {
        const toDate = new Date(query.dateTo);
        filteredDocuments = filteredDocuments.filter(doc => 
          new Date(doc.created_at) <= toDate
        );
      }

      if (query.doctorName) {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.doctorName?.toLowerCase().includes(query.doctorName!.toLowerCase())
        );
      }

      if (query.department) {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.department?.toLowerCase().includes(query.department!.toLowerCase())
        );
      }

      if (query.tags && query.tags.length > 0) {
        filteredDocuments = filteredDocuments.filter(doc => 
          query.tags!.some(tag => doc.tags.includes(tag))
        );
      }

      // เรียงลำดับตามวันที่สร้าง (ใหม่สุดก่อน)
      filteredDocuments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

      return {
        documents: paginatedDocuments,
        total: filteredDocuments.length
      };
    } catch (error) {
      logger.error('Failed to get patient documents:', error);
      throw error;
    }
  }

  /**
   * ดาวน์โหลดเอกสาร
   */
  public static async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // อัปเดตสถิติการดาวน์โหลด
      await this.updateDownloadStats(documentId);

      // ดาวน์โหลดไฟล์
      const response = await fetch(document.fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      return await response.blob();
    } catch (error) {
      logger.error('Failed to download document:', error);
      throw error;
    }
  }

  /**
   * ดูเอกสารออนไลน์
   */
  public static async viewDocumentOnline(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // อัปเดตสถิติการเข้าถึง
      await this.updateAccessStats(documentId);

      return document.fileUrl;
    } catch (error) {
      logger.error('Failed to view document online:', error);
      throw error;
    }
  }

  /**
   * สร้างเอกสารจากข้อมูลการตรวจ
   */
  public static async createDocumentFromMedicalRecord(
    recordType: string,
    recordData: any,
    patientInfo: {
      patientHn: string;
      patientNationalId: string;
      patientName: string;
    },
    createdBy: string,
    createdByName: string
  ): Promise<PatientDocument> {
    try {
      const documentConfig = this.getDocumentConfig(recordType);
      
      // สร้างเนื้อหาเอกสาร
      const documentContent = await this.generateDocumentContent(
        recordType, 
        recordData, 
        patientInfo, 
        documentConfig
      );

      const request: CreatePatientDocumentRequest = {
        patientHn: patientInfo.patientHn,
        patientNationalId: patientInfo.patientNationalId,
        documentType: recordType,
        documentTitle: documentConfig.title,
        documentDescription: documentConfig.description,
        fileContent: documentContent,
        fileName: `${documentConfig.fileName}_${patientInfo.patientHn}_${new Date().toISOString().split('T')[0]}.pdf`,
        mimeType: 'application/pdf',
        visitId: recordData.visitId,
        queueNumber: recordData.queueNumber,
        doctorName: recordData.doctorName,
        department: recordData.department,
        createdBy,
        createdByName,
        tags: documentConfig.tags,
        metadata: {
          recordType,
          originalData: recordData
        }
      };

      return await this.createDocument(request);
    } catch (error) {
      logger.error('Failed to create document from medical record:', error);
      throw error;
    }
  }

  /**
   * ส่งการแจ้งเตือนให้ผู้ป่วยเมื่อมีเอกสารใหม่
   */
  private static async notifyPatientNewDocument(document: PatientDocument): Promise<void> {
    try {
      // ส่งการแจ้งเตือนผ่าน NotificationService
      const { NotificationService } = await import('./notificationService');
      
      await NotificationService.notifyPatientRecordUpdate({
        patientHn: document.patientHn,
        patientNationalId: document.patientNationalId,
        patientName: '', // จะต้องดึงจากฐานข้อมูล
        patientPhone: '',
        patientEmail: '',
        recordType: 'document',
        recordId: document.id,
        recordedBy: document.createdBy || 'system',
        recordedTime: document.created_at || new Date().toISOString(),
        message: `มีเอกสารใหม่: ${document.documentTitle}`
      });

      logger.info('Patient notified of new document', { documentId: document.id });
    } catch (error) {
      logger.error('Failed to notify patient of new document:', error);
    }
  }

  /**
   * ดึงการตั้งค่าเอกสารตามประเภท
   */
  private static getDocumentConfig(recordType: string): {
    title: string;
    description: string;
    fileName: string;
    tags: string[];
  } {
    const configs: { [key: string]: any } = {
      'vital_signs': {
        title: 'รายงานสัญญาณชีพ',
        description: 'รายงานการวัดสัญญาณชีพของผู้ป่วย',
        fileName: 'vital_signs_report',
        tags: ['สัญญาณชีพ', 'รายงาน', 'การตรวจ']
      },
      'history_taking': {
        title: 'รายงานการซักประวัติ',
        description: 'รายงานการซักประวัติทางการแพทย์',
        fileName: 'history_taking_report',
        tags: ['ซักประวัติ', 'รายงาน', 'การตรวจ']
      },
      'doctor_visit': {
        title: 'รายงานการตรวจโดยแพทย์',
        description: 'รายงานการตรวจและวินิจฉัยของแพทย์',
        fileName: 'doctor_visit_report',
        tags: ['การตรวจ', 'รายงาน', 'แพทย์']
      },
      'lab_result': {
        title: 'ผลการตรวจทางห้องปฏิบัติการ',
        description: 'ผลการตรวจทางห้องปฏิบัติการ',
        fileName: 'lab_result_report',
        tags: ['ผลแลบ', 'ห้องปฏิบัติการ', 'การตรวจ']
      },
      'prescription': {
        title: 'ใบสั่งยา',
        description: 'ใบสั่งยาจากแพทย์',
        fileName: 'prescription',
        tags: ['ใบสั่งยา', 'ยา', 'แพทย์']
      },
      'appointment': {
        title: 'ใบนัดหมาย',
        description: 'ใบนัดหมายการรักษา',
        fileName: 'appointment',
        tags: ['นัดหมาย', 'การรักษา']
      },
      'medical_certificate': {
        title: 'ใบรับรองแพทย์',
        description: 'ใบรับรองแพทย์',
        fileName: 'medical_certificate',
        tags: ['ใบรับรอง', 'แพทย์']
      },
      'referral': {
        title: 'ใบส่งตัว',
        description: 'ใบส่งตัวผู้ป่วย',
        fileName: 'referral',
        tags: ['ส่งตัว', 'แพทย์']
      }
    };

    return configs[recordType] || {
      title: 'เอกสารทางการแพทย์',
      description: 'เอกสารทางการแพทย์',
      fileName: 'medical_document',
      tags: ['เอกสาร', 'การแพทย์']
    };
  }

  /**
   * สร้างเนื้อหาเอกสาร
   */
  private static async generateDocumentContent(
    recordType: string,
    recordData: any,
    patientInfo: any,
    config: any
  ): Promise<string> {
    // ในระบบจริงจะใช้ PDF generation library เช่น jsPDF หรือ Puppeteer
    // สำหรับตอนนี้จะสร้าง HTML content แล้วแปลงเป็น PDF
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>${config.title}</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .patient-info { background: #f8f9fa; padding: 15px; margin-bottom: 20px; }
          .content { margin-bottom: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.title}</h1>
          <p>โรงพยาบาลตัวอย่าง</p>
        </div>
        
        <div class="patient-info">
          <h3>ข้อมูลผู้ป่วย</h3>
          <p><strong>ชื่อ:</strong> ${patientInfo.patient_name}</p>
          <p><strong>หมายเลข HN:</strong> ${patientInfo.patientHn}</p>
          <p><strong>วันที่สร้าง:</strong> ${new Date().toLocaleString('th-TH')}</p>
        </div>
        
        <div class="content">
          <h3>รายละเอียด</h3>
          <pre>${JSON.stringify(recordData, null, 2)}</pre>
        </div>
        
        <div class="footer">
          <p>เอกสารนี้ถูกสร้างโดยระบบ EMR อัตโนมัติ</p>
          <p>วันที่พิมพ์: ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </body>
      </html>
    `;

    // แปลง HTML เป็น Base64 (ในระบบจริงจะใช้ PDF generation)
    return btoa(unescape(encodeURIComponent(htmlContent)));
  }

  /**
   * บันทึกเอกสาร
   */
  private static async saveDocument(document: PatientDocument): Promise<void> {
    try {
      const existingDocuments = await this.getAllDocuments();
      existingDocuments.push(document);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingDocuments));
      
      logger.info('Document saved successfully', { documentId: document.id });
    } catch (error) {
      logger.error('Failed to save document:', error);
      throw error;
    }
  }

  /**
   * ดึงเอกสารทั้งหมด
   */
  private static async getAllDocuments(): Promise<PatientDocument[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to get all documents:', error);
      return [];
    }
  }

  /**
   * ดึงเอกสารตาม ID
   */
  private static async getDocumentById(documentId: string): Promise<PatientDocument | null> {
    try {
      const documents = await this.getAllDocuments();
      return documents.find(doc => doc.id === documentId) || null;
    } catch (error) {
      logger.error('Failed to get document by ID:', error);
      return null;
    }
  }

  /**
   * อัปเดตสถิติการดาวน์โหลด
   */
  private static async updateDownloadStats(documentId: string): Promise<void> {
    try {
      const documents = await this.getAllDocuments();
      const documentIndex = documents.findIndex(doc => doc.id === documentId);
      
      if (documentIndex !== -1) {
        documents[documentIndex].downloadCount++;
        documents[documentIndex].isDownloaded = true;
        documents[documentIndex].lastAccessedAt = new Date().toISOString();
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
      }
    } catch (error) {
      logger.error('Failed to update download stats:', error);
    }
  }

  /**
   * อัปเดตสถิติการเข้าถึง
   */
  private static async updateAccessStats(documentId: string): Promise<void> {
    try {
      const documents = await this.getAllDocuments();
      const documentIndex = documents.findIndex(doc => doc.id === documentId);
      
      if (documentIndex !== -1) {
        documents[documentIndex].lastAccessedAt = new Date().toISOString();
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
      }
    } catch (error) {
      logger.error('Failed to update access stats:', error);
    }
  }

  /**
   * สร้าง Document ID
   */
  private static generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * สร้าง File URL
   */
  private static generateFileUrl(fileName: string, content: string): string {
    return `data:application/pdf;base64,${content}`;
  }

  /**
   * คำนวณขนาดไฟล์
   */
  private static calculateFileSize(content: string): number {
    return Math.round((content.length * 3) / 4); // Base64 to bytes approximation
  }
}
