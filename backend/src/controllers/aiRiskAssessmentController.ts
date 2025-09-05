import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Risk Assessment Controller
 * จัดการการประเมินความเสี่ยงด้วย AI สำหรับโรคต่างๆ
 */

interface RiskFactors {
  age: number;
  gender: string;
  bmi: number;
  bloodPressure: { systolic: number; diastolic: number };
  bloodGlucose: number;
  cholesterol: number;
  familyHistory: string[];
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
    exercise: string;
    diet: string;
  };
  medicalHistory: string[];
}

interface RiskAssessmentResult {
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  probability: number;
  factors: RiskFactors;
  recommendations: string[];
  nextAssessmentDate: Date;
}

/**
 * Calculate risk assessment for a patient
 * POST /api/ai/risk-assessment
 */
export const calculateRiskAssessment = async (req: Request, res: Response) => {
  try {
    const { patientId, assessmentType } = req.body;
    const userId = (req as any).user?.id;

    if (!patientId || !assessmentType) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and assessment type are required',
        data: null
      });
    }

    // Validate assessment type
    const validTypes = ['diabetes', 'hypertension', 'heart_disease', 'stroke', 'cancer'];
    if (!validTypes.includes(assessmentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment type',
        data: null
      });
    }

    // Get patient data
    const patientData = await getPatientDataForAssessment(patientId);
    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        data: null
      });
    }

    // Calculate risk assessment
    const riskResult = await calculateRiskForType(assessmentType, patientData);

    // Save assessment to database
    const assessmentId = uuidv4();
    await databaseManager.query(`
      INSERT INTO risk_assessments (
        id, patient_id, assessment_type, risk_level, probability,
        factors, recommendations, next_assessment_date, assessed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      assessmentId,
      patientId,
      assessmentType,
      riskResult.riskLevel,
      riskResult.probability,
      JSON.stringify(riskResult.factors),
      riskResult.recommendations,
      riskResult.nextAssessmentDate,
      userId || 'system'
    ]);

    // Update AI model performance
    await updateModelPerformance(assessmentType, riskResult.riskLevel);

    res.status(201).json({
      success: true,
      message: 'Risk assessment completed successfully',
      data: {
        id: assessmentId,
        patientId,
        assessmentType,
        riskLevel: riskResult.riskLevel,
        probability: riskResult.probability,
        factors: riskResult.factors,
        recommendations: riskResult.recommendations,
        nextAssessmentDate: riskResult.nextAssessmentDate,
        assessedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get risk assessment by ID
 * GET /api/ai/risk-assessment/{id}
 */
export const getRiskAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await databaseManager.query(`
      SELECT 
        ra.*,
        p.first_name,
        p.last_name,
        p.hn,
        u.first_name as assessed_by_first_name,
        u.last_name as assessed_by_last_name
      FROM risk_assessments ra
      LEFT JOIN patients p ON ra.patient_id = p.id
      LEFT JOIN users u ON ra.assessed_by = u.id
      WHERE ra.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found',
        data: null
      });
    }

    const assessment = result.rows[0];
    assessment.factors = JSON.parse(assessment.factors);

    res.json({
      success: true,
      message: 'Risk assessment retrieved successfully',
      data: assessment
    });

  } catch (error) {
    console.error('Error getting risk assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get risk assessment history for a patient
 * GET /api/ai/risk-assessment/history
 */
export const getRiskAssessmentHistory = async (req: Request, res: Response) => {
  try {
    const { patientId, assessmentType, limit = 10, offset = 0 } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
        data: null
      });
    }

    let whereClause = 'WHERE ra.patient_id = $1';
    const queryParams: any[] = [patientId];

    if (assessmentType) {
      whereClause += ' AND ra.assessment_type = $2';
      queryParams.push(assessmentType);
    }

    const result = await databaseManager.query(`
      SELECT 
        ra.id,
        ra.assessment_type,
        ra.risk_level,
        ra.probability,
        ra.factors,
        ra.recommendations,
        ra.next_assessment_date,
        ra.assessment_date,
        ra.assessed_by,
        u.first_name as assessed_by_first_name,
        u.last_name as assessed_by_last_name
      FROM risk_assessments ra
      LEFT JOIN users u ON ra.assessed_by = u.id
      ${whereClause}
      ORDER BY ra.assessment_date DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, [...queryParams, limit, offset]);

    // Parse factors JSON for each assessment
    const assessments = result.rows.map(assessment => ({
      ...assessment,
      factors: JSON.parse(assessment.factors)
    }));

    res.json({
      success: true,
      message: 'Risk assessment history retrieved successfully',
      data: {
        assessments,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: assessments.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting risk assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get AI model performance statistics
 * GET /api/ai/model-performance
 */
export const getModelPerformance = async (req: Request, res: Response) => {
  try {
    const { modelName, assessmentType } = req.query;

    let whereClause = '';
    const queryParams: any[] = [];

    if (modelName) {
      whereClause += 'WHERE model_name = $1';
      queryParams.push(modelName);
    }

    if (assessmentType) {
      const paramIndex = queryParams.length + 1;
      whereClause += queryParams.length > 0 ? ' AND' : 'WHERE';
      whereClause += ` assessment_type = $${paramIndex}`;
      queryParams.push(assessmentType);
    }

    const result = await databaseManager.query(`
      SELECT 
        model_name,
        model_version,
        assessment_type,
        accuracy,
        precision_score,
        recall_score,
        f1_score,
        total_predictions,
        correct_predictions,
        last_updated
      FROM ai_model_performance
      ${whereClause}
      ORDER BY last_updated DESC
    `, queryParams);

    res.json({
      success: true,
      message: 'Model performance retrieved successfully',
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: null
    });
  }
};

/**
 * Get patient data for risk assessment
 */
async function getPatientDataForAssessment(patientId: string): Promise<RiskFactors | null> {
  try {
    // Get patient basic info
    const patientResult = await databaseManager.query(`
      SELECT 
        p.*,
        EXTRACT(YEAR FROM AGE(p.birth_date)) as age
      FROM patients p
      WHERE p.id = $1
    `, [patientId]);

    if (patientResult.rows.length === 0) {
      return null;
    }

    const patient = patientResult.rows[0];

    // Get latest vital signs
    const vitalSignsResult = await databaseManager.query(`
      SELECT 
        systolic_bp, diastolic_bp, heart_rate, temperature,
        weight, height, bmi, blood_glucose
      FROM vital_signs
      WHERE patient_id = $1
      ORDER BY measurement_time DESC
      LIMIT 1
    `, [patientId]);

    const vitalSigns = vitalSignsResult.rows[0] || {};

    // Get latest lab results
    const labResultsResult = await databaseManager.query(`
      SELECT 
        lr.result_numeric, lr.result_unit, lo.test_name
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lo.patient_id = $1
      AND lo.test_name IN ('Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'Blood Glucose')
      ORDER BY lr.result_date DESC
      LIMIT 10
    `, [patientId]);

    const labResults = labResultsResult.rows;

    // Extract cholesterol value (use total cholesterol if available)
    const cholesterolResult = labResults.find(r => r.test_name === 'Cholesterol');
    const cholesterol = cholesterolResult ? parseFloat(cholesterolResult.result_numeric) : 200;

    // Extract blood glucose
    const glucoseResult = labResults.find(r => r.test_name === 'Blood Glucose');
    const bloodGlucose = glucoseResult ? parseFloat(glucoseResult.result_numeric) : (vitalSigns.blood_glucose || 100);

    return {
      age: patient.age || 30,
      gender: patient.gender || 'unknown',
      bmi: vitalSigns.bmi || 25,
      bloodPressure: {
        systolic: vitalSigns.systolic_bp || 120,
        diastolic: vitalSigns.diastolic_bp || 80
      },
      bloodGlucose: bloodGlucose,
      cholesterol: cholesterol,
      familyHistory: [], // Would be populated from patient history
      lifestyle: {
        smoking: false, // Would be populated from patient questionnaire
        alcohol: false,
        exercise: 'moderate',
        diet: 'balanced'
      },
      medicalHistory: [] // Would be populated from patient history
    };

  } catch (error) {
    console.error('Error getting patient data for assessment:', error);
    return null;
  }
}

/**
 * Calculate risk for specific assessment type
 */
async function calculateRiskForType(assessmentType: string, patientData: RiskFactors): Promise<RiskAssessmentResult> {
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high' = 'low';
  let probability = 0;
  let recommendations: string[] = [];

  switch (assessmentType) {
    case 'diabetes':
      return calculateDiabetesRisk(patientData);
    case 'hypertension':
      return calculateHypertensionRisk(patientData);
    case 'heart_disease':
      return calculateHeartDiseaseRisk(patientData);
    case 'stroke':
      return calculateStrokeRisk(patientData);
    case 'cancer':
      return calculateCancerRisk(patientData);
    default:
      throw new Error('Invalid assessment type');
  }
}

/**
 * Calculate diabetes risk
 */
function calculateDiabetesRisk(patientData: RiskFactors): RiskAssessmentResult {
  let riskScore = 0;
  let recommendations: string[] = [];

  // Age factor
  if (patientData.age >= 45) riskScore += 2;
  else if (patientData.age >= 35) riskScore += 1;

  // BMI factor
  if (patientData.bmi >= 30) {
    riskScore += 3;
    recommendations.push('ลดน้ำหนักให้อยู่ในเกณฑ์ปกติ');
  } else if (patientData.bmi >= 25) {
    riskScore += 1;
    recommendations.push('ควบคุมน้ำหนัก');
  }

  // Blood pressure factor
  if (patientData.bloodPressure.systolic >= 140 || patientData.bloodPressure.diastolic >= 90) {
    riskScore += 2;
    recommendations.push('ควบคุมความดันโลหิต');
  }

  // Blood glucose factor
  if (patientData.bloodGlucose >= 126) {
    riskScore += 4;
    recommendations.push('ตรวจระดับน้ำตาลในเลือดอย่างสม่ำเสมอ');
  } else if (patientData.bloodGlucose >= 100) {
    riskScore += 2;
    recommendations.push('ควบคุมระดับน้ำตาลในเลือด');
  }

  // Family history factor
  if (patientData.familyHistory.includes('diabetes')) {
    riskScore += 2;
  }

  // Lifestyle factors
  if (!patientData.lifestyle.exercise || patientData.lifestyle.exercise === 'sedentary') {
    riskScore += 1;
    recommendations.push('ออกกำลังกายอย่างสม่ำเสมอ');
  }

  // Calculate risk level and probability
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  let probability: number;

  if (riskScore >= 8) {
    riskLevel = 'very_high';
    probability = 85;
  } else if (riskScore >= 6) {
    riskLevel = 'high';
    probability = 65;
  } else if (riskScore >= 3) {
    riskLevel = 'moderate';
    probability = 35;
  } else {
    riskLevel = 'low';
    probability = 15;
  }

  // Add general recommendations
  if (recommendations.length === 0) {
    recommendations.push('รักษาสุขภาพให้แข็งแรง', 'ตรวจสุขภาพประจำปี');
  }

  return {
    riskLevel,
    probability,
    factors: patientData,
    recommendations,
    nextAssessmentDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
  };
}

/**
 * Calculate hypertension risk
 */
function calculateHypertensionRisk(patientData: RiskFactors): RiskAssessmentResult {
  let riskScore = 0;
  let recommendations: string[] = [];

  // Current blood pressure
  if (patientData.bloodPressure.systolic >= 140 || patientData.bloodPressure.diastolic >= 90) {
    riskScore += 4;
    recommendations.push('ควบคุมความดันโลหิตอย่างเร่งด่วน');
  } else if (patientData.bloodPressure.systolic >= 130 || patientData.bloodPressure.diastolic >= 85) {
    riskScore += 2;
    recommendations.push('ติดตามความดันโลหิตอย่างใกล้ชิด');
  }

  // Age factor
  if (patientData.age >= 65) riskScore += 2;
  else if (patientData.age >= 45) riskScore += 1;

  // BMI factor
  if (patientData.bmi >= 30) {
    riskScore += 2;
    recommendations.push('ลดน้ำหนัก');
  }

  // Family history
  if (patientData.familyHistory.includes('hypertension')) {
    riskScore += 2;
  }

  // Lifestyle factors
  if (patientData.lifestyle.smoking) {
    riskScore += 2;
    recommendations.push('หยุดสูบบุหรี่');
  }

  if (patientData.lifestyle.diet === 'high_sodium') {
    riskScore += 1;
    recommendations.push('ลดการบริโภคเกลือ');
  }

  // Calculate risk level and probability
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  let probability: number;

  if (riskScore >= 8) {
    riskLevel = 'very_high';
    probability = 80;
  } else if (riskScore >= 5) {
    riskLevel = 'high';
    probability = 60;
  } else if (riskScore >= 3) {
    riskLevel = 'moderate';
    probability = 35;
  } else {
    riskLevel = 'low';
    probability = 20;
  }

  if (recommendations.length === 0) {
    recommendations.push('รักษาสุขภาพให้แข็งแรง', 'ตรวจความดันโลหิตเป็นประจำ');
  }

  return {
    riskLevel,
    probability,
    factors: patientData,
    recommendations,
    nextAssessmentDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000) // 3 months
  };
}

/**
 * Calculate heart disease risk
 */
function calculateHeartDiseaseRisk(patientData: RiskFactors): RiskAssessmentResult {
  let riskScore = 0;
  let recommendations: string[] = [];

  // Age and gender factors
  if (patientData.gender === 'male' && patientData.age >= 45) riskScore += 2;
  if (patientData.gender === 'female' && patientData.age >= 55) riskScore += 2;

  // Blood pressure
  if (patientData.bloodPressure.systolic >= 140 || patientData.bloodPressure.diastolic >= 90) {
    riskScore += 2;
    recommendations.push('ควบคุมความดันโลหิต');
  }

  // Cholesterol
  if (patientData.cholesterol >= 240) {
    riskScore += 3;
    recommendations.push('ควบคุมระดับคอเลสเตอรอล');
  } else if (patientData.cholesterol >= 200) {
    riskScore += 1;
  }

  // BMI
  if (patientData.bmi >= 30) {
    riskScore += 2;
    recommendations.push('ลดน้ำหนัก');
  }

  // Lifestyle factors
  if (patientData.lifestyle.smoking) {
    riskScore += 3;
    recommendations.push('หยุดสูบบุหรี่');
  }

  if (patientData.lifestyle.exercise === 'sedentary') {
    riskScore += 1;
    recommendations.push('ออกกำลังกายอย่างสม่ำเสมอ');
  }

  // Family history
  if (patientData.familyHistory.includes('heart_disease')) {
    riskScore += 2;
  }

  // Calculate risk level and probability
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  let probability: number;

  if (riskScore >= 10) {
    riskLevel = 'very_high';
    probability = 75;
  } else if (riskScore >= 7) {
    riskLevel = 'high';
    probability = 50;
  } else if (riskScore >= 4) {
    riskLevel = 'moderate';
    probability = 25;
  } else {
    riskLevel = 'low';
    probability = 10;
  }

  if (recommendations.length === 0) {
    recommendations.push('รักษาสุขภาพหัวใจ', 'ตรวจสุขภาพหัวใจเป็นประจำ');
  }

  return {
    riskLevel,
    probability,
    factors: patientData,
    recommendations,
    nextAssessmentDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
  };
}

/**
 * Calculate stroke risk
 */
function calculateStrokeRisk(patientData: RiskFactors): RiskAssessmentResult {
  let riskScore = 0;
  let recommendations: string[] = [];

  // Age factor
  if (patientData.age >= 75) riskScore += 3;
  else if (patientData.age >= 65) riskScore += 2;
  else if (patientData.age >= 55) riskScore += 1;

  // Blood pressure
  if (patientData.bloodPressure.systolic >= 160 || patientData.bloodPressure.diastolic >= 100) {
    riskScore += 3;
    recommendations.push('ควบคุมความดันโลหิตอย่างเร่งด่วน');
  } else if (patientData.bloodPressure.systolic >= 140 || patientData.bloodPressure.diastolic >= 90) {
    riskScore += 2;
    recommendations.push('ควบคุมความดันโลหิต');
  }

  // Atrial fibrillation (simulated)
  if (patientData.heart_rate > 100) {
    riskScore += 2;
    recommendations.push('ตรวจการเต้นของหัวใจ');
  }

  // Diabetes
  if (patientData.bloodGlucose >= 126) {
    riskScore += 2;
    recommendations.push('ควบคุมระดับน้ำตาลในเลือด');
  }

  // Smoking
  if (patientData.lifestyle.smoking) {
    riskScore += 2;
    recommendations.push('หยุดสูบบุหรี่');
  }

  // Calculate risk level and probability
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  let probability: number;

  if (riskScore >= 8) {
    riskLevel = 'very_high';
    probability = 70;
  } else if (riskScore >= 5) {
    riskLevel = 'high';
    probability = 45;
  } else if (riskScore >= 3) {
    riskLevel = 'moderate';
    probability = 25;
  } else {
    riskLevel = 'low';
    probability = 10;
  }

  if (recommendations.length === 0) {
    recommendations.push('รักษาสุขภาพให้แข็งแรง', 'ตรวจสุขภาพเป็นประจำ');
  }

  return {
    riskLevel,
    probability,
    factors: patientData,
    recommendations,
    nextAssessmentDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
  };
}

/**
 * Calculate cancer risk (general)
 */
function calculateCancerRisk(patientData: RiskFactors): RiskAssessmentResult {
  let riskScore = 0;
  let recommendations: string[] = [];

  // Age factor
  if (patientData.age >= 65) riskScore += 3;
  else if (patientData.age >= 50) riskScore += 2;
  else if (patientData.age >= 40) riskScore += 1;

  // Smoking
  if (patientData.lifestyle.smoking) {
    riskScore += 4;
    recommendations.push('หยุดสูบบุหรี่');
  }

  // BMI
  if (patientData.bmi >= 30) {
    riskScore += 2;
    recommendations.push('ลดน้ำหนัก');
  }

  // Family history
  if (patientData.familyHistory.includes('cancer')) {
    riskScore += 2;
  }

  // Alcohol consumption
  if (patientData.lifestyle.alcohol) {
    riskScore += 1;
    recommendations.push('ลดการดื่มแอลกอฮอล์');
  }

  // Calculate risk level and probability
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  let probability: number;

  if (riskScore >= 8) {
    riskLevel = 'very_high';
    probability = 60;
  } else if (riskScore >= 5) {
    riskLevel = 'high';
    probability = 35;
  } else if (riskScore >= 3) {
    riskLevel = 'moderate';
    probability = 20;
  } else {
    riskLevel = 'low';
    probability = 10;
  }

  if (recommendations.length === 0) {
    recommendations.push('ตรวจคัดกรองมะเร็งตามอายุ', 'รักษาสุขภาพให้แข็งแรง');
  }

  return {
    riskLevel,
    probability,
    factors: patientData,
    recommendations,
    nextAssessmentDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000) // 12 months
  };
}

/**
 * Update AI model performance
 */
async function updateModelPerformance(assessmentType: string, riskLevel: string): Promise<void> {
  try {
    const modelName = `risk_assessment_${assessmentType}`;
    const modelVersion = '1.0.0';

    // Check if performance record exists
    const existingResult = await databaseManager.query(`
      SELECT id, total_predictions, correct_predictions
      FROM ai_model_performance
      WHERE model_name = $1 AND model_version = $2 AND assessment_type = $3
    `, [modelName, modelVersion, assessmentType]);

    if (existingResult.rows.length > 0) {
      // Update existing record
      const record = existingResult.rows[0];
      const newTotal = record.total_predictions + 1;
      const newCorrect = record.correct_predictions + (riskLevel === 'moderate' || riskLevel === 'high' ? 1 : 0);
      
      await databaseManager.query(`
        UPDATE ai_model_performance
        SET 
          total_predictions = $1,
          correct_predictions = $2,
          accuracy = $3,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newTotal, newCorrect, newCorrect / newTotal, record.id]);
    } else {
      // Create new record
      await databaseManager.query(`
        INSERT INTO ai_model_performance (
          model_name, model_version, assessment_type,
          total_predictions, correct_predictions, accuracy,
          last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [modelName, modelVersion, assessmentType, 1, 0, 0]);
    }
  } catch (error) {
    console.error('Error updating model performance:', error);
  }
}
