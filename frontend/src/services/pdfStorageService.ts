import { logger } from '@/lib/logger';

interface PDFRecord {
  id: string;
  patientHn: string;
  patientName: string;
  queueNumber: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  createdBy: string;
  visitId?: string;
  doctorName: string;
  department: string;
  treatmentType: string;
}

export class PDFStorageService {
  /**
   * เก็บไฟล์ PDF ลงในระบบ
   */
  static async storePDF(
    pdfBlob: Blob,
    patientHn: string,
    patientName: string,
    queueNumber: string,
    createdBy: string,
    visitId?: string,
    doctorName?: string,
    department?: string,
    treatmentType?: string
  ): Promise<PDFRecord> {
    try {
      // สร้างชื่อไฟล์
      const fileName = `checkin-report-${patientHn}-${queueNumber}-${Date.now()}.pdf`;
      
      // สร้าง URL สำหรับไฟล์
      const fileUrl = URL.createObjectURL(pdfBlob);
      
      // สร้างข้อมูลไฟล์
      const pdfRecord: PDFRecord = {
        id: `pdf-${Date.now()}`,
        patientHn,
        patientName,
        queueNumber,
        fileName,
        fileUrl,
        fileSize: pdfBlob.size,
        createdAt: new Date().toISOString(),
        createdBy,
        visitId,
        doctorName: doctorName || 'ไม่ระบุ',
        department: department || 'ไม่ระบุ',
        treatmentType: treatmentType || 'ไม่ระบุ'
      };
      
      // เก็บข้อมูลใน localStorage (ในระบบจริงจะเก็บในฐานข้อมูลและ cloud storage)
      await this.savePDFRecord(pdfRecord);
      
      logger.info('PDF stored successfully', { 
        patientHn, 
        queueNumber, 
        fileName, 
        fileSize: pdfBlob.size 
      });
      
      return pdfRecord;
    } catch (error) {
      logger.error('Failed to store PDF:', error);
      throw error;
    }
  }

  /**
   * บันทึกข้อมูล PDF ใน localStorage
   */
  private static async savePDFRecord(pdfRecord: PDFRecord): Promise<void> {
    try {
      const existingRecords = this.getStoredPDFs();
      existingRecords.push(pdfRecord);
      localStorage.setItem('stored_pdfs', JSON.stringify(existingRecords));
    } catch (error) {
      logger.error('Failed to save PDF record:', error);
      throw error;
    }
  }

  /**
   * ดึงรายการ PDF ที่เก็บไว้
   */
  static getStoredPDFs(): PDFRecord[] {
    try {
      const stored = localStorage.getItem('stored_pdfs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to get stored PDFs:', error);
      return [];
    }
  }

  /**
   * ดึง PDF ตาม HN
   */
  static getPDFsByPatientHn(patientHn: string): PDFRecord[] {
    try {
      const allPDFs = this.getStoredPDFs();
      return allPDFs.filter(pdf => pdf.patientHn === patientHn);
    } catch (error) {
      logger.error('Failed to get PDFs by patient HN:', error);
      return [];
    }
  }

  /**
   * ดึง PDF ตามหมายเลขคิว
   */
  static getPDFByQueueNumber(queueNumber: string): PDFRecord | null {
    try {
      const allPDFs = this.getStoredPDFs();
      return allPDFs.find(pdf => pdf.queueNumber === queueNumber) || null;
    } catch (error) {
      logger.error('Failed to get PDF by queue number:', error);
      return null;
    }
  }

  /**
   * ดาวน์โหลด PDF
   */
  static async downloadPDF(pdfRecord: PDFRecord): Promise<void> {
    try {
      // สร้างลิงก์สำหรับดาวน์โหลด
      const link = document.createElement('a');
      link.href = pdfRecord.fileUrl;
      link.download = pdfRecord.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info('PDF downloaded', { fileName: pdfRecord.fileName });
    } catch (error) {
      logger.error('Failed to download PDF:', error);
      throw error;
    }
  }

  /**
   * ดู PDF ในหน้าต่างใหม่
   */
  static async viewPDF(pdfRecord: PDFRecord): Promise<void> {
    try {
      window.open(pdfRecord.fileUrl, '_blank');
      logger.info('PDF opened in new window', { fileName: pdfRecord.fileName });
    } catch (error) {
      logger.error('Failed to view PDF:', error);
      throw error;
    }
  }

  /**
   * ลบ PDF
   */
  static async deletePDF(pdfId: string): Promise<void> {
    try {
      const allPDFs = this.getStoredPDFs();
      const pdfToDelete = allPDFs.find(pdf => pdf.id === pdfId);
      
      if (pdfToDelete) {
        // ลบ URL object
        URL.revokeObjectURL(pdfToDelete.fileUrl);
        
        // ลบจากรายการ
        const updatedPDFs = allPDFs.filter(pdf => pdf.id !== pdfId);
        localStorage.setItem('stored_pdfs', JSON.stringify(updatedPDFs));
        
        logger.info('PDF deleted', { pdfId, fileName: pdfToDelete.fileName });
      }
    } catch (error) {
      logger.error('Failed to delete PDF:', error);
      throw error;
    }
  }

  /**
   * สร้าง PDF จาก jsPDF และเก็บลงระบบ
   */
  static async createAndStorePDF(
    pdfDoc: any, // jsPDF document
    patientHn: string,
    patientName: string,
    queueNumber: string,
    createdBy: string,
    visitId?: string,
    doctorName?: string,
    department?: string,
    treatmentType?: string
  ): Promise<PDFRecord> {
    try {
      // สร้าง Blob จาก jsPDF
      const pdfBlob = pdfDoc.output('blob');
      
      // เก็บลงระบบ
      const pdfRecord = await this.storePDF(
        pdfBlob,
        patientHn,
        patientName,
        queueNumber,
        createdBy,
        visitId,
        doctorName,
        department,
        treatmentType
      );
      
      return pdfRecord;
    } catch (error) {
      logger.error('Failed to create and store PDF:', error);
      throw error;
    }
  }

  /**
   * ส่งออกข้อมูล PDF เป็น JSON (สำหรับ backup)
   */
  static exportPDFData(): string {
    try {
      const allPDFs = this.getStoredPDFs();
      return JSON.stringify(allPDFs, null, 2);
    } catch (error) {
      logger.error('Failed to export PDF data:', error);
      throw error;
    }
  }

  /**
   * นำเข้าข้อมูล PDF จาก JSON (สำหรับ restore)
   */
  static importPDFData(jsonData: string): void {
    try {
      const pdfData = JSON.parse(jsonData);
      if (Array.isArray(pdfData)) {
        localStorage.setItem('stored_pdfs', JSON.stringify(pdfData));
        logger.info('PDF data imported successfully', { count: pdfData.length });
      } else {
        throw new Error('Invalid PDF data format');
      }
    } catch (error) {
      logger.error('Failed to import PDF data:', error);
      throw error;
    }
  }

  /**
   * ล้างข้อมูล PDF ทั้งหมด
   */
  static clearAllPDFs(): void {
    try {
      const allPDFs = this.getStoredPDFs();
      
      // ลบ URL objects ทั้งหมด
      allPDFs.forEach(pdf => {
        URL.revokeObjectURL(pdf.fileUrl);
      });
      
      // ล้าง localStorage
      localStorage.removeItem('stored_pdfs');
      
      logger.info('All PDFs cleared', { count: allPDFs.length });
    } catch (error) {
      logger.error('Failed to clear all PDFs:', error);
      throw error;
    }
  }
}
