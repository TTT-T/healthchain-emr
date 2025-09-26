import jsPDF from 'jspdf';
import { createLocalDateTimeString, formatLocalDateTime, formatLocalTime } from '@/utils/timeUtils';
import { User } from '@/types/api';
import { MedicalPatient } from '@/types/api';
import { PDFStorageService } from './pdfStorageService';
import { NotificationService } from './notificationService';

interface CheckInData {
  patientHn: string;
  patientNationalId: string;
  treatmentType: string;
  assignedDoctor: string;
  visitTime: string;
  symptoms: string;
  notes: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  currentQueue: number;
  estimatedWaitTime: number;
  isAvailable: boolean;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  position?: string;
  consultationFee?: number;
  email?: string;
  phone?: string;
  availability?: any;
}

export class PDFService {
  /**
   * สร้าง PDF รายงานการเช็คอิน
   */
  static async generateCheckInReport(
    patient: MedicalPatient,
    checkInData: CheckInData,
    doctor: Doctor,
    currentUser: User,
    queueNumber: string
  ): Promise<void> {
    // สร้าง PDF แบบใหม่ที่ใช้วิธีง่ายๆ
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ตั้งค่าฟอนต์
    doc.setFont('helvetica');
    
    // ลองใช้วิธีสร้าง PDF แบบใหม่ที่รองรับภาษาไทย
    try {
      // สร้าง HTML content สำหรับ PDF
      const htmlContent = this.generateHTMLContent(patient, doctor, currentUser, checkInData, queueNumber);
      
      // ใช้วิธีสร้าง PDF จาก HTML (ถ้ามี library)
      // หรือใช้วิธีสร้าง PDF แบบง่ายๆ
      this.createSimplePDF(doc, patient, doctor, currentUser, checkInData, queueNumber);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // สร้าง PDF แบบง่ายๆ เป็น fallback
      this.createFallbackPDF(doc, patient, doctor, currentUser, checkInData, queueNumber);
    }
    
    // สร้าง Blob และเก็บลงระบบ
    const pdfBlob = doc.output('blob');
    
    // เก็บ PDF ลงระบบ
    const pdfRecord = await PDFStorageService.createAndStorePDF(
      doc,
      patient.hn || 'N/A',
      `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'N/A',
      queueNumber,
      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'N/A',
      undefined, // visitId
      doctor.name || 'N/A',
      doctor.department || 'N/A',
      this.getTreatmentTypeLabel(checkInData.treatmentType) || 'N/A'
    );
    
    // ส่งการแจ้งเตือนให้ผู้ป่วย
    await NotificationService.notifyPatient({
      patientHn: patient.hn || 'N/A',
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'N/A',
      queueNumber,
      doctorName: doctor.name || 'N/A',
      department: doctor.department || 'N/A',
      visitTime: checkInData.visitTime,
      treatmentType: this.getTreatmentTypeLabel(checkInData.treatmentType) || 'N/A',
      estimatedWaitTime: doctor.estimatedWaitTime || 0,
      pdfUrl: pdfRecord.fileUrl
    });
    
    // บันทึกไฟล์ (สำหรับดาวน์โหลดทันที)
    const fileName = `checkin-report-${patient.hn || 'unknown'}-${queueNumber}-${createLocalDateTimeString(new Date()).slice(0, 10)}.pdf`;
    doc.save(fileName);
  }
  
  /**
   * สร้าง PDF แบบง่ายๆ ที่รองรับภาษาไทย
   */
  private static createSimplePDF(
    doc: jsPDF,
    patient: MedicalPatient,
    doctor: Doctor,
    currentUser: User,
    checkInData: CheckInData,
    queueNumber: string
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // หัวกระดาษ - ใหญ่และเด่น
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Check-in Report', pageWidth / 2, 25, { align: 'center' });
    
    // ข้อมูลโรงพยาบาล
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sample Hospital', pageWidth / 2, 35, { align: 'center' });
    doc.text('Electronic Medical Record System', pageWidth / 2, 42, { align: 'center' });
    
    // เส้นแบ่ง
    doc.setLineWidth(0.5);
    doc.line(20, 50, pageWidth - 20, 50);
    
    // ข้อมูลพื้นฐาน - จัดเรียงให้สวยงาม
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Check-in Information', 20, 60);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatLocalDateTime(new Date())}`, 20, 70);
    doc.text(`Time: ${formatLocalTime(new Date())}`, 20, 78);
    doc.text(`Queue Number: ${queueNumber}`, pageWidth - 20, 70, { align: 'right' });
    
    // ข้อมูลผู้ป่วย - ใช้กล่อง
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, 95);
    
    // วาดกล่องรอบข้อมูลผู้ป่วย
    doc.setLineWidth(0.3);
    doc.rect(20, 100, pageWidth - 40, 60);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    let yPos = 110;
    
    const patientData = [
      ['Hospital Number:', patient.hn || 'N/A'],
      ['Name:', `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'N/A'],
      ['National ID:', patient.national_id || 'N/A'],
      ['Birth Date:', patient.birth_date ? new Date(patient.birth_date).toLocaleString('en-US') : 'N/A'],
      ['Age:', patient.birth_date ? this.calculateAge(patient.birth_date) + ' years' : 'N/A'],
      ['Gender:', patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'N/A'],
      ['Phone:', patient.phone || 'N/A'],
      ['Address:', patient.address || 'N/A']
    ];
    
    patientData.forEach(([label, value]) => {
      doc.text(label, 25, yPos);
      doc.text(value, 80, yPos);
      yPos += 6;
    });
    
    // ข้อมูลการรักษา - ใช้กล่อง
    yPos = 170;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Treatment Information', 20, yPos);
    
    // วาดกล่องรอบข้อมูลการรักษา
    doc.rect(20, yPos + 5, pageWidth - 40, 80);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const treatmentData = [
      ['Treatment Type:', this.getTreatmentTypeLabel(checkInData.treatmentType) || 'N/A'],
      ['Attending Doctor:', doctor.name || 'N/A'],
      ['Department:', doctor.department || 'N/A'],
      ['Specialization:', doctor.specialization || 'N/A'],
      ['Visit Date:', checkInData.visitTime ? formatLocalDateTime(new Date(checkInData.visitTime)) : 'N/A'],
      ['Visit Time:', checkInData.visitTime ? formatLocalTime(new Date(checkInData.visitTime)) : 'N/A'],
      ['Chief Complaint:', checkInData.symptoms || 'N/A'],
      ['Notes:', checkInData.notes || 'N/A']
    ];
    
    treatmentData.forEach(([label, value]) => {
      doc.text(label, 25, yPos);
      // แบ่งข้อความยาว
      const lines = doc.splitTextToSize(value, 100);
      doc.text(lines, 80, yPos);
      yPos += lines.length * 6;
    });
    
    // ข้อมูลผู้สร้างคิว - ใช้กล่อง
    yPos = 260;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Staff Information', 20, yPos);
    
    // วาดกล่องรอบข้อมูลผู้สร้างคิว
    doc.rect(20, yPos + 5, pageWidth - 40, 50);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const staffData = [
      ['Name:', `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'N/A'],
      ['Position:', this.getRoleLabel(currentUser.role) || 'N/A'],
      ['Department:', currentUser.departmentId || 'N/A'],
      ['Employee ID:', currentUser.employeeId || 'N/A'],
      ['Created Date:', formatLocalDateTime(new Date())],
      ['Created Time:', formatLocalTime(new Date())]
    ];
    
    staffData.forEach(([label, value]) => {
      doc.text(label, 25, yPos);
      doc.text(value, 80, yPos);
      yPos += 6;
    });
    
    // ลายเซ็น - จัดให้สวยงาม
    yPos = 320;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Signatures', 20, yPos);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Staff Signature', 20, yPos);
    doc.text('Doctor Signature', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 20;
    doc.text('_________________', 20, yPos);
    doc.text('_________________', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 10;
    doc.text(`(${`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'N/A'})`, 20, yPos);
    doc.text(`(${doctor.name || 'N/A'})`, pageWidth - 20, yPos, { align: 'right' });
  }
  
  /**
   * สร้าง PDF แบบ fallback
   */
  private static createFallbackPDF(
    doc: jsPDF,
    patient: MedicalPatient,
    doctor: Doctor,
    currentUser: User,
    checkInData: CheckInData,
    queueNumber: string
  ): void {
    doc.setFontSize(14);
    doc.text('Check-in Report', 20, 30);
    doc.setFontSize(10);
    doc.text(`Queue Number: ${queueNumber}`, 20, 45);
    doc.text(`Patient: ${patient.hn || 'N/A'}`, 20, 55);
    doc.text(`Doctor: ${doctor.name || 'N/A'}`, 20, 65);
    doc.text(`Date: ${formatLocalDateTime(new Date())}`, 20, 75);
  }
  
  /**
   * สร้าง HTML content สำหรับ PDF
   */
  private static generateHTMLContent(
    patient: MedicalPatient,
    doctor: Doctor,
    currentUser: User,
    checkInData: CheckInData,
    queueNumber: string
  ): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานการเช็คอินผู้ป่วย</h1>
            <h2>โรงพยาบาลตัวอย่าง</h2>
            <p>ระบบบันทึกสุขภาพอิเล็กทรอนิกส์</p>
          </div>
          
          <div class="section">
            <h3>ข้อมูลการเช็คอิน</h3>
            <p><span class="label">วันที่:</span> <span class="value">${formatLocalDateTime(new Date())}</span></p>
            <p><span class="label">เวลา:</span> <span class="value">${formatLocalTime(new Date())}</span></p>
            <p><span class="label">หมายเลขคิว:</span> <span class="value">${queueNumber}</span></p>
          </div>
          
          <div class="section">
            <h3>ข้อมูลผู้ป่วย</h3>
            <p><span class="label">หมายเลข HN:</span> <span class="value">${patient.hn || 'ไม่ระบุ'}</span></p>
            <p><span class="label">ชื่อ-นามสกุล:</span> <span class="value">${patient.firstName || ''} ${patient.lastName || ''}</span></p>
            <p><span class="label">เลขบัตรประชาชน:</span> <span class="value">${patient.national_id || 'ไม่ระบุ'}</span></p>
            <p><span class="label">วันเกิด:</span> <span class="value">${patient.birth_date ? new Date(patient.birth_date).toLocaleString('th-TH') : 'ไม่ระบุ'}</span></p>
            <p><span class="label">อายุ:</span> <span class="value">${patient.birth_date ? this.calculateAge(patient.birth_date) + ' ปี' : 'ไม่ระบุ'}</span></p>
            <p><span class="label">เพศ:</span> <span class="value">${patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}</span></p>
            <p><span class="label">เบอร์โทรศัพท์:</span> <span class="value">${patient.phone || 'ไม่ระบุ'}</span></p>
            <p><span class="label">ที่อยู่:</span> <span class="value">${patient.address || 'ไม่ระบุ'}</span></p>
          </div>
          
          <div class="section">
            <h3>ข้อมูลการรักษา</h3>
            <p><span class="label">ประเภทการรักษา:</span> <span class="value">${this.getTreatmentTypeLabel(checkInData.treatmentType) || 'ไม่ระบุ'}</span></p>
            <p><span class="label">แพทย์ผู้ตรวจ:</span> <span class="value">${doctor.name || 'ไม่ระบุ'}</span></p>
            <p><span class="label">แผนก:</span> <span class="value">${doctor.department || 'ไม่ระบุ'}</span></p>
            <p><span class="label">ความเชี่ยวชาญ:</span> <span class="value">${doctor.specialization || 'ไม่ระบุ'}</span></p>
            <p><span class="label">วันที่มาตรวจ:</span> <span class="value">${checkInData.visitTime ? formatLocalDateTime(new Date(checkInData.visitTime)) : 'ไม่ระบุ'}</span></p>
            <p><span class="label">เวลาที่มาตรวจ:</span> <span class="value">${checkInData.visitTime ? formatLocalTime(new Date(checkInData.visitTime)) : 'ไม่ระบุ'}</span></p>
            <p><span class="label">อาการเบื้องต้น:</span> <span class="value">${checkInData.symptoms || 'ไม่ระบุ'}</span></p>
            <p><span class="label">หมายเหตุ:</span> <span class="value">${checkInData.notes || 'ไม่ระบุ'}</span></p>
          </div>
          
          <div class="section">
            <h3>ข้อมูลผู้สร้างคิว</h3>
            <p><span class="label">ชื่อ-นามสกุล:</span> <span class="value">${currentUser.firstName || ''} ${currentUser.lastName || ''}</span></p>
            <p><span class="label">ตำแหน่ง:</span> <span class="value">${this.getRoleLabel(currentUser.role) || 'ไม่ระบุ'}</span></p>
            <p><span class="label">แผนก:</span> <span class="value">${currentUser.departmentId || 'ไม่ระบุ'}</span></p>
            <p><span class="label">รหัสพนักงาน:</span> <span class="value">${currentUser.employeeId || 'ไม่ระบุ'}</span></p>
            <p><span class="label">วันที่สร้าง:</span> <span class="value">${formatLocalDateTime(new Date())}</span></p>
            <p><span class="label">เวลาที่สร้าง:</span> <span class="value">${formatLocalTime(new Date())}</span></p>
          </div>
          
          <div class="section">
            <h3>ลายเซ็น</h3>
            <p><span class="label">ผู้สร้างคิว:</span> <span class="value">${currentUser.firstName || ''} ${currentUser.lastName || ''}</span></p>
            <p><span class="label">แพทย์ผู้ตรวจ:</span> <span class="value">${doctor.name || 'ไม่ระบุ'}</span></p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * คำนวณอายุจากวันเกิด
   */
  private static calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * แปลงประเภทการรักษาเป็นภาษาอังกฤษ
   */
  private static getTreatmentTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'walk_in': 'Walk-in Visit',
      'opd': 'OPD - General Consultation',
      'health_check': 'Health Check-up',
      'vaccination': 'Vaccination',
      'emergency': 'Emergency',
      'followup': 'Follow-up Visit'
    };
    return types[type] || type;
  }
  
  /**
   * แปลงบทบาทเป็นภาษาอังกฤษ
   */
  private static getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Administrator',
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'pharmacist': 'Pharmacist',
      'lab_tech': 'Lab Technician',
      'staff': 'Staff',
      'patient': 'Patient'
    };
    return roles[role] || role;
  }
}