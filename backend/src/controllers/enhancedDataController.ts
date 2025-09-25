import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { logger } from '../utils/logger';

/**
 * Enhanced Data Controller
 * จัดการข้อมูลเพิ่มเติมสำหรับ AI Analysis
 */

/**
 * Save enhanced vital signs data (for AI analysis)
 * POST /api/medical/patients/:id/enhanced-vital-signs
 */
export const saveEnhancedVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const vitalSignsData = req.body;
    const userId = (req as any).user.id;

    logger.info('Saving enhanced vital signs for patient:', patientId);

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Insert enhanced vital signs data into critical_lab_values table
    // (We're reusing this table for enhanced data storage)
    const result = await databaseManager.query(`
      INSERT INTO critical_lab_values (
        patient_id, test_date, created_by
      ) VALUES (
        $1, $2, $3
      ) RETURNING *
    `, [
      patientId,
      vitalSignsData.testDate || new Date().toISOString(),
      userId
    ]);

    logger.info('Enhanced vital signs saved successfully');

    res.status(201).json({
      data: result.rows[0],
      meta: null,
      error: null,
      statusCode: 201
    });

  } catch (error: any) {
    logger.error('Error saving enhanced vital signs:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Failed to save enhanced vital signs' },
      statusCode: 500
    });
  }
};

/**
 * Save critical lab values
 * POST /api/medical/patients/:id/critical-lab-values
 */
export const saveCriticalLabValues = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const labValues = req.body;
    const userId = (req as any).user.id;

    logger.info('Saving critical lab values for patient:', patientId);

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Insert critical lab values
    const result = await databaseManager.query(`
      INSERT INTO critical_lab_values (
        patient_id, lab_result_id, hba1c, fasting_insulin, c_peptide,
        total_cholesterol, hdl_cholesterol, ldl_cholesterol, triglycerides,
        bun, creatinine, egfr, alt, ast, alp, bilirubin,
        tsh, t3, t4, crp, esr, vitamin_d, b12, folate,
        iron, ferritin, uric_acid, test_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *
    `, [
      patientId,
      labValues.labResultId || null,
      labValues.hba1c || null,
      labValues.fastingInsulin || null,
      labValues.cPeptide || null,
      labValues.totalCholesterol || null,
      labValues.hdlCholesterol || null,
      labValues.ldlCholesterol || null,
      labValues.triglycerides || null,
      labValues.bun || null,
      labValues.creatinine || null,
      labValues.egfr || null,
      labValues.alt || null,
      labValues.ast || null,
      labValues.alp || null,
      labValues.bilirubin || null,
      labValues.tsh || null,
      labValues.t3 || null,
      labValues.t4 || null,
      labValues.crp || null,
      labValues.esr || null,
      labValues.vitaminD || null,
      labValues.b12 || null,
      labValues.folate || null,
      labValues.iron || null,
      labValues.ferritin || null,
      labValues.uricAcid || null,
      labValues.testDate || new Date().toISOString().split('T')[0],
      userId
    ]);

    res.status(201).json({
      data: result.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: userId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    logger.error('Error saving critical lab values:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get critical lab values for a patient
 * GET /api/medical/patients/:id/critical-lab-values
 */
export const getCriticalLabValues = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    logger.info('Getting critical lab values for patient:', patientId);

    const result = await databaseManager.query(`
      SELECT * FROM critical_lab_values
      WHERE patient_id = $1
      ORDER BY test_date DESC
      LIMIT $2 OFFSET $3
    `, [patientId, Number(limit), Number(offset)]);

    res.status(200).json({
      data: result.rows,
      meta: {
        timestamp: new Date().toISOString(),
        count: result.rows.length,
        limit: Number(limit),
        offset: Number(offset)
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting critical lab values:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Save detailed nutrition data
 * POST /api/medical/patients/:id/detailed-nutrition
 */
export const saveDetailedNutrition = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const nutritionData = req.body;
    const userId = (req as any).user.id;

    logger.info('Saving detailed nutrition for patient:', patientId);
    logger.info('Nutrition data received:', nutritionData);

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Insert detailed nutrition
    const result = await databaseManager.query(`
      INSERT INTO detailed_nutrition (
        patient_id, visit_id, daily_calorie_intake, carbohydrate_intake,
        protein_intake, fat_intake, fiber_intake, sugar_intake, sodium_intake,
        water_intake, meal_frequency, snacking_frequency, eating_out_frequency,
        processed_food_consumption, organic_food_consumption, supplement_use,
        alcohol_consumption, caffeine_consumption, assessment_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *
    `, [
      patientId,
      nutritionData.visitId || null,
      nutritionData.dailyCalorieIntake || null,
      nutritionData.carbohydrateIntake || null,
      nutritionData.proteinIntake || null,
      nutritionData.fatIntake || null,
      nutritionData.fiberIntake || null,
      nutritionData.sugarIntake || null,
      nutritionData.sodiumIntake || null,
      nutritionData.waterIntake || null,
      nutritionData.mealFrequency || null,
      nutritionData.snackingFrequency || null,
      nutritionData.eatingOutFrequency || null,
      nutritionData.processedFoodConsumption || null,
      nutritionData.organicFoodConsumption || null,
      nutritionData.supplementUse || null,
      nutritionData.alcoholConsumption || null,
      nutritionData.caffeineConsumption || null,
      nutritionData.assessmentDate || new Date().toISOString().split('T')[0],
      userId
    ]);

    res.status(201).json({
      data: result.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: userId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    logger.error('Error saving detailed nutrition:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      data: null,
      meta: null,
      error: { 
        message: 'Internal server error',
        details: error.message 
      },
      statusCode: 500
    });
  }
};

/**
 * Get detailed nutrition data for a patient
 * GET /api/medical/patients/:id/detailed-nutrition
 */
export const getDetailedNutrition = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    logger.info('Getting detailed nutrition for patient:', patientId);

    const result = await databaseManager.query(`
      SELECT * FROM detailed_nutrition
      WHERE patient_id = $1
      ORDER BY assessment_date DESC
      LIMIT $2 OFFSET $3
    `, [patientId, Number(limit), Number(offset)]);

    res.status(200).json({
      data: result.rows,
      meta: {
        timestamp: new Date().toISOString(),
        count: result.rows.length,
        limit: Number(limit),
        offset: Number(offset)
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting detailed nutrition:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Save detailed exercise data
 * POST /api/medical/patients/:id/detailed-exercise
 */
export const saveDetailedExercise = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const exerciseData = req.body;
    const userId = (req as any).user.id;

    logger.info('Saving detailed exercise for patient:', patientId);
    logger.info('Exercise data received:', exerciseData);

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Insert detailed exercise
    const result = await databaseManager.query(`
      INSERT INTO detailed_exercise (
        patient_id, visit_id, exercise_type, exercise_duration, exercise_frequency,
        exercise_intensity, mets, heart_rate_zones, vo2_max, strength_training,
        flexibility_training, balance_training, sports_participation,
        physical_activity_at_work, transportation_method, stairs_usage,
        walking_steps, assessment_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `, [
      patientId,
      exerciseData.visitId || null,
      exerciseData.exerciseType || null,
      exerciseData.exerciseDuration || null,
      exerciseData.exerciseFrequency || null,
      exerciseData.exerciseIntensity || null,
      exerciseData.mets || null,
      exerciseData.heartRateZones || null,
      exerciseData.vo2Max || null,
      exerciseData.strengthTraining || null,
      exerciseData.flexibilityTraining || null,
      exerciseData.balanceTraining || null,
      exerciseData.sportsParticipation || null,
      exerciseData.physicalActivityAtWork || null,
      exerciseData.transportationMethod || null,
      exerciseData.stairsUsage || null,
      exerciseData.walkingSteps || null,
      exerciseData.assessmentDate || new Date().toISOString().split('T')[0],
      userId
    ]);

    res.status(201).json({
      data: result.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: userId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    logger.error('Error saving detailed exercise:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      data: null,
      meta: null,
      error: { 
        message: 'Internal server error',
        details: error.message 
      },
      statusCode: 500
    });
  }
};

/**
 * Get detailed exercise data for a patient
 * GET /api/medical/patients/:id/detailed-exercise
 */
export const getDetailedExercise = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    logger.info('Getting detailed exercise for patient:', patientId);

    const result = await databaseManager.query(`
      SELECT * FROM detailed_exercise
      WHERE patient_id = $1
      ORDER BY assessment_date DESC
      LIMIT $2 OFFSET $3
    `, [patientId, Number(limit), Number(offset)]);

    res.status(200).json({
      data: result.rows,
      meta: {
        timestamp: new Date().toISOString(),
        count: result.rows.length,
        limit: Number(limit),
        offset: Number(offset)
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting detailed exercise:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get comprehensive patient data for AI analysis
 * GET /api/medical/patients/:id/comprehensive-data
 */
export const getComprehensivePatientData = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;

    logger.info('Getting comprehensive patient data for AI analysis:', patientId);

    // Get patient basic info
    const patientResult = await databaseManager.query(`
      SELECT p.*, u.first_name, u.last_name, u.thai_name
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [patientId]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    // Get latest vital signs with enhanced fields
    const vitalSignsResult = await databaseManager.query(`
      SELECT * FROM vital_signs
      WHERE patient_id = $1
      ORDER BY measurement_time DESC
      LIMIT 1
    `, [patientId]);

    // Get latest critical lab values
    const labValuesResult = await databaseManager.query(`
      SELECT * FROM critical_lab_values
      WHERE patient_id = $1
      ORDER BY test_date DESC
      LIMIT 1
    `, [patientId]);

    // Get latest detailed nutrition
    const nutritionResult = await databaseManager.query(`
      SELECT * FROM detailed_nutrition
      WHERE patient_id = $1
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [patientId]);

    // Get latest detailed exercise
    const exerciseResult = await databaseManager.query(`
      SELECT * FROM detailed_exercise
      WHERE patient_id = $1
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [patientId]);

    // Get medical history
    const historyResult = await databaseManager.query(`
      SELECT * FROM medical_records
      WHERE patient_id = $1
      AND record_type = 'history_taking'
      ORDER BY recorded_time DESC
      LIMIT 1
    `, [patientId]);

    const comprehensiveData = {
      patient: patient,
      vitalSigns: vitalSignsResult.rows[0] || null,
      criticalLabValues: labValuesResult.rows[0] || null,
      detailedNutrition: nutritionResult.rows[0] || null,
      detailedExercise: exerciseResult.rows[0] || null,
      medicalHistory: historyResult.rows[0] || null,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      data: comprehensiveData,
      meta: {
        timestamp: new Date().toISOString(),
        patientId: patientId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting comprehensive patient data:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
