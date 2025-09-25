import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

/**
 * Enhanced Data Service
 * จัดการ API calls สำหรับข้อมูลเพิ่มเติมสำหรับ AI Analysis
 */

export interface CriticalLabValues {
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
  testDate?: string;
  labResultId?: string;
}

export interface DetailedNutrition {
  dailyCalorieIntake?: number;
  carbohydrateIntake?: number;
  proteinIntake?: number;
  fatIntake?: number;
  fiberIntake?: number;
  sugarIntake?: number;
  sodiumIntake?: number;
  waterIntake?: number;
  mealFrequency?: number;
  snackingFrequency?: string;
  eatingOutFrequency?: string;
  processedFoodConsumption?: string;
  organicFoodConsumption?: string;
  supplementUse?: string;
  alcoholConsumption?: number;
  caffeineConsumption?: number;
  assessmentDate?: string;
  visitId?: string;
}

export interface DetailedExercise {
  exerciseType?: string;
  exerciseDuration?: number;
  exerciseFrequency?: number;
  exerciseIntensity?: string;
  mets?: number;
  heartRateZones?: string;
  vo2Max?: number;
  strengthTraining?: string;
  flexibilityTraining?: string;
  balanceTraining?: string;
  sportsParticipation?: string;
  physicalActivityAtWork?: string;
  transportationMethod?: string;
  stairsUsage?: string;
  walkingSteps?: number;
  assessmentDate?: string;
  visitId?: string;
}

export interface ComprehensivePatientData {
  patient: any;
  vitalSigns: any;
  criticalLabValues: any;
  detailedNutrition: any;
  detailedExercise: any;
  medicalHistory: any;
  lastUpdated: string;
}

export class EnhancedDataService {
  /**
   * Save enhanced vital signs data for a patient
   */
  static async saveEnhancedVitalSigns(patientId: string, vitalSignsData: any): Promise<any> {
    try {
      logger.info('Saving enhanced vital signs for patient:', patientId);
      
      const response = await apiClient.post(`/medical/patients/${patientId}/enhanced-vital-signs`, vitalSignsData);
      
      logger.info('Enhanced vital signs saved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error saving enhanced vital signs:', error);
      throw error;
    }
  }

  /**
   * Save critical lab values for a patient
   */
  static async saveCriticalLabValues(patientId: string, labValues: CriticalLabValues): Promise<any> {
    try {
      logger.info('Saving critical lab values for patient:', patientId);
      
      const response = await apiClient.post(`/medical/patients/${patientId}/critical-lab-values`, labValues);
      
      logger.info('Critical lab values saved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error saving critical lab values:', error);
      throw error;
    }
  }

  /**
   * Get critical lab values for a patient
   */
  static async getCriticalLabValues(patientId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      logger.info('Getting critical lab values for patient:', patientId);
      
      const response = await apiClient.get(`/medical/patients/${patientId}/critical-lab-values`, {
        params: { limit, offset }
      });
      
      logger.info('Critical lab values retrieved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error getting critical lab values:', error);
      throw error;
    }
  }

  /**
   * Save detailed nutrition data for a patient
   */
  static async saveDetailedNutrition(patientId: string, nutritionData: DetailedNutrition): Promise<any> {
    try {
      logger.info('Saving detailed nutrition for patient:', patientId);
      
      const response = await apiClient.post(`/medical/patients/${patientId}/detailed-nutrition`, nutritionData);
      
      logger.info('Detailed nutrition saved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error saving detailed nutrition:', error);
      throw error;
    }
  }

  /**
   * Get detailed nutrition data for a patient
   */
  static async getDetailedNutrition(patientId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      logger.info('Getting detailed nutrition for patient:', patientId);
      
      const response = await apiClient.get(`/medical/patients/${patientId}/detailed-nutrition`, {
        params: { limit, offset }
      });
      
      logger.info('Detailed nutrition retrieved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error getting detailed nutrition:', error);
      throw error;
    }
  }

  /**
   * Save detailed exercise data for a patient
   */
  static async saveDetailedExercise(patientId: string, exerciseData: DetailedExercise): Promise<any> {
    try {
      logger.info('Saving detailed exercise for patient:', patientId);
      
      const response = await apiClient.post(`/medical/patients/${patientId}/detailed-exercise`, exerciseData);
      
      logger.info('Detailed exercise saved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error saving detailed exercise:', error);
      throw error;
    }
  }

  /**
   * Get detailed exercise data for a patient
   */
  static async getDetailedExercise(patientId: string, limit: number = 10, offset: number = 0): Promise<any> {
    try {
      logger.info('Getting detailed exercise for patient:', patientId);
      
      const response = await apiClient.get(`/medical/patients/${patientId}/detailed-exercise`, {
        params: { limit, offset }
      });
      
      logger.info('Detailed exercise retrieved successfully');
      return response.data;
    } catch (error) {
      logger.error('Error getting detailed exercise:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive patient data for AI analysis
   */
  static async getComprehensivePatientData(patientId: string): Promise<ComprehensivePatientData> {
    try {
      logger.info('Getting comprehensive patient data for AI analysis:', patientId);
      
      const response = await apiClient.get(`/medical/patients/${patientId}/comprehensive-data`);
      
      logger.info('Comprehensive patient data retrieved successfully');
      return response.data as ComprehensivePatientData;
    } catch (error) {
      logger.error('Error getting comprehensive patient data:', error);
      throw error;
    }
  }

  /**
   * Validate critical lab values
   */
  static validateCriticalLabValues(labValues: CriticalLabValues): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate HbA1c
    if (labValues.hba1c !== undefined && (labValues.hba1c < 0 || labValues.hba1c > 20)) {
      errors.push('HbA1c ต้องอยู่ระหว่าง 0-20%');
    }

    // Validate Fasting Insulin
    if (labValues.fastingInsulin !== undefined && (labValues.fastingInsulin < 0 || labValues.fastingInsulin > 100)) {
      errors.push('Fasting Insulin ต้องอยู่ระหว่าง 0-100 μU/mL');
    }

    // Validate Total Cholesterol
    if (labValues.totalCholesterol !== undefined && (labValues.totalCholesterol < 0 || labValues.totalCholesterol > 1000)) {
      errors.push('Total Cholesterol ต้องอยู่ระหว่าง 0-1000 mg/dL');
    }

    // Validate HDL Cholesterol
    if (labValues.hdlCholesterol !== undefined && (labValues.hdlCholesterol < 0 || labValues.hdlCholesterol > 200)) {
      errors.push('HDL Cholesterol ต้องอยู่ระหว่าง 0-200 mg/dL');
    }

    // Validate LDL Cholesterol
    if (labValues.ldlCholesterol !== undefined && (labValues.ldlCholesterol < 0 || labValues.ldlCholesterol > 500)) {
      errors.push('LDL Cholesterol ต้องอยู่ระหว่าง 0-500 mg/dL');
    }

    // Validate Triglycerides
    if (labValues.triglycerides !== undefined && (labValues.triglycerides < 0 || labValues.triglycerides > 1000)) {
      errors.push('Triglycerides ต้องอยู่ระหว่าง 0-1000 mg/dL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate detailed nutrition data
   */
  static validateDetailedNutrition(nutrition: DetailedNutrition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate Daily Calorie Intake
    if (nutrition.dailyCalorieIntake !== undefined && (nutrition.dailyCalorieIntake < 0 || nutrition.dailyCalorieIntake > 10000)) {
      errors.push('Daily Calorie Intake ต้องอยู่ระหว่าง 0-10000 kcal');
    }

    // Validate Carbohydrate Intake
    if (nutrition.carbohydrateIntake !== undefined && (nutrition.carbohydrateIntake < 0 || nutrition.carbohydrateIntake > 1000)) {
      errors.push('Carbohydrate Intake ต้องอยู่ระหว่าง 0-1000 g');
    }

    // Validate Protein Intake
    if (nutrition.proteinIntake !== undefined && (nutrition.proteinIntake < 0 || nutrition.proteinIntake > 500)) {
      errors.push('Protein Intake ต้องอยู่ระหว่าง 0-500 g');
    }

    // Validate Fat Intake
    if (nutrition.fatIntake !== undefined && (nutrition.fatIntake < 0 || nutrition.fatIntake > 500)) {
      errors.push('Fat Intake ต้องอยู่ระหว่าง 0-500 g');
    }

    // Validate Water Intake
    if (nutrition.waterIntake !== undefined && (nutrition.waterIntake < 0 || nutrition.waterIntake > 20)) {
      errors.push('Water Intake ต้องอยู่ระหว่าง 0-20 L');
    }

    // Validate Meal Frequency
    if (nutrition.mealFrequency !== undefined && (nutrition.mealFrequency < 1 || nutrition.mealFrequency > 10)) {
      errors.push('Meal Frequency ต้องอยู่ระหว่าง 1-10 ครั้ง/วัน');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate detailed exercise data
   */
  static validateDetailedExercise(exercise: DetailedExercise): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate Exercise Duration
    if (exercise.exerciseDuration !== undefined && (exercise.exerciseDuration < 0 || exercise.exerciseDuration > 600)) {
      errors.push('Exercise Duration ต้องอยู่ระหว่าง 0-600 นาที');
    }

    // Validate Exercise Frequency
    if (exercise.exerciseFrequency !== undefined && (exercise.exerciseFrequency < 0 || exercise.exerciseFrequency > 14)) {
      errors.push('Exercise Frequency ต้องอยู่ระหว่าง 0-14 ครั้ง/สัปดาห์');
    }

    // Validate METs
    if (exercise.mets !== undefined && (exercise.mets < 0 || exercise.mets > 20)) {
      errors.push('METs ต้องอยู่ระหว่าง 0-20');
    }

    // Validate VO2 Max
    if (exercise.vo2Max !== undefined && (exercise.vo2Max < 0 || exercise.vo2Max > 100)) {
      errors.push('VO2 Max ต้องอยู่ระหว่าง 0-100 mL/kg/min');
    }

    // Validate Walking Steps
    if (exercise.walkingSteps !== undefined && (exercise.walkingSteps < 0 || exercise.walkingSteps > 100000)) {
      errors.push('Walking Steps ต้องอยู่ระหว่าง 0-100000 ก้าว/วัน');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
