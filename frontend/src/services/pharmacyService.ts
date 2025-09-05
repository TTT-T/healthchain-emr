import { apiClient } from '@/lib/api';
import { 
  MedicalPrescription, 
  CreatePrescriptionRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Pharmacy Service
 * จัดการข้อมูลร้านยาและใบสั่งยา
 */
export class PharmacyService {
  /**
   * สร้างใบสั่งยา
   */
  static async createPrescription(data: CreatePrescriptionRequest): Promise<APIResponse<MedicalPrescription>> {
    try {
      const response = await apiClient.createPrescription(data);
      return response;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลใบสั่งยาโดย ID
   */
  static async getPrescription(id: string): Promise<APIResponse<MedicalPrescription>> {
    try {
      const response = await apiClient.getPrescription(id);
      return response;
    } catch (error) {
      console.error('Error getting prescription:', error);
      throw error;
    }
  }

  /**
   * อัปเดตใบสั่งยา
   */
  static async updatePrescription(id: string, data: Partial<MedicalPrescription>): Promise<APIResponse<MedicalPrescription>> {
    try {
      const response = await apiClient.updatePrescription(id, data);
      return response;
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  /**
   * อัปเดตรายการยา
   */
  static async updatePrescriptionItem(id: string, data: any): Promise<APIResponse<any>> {
    try {
      const response = await apiClient.updatePrescriptionItem(id, data);
      return response;
    } catch (error) {
      console.error('Error updating prescription item:', error);
      throw error;
    }
  }

  /**
   * ดึงใบสั่งยาของการมาพบแพทย์
   */
  static async getPrescriptionsByVisit(visitId: string): Promise<APIResponse<MedicalPrescription[]>> {
    try {
      const response = await apiClient.getPrescriptionsByVisit(visitId);
      return response;
    } catch (error) {
      console.error('Error getting prescriptions by visit:', error);
      throw error;
    }
  }

  /**
   * รายการยาทั่วไป
   */
  static getCommonMedications(): { 
    name: string; 
    genericName: string; 
    strength: string; 
    unit: string;
    category: string;
  }[] {
    return [
      // ยาแก้ปวดลดไข้
      { name: 'พาราเซตามอล', genericName: 'Paracetamol', strength: '500', unit: 'mg', category: 'แก้ปวดลดไข้' },
      { name: 'ไอบูโพรเฟน', genericName: 'Ibuprofen', strength: '400', unit: 'mg', category: 'แก้ปวดลดไข้' },
      { name: 'แอสไพริน', genericName: 'Aspirin', strength: '100', unit: 'mg', category: 'แก้ปวดลดไข้' },
      
      // ยาปฏิชีวนะ
      { name: 'อมอกซีซิลลิน', genericName: 'Amoxicillin', strength: '500', unit: 'mg', category: 'ปฏิชีวนะ' },
      { name: 'เซฟาเล็กซิน', genericName: 'Cephalexin', strength: '500', unit: 'mg', category: 'ปฏิชีวนะ' },
      { name: 'อะซิโทรไมซิน', genericName: 'Azithromycin', strength: '250', unit: 'mg', category: 'ปฏิชีวนะ' },
      
      // ยาลดความดัน
      { name: 'เอนาลาพริล', genericName: 'Enalapril', strength: '5', unit: 'mg', category: 'ลดความดันโลหิต' },
      { name: 'แอมโลไดพิน', genericName: 'Amlodipine', strength: '5', unit: 'mg', category: 'ลดความดันโลหิต' },
      { name: 'ลอซาร์แทน', genericName: 'Losartan', strength: '50', unit: 'mg', category: 'ลดความดันโลหิต' },
      
      // ยาเบาหวาน
      { name: 'เมตฟอร์มิน', genericName: 'Metformin', strength: '500', unit: 'mg', category: 'เบาหวาน' },
      { name: 'กลิเบนคลาไมด์', genericName: 'Glibenclamide', strength: '5', unit: 'mg', category: 'เบาหวาน' },
      
      // ยาลดไขมัน
      { name: 'ซิมวาสแตติน', genericName: 'Simvastatin', strength: '20', unit: 'mg', category: 'ลดไขมัน' },
      { name: 'อะทอร์วาสแตติน', genericName: 'Atorvastatin', strength: '20', unit: 'mg', category: 'ลดไขมัน' },
      
      // ยาแก้แพ้
      { name: 'เซทิริซีน', genericName: 'Cetirizine', strength: '10', unit: 'mg', category: 'แก้แพ้' },
      { name: 'โลราทาไดน์', genericName: 'Loratadine', strength: '10', unit: 'mg', category: 'แก้แพ้' },
      
      // ยาระบบทางเดินหายใจ
      { name: 'ซัลบูทามอล', genericName: 'Salbutamol', strength: '2', unit: 'mg', category: 'ระบบทางเดินหายใจ' },
      { name: 'เทียโอฟิลลีน', genericName: 'Theophylline', strength: '200', unit: 'mg', category: 'ระบบทางเดินหายใจ' }
    ];
  }

  /**
   * รายการความถี่ในการใช้ยา
   */
  static getFrequencyOptions(): { value: string; label: string; timesPerDay: number }[] {
    return [
      { value: 'once_daily', label: 'วันละ 1 ครั้ง', timesPerDay: 1 },
      { value: 'twice_daily', label: 'วันละ 2 ครั้ง (เช้า-เย็น)', timesPerDay: 2 },
      { value: 'three_times_daily', label: 'วันละ 3 ครั้ง (เช้า-เที่ยง-เย็น)', timesPerDay: 3 },
      { value: 'four_times_daily', label: 'วันละ 4 ครั้ง (ทุก 6 ชั่วโมง)', timesPerDay: 4 },
      { value: 'every_8_hours', label: 'ทุก 8 ชั่วโมง', timesPerDay: 3 },
      { value: 'every_6_hours', label: 'ทุก 6 ชั่วโมง', timesPerDay: 4 },
      { value: 'every_4_hours', label: 'ทุก 4 ชั่วโมง', timesPerDay: 6 },
      { value: 'as_needed', label: 'เมื่อจำเป็น', timesPerDay: 0 }
    ];
  }

  /**
   * รายการระยะเวลาการใช้ยา
   */
  static getDurationOptions(): { value: string; label: string; days: number }[] {
    return [
      { value: '3_days', label: '3 วัน', days: 3 },
      { value: '5_days', label: '5 วัน', days: 5 },
      { value: '7_days', label: '7 วัน', days: 7 },
      { value: '10_days', label: '10 วัน', days: 10 },
      { value: '14_days', label: '14 วัน', days: 14 },
      { value: '30_days', label: '30 วัน', days: 30 },
      { value: '60_days', label: '60 วัน', days: 60 },
      { value: '90_days', label: '90 วัน', days: 90 },
      { value: 'continuous', label: 'ใช้ต่อเนื่อง', days: 0 }
    ];
  }

  /**
   * คำนวณจำนวนยาที่ต้องการ
   */
  static calculateQuantity(frequency: string, duration: string): number {
    const freq = this.getFrequencyOptions().find(f => f.value === frequency);
    const dur = this.getDurationOptions().find(d => d.value === duration);
    
    if (!freq || !dur || freq.timesPerDay === 0 || dur.days === 0) {
      return 0;
    }
    
    return freq.timesPerDay * dur.days;
  }

  /**
   * แปลงสถานะเป็นภาษาไทย
   */
  static getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'รอจ่ายยา',
      'dispensed': 'จ่ายยาแล้ว',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  }

  /**
   * แปลงสถานะเป็นสี
   */
  static getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'dispensed': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * สร้าง Prescription Number แบบจำลอง (สำหรับ UI เท่านั้น)
   */
  static generatePrescriptionNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `RX${year}${month}${day}${random}`;
  }

  /**
   * คำนวณราคาโดยประมาณ
   */
  static calculateEstimatedCost(medications: any[]): number {
    // ราคาประมาณการต่อเม็ด/หน่วย (บาท)
    const estimatedPrices: { [key: string]: number } = {
      'paracetamol': 0.5,
      'ibuprofen': 1.5,
      'aspirin': 0.3,
      'amoxicillin': 2.0,
      'cephalexin': 3.0,
      'azithromycin': 8.0,
      'enalapril': 1.0,
      'amlodipine': 1.5,
      'losartan': 3.0,
      'metformin': 0.8,
      'glibenclamide': 0.5,
      'simvastatin': 2.0,
      'atorvastatin': 4.0,
      'cetirizine': 2.0,
      'loratadine': 3.0,
      'salbutamol': 5.0,
      'theophylline': 1.5
    };

    return medications.reduce((total, med) => {
      const genericName = med.medicationName?.toLowerCase() || '';
      const matchedPrice = Object.entries(estimatedPrices).find(([key]) => 
        genericName.includes(key)
      );
      
      const pricePerUnit = matchedPrice ? matchedPrice[1] : 2.0; // ราคาเริ่มต้น 2 บาท
      const quantity = med.quantity || 0;
      
      return total + (pricePerUnit * quantity);
    }, 0);
  }

  /**
   * สร้างคำแนะนำการใช้ยา
   */
  static generateInstructions(medication: {
    medicationName: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }): string {
    const freq = this.getFrequencyOptions().find(f => f.value === medication.frequency);
    const dur = this.getDurationOptions().find(d => d.value === medication.duration);
    
    let instructions = `ใช้ ${freq?.label || medication.frequency}`;
    
    if (dur && dur.days > 0) {
      instructions += ` เป็นเวลา ${dur.label}`;
    } else if (medication.duration === 'continuous') {
      instructions += ` ใช้ต่อเนื่องตามแพทย์สั่ง`;
    }
    
    if (medication.instructions) {
      instructions += ` ${medication.instructions}`;
    }
    
    return instructions;
  }
}

export default PharmacyService;
