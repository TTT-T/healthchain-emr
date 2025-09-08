import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/types/api';

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId?: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  reason: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  createdBy: string;
  reminderSent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface UpdateAppointmentRequest {
  doctorId?: string;
  appointmentType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  reason?: string;
  notes?: string;
  status?: string;
  priority?: string;
  location?: string;
  reminderSent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface AppointmentRecord {
  id: string;
  patientId: string;
  doctorId?: string;
  recordType: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  reason: string;
  notes?: string;
  status: string;
  priority: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reminderSent: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
  patient?: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
  doctor?: {
    thaiName: string;
  };
}

/**
 * Appointment Service
 * จัดการข้อมูลนัดหมาย
 */
export class AppointmentService {
  /**
   * สร้างนัดหมาย
   */
  static async createAppointment(data: CreateAppointmentRequest): Promise<APIResponse<AppointmentRecord>> {
    try {
      const response = await apiClient.post('/medical/appointments', data);
      return response as APIResponse<AppointmentRecord>;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนัดหมายโดย ID
   */
  static async getAppointmentById(id: string): Promise<APIResponse<AppointmentRecord>> {
    try {
      const response = await apiClient.get(`/medical/appointments/${id}`);
      return response as APIResponse<AppointmentRecord>;
    } catch (error) {
      logger.error('Error retrieving appointment:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนัดหมายของผู้ป่วย
   */
  static async getAppointmentsByPatient(patientId: string): Promise<APIResponse<AppointmentRecord[]>> {
    try {
      const response = await apiClient.get(`/medical/patients/${patientId}/appointments`);
      return response as APIResponse<AppointmentRecord[]>;
    } catch (error) {
      logger.error('Error retrieving patient appointments:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนัดหมายของแพทย์
   */
  static async getAppointmentsByDoctor(doctorId: string, date?: string): Promise<APIResponse<AppointmentRecord[]>> {
    try {
      const url = date 
        ? `/medical/doctors/${doctorId}/appointments?date=${date}`
        : `/medical/doctors/${doctorId}/appointments`;
      const response = await apiClient.get(url);
      return response as APIResponse<AppointmentRecord[]>;
    } catch (error) {
      logger.error('Error retrieving doctor appointments:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลนัดหมาย
   */
  static async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<APIResponse<AppointmentRecord>> {
    try {
      const response = await apiClient.put(`/medical/appointments/${id}`, data);
      return response as APIResponse<AppointmentRecord>;
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * ลบนัดหมาย
   */
  static async deleteAppointment(id: string): Promise<APIResponse<{ id: string }>> {
    try {
      const response = await apiClient.delete(`/medical/appointments/${id}`);
      return response as APIResponse<{ id: string }>;
    } catch (error) {
      logger.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก UI form เป็น API format
   */
  static formatAppointmentDataForAPI(appointmentData: any, patientId: string, createdBy: string): CreateAppointmentRequest {
    return {
      patientId,
      doctorId: appointmentData.doctorId,
      appointmentType: appointmentData.appointmentType,
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      duration: appointmentData.duration || 30,
      reason: appointmentData.reason,
      notes: appointmentData.notes,
      status: appointmentData.status || 'scheduled',
      priority: appointmentData.priority || 'medium',
      location: appointmentData.location,
      createdBy,
      reminderSent: appointmentData.reminderSent || false,
      followUpRequired: appointmentData.followUpRequired || false,
      followUpDate: appointmentData.followUpDate
    };
  }

  /**
   * แปลงข้อมูลจาก API เป็น UI format
   */
  static formatAppointmentDataFromAPI(record: AppointmentRecord): any {
    return {
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentType: record.appointmentType,
      appointmentDate: record.appointmentDate,
      appointmentTime: record.appointmentTime,
      duration: record.duration,
      reason: record.reason,
      notes: record.notes,
      status: record.status,
      priority: record.priority,
      location: record.location,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      reminderSent: record.reminderSent,
      followUpRequired: record.followUpRequired,
      followUpDate: record.followUpDate,
      patient: record.patient,
      doctor: record.doctor
    };
  }

  /**
   * สร้างข้อมูลเริ่มต้นสำหรับฟอร์ม
   */
  static createEmptyAppointmentData(): any {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      doctorId: '',
      appointmentType: '',
      appointmentDate: tomorrow.toISOString().split('T')[0],
      appointmentTime: '09:00',
      duration: 30,
      reason: '',
      notes: '',
      status: 'scheduled',
      priority: 'medium',
      location: '',
      reminderSent: false,
      followUpRequired: false,
      followUpDate: ''
    };
  }

  /**
   * ตรวจสอบความถูกต้องของข้อมูลนัดหมาย
   */
  static validateAppointmentData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.appointmentType?.trim()) {
      errors.push('กรุณาเลือกประเภทนัดหมาย');
    }
    if (!data.appointmentDate) {
      errors.push('กรุณาเลือกวันที่นัดหมาย');
    }
    if (!data.appointmentTime) {
      errors.push('กรุณาเลือกเวลานัดหมาย');
    }
    if (!data.reason?.trim()) {
      errors.push('กรุณากรอกเหตุผลในการนัดหมาย');
    }
    if (!data.status) {
      errors.push('กรุณาเลือกสถานะนัดหมาย');
    }
    if (!data.priority) {
      errors.push('กรุณาเลือกความสำคัญ');
    }

    // ตรวจสอบวันที่ไม่เป็นอดีต
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const now = new Date();
    if (appointmentDateTime < now) {
      errors.push('ไม่สามารถนัดหมายในอดีตได้');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * กำหนดสีตามสถานะนัดหมาย
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'no_show':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * กำหนดข้อความสถานะเป็นภาษาไทย
   */
  static getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'นัดแล้ว';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'cancelled':
        return 'ยกเลิก';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'no_show':
        return 'ไม่มาตามนัด';
      default:
        return 'ไม่ระบุ';
    }
  }

  /**
   * กำหนดสีตามความสำคัญ
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low':
        return 'text-gray-600 bg-gray-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'urgent':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * กำหนดข้อความความสำคัญเป็นภาษาไทย
   */
  static getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low':
        return 'ต่ำ';
      case 'medium':
        return 'ปานกลาง';
      case 'high':
        return 'สูง';
      case 'urgent':
        return 'ด่วน';
      default:
        return 'ไม่ระบุ';
    }
  }

  /**
   * คำนวณเวลาสิ้นสุดนัดหมาย
   */
  static calculateEndTime(appointmentTime: string, duration: number): string {
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  /**
   * ตรวจสอบความขัดแย้งของเวลานัดหมาย
   */
  static checkTimeConflict(appointments: AppointmentRecord[], newAppointment: any): boolean {
    const newStart = new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`);
    const newEnd = new Date(newStart.getTime() + (newAppointment.duration || 30) * 60000);

    return appointments.some(appointment => {
      if (appointment.appointmentDate !== newAppointment.appointmentDate) return false;
      
      const existingStart = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      const existingEnd = new Date(existingStart.getTime() + appointment.duration * 60000);

      return (newStart < existingEnd && newEnd > existingStart);
    });
  }

  /**
   * จัดรูปแบบวันที่และเวลาให้อ่านง่าย
   */
  static formatDateTime(date: string, time: string): string {
    const appointmentDate = new Date(`${date}T${time}`);
    return appointmentDate.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}