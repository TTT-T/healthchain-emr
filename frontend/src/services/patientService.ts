import { apiClient } from '@/lib/api';
import { 
  MedicalPatient, 
  CreatePatientRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Patient Service
 * จัดการข้อมูลผู้ป่วยทั้งหมด
 */
export class PatientService {
  /**
   * ค้นหาผู้ป่วย
   */
  static async searchPatients(query: string, type: 'hn' | 'queue' | 'name' = 'name') {
    try {
      const params: any = {};
      
      if (type === 'hn') {
        params.hn = query;
      } else if (type === 'queue') {
        params.queue = query;
      } else {
        params.search = query;
      }

      const response = await apiClient.getPatients(params);
      return response;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  /**
   * สร้างผู้ป่วยใหม่
   */
  static async createPatient(data: CreatePatientRequest): Promise<APIResponse<MedicalPatient>> {
    try {
      // แปลงจาก CreatePatientRequest เป็น format ที่ backend ต้องการ
      const patientData = {
        hospitalNumber: data.hospitalNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        thaiName: data.thaiName,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        religion: data.religion,
        phone: data.phone,
        email: data.email,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        bloodType: data.bloodType,
        allergies: data.allergies,
        medicalHistory: data.medicalHistory,
        currentMedications: data.currentMedications,
        insuranceType: data.insuranceType,
        insuranceNumber: data.insuranceNumber,
        insuranceExpiryDate: data.insuranceExpiryDate,
        district: data.district,
        province: data.province,
        postalCode: data.postalCode,
      };

      const response = await apiClient.createPatient(patientData);
      return response;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลผู้ป่วยโดย ID (สำหรับ patient เอง)
   */
  static async getPatient(id: string): Promise<APIResponse<MedicalPatient>> {
    try {
      // For patient getting their own profile, use profile endpoint
      const response = await apiClient.getPatientProfile();
      return response;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลผู้ป่วย
   */
  static async updatePatient(id: string, data: Partial<MedicalPatient>): Promise<APIResponse<MedicalPatient>> {
    try {
      const response = await apiClient.updatePatient(id, data);
      return response;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * ดึงรายการผู้ป่วยทั้งหมด
   */
  static async listPatients(params?: { 
    page?: number; 
    limit?: number; 
    search?: string 
  }): Promise<APIResponse<MedicalPatient[]>> {
    try {
      const response = await apiClient.getPatients(params);
      return response;
    } catch (error) {
      console.error('Error listing patients:', error);
      throw error;
    }
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
   * สร้าง Hospital Number แบบจำลอง (สำหรับ UI เท่านั้น)
   */
  static generateHN(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `${year}-${random}`;
  }
}

export default PatientService;
