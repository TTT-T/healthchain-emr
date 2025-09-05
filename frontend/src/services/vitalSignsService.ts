import { apiClient } from '@/lib/api';
import { 
  MedicalVitalSigns, 
  CreateVitalSignsRequest, 
  APIResponse 
} from '@/types/api';

/**
 * Vital Signs Service
 * จัดการข้อมูลสัญญาณชีพ
 */
export class VitalSignsService {
  /**
   * บันทึกสัญญาณชีพ
   */
  static async createVitalSigns(data: CreateVitalSignsRequest): Promise<APIResponse<MedicalVitalSigns>> {
    try {
      const response = await apiClient.createVitalSigns(data);
      return response;
    } catch (error) {
      console.error('Error creating vital signs:', error);
      throw error;
    }
  }

  /**
   * ดึงสัญญาณชีพของการมาพบแพทย์
   */
  static async getVitalSignsByVisit(visitId: string): Promise<APIResponse<MedicalVitalSigns[]>> {
    try {
      const response = await apiClient.getVitalSignsByVisit(visitId);
      return response;
    } catch (error) {
      console.error('Error getting vital signs:', error);
      throw error;
    }
  }

  /**
   * อัปเดตสัญญาณชีพ
   */
  static async updateVitalSigns(id: string, data: Partial<MedicalVitalSigns>): Promise<APIResponse<MedicalVitalSigns>> {
    try {
      const response = await apiClient.updateVitalSigns(id, data);
      return response;
    } catch (error) {
      console.error('Error updating vital signs:', error);
      throw error;
    }
  }

  /**
   * ลบสัญญาณชีพ
   */
  static async deleteVitalSigns(id: string): Promise<APIResponse<null>> {
    try {
      const response = await apiClient.deleteVitalSigns(id);
      return response;
    } catch (error) {
      console.error('Error deleting vital signs:', error);
      throw error;
    }
  }

  /**
   * คำนวณ BMI
   */
  static calculateBMI(weight: number, height: number): { bmi: number; category: string } {
    if (!weight || !height || weight <= 0 || height <= 0) {
      return { bmi: 0, category: 'ไม่สามารถคำนวณได้' };
    }

    const heightInMeters = height / 100; // แปลง cm เป็น m
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    if (bmi < 18.5) {
      category = 'น้ำหนักน้อย';
    } else if (bmi < 23) {
      category = 'ปกติ';
    } else if (bmi < 25) {
      category = 'เกิน';
    } else if (bmi < 30) {
      category = 'อ้วนระดับ 1';
    } else {
      category = 'อ้วนระดับ 2';
    }

    return { 
      bmi: Math.round(bmi * 10) / 10, // ปัดเศษให้เหลือ 1 ตำแหน่ง
      category 
    };
  }

  /**
   * คำนวณ Waist-Hip Ratio
   */
  static calculateWaistHipRatio(waist: number, hip: number): { ratio: number; category: string } {
    if (!waist || !hip || waist <= 0 || hip <= 0) {
      return { ratio: 0, category: 'ไม่สามารถคำนวณได้' };
    }

    const ratio = waist / hip;
    let category = '';
    
    // เกณฑ์สำหรับชาย: >0.90 เสี่ยง, หญิง: >0.85 เสี่ยง
    if (ratio <= 0.85) {
      category = 'ปกติ';
    } else if (ratio <= 0.90) {
      category = 'เสี่ยงปานกลาง';
    } else {
      category = 'เสี่ยงสูง';
    }

    return { 
      ratio: Math.round(ratio * 100) / 100, // ปัดเศษให้เหลือ 2 ตำแหน่ง
      category 
    };
  }

  /**
   * ประเมินความดันโลหิต
   */
  static assessBloodPressure(systolic: number, diastolic: number): string {
    if (!systolic || !diastolic) return 'ไม่สามารถประเมินได้';

    if (systolic < 90 || diastolic < 60) {
      return 'ความดันต่ำ';
    } else if (systolic <= 120 && diastolic <= 80) {
      return 'ปกติ';
    } else if (systolic <= 129 && diastolic <= 80) {
      return 'ความดันสูงระดับ 1';
    } else if (systolic <= 139 || diastolic <= 89) {
      return 'ความดันสูงระดับ 2';
    } else {
      return 'ความดันสูงมาก';
    }
  }

  /**
   * ประเมินอุณหภูมิร่างกาย
   */
  static assessTemperature(temp: number): string {
    if (!temp) return 'ไม่สามารถประเมินได้';

    if (temp < 35) {
      return 'อุณหภูมิต่ำมาก';
    } else if (temp < 36) {
      return 'อุณหภูมิต่ำ';
    } else if (temp <= 37.2) {
      return 'ปกติ';
    } else if (temp <= 38) {
      return 'มีไข้เล็กน้อย';
    } else if (temp <= 39) {
      return 'มีไข้';
    } else {
      return 'มีไข้สูง';
    }
  }

  /**
   * ประเมินความเสี่ยงเบาหวาน (เบื้องต้น)
   */
  static assessDiabetesRisk(data: {
    age?: number;
    bmi?: number;
    waistCircumference?: number;
    fastingGlucose?: number;
    bloodSugar?: number;
  }): { risk: string; factors: string[] } {
    const riskFactors: string[] = [];
    let riskLevel = 'ต่ำ';

    // อายุ
    if (data.age && data.age >= 45) {
      riskFactors.push('อายุ 45 ปีขึ้นไป');
    }

    // BMI
    if (data.bmi && data.bmi >= 25) {
      riskFactors.push('BMI สูง (≥25)');
    }

    // เส้นรอบเอว
    if (data.waistCircumference) {
      if (data.waistCircumference >= 90) { // ชาย
        riskFactors.push('เส้นรอบเอวใหญ่');
      } else if (data.waistCircumference >= 80) { // หญิง
        riskFactors.push('เส้นรอบเอวใหญ่');
      }
    }

    // ระดับน้ำตาลในเลือด
    if (data.fastingGlucose && data.fastingGlucose >= 100) {
      riskFactors.push('น้ำตาลในเลือดขณะอดอาหารสูง');
    }

    if (data.bloodSugar && data.bloodSugar >= 140) {
      riskFactors.push('น้ำตาลในเลือดสูง');
    }

    // ประเมินระดับความเสี่ยง
    if (riskFactors.length >= 3) {
      riskLevel = 'สูง';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'ปานกลาง';
    }

    return { risk: riskLevel, factors: riskFactors };
  }

  /**
   * ตรวจสอบค่าที่ผิดปกติ
   */
  static getAbnormalValues(vitalSigns: MedicalVitalSigns): string[] {
    const abnormal: string[] = [];

    // ความดันโลหิต
    if (vitalSigns.systolic_bp && vitalSigns.diastolic_bp) {
      const bpAssessment = this.assessBloodPressure(vitalSigns.systolic_bp, vitalSigns.diastolic_bp);
      if (bpAssessment !== 'ปกติ') {
        abnormal.push(`ความดันโลหิต: ${bpAssessment}`);
      }
    }

    // อุณหภูมิ
    if (vitalSigns.body_temperature) {
      const tempAssessment = this.assessTemperature(vitalSigns.body_temperature);
      if (tempAssessment !== 'ปกติ') {
        abnormal.push(`อุณหภูมิ: ${tempAssessment}`);
      }
    }

    // อัตราการเต้นของหัวใจ
    if (vitalSigns.heart_rate) {
      if (vitalSigns.heart_rate < 60) {
        abnormal.push('อัตราการเต้นของหัวใจต่ำ');
      } else if (vitalSigns.heart_rate > 100) {
        abnormal.push('อัตราการเต้นของหัวใจสูง');
      }
    }

    // ออกซิเจนในเลือด
    if (vitalSigns.oxygen_saturation && vitalSigns.oxygen_saturation < 95) {
      abnormal.push('ออกซิเจนในเลือดต่ำ');
    }

    return abnormal;
  }
}

export default VitalSignsService;
