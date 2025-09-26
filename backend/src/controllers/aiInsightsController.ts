import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
// Removed getPatientIdForUser import - using direct patient lookup

/**
 * AI Insights Controller
 * จัดการ AI insights และ recommendations สำหรับผู้ป่วย
 */

/**
 * Get AI insights for a patient
 * GET /api/patients/{id}/ai-insights
 */
export const getPatientAIInsights = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, insightType, riskLevel, isActive } = req.query;
    const user = (req as any).user;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientQuery.rows.length === 0) {
        // If no patient found by user_id, try by email
        patientQuery = await databaseManager.query(
          'SELECT id, first_name, last_name, user_id, email FROM patients WHERE email = $1',
          [user.email]
        );
      }
      
      if (patientQuery.rows.length === 0) {
        // If still no patient found, create a virtual patient record from user data
        patient = {
          id: user.id, // Use user ID as patient ID
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
        };
        actualPatientId = user.id;
      } else {
        patient = patientQuery.rows[0];
        actualPatientId = patient.id;
      }
    } else {
      // For doctors/admins, use the provided patient ID
      const patientResult = await databaseManager.query(
        'SELECT id, first_name, last_name, email FROM patients WHERE id = $1',
        [patientId]
      );
      patient = patientResult.rows[0];
      
      if (!patient) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      actualPatientId = patientId;
    }
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for AI insights
    let whereClause = 'WHERE ai.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (insightType) {
      whereClause += ' AND ai.insight_type = $2';
      queryParams.push(insightType);
    }

    if (riskLevel) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND ai.risk_level = $${paramIndex}`;
      queryParams.push(riskLevel);
    }

    if (isActive !== undefined) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND ai.is_active = $${paramIndex}`;
      queryParams.push(isActive === 'true');
    }

    // Get AI insights
    const insightsQuery = `
      SELECT 
        ai.id,
        ai.insight_type,
        ai.title,
        ai.description,
        ai.confidence_score,
        ai.data_source,
        ai.recommendations,
        ai.risk_level,
        ai.is_active,
        ai.generated_at,
        ai.created_at,
        ai.updated_at,
        u.first_name as generated_by_first_name,
        u.last_name as generated_by_last_name
      FROM ai_insights ai
      LEFT JOIN users u ON ai.generated_by = u.id
      ${whereClause}
      ORDER BY ai.risk_level DESC, ai.confidence_score DESC, ai.generated_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const insightsResult = await databaseManager.query(insightsQuery, queryParams);
    const insights = insightsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ai_insights ai
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get risk level summary
    const riskSummary = await databaseManager.query(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM ai_insights ai
      WHERE ai.patient_id = $1 AND ai.is_active = true
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END
    `, [actualPatientId]);

    // Format insights
    const formattedInsights = insights.map(insight => ({
      id: insight.id,
      insight_type: insight.insight_type,
      title: insight.title,
      description: insight.description,
      confidence_score: insight.confidence_score,
      data_source: insight.data_source,
      recommendations: insight.recommendations,
      risk_level: insight.risk_level,
      is_active: insight.is_active,
      generated_at: insight.generated_at,
      created_at: insight.created_at,
      updated_at: insight.updated_at,
      generated_by: insight.generated_by_first_name ? {
        name: `${insight.generated_by_first_name} ${insight.generated_by_last_name}`
      } : null
    }));

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        insights: formattedInsights,
        risk_summary: riskSummary.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        insightCount: formattedInsights.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient AI insights:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Calculate new AI insights for a patient
 * POST /api/patients/{id}/ai-insights/calculate
 */
export const calculatePatientAIInsights = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { insightTypes, forceRecalculate = false } = req.body;

    const user = (req as any).user;
    const userId = user.id;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientQuery.rows.length === 0) {
        // If not found by user_id, try by email
        patientQuery = await databaseManager.query(
          'SELECT id, first_name, last_name, user_id, email FROM patients WHERE email = $1',
          [user.email]
        );
        
        if (patientQuery.rows.length === 0) {
          // Do not auto-create patient record
          return res.status(404).json({
            data: null,
            meta: null,
            error: { 
              message: 'Patient record not found. Please register through EMR system at /emr/register-patient',
              code: 'PATIENT_NOT_REGISTERED'
            },
            statusCode: 404
          });
        }
      }
      
      patient = patientQuery.rows[0];
      actualPatientId = patient.id;
    } else {
      // For other roles (doctor, admin), use patient ID from URL parameter
      const patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE id = $1',
        [patientId]
      );
      
      if (patientQuery.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      
      patient = patientQuery.rows[0];
      actualPatientId = patient.id;
    }

    // Get a valid user ID if not provided
    let validUserId = userId;
    if (!validUserId || validUserId === '1') {
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
      validUserId = userResult.rows[0]?.id;
    }

    const generatedInsights = [];

    // Calculate different types of insights
    const typesToCalculate = insightTypes || ['health_risk', 'medication_adherence', 'treatment_effectiveness'];

    for (const insightType of typesToCalculate) {
      // Check if recent insights exist (unless force recalculate)
      if (!forceRecalculate) {
        const recentInsight = await databaseManager.query(`
          SELECT id FROM ai_insights 
          WHERE patient_id = $1 AND insight_type = $2 
          AND generated_at > NOW() - INTERVAL '24 hours'
          AND is_active = true
        `, [actualPatientId, insightType]);

        if (recentInsight.rows.length > 0) {
          continue; // Skip if recent insight exists
        }
      }

      // Generate insight based on type
      let insight = null;
      switch (insightType) {
        case 'health_risk':
          insight = await calculateHealthRiskInsight(actualPatientId, validUserId);
          break;
        case 'medication_adherence':
          insight = await calculateMedicationAdherenceInsight(actualPatientId, validUserId);
          break;
        case 'treatment_effectiveness':
          insight = await calculateTreatmentEffectivenessInsight(actualPatientId, validUserId);
          break;
        case 'lab_trends':
          insight = await calculateLabTrendsInsight(actualPatientId, validUserId);
          break;
        case 'appointment_patterns':
          insight = await calculateAppointmentPatternsInsight(actualPatientId, validUserId);
          break;
      }

      if (insight) {
        generatedInsights.push(insight);
      }
    }

    res.status(201).json({
      data: {
        insights: generatedInsights,
        message: `Generated ${generatedInsights.length} new AI insights`
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: validUserId,
        insightTypes: typesToCalculate
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error calculating patient AI insights:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Calculate health risk insight
 */
async function calculateHealthRiskInsight(actualPatientId: string, userId: string) {
  try {
    // Get patient's recent lab results and vital signs
    const labResults = await databaseManager.query(`
      SELECT lr.result_value, lr.abnormal_flag, lo._name, lr.result_date
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lo.patient_id = $1
      AND lr.result_date > NOW() - INTERVAL '90 days'
      ORDER BY lr.result_date DESC
      LIMIT 10
    `, [actualPatientId]);

    const vitalSigns = await databaseManager.query(`
      SELECT systolic_bp, diastolic_bp, heart_rate, temperature, weight, height, bmi
      FROM vital_signs
      WHERE patient_id = $1
      ORDER BY measurement_time DESC
      LIMIT 5
    `, [actualPatientId]);

    // Simple AI logic for health risk assessment
    let riskLevel = 'low';
    let confidenceScore = 0.5;
    let recommendations = [];
    let description = 'สุขภาพโดยรวมอยู่ในเกณฑ์ปกติ';

    // Check for abnormal lab results
    const abnormalResults = labResults.rows.filter(result => result.abnormal_flag === 'high' || result.abnormal_flag === 'low');
    if (abnormalResults.length > 0) {
      riskLevel = 'medium';
      confidenceScore = 0.7;
      description = 'พบผลการตรวจที่ผิดปกติ ควรติดตามอย่างใกล้ชิด';
      recommendations.push('ติดตามผลการตรวจอย่างสม่ำเสมอ', 'ปรึกษาแพทย์เพื่อวางแผนการรักษา');
    }

    // Check vital signs
    if (vitalSigns.rows.length > 0) {
      const laVitals = vitalSigns.rows[0];
      if (laVitals.bmi && laVitals.bmi > 30) {
        riskLevel = 'high';
        confidenceScore = 0.8;
        description = 'พบความเสี่ยงต่อโรคอ้วนและโรคที่เกี่ยวข้อง';
        recommendations.push('ควบคุมน้ำหนัก', 'ออกกำลังกายสม่ำเสมอ', 'ปรึกษาโภชนากร');
      }
    }

    // Create insight record
    const insightId = uuidv4();
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description, confidence_score,
        data_source, recommendations, risk_level, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      insightId, actualPatientId, 'health_risk', 'การประเมินความเสี่ยงด้านสุขภาพ',
      description, confidenceScore, ['lab_results', 'vital_signs'],
      recommendations, riskLevel, userId
    ]);

    return {
      id: insightId,
      insight_type: 'health_risk',
      title: 'การประเมินความเสี่ยงด้านสุขภาพ',
      description,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating health risk insight:', error);
    return null;
  }
}

/**
 * Calculate medication adherence insight
 */
async function calculateMedicationAdherenceInsight(actualPatientId: string, userId: string) {
  try {
    // Get patient's prescriptions and appointments
    const prescriptions = await databaseManager.query(`
      SELECT p.prescription_date, p.status, pi.medication_name, pi.duration_days
      FROM prescriptions p
      INNER JOIN prescription_items pi ON p.id = pi.prescription_id
      WHERE p.patient_id = $1
      AND p.prescription_date > NOW() - INTERVAL '90 days'
      ORDER BY p.prescription_date DESC
    `, [actualPatientId]);

    const appointments = await databaseManager.query(`
      SELECT appointment_date, status, appointment_type
      FROM appointments
      WHERE patient_id = $1
      AND appointment_date > NOW() - INTERVAL '90 days'
      ORDER BY appointment_date DESC
    `, [actualPatientId]);

    // Simple adherence calculation
    const totalPrescriptions = prescriptions.rows.length;
    const completedPrescriptions = prescriptions.rows.filter(p => p.status === 'dispensed').length;
    const adherenceRate = totalPrescriptions > 0 ? completedPrescriptions / totalPrescriptions : 1;

    let riskLevel = 'low';
    let confidenceScore = 0.6;
    let description = 'การรับประทานยาตามแพทย์สั่งอยู่ในระดับดี';
    let recommendations = [];

    if (adherenceRate < 0.7) {
      riskLevel = 'high';
      confidenceScore = 0.8;
      description = 'การรับประทานยาตามแพทย์สั่งอยู่ในระดับต่ำ ควรปรับปรุง';
      recommendations.push('ตั้งเตือนการรับประทานยา', 'ปรึกษาแพทย์เกี่ยวกับความยากลำบากในการรับประทานยา');
    } else if (adherenceRate < 0.9) {
      riskLevel = 'medium';
      confidenceScore = 0.7;
      description = 'การรับประทานยาตามแพทย์สั่งอยู่ในระดับปานกลาง';
      recommendations.push('ติดตามการรับประทานยาอย่างสม่ำเสมอ');
    }

    // Create insight record
    const insightId = uuidv4();
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description, confidence_score,
        data_source, recommendations, risk_level, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      insightId, actualPatientId, 'medication_adherence', 'การประเมินการรับประทานยาตามแพทย์สั่ง',
      description, confidenceScore, ['prescriptions', 'appointments'],
      recommendations, riskLevel, userId
    ]);

    return {
      id: insightId,
      insight_type: 'medication_adherence',
      title: 'การประเมินการรับประทานยาตามแพทย์สั่ง',
      description,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating medication adherence insight:', error);
    return null;
  }
}

/**
 * Calculate treatment effectiveness insight
 */
async function calculateTreatmentEffectivenessInsight(actualPatientId: string, userId: string) {
  try {
    // Get patient's visits and diagnoses
    const visits = await databaseManager.query(`
      SELECT v.visit_date, v.diagnosis, v.treatment_plan, v.status
      FROM visits v
      WHERE v.patient_id = $1
      AND v.visit_date > NOW() - INTERVAL '180 days'
      ORDER BY v.visit_date DESC
    `, [actualPatientId]);

    // Simple treatment effectiveness analysis
    const totalVisits = visits.rows.length;
    const completedVisits = visits.rows.filter(v => v.status === 'completed').length;
    const effectivenessRate = totalVisits > 0 ? completedVisits / totalVisits : 1;

    let riskLevel = 'low';
    let confidenceScore = 0.6;
    let description = 'ประสิทธิภาพการรักษาอยู่ในระดับดี';
    let recommendations = [];

    if (effectivenessRate < 0.6) {
      riskLevel = 'high';
      confidenceScore = 0.8;
      description = 'ประสิทธิภาพการรักษาอยู่ในระดับต่ำ ควรปรับปรุงแผนการรักษา';
      recommendations.push('ทบทวนแผนการรักษา', 'ปรึกษาแพทย์ผู้เชี่ยวชาญ', 'ปรับเปลี่ยนวิธีการรักษา');
    } else if (effectivenessRate < 0.8) {
      riskLevel = 'medium';
      confidenceScore = 0.7;
      description = 'ประสิทธิภาพการรักษาอยู่ในระดับปานกลาง';
      recommendations.push('ติดตามผลการรักษาอย่างใกล้ชิด');
    }

    // Create insight record
    const insightId = uuidv4();
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description, confidence_score,
        data_source, recommendations, risk_level, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      insightId, actualPatientId, 'treatment_effectiveness', 'การประเมินประสิทธิภาพการรักษา',
      description, confidenceScore, ['visits', 'diagnoses'],
      recommendations, riskLevel, userId
    ]);

    return {
      id: insightId,
      insight_type: 'treatment_effectiveness',
      title: 'การประเมินประสิทธิภาพการรักษา',
      description,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating treatment effectiveness insight:', error);
    return null;
  }
}

/**
 * Calculate lab trends insight
 */
async function calculateLabTrendsInsight(actualPatientId: string, userId: string) {
  try {
    // Get patient's lab results over time
    const labResults = await databaseManager.query(`
      SELECT lr.result_numeric, lr.result_date, lo._name
      FROM lab_results lr
      INNER JOIN lab_orders lo ON lr.lab_order_id = lo.id
      WHERE lo.patient_id = $1
      AND lr.result_numeric IS NOT NULL
      AND lr.result_date > NOW() - INTERVAL '180 days'
      ORDER BY lr.result_date DESC
    `, [actualPatientId]);

    // Simple trend analysis
    let riskLevel = 'low';
    let confidenceScore = 0.5;
    let description = 'แนวโน้มผลการตรวจอยู่ในเกณฑ์ปกติ';
    let recommendations = [];

    if (labResults.rows.length >= 3) {
      // Check for trends (simplified)
      const recentResults = labResults.rows.slice(0, 3);
      const olderResults = labResults.rows.slice(3, 6);
      
      if (recentResults.length > 0 && olderResults.length > 0) {
        const recentAvg = recentResults.reduce((sum, r) => sum + parseFloat(r.result_numeric), 0) / recentResults.length;
        const olderAvg = olderResults.reduce((sum, r) => sum + parseFloat(r.result_numeric), 0) / olderResults.length;
        
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(changePercent) > 20) {
          riskLevel = 'medium';
          confidenceScore = 0.7;
          description = `พบการเปลี่ยนแปลงในผลการตรวจ ${changePercent > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(changePercent).toFixed(1)}%`;
          recommendations.push('ติดตามผลการตรวจอย่างใกล้ชิด', 'ปรึกษาแพทย์เกี่ยวกับการเปลี่ยนแปลง');
        }
      }
    }

    // Create insight record
    const insightId = uuidv4();
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description, confidence_score,
        data_source, recommendations, risk_level, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      insightId, actualPatientId, 'lab_trends', 'การวิเคราะห์แนวโน้มผลการตรวจ',
      description, confidenceScore, ['lab_results'],
      recommendations, riskLevel, userId
    ]);

    return {
      id: insightId,
      insight_type: 'lab_trends',
      title: 'การวิเคราะห์แนวโน้มผลการตรวจ',
      description,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating lab trends insight:', error);
    return null;
  }
}

/**
 * Calculate appointment patterns insight
 */
async function calculateAppointmentPatternsInsight(actualPatientId: string, userId: string) {
  try {
    // Get patient's appointment history
    const appointments = await databaseManager.query(`
      SELECT appointment_date, status, appointment_type
      FROM appointments
      WHERE patient_id = $1
      AND appointment_date > NOW() - INTERVAL '365 days'
      ORDER BY appointment_date DESC
    `, [actualPatientId]);

    // Simple pattern analysis
    const totalAppointments = appointments.rows.length;
    const completedAppointments = appointments.rows.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.rows.filter(a => a.status === 'cancelled').length;
    
    const completionRate = totalAppointments > 0 ? completedAppointments / totalAppointments : 1;
    const cancellationRate = totalAppointments > 0 ? cancelledAppointments / totalAppointments : 0;

    let riskLevel = 'low';
    let confidenceScore = 0.6;
    let description = 'รูปแบบการนัดหมายอยู่ในเกณฑ์ปกติ';
    let recommendations = [];

    if (cancellationRate > 0.3) {
      riskLevel = 'high';
      confidenceScore = 0.8;
      description = 'อัตราการยกเลิกนัดหมายสูง ควรปรับปรุง';
      recommendations.push('ปรับเวลานัดหมายให้เหมาะสม', 'ส่งการแจ้งเตือนล่วงหน้า', 'ปรึกษาเกี่ยวกับความสะดวกในการนัดหมาย');
    } else if (cancellationRate > 0.1) {
      riskLevel = 'medium';
      confidenceScore = 0.7;
      description = 'อัตราการยกเลิกนัดหมายอยู่ในระดับปานกลาง';
      recommendations.push('ติดตามรูปแบบการนัดหมาย');
    }

    // Create insight record
    const insightId = uuidv4();
    await databaseManager.query(`
      INSERT INTO ai_insights (
        id, patient_id, insight_type, title, description, confidence_score,
        data_source, recommendations, risk_level, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      insightId, actualPatientId, 'appointment_patterns', 'การวิเคราะห์รูปแบบการนัดหมาย',
      description, confidenceScore, ['appointments'],
      recommendations, riskLevel, userId
    ]);

    return {
      id: insightId,
      insight_type: 'appointment_patterns',
      title: 'การวิเคราะห์รูปแบบการนัดหมาย',
      description,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      recommendations
    };

  } catch (error) {
    console.error('Error calculating appointment patterns insight:', error);
    return null;
  }
}
