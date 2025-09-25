import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { DiabetesRiskAssessmentService, DiabetesRiskResult } from '../services/diabetesRiskAssessmentService';
import { logger } from '../utils/logger';

/**
 * AI Dashboard Controller
 * จัดการข้อมูล Dashboard สำหรับ AI Risk Assessment
 */

/**
 * Get AI Dashboard Overview
 * GET /api/ai/dashboard/overview
 */
export const getAIDashboardOverview = async (req: Request, res: Response) => {
  try {
    const { riskLevel, limit = 50 } = req.query;
    const user = (req as any).user;

    logger.info('Getting AI Dashboard Overview:', { riskLevel, limit });

    // ดึงข้อมูลผู้ป่วยทั้งหมด
    let whereClause = '';
    const queryParams: any[] = [];
    
    if (riskLevel) {
      whereClause = 'WHERE p.id IN (SELECT patient_id FROM ai_insights WHERE insight_type = $1 AND risk_level = $2)';
      queryParams.push('diabetes_risk', riskLevel);
    }

    const patientsQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.date_of_birth,
        p.gender,
        p.hospital_number,
        p.created_at,
        COUNT(v.id) as visit_count,
        MAX(v.visit_date) as last_visit_date
      FROM patients p
      LEFT JOIN visits v ON p.id = v.patient_id
      ${whereClause}
      GROUP BY p.id, p.first_name, p.last_name, p.thai_name, p.date_of_birth, p.gender, p.hospital_number, p.created_at
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1}
    `;

    queryParams.push(Number(limit));
    const patientsResult = await databaseManager.query(patientsQuery, queryParams);

    // คำนวณความเสี่ยงสำหรับผู้ป่วยแต่ละคน
    const patientsWithRisk = await Promise.all(
      patientsResult.rows.map(async (patient) => {
        try {
          const riskResult = await DiabetesRiskAssessmentService.assessPatientDiabetesRisk(patient.id);
          
          return {
            ...patient,
            diabetesRisk: riskResult,
            age: calculateAge(patient.date_of_birth)
          };
        } catch (error) {
          logger.warn('Failed to assess risk for patient:', patient.id, error);
          return {
            ...patient,
            diabetesRisk: null,
            age: calculateAge(patient.date_of_birth)
          };
        }
      })
    );

    // สถิติรวม
    const totalPatients = patientsWithRisk.length;
    const riskStats = {
      low: patientsWithRisk.filter(p => p.diabetesRisk?.riskLevel === 'low').length,
      moderate: patientsWithRisk.filter(p => p.diabetesRisk?.riskLevel === 'moderate').length,
      high: patientsWithRisk.filter(p => p.diabetesRisk?.riskLevel === 'high').length,
      very_high: patientsWithRisk.filter(p => p.diabetesRisk?.riskLevel === 'very_high').length,
      no_data: patientsWithRisk.filter(p => !p.diabetesRisk).length
    };

    // ผู้ป่วยที่ต้องให้ความสำคัญ (ความเสี่ยงสูง)
    const highRiskPatients = patientsWithRisk
      .filter(p => p.diabetesRisk && ['high', 'very_high'].includes(p.diabetesRisk.riskLevel))
      .sort((a, b) => (b.diabetesRisk?.riskScore || 0) - (a.diabetesRisk?.riskScore || 0))
      .slice(0, 10);

    res.status(200).json({
      data: {
        overview: {
          totalPatients,
          riskStats,
          highRiskCount: riskStats.high + riskStats.very_high,
          lastUpdated: new Date().toISOString()
        },
        patients: patientsWithRisk,
        highRiskPatients,
        summary: {
          averageRiskScore: calculateAverageRiskScore(patientsWithRisk),
          urgentCases: patientsWithRisk.filter(p => p.diabetesRisk?.urgencyLevel === 'immediate').length,
          needsFollowUp: patientsWithRisk.filter(p => p.diabetesRisk?.urgencyLevel === 'urgent').length
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: user.id,
        riskLevel: riskLevel || 'all'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting AI Dashboard Overview:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get detailed diabetes risk assessment for a patient
 * GET /api/ai/dashboard/patients/:id/diabetes-risk
 */
export const getPatientDiabetesRisk = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const user = (req as any).user;

    logger.info('Getting diabetes risk for patient:', patientId);

    // ตรวจสอบว่าผู้ป่วยมีอยู่จริง
    const patientResult = await databaseManager.query(
      'SELECT id, first_name, last_name, thai_name, date_of_birth, gender FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    // คำนวณความเสี่ยงโรคเบาหวาน
    const riskResult = await DiabetesRiskAssessmentService.assessPatientDiabetesRisk(patientId);

    // ดึงข้อมูลเพิ่มเติม
    const additionalData = await getPatientAdditionalData(patientId);

    res.status(200).json({
      data: {
        patient: {
          ...patient,
          age: calculateAge(patient.date_of_birth)
        },
        diabetesRisk: riskResult,
        additionalData,
        riskHistory: await getPatientRiskHistory(patientId)
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: user.id,
        assessmentVersion: '1.0'
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting patient diabetes risk:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get risk trends and analytics
 * GET /api/ai/dashboard/analytics
 */
export const getAIAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const user = (req as any).user;

    logger.info('Getting AI Analytics:', { period });

    // คำนวณช่วงเวลา
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // สถิติความเสี่ยงตามเวลา
    const riskTrendsQuery = `
      SELECT 
        DATE(ai.generated_at) as date,
        ai.risk_level,
        COUNT(*) as count
      FROM ai_insights ai
      WHERE ai.insight_type = 'diabetes_risk'
      AND ai.generated_at >= $1
      GROUP BY DATE(ai.generated_at), ai.risk_level
      ORDER BY date DESC
    `;

    const riskTrendsResult = await databaseManager.query(riskTrendsQuery, [startDate]);

    // สถิติตามอายุ
    const ageStatsQuery = `
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) < 30 THEN 'under_30'
          WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN 30 AND 44 THEN '30_44'
          WHEN EXTRACT(YEAR FROM AGE(p.date_of_birth)) BETWEEN 45 AND 64 THEN '45_64'
          ELSE 'over_65'
        END as age_group,
        ai.risk_level,
        COUNT(*) as count
      FROM patients p
      INNER JOIN ai_insights ai ON p.id = ai.patient_id
      WHERE ai.insight_type = 'diabetes_risk'
      AND ai.generated_at >= $1
      GROUP BY age_group, ai.risk_level
      ORDER BY age_group, ai.risk_level
    `;

    const ageStatsResult = await databaseManager.query(ageStatsQuery, [startDate]);

    // สถิติตามเพศ
    const genderStatsQuery = `
      SELECT 
        p.gender,
        ai.risk_level,
        COUNT(*) as count
      FROM patients p
      INNER JOIN ai_insights ai ON p.id = ai.patient_id
      WHERE ai.insight_type = 'diabetes_risk'
      AND ai.generated_at >= $1
      GROUP BY p.gender, ai.risk_level
      ORDER BY p.gender, ai.risk_level
    `;

    const genderStatsResult = await databaseManager.query(genderStatsQuery, [startDate]);

    res.status(200).json({
      data: {
        period,
        riskTrends: riskTrendsResult.rows,
        ageStatistics: ageStatsResult.rows,
        genderStatistics: genderStatsResult.rows,
        summary: {
          totalAssessments: riskTrendsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          averageRiskScore: await calculateOverallAverageRiskScore(startDate),
          highRiskPercentage: await calculateHighRiskPercentage(startDate)
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: user.id,
        period
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error getting AI Analytics:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Bulk assess diabetes risk for multiple patients
 * POST /api/ai/dashboard/bulk-assess
 */
export const bulkAssessDiabetesRisk = async (req: Request, res: Response) => {
  try {
    const { patientIds, forceRecalculate = false } = req.body;
    const user = (req as any).user;

    logger.info('Bulk assessing diabetes risk:', { patientCount: patientIds?.length });

    if (!patientIds || !Array.isArray(patientIds)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'patientIds array is required' },
        statusCode: 400
      });
    }

    const results = await Promise.allSettled(
      patientIds.map(async (patientId: string) => {
        try {
          // ตรวจสอบว่าต้องคำนวณใหม่หรือไม่
          if (!forceRecalculate) {
            const existingResult = await databaseManager.query(`
              SELECT id FROM ai_insights 
              WHERE patient_id = $1 AND insight_type = 'diabetes_risk'
              AND generated_at > NOW() - INTERVAL '24 hours'
            `, [patientId]);

            if (existingResult.rows.length > 0) {
              return { patientId, status: 'skipped', reason: 'recent_assessment_exists' };
            }
          }

          const riskResult = await DiabetesRiskAssessmentService.assessPatientDiabetesRisk(patientId);
          
          // บันทึกผลลัพธ์ลงฐานข้อมูล
          await saveRiskAssessmentToDatabase(patientId, riskResult, user.id);
          
          return { patientId, status: 'success', riskResult };
        } catch (error) {
          logger.error('Error assessing risk for patient:', patientId, error);
          return { patientId, status: 'error', error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
    const failed = results.filter(r => r.status === 'rejected' || r.value.status === 'error').length;
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value.status === 'skipped').length;

    res.status(200).json({
      data: {
        summary: {
          total: patientIds.length,
          successful,
          failed,
          skipped
        },
        results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason })
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: user.id,
        forceRecalculate
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    logger.error('Error in bulk assess diabetes risk:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

// Helper functions
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function calculateAverageRiskScore(patients: any[]): number {
  const validScores = patients
    .filter(p => p.diabetesRisk?.riskScore)
    .map(p => p.diabetesRisk.riskScore);
  
  if (validScores.length === 0) return 0;
  
  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
}

async function getPatientAdditionalData(patientId: string) {
  try {
    // ดึงข้อมูลสัญญาณชีพล่าสุด
    const vitalSignsResult = await databaseManager.query(`
      SELECT * FROM vital_signs 
      WHERE patient_id = $1 
      ORDER BY measurement_time DESC 
      LIMIT 1
    `, [patientId]);

    // ดึงข้อมูล Lab Results ล่าสุด
    const labResultsResult = await databaseManager.query(`
      SELECT lr.*, lo.test_name 
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lo.patient_id = $1
      ORDER BY lr.result_date DESC
      LIMIT 10
    `, [patientId]);

    // ดึงข้อมูลการมาพบแพทย์ล่าสุด
    const visitsResult = await databaseManager.query(`
      SELECT * FROM visits 
      WHERE patient_id = $1 
      ORDER BY visit_date DESC 
      LIMIT 5
    `, [patientId]);

    return {
      latestVitalSigns: vitalSignsResult.rows[0] || null,
      recentLabResults: labResultsResult.rows,
      recentVisits: visitsResult.rows
    };
  } catch (error) {
    logger.error('Error getting patient additional data:', error);
    return {
      latestVitalSigns: null,
      recentLabResults: [],
      recentVisits: []
    };
  }
}

async function getPatientRiskHistory(patientId: string) {
  try {
    const historyResult = await databaseManager.query(`
      SELECT 
        ai.risk_score,
        ai.risk_level,
        ai.confidence_score,
        ai.generated_at,
        ai.recommendations
      FROM ai_insights ai
      WHERE ai.patient_id = $1 
      AND ai.insight_type = 'diabetes_risk'
      ORDER BY ai.generated_at DESC
      LIMIT 10
    `, [patientId]);

    return historyResult.rows;
  } catch (error) {
    logger.error('Error getting patient risk history:', error);
    return [];
  }
}

async function saveRiskAssessmentToDatabase(patientId: string, riskResult: DiabetesRiskResult, userId: string) {
  try {
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description,
        confidence_score, risk_level, recommendations,
        generated_by, generated_at, is_active
      ) VALUES (
        gen_random_uuid(), $1, 'diabetes_risk', $2, $3,
        $4, $5, $6, $7, NOW() AT TIME ZONE 'Asia/Bangkok', true
      )
    `, [
      patientId,
      `ความเสี่ยงโรคเบาหวาน: ${riskResult.riskLevel}`,
      `คะแนนความเสี่ยง: ${riskResult.riskScore}/100 (${riskResult.riskPercentage}% โอกาสเป็นโรคใน 10 ปี)`,
      riskResult.riskScore / 100, // Convert to 0-1 scale
      riskResult.riskLevel,
      JSON.stringify(riskResult.recommendations),
      userId
    ]);
  } catch (error) {
    logger.error('Error saving risk assessment to database:', error);
    throw error;
  }
}

async function calculateOverallAverageRiskScore(startDate: Date): Promise<number> {
  try {
    const result = await databaseManager.query(`
      SELECT AVG(confidence_score * 100) as avg_score
      FROM ai_insights
      WHERE insight_type = 'diabetes_risk'
      AND generated_at >= $1
    `, [startDate]);

    return result.rows[0]?.avg_score || 0;
  } catch (error) {
    logger.error('Error calculating overall average risk score:', error);
    return 0;
  }
}

async function calculateHighRiskPercentage(startDate: Date): Promise<number> {
  try {
    const result = await databaseManager.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN risk_level IN ('high', 'very_high') THEN 1 END) as high_risk
      FROM ai_insights
      WHERE insight_type = 'diabetes_risk'
      AND generated_at >= $1
    `, [startDate]);

    const { total, high_risk } = result.rows[0];
    return total > 0 ? (high_risk / total) * 100 : 0;
  } catch (error) {
    logger.error('Error calculating high risk percentage:', error);
    return 0;
  }
}
