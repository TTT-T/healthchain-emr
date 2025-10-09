import { logger } from '../utils/logger';

export interface PatientData {
  id: number;
  age: number;
  gender: 'ชาย' | 'หญิง';
  weight: number;
  height: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  exercise: string;
  smoking: string;
  alcohol: string;
  drinks: string;
  foodAllergies: string;
  familyHistory: string;
  chronicDiseases: string;
  heartRate: number;
  oxygenLevel: number;
}

export interface DiabetesRiskAssessment {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  riskScore: number;
  probability: number;
  factors: {
    age: number;
    weight: number;
    bloodPressure: number;
    familyHistory: number;
    lifestyle: number;
    chronicDiseases: number;
  };
  recommendations: {
    weight: string;
    exercise: string;
    diet: string;
    monitoring: string;
    lifestyle: string;
  };
  timeline: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
}

export interface HealthMetrics {
  bmi: number;
  bmiCategory: string;
  bloodPressureCategory: string;
  heartRateCategory: string;
  oxygenLevelCategory: string;
}

export class AIDiabetesPredictionService {
  /**
   * คำนวณ BMI
   */
  static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  /**
   * วิเคราะห์ความเสี่ยงโรคเบาหวาน
   */
  static analyzeDiabetesRisk(patient: PatientData): DiabetesRiskAssessment {
    const bmi = this.calculateBMI(patient.weight, patient.height);
    
    // คำนวณคะแนนความเสี่ยง
    const ageScore = this.calculateAgeScore(patient.age);
    const weightScore = this.calculateWeightScore(bmi);
    const bloodPressureScore = this.calculateBloodPressureScore(patient.bloodPressureSystolic, patient.bloodPressureDiastolic);
    const familyHistoryScore = this.calculateFamilyHistoryScore(patient.familyHistory);
    const lifestyleScore = this.calculateLifestyleScore(patient.exercise, patient.smoking, patient.alcohol);
    const chronicDiseasesScore = this.calculateChronicDiseasesScore(patient.chronicDiseases);

    const totalScore = ageScore + weightScore + bloodPressureScore + familyHistoryScore + lifestyleScore + chronicDiseasesScore;
    
    // คำนวณความน่าจะเป็น
    const probability = Math.min(95, Math.max(5, totalScore * 2.5));
    
    // กำหนดระดับความเสี่ยง
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    if (totalScore <= 15) riskLevel = 'LOW';
    else if (totalScore <= 25) riskLevel = 'MODERATE';
    else if (totalScore <= 35) riskLevel = 'HIGH';
    else riskLevel = 'VERY_HIGH';

    return {
      riskLevel,
      riskScore: totalScore,
      probability,
      factors: {
        age: ageScore,
        weight: weightScore,
        bloodPressure: bloodPressureScore,
        familyHistory: familyHistoryScore,
        lifestyle: lifestyleScore,
        chronicDiseases: chronicDiseasesScore
      },
      recommendations: this.generateRecommendations(patient, bmi, riskLevel),
      timeline: this.generateTimeline(riskLevel)
    };
  }

  /**
   * คำนวณคะแนนจากอายุ
   */
  private static calculateAgeScore(age: number): number {
    if (age < 25) return 2;
    if (age < 35) return 4;
    if (age < 45) return 6;
    if (age < 55) return 8;
    return 10;
  }

  /**
   * คำนวณคะแนนจากน้ำหนัก (BMI)
   */
  private static calculateWeightScore(bmi: number): number {
    if (bmi < 18.5) return 1;
    if (bmi < 23) return 2;
    if (bmi < 25) return 4;
    if (bmi < 30) return 6;
    if (bmi < 35) return 8;
    return 10;
  }

  /**
   * คำนวณคะแนนจากความดันโลหิต
   */
  private static calculateBloodPressureScore(systolic: number, diastolic: number): number {
    if (systolic < 120 && diastolic < 80) return 0;
    if (systolic < 130 && diastolic < 85) return 2;
    if (systolic < 140 && diastolic < 90) return 4;
    if (systolic < 160 && diastolic < 100) return 6;
    return 8;
  }

  /**
   * คำนวณคะแนนจากประวัติครอบครัว
   */
  private static calculateFamilyHistoryScore(familyHistory: string): number {
    if (!familyHistory || familyHistory === '-') return 0;
    if (familyHistory.includes('เบาหวาน')) return 8;
    if (familyHistory.includes('ความดัน')) return 4;
    return 2;
  }

  /**
   * คำนวณคะแนนจากไลฟ์สไตล์
   */
  private static calculateLifestyleScore(exercise: string, smoking: string, alcohol: string): number {
    let score = 0;
    
    // การออกกำลังกาย
    if (!exercise || exercise === '-') score += 4;
    else if (exercise.includes('ทุกวัน')) score += 0;
    else if (exercise.includes('4-5 ครั้ง')) score += 1;
    else if (exercise.includes('3 ครั้ง')) score += 2;
    else if (exercise.includes('1-2 ครั้ง')) score += 3;
    else score += 4;

    // การสูบบุหรี่
    if (smoking && smoking !== '-') {
      if (smoking.includes('20 ครั้ง')) score += 6;
      else if (smoking.includes('5-6 ครั้ง')) score += 5;
      else if (smoking.includes('3-4 ครั้ง')) score += 4;
      else if (smoking.includes('3 ครั้ง')) score += 3;
      else if (smoking.includes('1-3 ครั้ง')) score += 2;
      else score += 1;
    }

    // การดื่มแอลกอฮอล์
    if (alcohol && alcohol !== '-') {
      if (alcohol.includes('6 ครั้ง')) score += 3;
      else if (alcohol.includes('3 ครั้ง')) score += 2;
      else if (alcohol.includes('2 ครั้ง')) score += 1;
      else score += 0.5;
    }

    return score;
  }

  /**
   * คำนวณคะแนนจากโรคเรื้อรัง
   */
  private static calculateChronicDiseasesScore(chronicDiseases: string): number {
    if (!chronicDiseases || chronicDiseases === '-') return 0;
    if (chronicDiseases.includes('เบาหวาน')) return 10;
    if (chronicDiseases.includes('โรคหัวใจ')) return 6;
    if (chronicDiseases.includes('โรคโลหิตจาง')) return 3;
    if (chronicDiseases.includes('มะเร็ง')) return 4;
    if (chronicDiseases.includes('โรคต่อมน้ำเหลือง')) return 3;
    if (chronicDiseases.includes('ภูมิแพ้')) return 2;
    return 1;
  }

  /**
   * สร้างคำแนะนำ
   */
  private static generateRecommendations(patient: PatientData, bmi: number, riskLevel: string): any {
    const recommendations = {
      weight: '',
      exercise: '',
      diet: '',
      monitoring: '',
      lifestyle: ''
    };

    // คำแนะนำเรื่องน้ำหนัก
    if (bmi > 25) {
      const targetWeight = Math.round(23 * Math.pow(patient.height / 100, 2));
      const weightToLose = patient.weight - targetWeight;
      recommendations.weight = `ควรลดน้ำหนัก ${weightToLose} กก. เพื่อให้ BMI อยู่ในเกณฑ์ปกติ (18.5-23)`;
    } else if (bmi < 18.5) {
      const targetWeight = Math.round(20 * Math.pow(patient.height / 100, 2));
      const weightToGain = targetWeight - patient.weight;
      recommendations.weight = `ควรเพิ่มน้ำหนัก ${weightToGain} กก. เพื่อให้ BMI อยู่ในเกณฑ์ปกติ`;
    } else {
      recommendations.weight = 'น้ำหนักอยู่ในเกณฑ์ปกติ ควรรักษาระดับนี้ไว้';
    }

    // คำแนะนำเรื่องการออกกำลังกาย
    if (!patient.exercise || patient.exercise === '-') {
      recommendations.exercise = 'ควรออกกำลังกายอย่างน้อย 150 นาที/สัปดาห์ เช่น เดินเร็ว วิ่ง ปั่นจักรยาน';
    } else if (patient.exercise.includes('1-2 ครั้ง')) {
      recommendations.exercise = 'ควรเพิ่มการออกกำลังกายเป็น 3-4 ครั้ง/สัปดาห์';
    } else {
      recommendations.exercise = 'การออกกำลังกายอยู่ในเกณฑ์ดี ควรรักษาระดับนี้ไว้';
    }

    // คำแนะนำเรื่องอาหาร
    if (patient.drinks && patient.drinks.includes('น้ำอัดลม')) {
      recommendations.diet = 'ควรลดการดื่มน้ำอัดลมและเครื่องดื่มที่มีน้ำตาล ควรดื่มน้ำเปล่าแทน';
    } else if (patient.drinks && patient.drinks.includes('กาแฟ')) {
      recommendations.diet = 'ควรจำกัดการดื่มกาแฟไม่เกิน 2-3 แก้ว/วัน และไม่ใส่น้ำตาล';
    } else {
      recommendations.diet = 'ควรรับประทานอาหารที่มีประโยชน์ หลีกเลี่ยงอาหารหวานและไขมันสูง';
    }

    // คำแนะนำเรื่องการติดตาม
    if (riskLevel === 'VERY_HIGH' || riskLevel === 'HIGH') {
      recommendations.monitoring = 'ควรตรวจน้ำตาลในเลือดทุก 3 เดือน และพบแพทย์เป็นประจำ';
    } else if (riskLevel === 'MODERATE') {
      recommendations.monitoring = 'ควรตรวจน้ำตาลในเลือดทุก 6 เดือน';
    } else {
      recommendations.monitoring = 'ควรตรวจสุขภาพประจำปี';
    }

    // คำแนะนำเรื่องไลฟ์สไตล์
    if (patient.smoking && patient.smoking !== '-') {
      recommendations.lifestyle = 'ควรเลิกสูบบุหรี่เพื่อลดความเสี่ยงโรคเบาหวานและโรคอื่นๆ';
    } else if (patient.alcohol && patient.alcohol !== '-') {
      recommendations.lifestyle = 'ควรจำกัดการดื่มแอลกอฮอล์ไม่เกิน 1-2 แก้ว/วัน';
    } else {
      recommendations.lifestyle = 'ควรรักษาไลฟ์สไตล์ที่ดีนี้ไว้';
    }

    return recommendations;
  }

  /**
   * สร้างไทม์ไลน์การดูแล
   */
  private static generateTimeline(riskLevel: string): any {
    const timelines = {
      shortTerm: [] as string[],
      mediumTerm: [] as string[],
      longTerm: [] as string[]
    };

    if (riskLevel === 'VERY_HIGH' || riskLevel === 'HIGH') {
      timelines.shortTerm = [
        'เริ่มควบคุมอาหารทันที',
        'ออกกำลังกาย 30 นาที/วัน',
        'ตรวจน้ำตาลในเลือด',
        'พบแพทย์ภายใน 1 สัปดาห์'
      ];
      timelines.mediumTerm = [
        'ลดน้ำหนัก 5-10% ใน 3 เดือน',
        'ออกกำลังกายสม่ำเสมอ',
        'ตรวจน้ำตาลในเลือดทุกเดือน',
        'ปรับปรุงไลฟ์สไตล์'
      ];
      timelines.longTerm = [
        'รักษาน้ำหนักให้อยู่ในเกณฑ์ปกติ',
        'ออกกำลังกายเป็นประจำ',
        'ตรวจสุขภาพทุก 3 เดือน',
        'ป้องกันภาวะแทรกซ้อน'
      ];
    } else if (riskLevel === 'MODERATE') {
      timelines.shortTerm = [
        'ปรับปรุงอาหาร',
        'เริ่มออกกำลังกาย',
        'ตรวจน้ำตาลในเลือด'
      ];
      timelines.mediumTerm = [
        'ลดน้ำหนัก 3-5% ใน 6 เดือน',
        'ออกกำลังกายสม่ำเสมอ',
        'ตรวจสุขภาพทุก 6 เดือน'
      ];
      timelines.longTerm = [
        'รักษาไลฟ์สไตล์ที่ดี',
        'ตรวจสุขภาพประจำปี',
        'ป้องกันโรคเบาหวาน'
      ];
    } else {
      timelines.shortTerm = [
        'รักษาไลฟ์สไตล์ที่ดี',
        'ออกกำลังกายเป็นประจำ'
      ];
      timelines.mediumTerm = [
        'ตรวจสุขภาพประจำปี',
        'ป้องกันโรคเบาหวาน'
      ];
      timelines.longTerm = [
        'รักษาสุขภาพให้แข็งแรง',
        'ตรวจสุขภาพเป็นประจำ'
      ];
    }

    return timelines;
  }

  /**
   * วิเคราะห์ข้อมูลสุขภาพ
   */
  static analyzeHealthMetrics(patient: PatientData): HealthMetrics {
    const bmi = this.calculateBMI(patient.weight, patient.height);
    
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'น้ำหนักน้อย';
    else if (bmi < 23) bmiCategory = 'ปกติ';
    else if (bmi < 25) bmiCategory = 'น้ำหนักเกิน';
    else if (bmi < 30) bmiCategory = 'อ้วนระดับ 1';
    else bmiCategory = 'อ้วนระดับ 2';

    let bloodPressureCategory = '';
    if (patient.bloodPressureSystolic < 120 && patient.bloodPressureDiastolic < 80) {
      bloodPressureCategory = 'ปกติ';
    } else if (patient.bloodPressureSystolic < 130 && patient.bloodPressureDiastolic < 85) {
      bloodPressureCategory = 'สูงเล็กน้อย';
    } else if (patient.bloodPressureSystolic < 140 && patient.bloodPressureDiastolic < 90) {
      bloodPressureCategory = 'สูงระดับ 1';
    } else {
      bloodPressureCategory = 'สูงระดับ 2';
    }

    let heartRateCategory = '';
    if (patient.heartRate < 60) heartRateCategory = 'ช้า';
    else if (patient.heartRate > 100) heartRateCategory = 'เร็ว';
    else heartRateCategory = 'ปกติ';

    let oxygenLevelCategory = '';
    if (patient.oxygenLevel < 95) oxygenLevelCategory = 'ต่ำ';
    else if (patient.oxygenLevel > 100) oxygenLevelCategory = 'สูง';
    else oxygenLevelCategory = 'ปกติ';

    return {
      bmi,
      bmiCategory,
      bloodPressureCategory,
      heartRateCategory,
      oxygenLevelCategory
    };
  }

  /**
   * วิเคราะห์ข้อมูลทั้งหมด
   */
  static analyzeAllPatients(patients: PatientData[]): {
    summary: {
      totalPatients: number;
      averageRisk: number;
      riskDistribution: {
        low: number;
        moderate: number;
        high: number;
        veryHigh: number;
      };
      averageBMI: number;
      averageBloodPressure: number;
    };
    patients: Array<{
      patient: PatientData;
      riskAssessment: DiabetesRiskAssessment;
      healthMetrics: HealthMetrics;
    }>;
  } {
    const analyses = patients.map(patient => ({
      patient,
      riskAssessment: this.analyzeDiabetesRisk(patient),
      healthMetrics: this.analyzeHealthMetrics(patient)
    }));

    const totalPatients = patients.length;
    const averageRisk = analyses.reduce((sum, analysis) => sum + analysis.riskAssessment.riskScore, 0) / totalPatients;
    
    const riskDistribution = {
      low: analyses.filter(a => a.riskAssessment.riskLevel === 'LOW').length,
      moderate: analyses.filter(a => a.riskAssessment.riskLevel === 'MODERATE').length,
      high: analyses.filter(a => a.riskAssessment.riskLevel === 'HIGH').length,
      veryHigh: analyses.filter(a => a.riskAssessment.riskLevel === 'VERY_HIGH').length
    };

    const averageBMI = analyses.reduce((sum, analysis) => sum + analysis.healthMetrics.bmi, 0) / totalPatients;
    const averageBloodPressure = analyses.reduce((sum, analysis) => sum + analysis.patient.bloodPressureSystolic, 0) / totalPatients;

    return {
      summary: {
        totalPatients,
        averageRisk,
        riskDistribution,
        averageBMI,
        averageBloodPressure
      },
      patients: analyses
    };
  }
}

export default AIDiabetesPredictionService;
