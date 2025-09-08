import jsPDF from 'jspdf';
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ตั้งค่าฟอนต์
    doc.setFont('helvetica');
    
    // หัวกระดาษ
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('รายงานการเช็คอินผู้ป่วย', pageWidth / 2, 30, { align: 'center' });
    
    // ข้อมูลโรงพยาบาล
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('โรงพยาบาลตัวอย่าง', pageWidth / 2, 40, { align: 'center' });
    doc.text('ระบบบันทึกสุขภาพอิเล็กทรอนิกส์', pageWidth / 2, 47, { align: 'center' });
    
    // เส้นแบ่ง
    doc.setLineWidth(0.5);
    doc.line(20, 55, pageWidth - 20, 55);
    
    // ข้อมูลการสร้างรายงาน
    doc.setFontSize(10);
    doc.text(`วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 20, 65);
    doc.text(`เวลา: ${new Date().toLocaleTimeString('th-TH')}`, 20, 72);
    doc.text(`หมายเลขคิว: ${queueNumber}`, pageWidth - 20, 65, { align: 'right' });
    
    // ข้อมูลผู้ป่วย
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ข้อมูลผู้ป่วย', 20, 90);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 100;
    
    const patientData = [
      ['หมายเลข HN:', patient.hn],
      ['ชื่อ-นามสกุล:', patient.thai_name || `${patient.firstName} ${patient.lastName}`],
      ['เลขบัตรประชาชน:', patient.national_id || 'ไม่ระบุ'],
      ['วันเกิด:', patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('th-TH') : 'ไม่ระบุ'],
      ['อายุ:', patient.birth_date ? this.calculateAge(patient.birth_date) + ' ปี' : 'ไม่ระบุ'],
      ['เพศ:', patient.gender === 'male' ? 'ชาย' : 'หญิง'],
      ['เบอร์โทรศัพท์:', patient.phone || 'ไม่ระบุ'],
      ['ที่อยู่:', patient.address || 'ไม่ระบุ']
    ];
    
    patientData.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // ข้อมูลการรักษา
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ข้อมูลการรักษา', 20, yPos);
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const treatmentData = [
      ['ประเภทการรักษา:', this.getTreatmentTypeLabel(checkInData.treatmentType)],
      ['แพทย์ผู้ตรวจ:', doctor.name],
      ['แผนก:', doctor.department],
      ['ความเชี่ยวชาญ:', doctor.specialization],
      ['วันที่มาตรวจ:', new Date(checkInData.visitTime).toLocaleDateString('th-TH')],
      ['เวลาที่มาตรวจ:', new Date(checkInData.visitTime).toLocaleTimeString('th-TH')],
      ['อาการเบื้องต้น:', checkInData.symptoms || 'ไม่ระบุ'],
      ['หมายเหตุ:', checkInData.notes || 'ไม่ระบุ']
    ];
    
    treatmentData.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      // แบ่งข้อความยาว
      const lines = doc.splitTextToSize(value, 100);
      doc.text(lines, 80, yPos);
      yPos += lines.length * 7;
    });
    
    // ข้อมูลผู้สร้างคิว
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ข้อมูลผู้สร้างคิว', 20, yPos);
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const staffData = [
      ['ชื่อ-นามสกุล:', currentUser.thaiName || `${currentUser.firstName} ${currentUser.lastName}`],
      ['ตำแหน่ง:', this.getRoleLabel(currentUser.role)],
      ['แผนก:', currentUser.departmentId || 'ไม่ระบุ'],
      ['รหัสพนักงาน:', currentUser.employeeId || 'ไม่ระบุ'],
      ['วันที่สร้าง:', new Date().toLocaleDateString('th-TH')],
      ['เวลาที่สร้าง:', new Date().toLocaleTimeString('th-TH')]
    ];
    
    staffData.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // ข้อมูลคิว
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ข้อมูลคิว', 20, yPos);
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const queueData = [
      ['หมายเลขคิว:', queueNumber],
      ['คิวที่รออยู่:', doctor.currentQueue + ' คิว'],
      ['เวลารอโดยประมาณ:', doctor.estimatedWaitTime + ' นาที'],
      ['สถานะ:', 'รอตรวจ']
    ];
    
    queueData.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });
    
    // ลายเซ็น
    yPos += 20;
    doc.setFontSize(10);
    doc.text('ลายเซ็นผู้สร้างคิว', 20, yPos);
    doc.text('ลายเซ็นแพทย์ผู้ตรวจ', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 30;
    doc.text('_________________', 20, yPos);
    doc.text('_________________', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 10;
    doc.text(`(${currentUser.thaiName || `${currentUser.firstName} ${currentUser.lastName}`})`, 20, yPos);
    doc.text(`(${doctor.name})`, pageWidth - 20, yPos, { align: 'right' });
    
    // สร้าง Blob และเก็บลงระบบ
    const pdfBlob = doc.output('blob');
    
    // เก็บ PDF ลงระบบ
    const pdfRecord = await PDFStorageService.createAndStorePDF(
      doc,
      patient.hn,
      patient.thai_name || `${patient.firstName} ${patient.lastName}`,
      queueNumber,
      currentUser.thaiName || `${currentUser.firstName} ${currentUser.lastName}`,
      undefined, // visitId
      doctor.name,
      doctor.department,
      this.getTreatmentTypeLabel(checkInData.treatmentType)
    );
    
    // ส่งการแจ้งเตือนให้ผู้ป่วย
    await NotificationService.notifyPatient({
      patientHn: patient.hn,
      patientName: patient.thai_name || `${patient.firstName} ${patient.lastName}`,
      queueNumber,
      doctorName: doctor.name,
      department: doctor.department,
      visitTime: checkInData.visitTime,
      treatmentType: this.getTreatmentTypeLabel(checkInData.treatmentType),
      estimatedWaitTime: doctor.estimatedWaitTime,
      pdfUrl: pdfRecord.fileUrl
    });
    
    // บันทึกไฟล์ (สำหรับดาวน์โหลดทันที)
    const fileName = `checkin-report-${patient.hn}-${queueNumber}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }
  
  /**
   * คำนวณอายุ
   */
  private static calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * แปลงประเภทการรักษาเป็นภาษาไทย
   */
  private static getTreatmentTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'opd': 'OPD - ตรวจรักษาทั่วไป',
      'health_check': 'ตรวจสุขภาพ',
      'vaccination': 'ฉีดวัคซีน',
      'emergency': 'ฉุกเฉิน',
      'followup': 'นัดติดตามผล'
    };
    return types[type] || type;
  }
  
  /**
   * แปลงบทบาทเป็นภาษาไทย
   */
  private static getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'ผู้ดูแลระบบ',
      'doctor': 'แพทย์',
      'nurse': 'พยาบาล',
      'pharmacist': 'เภสัชกร',
      'lab_tech': 'เทคนิคการแพทย์',
      'staff': 'เจ้าหน้าที่',
      'patient': 'ผู้ป่วย'
    };
    return roles[role] || role;
  }
}
