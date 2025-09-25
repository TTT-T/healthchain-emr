import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface PatientSummary {
  patient: {
    id: string;
    thaiName: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    hospitalNumber: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergencyContact: string;
    created_at: string;
    updated_at: string;
  };
  records: {
    visits: any[];
    vitalSigns: any[];
    historyTaking: any[];
    doctorVisits: any[];
    pharmacy: any[];
    labResults: any[];
    appointments: any[];
    documents: any[];
  };
  summary: {
    totalVisits: number;
    totalAppointments: number;
    totalDocuments: number;
    totalLabResults: number;
    totalPharmacyRecords: number;
    lastVisit: string | null;
    lastAppointment: string | null;
    upcomingAppointments: number;
  };
}

export interface TimelineItem {
  id: string;
  recordType: string;
  recordedBy: string;
  recordedByName: string;
  doctorName: string;
  recordedTime: string;
  created_at: string;
  title: string;
  description: string;
  data: any;
}

/**
 * Patient Summary Service
 * จัดการข้อมูลประวัติผู้ป่วยแบบครบถ้วน
 */
export class PatientSummaryService {
  /**
   * ดึงข้อมูลประวัติผู้ป่วยแบบครบถ้วน
   */
  static async getPatientSummary(patientId: string): Promise<APIResponse<PatientSummary>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/summary`);
      return response as APIResponse<PatientSummary>;
    } catch (error) {
      logger.error('Error retrieving patient summary:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลไทม์ไลน์ผู้ป่วย
   */
  static async getPatientTimeline(patientId: string, limit: number = 50, offset: number = 0): Promise<APIResponse<TimelineItem[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/timeline?limit=${limit}&offset=${offset}`);
      return response as APIResponse<TimelineItem[]>;
    } catch (error) {
      logger.error('Error retrieving patient timeline:', error);
      throw error;
    }
  }

  /**
   * กำหนดสีตามประเภทบันทึก
   */
  static getRecordTypeColor(recordType: string): string {
    switch (recordType) {
      case 'visit':
        return 'text-blue-600 bg-blue-100';
      case 'vital_signs':
        return 'text-green-600 bg-green-100';
      case 'history_taking':
        return 'text-purple-600 bg-purple-100';
      case 'doctor_visit':
        return 'text-orange-600 bg-orange-100';
      case 'pharmacy_dispensing':
        return 'text-red-600 bg-red-100';
      case 'lab_result':
        return 'text-indigo-600 bg-indigo-100';
      case 'appointment':
        return 'text-pink-600 bg-pink-100';
      case 'document':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * กำหนดไอคอนตามประเภทบันทึก
   */
  static getRecordTypeIcon(recordType: string): string {
    switch (recordType) {
      case 'visit':
        return '🏥';
      case 'vital_signs':
        return '💓';
      case 'history_taking':
        return '📋';
      case 'doctor_visit':
        return '👨‍⚕️';
      case 'pharmacy_dispensing':
        return '💊';
      case 'lab_result':
        return '🧪';
      case 'appointment':
        return '📅';
      case 'document':
        return '📄';
      default:
        return '📝';
    }
  }

  /**
   * กำหนดข้อความประเภทบันทึกเป็นภาษาไทย
   */
  static getRecordTypeLabel(recordType: string): string {
    switch (recordType) {
      case 'visit':
        return 'การเยี่ยม';
      case 'vital_signs':
        return 'สัญญาณชีพ';
      case 'history_taking':
        return 'ซักประวัติ';
      case 'doctor_visit':
        return 'ตรวจโดยแพทย์';
      case 'pharmacy_dispensing':
        return 'จ่ายยา';
      case 'lab_result':
        return 'ผลแลบ';
      case 'appointment':
        return 'นัดหมาย';
      case 'document':
        return 'เอกสาร';
      default:
        return 'บันทึก';
    }
  }

  /**
   * จัดรูปแบบวันที่และเวลาให้อ่านง่าย
   */
  static formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * จัดรูปแบบวันที่ให้อ่านง่าย
   */
  static formatDate(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * คำนวณอายุจากวันเกิด
   */
  static calculateAge(birthDate: string): number {
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
   * ตรวจสอบว่าบันทึกเป็นของวันนี้หรือไม่
   */
  static isToday(dateTime: string): boolean {
    const today = new Date();
    const recordDate = new Date(dateTime);
    return today.toLocaleString() === recordDate.toLocaleString();
  }

  /**
   * ตรวจสอบว่าบันทึกเป็นของสัปดาห์นี้หรือไม่
   */
  static isThisWeek(dateTime: string): boolean {
    const today = new Date();
    const recordDate = new Date(dateTime);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return recordDate >= weekAgo && recordDate <= today;
  }

  /**
   * เรียงลำดับบันทึกตามเวลา
   */
  static sortRecordsByTime(records: any[]): any[] {
    return records.sort((a, b) => new Date(b.recordedTime).getTime() - new Date(a.recordedTime).getTime());
  }

  /**
   * กรองบันทึกตามประเภท
   */
  static filterRecordsByType(records: any[], recordType: string): any[] {
    return records.filter(record => record.recordType === recordType);
  }

  /**
   * กรองบันทึกตามช่วงเวลา
   */
  static filterRecordsByDateRange(records: any[], startDate: string, endDate: string): any[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return records.filter(record => {
      const recordDate = new Date(record.recordedTime);
      return recordDate >= start && recordDate <= end;
    });
  }

  /**
   * สร้างข้อมูลสถิติจากบันทึก
   */
  static generaatistics(records: any[]): {
    totalRecords: number;
    recordsByType: Record<string, number>;
    recordsByMonth: Record<string, number>;
    mostActiveMonth: string;
    mostCommonType: string;
  } {
    const recordsByType: Record<string, number> = {};
    const recordsByMonth: Record<string, number> = {};
    
    records.forEach(record => {
      // Count by type
      recordsByType[record.recordType] = (recordsByType[record.recordType] || 0) + 1;
      
      // Count by month
      const month = new Date(record.recordedTime).toLocaleString('th-TH', { year: 'numeric', month: 'long' });
      recordsByMonth[month] = (recordsByMonth[month] || 0) + 1;
    });
    
    // Find most active month
    const mostActiveMonth = Object.entries(recordsByMonth).reduce((a, b) => 
      recordsByMonth[a[0]] > recordsByMonth[b[0]] ? a : b
    )[0] || 'ไม่มีข้อมูล';
    
    // Find most common type
    const mostCommonType = Object.entries(recordsByType).reduce((a, b) => 
      recordsByType[a[0]] > recordsByType[b[0]] ? a : b
    )[0] || 'ไม่มีข้อมูล';
    
    return {
      totalRecords: records.length,
      recordsByType,
      recordsByMonth,
      mostActiveMonth,
      mostCommonType
    };
  }

  /**
   * สร้างข้อมูลสรุปสำหรับการแสดงผล
   */
  static createSummaryCards(summary: any): Array<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
    description: string;
  }> {
    return [
      {
        title: 'การเยี่ยมทั้งหมด',
        value: summary.totalVisits,
        icon: '🏥',
        color: 'blue',
        description: 'จำนวนครั้งที่มาเยี่ยม'
      },
      {
        title: 'นัดหมายทั้งหมด',
        value: summary.totalAppointments,
        icon: '📅',
        color: 'green',
        description: 'จำนวนนัดหมายทั้งหมด'
      },
      {
        title: 'นัดหมายที่รอ',
        value: summary.upcomingAppointments,
        icon: '⏰',
        color: 'orange',
        description: 'นัดหมายที่ยังไม่มาถึง'
      },
      {
        title: 'เอกสารทั้งหมด',
        value: summary.totalDocuments,
        icon: '📄',
        color: 'purple',
        description: 'เอกสารที่ออกให้'
      },
      {
        title: 'ผลแลบทั้งหมด',
        value: summary.totalLabResults,
        icon: '🧪',
        color: 'indigo',
        description: 'ผลการตรวจแลบ'
      },
      {
        title: 'การจ่ายยา',
        value: summary.totalPharmacyRecords,
        icon: '💊',
        color: 'red',
        description: 'ครั้งที่จ่ายยา'
      }
    ];
  }
}
