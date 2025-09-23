import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface Doctor {
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

export interface CreateDoctorRequest {
  userId: string;
  medicalLicenseNumber: string;
  specialization: string;
  department: string;
  position?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  availability?: any;
}

export interface UpdateDoctorRequest {
  medicalLicenseNumber?: string;
  specialization?: string;
  department?: string;
  position?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  availability?: any;
}

/**
 * Doctor Service
 * จัดการข้อมูลแพทย์ในระบบ EMR
 */
export class DoctorService {
  /**
   * ดึงรายชื่อแพทย์ทั้งหมด
   */
  static async getDoctors(params?: {
    page?: number;
    limit?: number;
    department?: string;
    specialization?: string;
    is_available?: boolean;
  }) {
    try {
      logger.('📱 DoctorService.getDoctors called', params);
      const response = await apiClient.get('/medical/doctors', { params });
      
      logger.('✅ DoctorService.getDoctors success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.getDoctors error:', error);
      console.error('❌ DoctorService.getDoctors error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * ดึงข้อมูลแพทย์ตาม ID
   */
  static async getDoctorById(id: string) {
    try {
      logger.('📱 DoctorService.getDoctorById called', { id });
      
      const response = await apiClient.get(`/medical/doctors/${id}`);
      
      logger.('✅ DoctorService.getDoctorById success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.getDoctorById error:', error);
      throw error;
    }
  }

  /**
   * สร้างแพทย์ใหม่
   */
  static async createDoctor(data: CreateDoctorRequest) {
    try {
      logger.('📱 DoctorService.createDoctor called', data);
      
      const response = await apiClient.post('/medical/doctors', data);
      
      logger.('✅ DoctorService.createDoctor success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.createDoctor error:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลแพทย์
   */
  static async updateDoctor(id: string, data: UpdateDoctorRequest) {
    try {
      logger.('📱 DoctorService.updateDoctor called', { id, data });
      
      const response = await apiClient.post(`/medical/doctors/${id}/update`, data);
      
      logger.('✅ DoctorService.updateDoctor success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.updateDoctor error:', error);
      throw error;
    }
  }

  /**
   * ลบแพทย์
   */
  static async deleteDoctor(id: string) {
    try {
      logger.('📱 DoctorService.deleteDoctor called', { id });
      
      const response = await apiClient.post(`/medical/doctors/${id}/delete`, {});
      
      logger.('✅ DoctorService.deleteDoctor success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.deleteDoctor error:', error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะพร้อมตรวจ
   */
  static async updateAvailability(id: string, isAvailable: boolean) {
    try {
      logger.('📱 DoctorService.updateAvailability called', { id, isAvailable });
      
      const response = await apiClient.post(`/medical/doctors/${id}/availability`, { isAvailable });
      
      logger.('✅ DoctorService.updateAvailability success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.updateAvailability error:', error);
      throw error;
    }
  }

  /**
   * ดึงคิวปัจจุบันของแพทย์
   */
  static async getCurrentQueue(id: string) {
    try {
      logger.('📱 DoctorService.getCurrentQueue called', { id });
      
      const response = await apiClient.get(`/medical/doctors/${id}/queue`);
      
      logger.('✅ DoctorService.getCurrentQueue success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.getCurrentQueue error:', error);
      throw error;
    }
  }

  /**
   * ดึงแพทย์ที่พร้อมตรวจ (สำหรับ Check-in)
   */
  static async getAvailableDoctors() {
    try {
      logger.('📱 DoctorService.getAvailableDoctors called');
      
      const response = await this.getDoctors({
        is_available: true,
        limit: 100 // ดึงทั้งหมด
      });
      
      logger.('✅ DoctorService.getAvailableDoctors success:', response);
      return response;
    } catch (error) {
      logger.error('❌ DoctorService.getAvailableDoctors error:', error);
      throw error;
    }
  }
}
