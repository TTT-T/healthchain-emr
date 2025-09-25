import { databaseManager } from '../database/connection';
import { logger } from '../utils/logger';

/**
 * Diabetes Risk Assessment Service
 * บริการประเมินความเสี่ยงโรคเบาหวานด้วย AI
 */

export interface DiabetesRiskFactors {
  // ข้อมูลพื้นฐาน
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  waistCircumference?: number;
  
  // ประวัติครอบครัว
  familyHistoryDiabetes: boolean;
  familyHistoryHypertension: boolean;
  
  // ข้อมูลทางการแพทย์
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  fastingGlucose?: number;
  hba1c?: number;
  
  // ข้อมูลวิถีชีวิต
  physicalActivity: 'low' | 'moderate' | 'high';
  smoking: boolean;
  alcoholConsumption: 'none' | 'light' | 'moderate' | 'heavy';
  
  // ประวัติการตั้งครรภ์ (สำหรับผู้หญิง)
  gestationalDiabetes?: boolean;
  polycysticOvarySyndrome?: boolean;
  
  // โรคประจำตัว
  hypertension: boolean;
  dyslipidemia: boolean;
  cardiovascularDisease: boolean;
  
  // ข้อมูลเพิ่มเติม
  sleepDuration?: number; // ชั่วโมงต่อคืน
  stressLevel?: 'low' | 'moderate' | 'high';
  dietQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Enhanced AI Analysis Fields
  bodyFatPercentage?: number;
  muscleMass?: number;
  boneDensity?: 'normal' | 'osteopenia' | 'osteoporosis';
  skinFoldThickness?: number;
  hydrationStatus?: 'good' | 'moderate' | 'poor';
  sleepQuality?: number; // 1-10
  depressionScore?: number; // 0-27
  anxietyLevel?: number; // 1-10
  qualityOfLifeScore?: number; // 0-100
  
  // Critical Lab Values
  hba1c?: number;
  fastingInsulin?: number;
  cPeptide?: number;
  totalCholesterol?: number;
  hdlCholesterol?: number;
  ldlCholesterol?: number;
  triglycerides?: number;
  bun?: number;
  creatinine?: number;
  egfr?: number;
  alt?: number;
  ast?: number;
  alp?: number;
  bilirubin?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  crp?: number;
  esr?: number;
  vitaminD?: number;
  b12?: number;
  folate?: number;
  iron?: number;
  ferritin?: number;
  uricAcid?: number;
  
  // Detailed Nutrition
  dailyCalorieIntake?: number;
  carbohydrateIntake?: number;
  proteinIntake?: number;
  fatIntake?: number;
  fiberIntake?: number;
  sugarIntake?: number;
  sodiumIntake?: number;
  waterIntake?: number;
  mealFrequency?: number;
  alcoholConsumption?: number;
  caffeineConsumption?: number;
  
  // Detailed Exercise
  exerciseType?: string;
  exerciseDuration?: number;
  exerciseFrequency?: number;
  exerciseIntensity?: 'low' | 'moderate' | 'high';
  mets?: number;
  vo2Max?: number;
  walkingSteps?: number;
}

export interface DiabetesRiskResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  riskPercentage: number; // ความน่าจะเป็นเป็นโรคเบาหวานใน 10 ปี
  contributingFactors: string[];
  recommendations: string[];
  nextScreeningDate?: string;
  urgencyLevel: 'routine' | 'urgent' | 'immediate';
}

export class DiabetesRiskAssessmentService {
  
  /**
   * คำนวณความเสี่ยงโรคเบาหวานสำหรับผู้ป่วย
   */
  static async assessPatientDiabetesRisk(patientId: string): Promise<DiabetesRiskResult> {
    try {
      logger.info('Starting diabetes risk assessment for patient:', patientId);
      
      // ดึงข้อมูลผู้ป่วยทั้งหมด
      const riskFactors = await this.gatherPatientRiskFactors(patientId);
      
      // คำนวณความเสี่ยง
      const riskResult = this.calculateDiabetesRisk(riskFactors);
      
      logger.info('Diabetes risk assessment completed:', {
        patientId,
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore
      });
      
      return riskResult;
      
    } catch (error) {
      logger.error('Error in diabetes risk assessment:', error);
      throw error;
    }
  }
  
  /**
   * รวบรวมข้อมูลปัจจัยเสี่ยงจากฐานข้อมูล
   */
  private static async gatherPatientRiskFactors(patientId: string): Promise<DiabetesRiskFactors> {
    try {
      // ดึงข้อมูลผู้ป่วย
      const patientResult = await databaseManager.query(`
        SELECT 
          p.id, p.first_name, p.last_name, p.thai_name,
          p.date_of_birth, p.gender, p.weight, p.height,
          p.blood_group, p.drug_allergies, p.food_allergies,
          p.chronic_diseases, p.current_medications,
          p.created_at
        FROM patients p
        WHERE p.id = $1
      `, [patientId]);
      
      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const patient = patientResult.rows[0];
      
      // คำนวณอายุ
      const age = this.calculateAge(patient.date_of_birth);
      
      // คำนวณ BMI
      const bmi = patient.weight && patient.height ? 
        patient.weight / Math.pow(patient.height / 100, 2) : 0;
      
      // ดึงข้อมูลสัญญาณชีพล่าสุด
      const vitalSignsResult = await databaseManager.query(`
        SELECT 
          systolic_bp, diastolic_bp, weight, height, bmi,
          measurement_time
        FROM vital_signs
        WHERE patient_id = $1
        ORDER BY measurement_time DESC
        LIMIT 1
      `, [patientId]);
      
      const vitalSigns = vitalSignsResult.rows[0] || {};
      
      // ดึงข้อมูล Lab Results ล่าสุด
      const labResultsResult = await databaseManager.query(`
        SELECT 
          lr.result_value, lr.result_numeric, lr.result_unit,
          lo.test_name, lr.result_date
        FROM lab_results lr
        INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
        WHERE lo.patient_id = $1
        AND lo.test_name ILIKE ANY(ARRAY['%glucose%', '%hba1c%', '%a1c%', '%sugar%'])
        ORDER BY lr.result_date DESC
        LIMIT 5
      `, [patientId]);
      
      // ดึงข้อมูล History Taking
      const historyResult = await databaseManager.query(`
        SELECT 
          family_history, social_history, lifestyle_factors,
          pregnancy_history, dietary_history
        FROM medical_records
        WHERE patient_id = $1
        AND record_type = 'history_taking'
        ORDER BY recorded_time DESC
        LIMIT 1
      `, [patientId]);
      
      const history = historyResult.rows[0] || {};
      
      // ดึงข้อมูล Critical Lab Values ล่าสุด
      const criticalLabResult = await databaseManager.query(`
        SELECT * FROM critical_lab_values
        WHERE patient_id = $1
        ORDER BY test_date DESC
        LIMIT 1
      `, [patientId]);
      
      const criticalLabs = criticalLabResult.rows[0] || {};
      
      // ดึงข้อมูล Detailed Nutrition ล่าสุด
      const nutritionResult = await databaseManager.query(`
        SELECT * FROM detailed_nutrition
        WHERE patient_id = $1
        ORDER BY assessment_date DESC
        LIMIT 1
      `, [patientId]);
      
      const nutrition = nutritionResult.rows[0] || {};
      
      // ดึงข้อมูล Detailed Exercise ล่าสุด
      const exerciseResult = await databaseManager.query(`
        SELECT * FROM detailed_exercise
        WHERE patient_id = $1
        ORDER BY assessment_date DESC
        LIMIT 1
      `, [patientId]);
      
      const exercise = exerciseResult.rows[0] || {};
      
      // ประมวลผลข้อมูล
      const riskFactors: DiabetesRiskFactors = {
        age,
        gender: patient.gender,
        bmi: bmi || vitalSigns.bmi || 0,
        waistCircumference: vitalSigns.waist_circumference,
        
        familyHistoryDiabetes: this.extractFamilyHistory(history.family_history, 'diabetes'),
        familyHistoryHypertension: this.extractFamilyHistory(history.family_history, 'hypertension'),
        
        bloodPressure: {
          systolic: vitalSigns.systolic_bp || 120,
          diastolic: vitalSigns.diastolic_bp || 80
        },
        fastingGlucose: this.extractLabValue(labResultsResult.rows, 'glucose'),
        hba1c: this.extractLabValue(labResultsResult.rows, 'hba1c'),
        
        physicalActivity: this.extractPhysicalActivity(history.social_history),
        smoking: this.extractSmokingStatus(history.social_history),
        alcoholConsumption: this.extractAlcoholConsumption(history.social_history),
        
        gestationalDiabetes: this.extractPregnancyHistory(history.pregnancy_history, 'gestational_diabetes'),
        polycysticOvarySyndrome: this.extractPregnancyHistory(history.pregnancy_history, 'pcos'),
        
        hypertension: this.hasCondition(patient.chronic_diseases, ['hypertension', 'ความดันโลหิตสูง']),
        dyslipidemia: this.hasCondition(patient.chronic_diseases, ['dyslipidemia', 'ไขมันในเลือดสูง']),
        cardiovascularDisease: this.hasCondition(patient.chronic_diseases, ['cardiovascular', 'โรคหัวใจ']),
        
        sleepDuration: this.extractSleepDuration(history.lifestyle_factors),
        stressLevel: this.extractStressLevel(history.lifestyle_factors),
        dietQuality: this.extractDietQuality(history.dietary_history),
        
        // Enhanced AI Analysis Fields
        bodyFatPercentage: vitalSigns.body_fat_percentage,
        muscleMass: vitalSigns.muscle_mass,
        boneDensity: vitalSigns.bone_density,
        skinFoldThickness: vitalSigns.skin_fold_thickness,
        hydrationStatus: vitalSigns.hydration_status,
        sleepQuality: vitalSigns.sleep_quality,
        depressionScore: vitalSigns.depression_score,
        anxietyLevel: vitalSigns.anxiety_level,
        qualityOfLifeScore: vitalSigns.quality_of_life_score,
        
        // Critical Lab Values
        hba1c: criticalLabs.hba1c,
        fastingInsulin: criticalLabs.fasting_insulin,
        cPeptide: criticalLabs.c_peptide,
        totalCholesterol: criticalLabs.total_cholesterol,
        hdlCholesterol: criticalLabs.hdl_cholesterol,
        ldlCholesterol: criticalLabs.ldl_cholesterol,
        triglycerides: criticalLabs.triglycerides,
        bun: criticalLabs.bun,
        creatinine: criticalLabs.creatinine,
        egfr: criticalLabs.egfr,
        alt: criticalLabs.alt,
        ast: criticalLabs.ast,
        alp: criticalLabs.alp,
        bilirubin: criticalLabs.bilirubin,
        tsh: criticalLabs.tsh,
        t3: criticalLabs.t3,
        t4: criticalLabs.t4,
        crp: criticalLabs.crp,
        esr: criticalLabs.esr,
        vitaminD: criticalLabs.vitamin_d,
        b12: criticalLabs.b12,
        folate: criticalLabs.folate,
        iron: criticalLabs.iron,
        ferritin: criticalLabs.ferritin,
        uricAcid: criticalLabs.uric_acid,
        
        // Detailed Nutrition
        dailyCalorieIntake: nutrition.daily_calorie_intake,
        carbohydrateIntake: nutrition.carbohydrate_intake,
        proteinIntake: nutrition.protein_intake,
        fatIntake: nutrition.fat_intake,
        fiberIntake: nutrition.fiber_intake,
        sugarIntake: nutrition.sugar_intake,
        sodiumIntake: nutrition.sodium_intake,
        waterIntake: nutrition.water_intake,
        mealFrequency: nutrition.meal_frequency,
        alcoholConsumption: nutrition.alcohol_consumption,
        caffeineConsumption: nutrition.caffeine_consumption,
        
        // Detailed Exercise
        exerciseType: exercise.exercise_type,
        exerciseDuration: exercise.exercise_duration,
        exerciseFrequency: exercise.exercise_frequency,
        exerciseIntensity: exercise.exercise_intensity,
        mets: exercise.mets,
        vo2Max: exercise.vo2_max,
        walkingSteps: exercise.walking_steps
      };
      
      logger.info('Gathered risk factors:', riskFactors);
      return riskFactors;
      
    } catch (error) {
      logger.error('Error gathering patient risk factors:', error);
      throw error;
    }
  }
  
  /**
   * คำนวณความเสี่ยงโรคเบาหวาน
   */
  private static calculateDiabetesRisk(factors: DiabetesRiskFactors): DiabetesRiskResult {
    let riskScore = 0;
    const contributingFactors: string[] = [];
    
    // อายุ (0-25 คะแนน)
    if (factors.age >= 65) {
      riskScore += 25;
      contributingFactors.push('อายุ 65 ปีขึ้นไป');
    } else if (factors.age >= 45) {
      riskScore += 15;
      contributingFactors.push('อายุ 45-64 ปี');
    } else if (factors.age >= 35) {
      riskScore += 10;
      contributingFactors.push('อายุ 35-44 ปี');
    }
    
    // BMI (0-20 คะแนน)
    if (factors.bmi >= 30) {
      riskScore += 20;
      contributingFactors.push('อ้วน (BMI ≥ 30)');
    } else if (factors.bmi >= 25) {
      riskScore += 10;
      contributingFactors.push('น้ำหนักเกิน (BMI 25-29.9)');
    }
    
    // ความดันโลหิต (0-15 คะแนน)
    if (factors.bloodPressure.systolic >= 140 || factors.bloodPressure.diastolic >= 90) {
      riskScore += 15;
      contributingFactors.push('ความดันโลหิตสูง');
    } else if (factors.bloodPressure.systolic >= 130 || factors.bloodPressure.diastolic >= 85) {
      riskScore += 8;
      contributingFactors.push('ความดันโลหิตสูงเล็กน้อย');
    }
    
    // ประวัติครอบครัว (0-15 คะแนน)
    if (factors.familyHistoryDiabetes) {
      riskScore += 15;
      contributingFactors.push('ประวัติครอบครัวเป็นโรคเบาหวาน');
    }
    
    // การออกกำลังกาย (0-10 คะแนน)
    if (factors.physicalActivity === 'low') {
      riskScore += 10;
      contributingFactors.push('ออกกำลังกายน้อย');
    } else if (factors.physicalActivity === 'moderate') {
      riskScore += 5;
      contributingFactors.push('ออกกำลังกายปานกลาง');
    }
    
    // การสูบบุหรี่ (0-5 คะแนน)
    if (factors.smoking) {
      riskScore += 5;
      contributingFactors.push('สูบบุหรี่');
    }
    
    // โรคประจำตัว (0-20 คะแนน)
    if (factors.hypertension) {
      riskScore += 10;
      contributingFactors.push('โรคความดันโลหิตสูง');
    }
    if (factors.dyslipidemia) {
      riskScore += 10;
      contributingFactors.push('ไขมันในเลือดสูง');
    }
    
    // ค่าน้ำตาลในเลือด (0-25 คะแนน)
    if (factors.fastingGlucose) {
      if (factors.fastingGlucose >= 126) {
        riskScore += 25;
        contributingFactors.push('น้ำตาลในเลือดสูงมาก (≥ 126 mg/dL)');
      } else if (factors.fastingGlucose >= 100) {
        riskScore += 15;
        contributingFactors.push('น้ำตาลในเลือดสูงเล็กน้อย (100-125 mg/dL)');
      }
    }
    
    // HbA1c (0-20 คะแนน)
    if (factors.hba1c) {
      if (factors.hba1c >= 6.5) {
        riskScore += 20;
        contributingFactors.push('HbA1c สูงมาก (≥ 6.5%)');
      } else if (factors.hba1c >= 5.7) {
        riskScore += 10;
        contributingFactors.push('HbA1c สูงเล็กน้อย (5.7-6.4%)');
      }
    }
    
    // เพศหญิง - ประวัติการตั้งครรภ์ (0-10 คะแนน)
    if (factors.gender === 'female') {
      if (factors.gestationalDiabetes) {
        riskScore += 10;
        contributingFactors.push('ประวัติเบาหวานขณะตั้งครรภ์');
      }
      if (factors.polycysticOvarySyndrome) {
        riskScore += 5;
        contributingFactors.push('โรคถุงน้ำรังไข่หลายใบ');
      }
    }
    
    // Enhanced AI Analysis Fields (0-30 คะแนน)
    if (factors.bodyFatPercentage && factors.bodyFatPercentage > 30) {
      riskScore += 8;
      contributingFactors.push('เปอร์เซ็นต์ไขมันในร่างกายสูง');
    }
    
    if (factors.sleepQuality && factors.sleepQuality < 5) {
      riskScore += 5;
      contributingFactors.push('คุณภาพการนอนไม่ดี');
    }
    
    if (factors.stressLevel && factors.stressLevel > 7) {
      riskScore += 5;
      contributingFactors.push('ระดับความเครียดสูง');
    }
    
    if (factors.depressionScore && factors.depressionScore > 10) {
      riskScore += 4;
      contributingFactors.push('ภาวะซึมเศร้า');
    }
    
    if (factors.qualityOfLifeScore && factors.qualityOfLifeScore < 50) {
      riskScore += 3;
      contributingFactors.push('คุณภาพชีวิตต่ำ');
    }
    
    // Critical Lab Values (0-25 คะแนน)
    if (factors.fastingInsulin && factors.fastingInsulin > 25) {
      riskScore += 8;
      contributingFactors.push('ระดับอินซูลินสูง (ดื้ออินซูลิน)');
    }
    
    if (factors.cPeptide && factors.cPeptide < 1.0) {
      riskScore += 5;
      contributingFactors.push('C-Peptide ต่ำ (การทำงานของตับอ่อนลดลง)');
    }
    
    if (factors.triglycerides && factors.triglycerides > 200) {
      riskScore += 4;
      contributingFactors.push('ไตรกลีเซอไรด์สูง');
    }
    
    if (factors.hdlCholesterol && factors.hdlCholesterol < 40) {
      riskScore += 3;
      contributingFactors.push('HDL คอเลสเตอรอลต่ำ');
    }
    
    if (factors.crp && factors.crp > 3.0) {
      riskScore += 3;
      contributingFactors.push('CRP สูง (การอักเสบ)');
    }
    
    if (factors.vitaminD && factors.vitaminD < 20) {
      riskScore += 2;
      contributingFactors.push('วิตามิน D ต่ำ');
    }
    
    // Detailed Nutrition (0-15 คะแนน)
    if (factors.dailyCalorieIntake && factors.dailyCalorieIntake > 2500) {
      riskScore += 5;
      contributingFactors.push('ปริมาณแคลอรี่สูงเกินไป');
    }
    
    if (factors.sugarIntake && factors.sugarIntake > 50) {
      riskScore += 4;
      contributingFactors.push('การบริโภคน้ำตาลสูง');
    }
    
    if (factors.sodiumIntake && factors.sodiumIntake > 2300) {
      riskScore += 3;
      contributingFactors.push('การบริโภคโซเดียมสูง');
    }
    
    if (factors.fiberIntake && factors.fiberIntake < 25) {
      riskScore += 3;
      contributingFactors.push('การบริโภคไฟเบอร์ต่ำ');
    }
    
    // Detailed Exercise (0-10 คะแนน)
    if (factors.exerciseFrequency && factors.exerciseFrequency < 3) {
      riskScore += 5;
      contributingFactors.push('ออกกำลังกายน้อย');
    }
    
    if (factors.walkingSteps && factors.walkingSteps < 5000) {
      riskScore += 3;
      contributingFactors.push('เดินน้อย');
    }
    
    if (factors.exerciseIntensity === 'low') {
      riskScore += 2;
      contributingFactors.push('ความเข้มข้นการออกกำลังกายต่ำ');
    }
    
    // กำหนดระดับความเสี่ยง
    let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
    let riskPercentage: number;
    let urgencyLevel: 'routine' | 'urgent' | 'immediate';
    
    if (riskScore >= 70) {
      riskLevel = 'very_high';
      riskPercentage = 50;
      urgencyLevel = 'immediate';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      riskPercentage = 25;
      urgencyLevel = 'urgent';
    } else if (riskScore >= 30) {
      riskLevel = 'moderate';
      riskPercentage = 10;
      urgencyLevel = 'routine';
    } else {
      riskLevel = 'low';
      riskPercentage = 2;
      urgencyLevel = 'routine';
    }
    
    // สร้างคำแนะนำ
    const recommendations = this.generateRecommendations(riskLevel, contributingFactors, factors);
    
    // กำหนดวันที่ตรวจครั้งต่อไป
    const nextScreeningDate = this.calculateNextScreeningDate(riskLevel);
    
    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      riskPercentage,
      contributingFactors,
      recommendations,
      nextScreeningDate,
      urgencyLevel
    };
  }
  
  /**
   * สร้างคำแนะนำตามระดับความเสี่ยง
   */
  private static generateRecommendations(
    riskLevel: string, 
    contributingFactors: string[], 
    factors: DiabetesRiskFactors
  ): string[] {
    const recommendations: string[] = [];
    
    switch (riskLevel) {
      case 'very_high':
        recommendations.push('🚨 ความเสี่ยงสูงมาก - ควรปรึกษาแพทย์ทันที');
        recommendations.push('📋 ตรวจ HbA1c และ OGTT เพื่อยืนยันการวินิจฉัย');
        recommendations.push('💊 พิจารณาเริ่มยาลดน้ำตาลในเลือด');
        recommendations.push('📅 นัดติดตามทุก 3 เดือน');
        break;
        
      case 'high':
        recommendations.push('⚠️ ความเสี่ยงสูง - ควรปรึกษาแพทย์ภายใน 1 สัปดาห์');
        recommendations.push('🩸 ตรวจ HbA1c และ Fasting Glucose');
        recommendations.push('📅 นัดติดตามทุก 6 เดือน');
        break;
        
      case 'moderate':
        recommendations.push('⚡ ความเสี่ยงปานกลาง - ควรปรับเปลี่ยนวิถีชีวิต');
        recommendations.push('🩸 ตรวจ Fasting Glucose หรือ HbA1c');
        recommendations.push('📅 นัดติดตามทุกปี');
        break;
        
      case 'low':
        recommendations.push('✅ ความเสี่ยงต่ำ - รักษาสุขภาพให้ดีต่อไป');
        recommendations.push('🩸 ตรวจคัดกรองทุก 3 ปี');
        break;
    }
    
    // คำแนะนำเฉพาะตามปัจจัยเสี่ยง
    if (factors.bmi >= 25) {
      recommendations.push('🏃‍♂️ ลดน้ำหนัก 5-10% ของน้ำหนักตัว');
      recommendations.push('🥗 ควบคุมอาหาร - ลดแป้งและน้ำตาล');
    }
    
    if (factors.physicalActivity === 'low') {
      recommendations.push('🚶‍♀️ ออกกำลังกายอย่างน้อย 150 นาที/สัปดาห์');
      recommendations.push('💪 เพิ่มกิจกรรมทางกายในชีวิตประจำวัน');
    }
    
    if (factors.bloodPressure.systolic >= 130) {
      recommendations.push('🩺 ควบคุมความดันโลหิต < 130/80 mmHg');
      recommendations.push('🧂 ลดการบริโภคเกลือ');
    }
    
    if (factors.smoking) {
      recommendations.push('🚭 หยุดสูบบุหรี่');
      recommendations.push('🏥 ขอคำปรึกษาเรื่องการเลิกบุหรี่');
    }
    
    if (factors.familyHistoryDiabetes) {
      recommendations.push('👨‍👩‍👧‍👦 ตรวจคัดกรองสมาชิกในครอบครัว');
      recommendations.push('📚 เรียนรู้เกี่ยวกับโรคเบาหวาน');
    }
    
    return recommendations;
  }
  
  /**
   * คำนวณวันที่ตรวจครั้งต่อไป
   */
  private static calculateNextScreeningDate(riskLevel: string): string {
    const now = new Date();
    
    switch (riskLevel) {
      case 'very_high':
        return new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 เดือน
      case 'high':
        return new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 เดือน
      case 'moderate':
        return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 ปี
      case 'low':
        return new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 ปี
      default:
        return new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }
  
  // Helper methods
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
  
  private static extractFamilyHistory(history: string, condition: string): boolean {
    if (!history) return false;
    const lowerHistory = history.toLowerCase();
    const conditionMap: { [key: string]: string[] } = {
      'diabetes': ['เบาหวาน', 'diabetes', 'น้ำตาล'],
      'hypertension': ['ความดัน', 'hypertension', 'bp']
    };
    
    const keywords = conditionMap[condition] || [];
    return keywords.some(keyword => lowerHistory.includes(keyword));
  }
  
  private static extractLabValue(labResults: any[], testType: string): number | undefined {
    const result = labResults.find(r => 
      r.test_name.toLowerCase().includes(testType.toLowerCase())
    );
    
    if (result && result.result_numeric) {
      return result.result_numeric;
    }
    
    return undefined;
  }
  
  private static extractPhysicalActivity(history: string): 'low' | 'moderate' | 'high' {
    if (!history) return 'low';
    const lowerHistory = history.toLowerCase();
    
    if (lowerHistory.includes('ออกกำลังกาย') || lowerHistory.includes('exercise')) {
      if (lowerHistory.includes('ทุกวัน') || lowerHistory.includes('daily')) {
        return 'high';
      } else if (lowerHistory.includes('สัปดาห์') || lowerHistory.includes('week')) {
        return 'moderate';
      }
    }
    
    return 'low';
  }
  
  private static extractSmokingStatus(history: string): boolean {
    if (!history) return false;
    const lowerHistory = history.toLowerCase();
    return lowerHistory.includes('สูบ') || lowerHistory.includes('smoke');
  }
  
  private static extractAlcoholConsumption(history: string): 'none' | 'light' | 'moderate' | 'heavy' {
    if (!history) return 'none';
    const lowerHistory = history.toLowerCase();
    
    if (lowerHistory.includes('ดื่ม') || lowerHistory.includes('alcohol')) {
      if (lowerHistory.includes('มาก') || lowerHistory.includes('heavy')) {
        return 'heavy';
      } else if (lowerHistory.includes('ปานกลาง') || lowerHistory.includes('moderate')) {
        return 'moderate';
      } else {
        return 'light';
      }
    }
    
    return 'none';
  }
  
  private static extractPregnancyHistory(history: string, condition: string): boolean {
    if (!history) return false;
    const lowerHistory = history.toLowerCase();
    
    if (condition === 'gestational_diabetes') {
      return lowerHistory.includes('เบาหวาน') && lowerHistory.includes('ตั้งครรภ์');
    } else if (condition === 'pcos') {
      return lowerHistory.includes('pcos') || lowerHistory.includes('ถุงน้ำ');
    }
    
    return false;
  }
  
  private static hasCondition(chronicDiseases: string, conditions: string[]): boolean {
    if (!chronicDiseases) return false;
    const lowerDiseases = chronicDiseases.toLowerCase();
    return conditions.some(condition => lowerDiseases.includes(condition.toLowerCase()));
  }
  
  private static extractSleepDuration(history: string): number | undefined {
    if (!history) return undefined;
    const match = history.match(/(\d+)\s*(ชั่วโมง|hour)/);
    return match ? parseInt(match[1]) : undefined;
  }
  
  private static extractStressLevel(history: string): 'low' | 'moderate' | 'high' {
    if (!history) return 'moderate';
    const lowerHistory = history.toLowerCase();
    
    if (lowerHistory.includes('เครียดมาก') || lowerHistory.includes('high stress')) {
      return 'high';
    } else if (lowerHistory.includes('เครียดน้อย') || lowerHistory.includes('low stress')) {
      return 'low';
    }
    
    return 'moderate';
  }
  
  private static extractDietQuality(history: string): 'poor' | 'fair' | 'good' | 'excellent' {
    if (!history) return 'fair';
    const lowerHistory = history.toLowerCase();
    
    if (lowerHistory.includes('อาหารดี') || lowerHistory.includes('healthy diet')) {
      return 'good';
    } else if (lowerHistory.includes('อาหารไม่ดี') || lowerHistory.includes('poor diet')) {
      return 'poor';
    } else if (lowerHistory.includes('อาหารดีมาก') || lowerHistory.includes('excellent diet')) {
      return 'excellent';
    }
    
    return 'fair';
  }
}
